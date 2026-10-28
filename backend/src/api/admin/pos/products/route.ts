import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  getVariantAvailability,
} from "@medusajs/framework/utils"

const SHOWROOM_CHANNEL = process.env.POS_SALES_CHANNEL_NAME || "Tantush Showroom"

/**
 * GET /admin/pos/products?q=… — product search for the POS screen with the
 * BDT price and live available stock (stocked − reserved) per size.
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const q = String(req.query.q ?? "").trim().slice(0, 80)
  if (q.length < 2) {
    return res.json({ products: [] })
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const [{ data: channels }, byText, bySku] = await Promise.all([
    query.graph({ entity: "sales_channel", fields: ["id"], filters: { name: SHOWROOM_CHANNEL } }),
    query.graph({
      entity: "product",
      fields: ["id"],
      filters: { q } as any,
      pagination: { take: 12 },
    }),
    query.graph({
      entity: "product_variant",
      fields: ["product_id"],
      filters: { sku: q.toUpperCase() },
    }),
  ])

  const ids = [
    ...new Set([
      ...bySku.data.map((v: any) => v.product_id as string),
      ...byText.data.map((p: any) => p.id as string),
    ]),
  ].slice(0, 12)
  if (!ids.length) {
    return res.json({ products: [] })
  }

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "thumbnail",
      "variants.id",
      "variants.title",
      "variants.sku",
      "variants.manage_inventory",
      "variants.allow_backorder",
      "variants.prices.amount",
      "variants.prices.currency_code",
      "variants.prices.price_list_id",
    ],
    filters: { id: ids },
  })

  const variantIds = products.flatMap((p: any) => (p.variants ?? []).map((v: any) => v.id))
  const availability =
    channels[0] && variantIds.length
      ? await getVariantAvailability(query, {
          variant_ids: variantIds,
          sales_channel_id: channels[0].id,
        })
      : {}

  res.json({
    products: products.map((p: any) => ({
      id: p.id,
      title: p.title,
      thumbnail: p.thumbnail,
      variants: [...(p.variants ?? [])]
        .sort((a: any, b: any) => Number(a.title) - Number(b.title) || String(a.title).localeCompare(String(b.title)))
        .map((v: any) => ({
          id: v.id,
          title: v.title,
          sku: v.sku,
          manage_inventory: v.manage_inventory,
          // Base (shelf) price; sale price lists apply online only
          price:
            (v.prices ?? []).find((pr: any) => pr.currency_code === "bdt" && !pr.price_list_id)?.amount ?? null,
          available:
            !v.manage_inventory || v.allow_backorder
              ? null
              : availability[v.id]?.availability ?? 0,
        })),
    })),
  })
}
