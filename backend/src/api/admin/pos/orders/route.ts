import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createPosSaleWorkflow } from "../../../../workflows/pos/create-pos-sale"
import { AdminPosOrderType } from "./validators"

const SHOWROOM_CHANNEL = process.env.POS_SALES_CHANNEL_NAME || "Tantush Showroom"

/**
 * POST /admin/pos/orders — record an in-store (offline) sale.
 * Admin-only: every /admin route requires an authenticated user.
 */
export async function POST(
  req: AuthenticatedMedusaRequest<AdminPosOrderType>,
  res: MedusaResponse
) {
  const body = req.validatedBody
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const [{ data: channels }, { data: regions }] = await Promise.all([
    query.graph({
      entity: "sales_channel",
      fields: ["id", "stock_locations.id"],
      filters: { name: SHOWROOM_CHANNEL },
    }),
    query.graph({
      entity: "region",
      fields: ["id", "currency_code", "countries.iso_2"],
    }),
  ])
  const channel = channels[0] as any
  const region = (regions as any[]).find((r) =>
    (r.countries ?? []).some((c: any) => c?.iso_2 === "bd")
  )
  const locationId = channel?.stock_locations?.[0]?.id
  if (!channel || !region || !locationId) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      `POS is not configured: need sales channel "${SHOWROOM_CHANNEL}" linked to a stock location and a Bangladesh region`
    )
  }

  const { data: options } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "service_zone.fulfillment_set.type", "service_zone.fulfillment_set.location.id"],
  })
  const pickupOption = (options as any[]).find(
    (o) => o.service_zone?.fulfillment_set?.type === "pickup"
  )
  if (!pickupOption) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "POS needs a pickup shipping option (e.g. 'Pick up from showroom')"
    )
  }

  const variantIds = [...new Set(body.items.map((i) => i.variant_id))]
  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: [
      "id",
      "inventory_items.inventory_item_id",
      "inventory_items.required_quantity",
    ],
    filters: { id: variantIds },
  })
  if (variants.length !== variantIds.length) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "One or more products were not found")
  }

  const inventory = Object.fromEntries(
    (variants as any[]).map((v) => [
      v.id,
      (v.inventory_items ?? []).map((ii: any) => ({
        inventory_item_id: ii.inventory_item_id,
        required_quantity: Number(ii.required_quantity ?? 1),
      })),
    ])
  )

  const { result: order } = await createPosSaleWorkflow(req.scope).run({
    input: {
      region_id: region.id,
      currency_code: region.currency_code,
      sales_channel_id: channel.id,
      location_id: locationId,
      shipping_option_id: pickupOption.id,
      items: body.items,
      inventory,
      customer_name: body.customer_name,
      customer_phone: body.customer_phone || undefined,
      email: body.email || undefined,
      note: body.note,
      created_by: req.auth_context.actor_id,
    },
  })

  res.status(201).json({
    order: { id: order.id, display_id: (order as any).display_id, total: (order as any).total },
  })
}
