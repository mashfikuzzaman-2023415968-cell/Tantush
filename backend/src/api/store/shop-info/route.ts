import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

/**
 * GET /store/shop-info
 *
 * Public details about the physical shop(s) for the "Visit our showroom"
 * section, so the address is edited once in Admin → Locations and shows up
 * everywhere on the website.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cache = req.scope.resolve(Modules.CACHE)
  const cacheKey = "shop-info:v1"
  const cached = await cache.get(cacheKey)
  if (cached) {
    return res.json(cached)
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: locations } = await query.graph({
    entity: "stock_location",
    fields: [
      "id",
      "name",
      "address.address_1",
      "address.address_2",
      "address.city",
      "address.postal_code",
      "address.phone",
      "fulfillment_sets.type",
    ],
  })

  const body = {
    showrooms: locations
      .filter((l: any) =>
        (l.fulfillment_sets ?? []).some((s: any) => s?.type === "pickup")
      )
      .map((l: any) => ({
        id: l.id,
        name: l.name,
        address_1: l.address?.address_1 ?? null,
        address_2: l.address?.address_2 ?? null,
        city: l.address?.city ?? null,
        postal_code: l.address?.postal_code ?? null,
        phone: l.address?.phone ?? null,
      })),
  }

  await cache.set(cacheKey, body, 600)
  res.setHeader("Cache-Control", "public, max-age=300")
  res.json(body)
}
