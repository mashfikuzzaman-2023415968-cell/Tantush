import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  getVariantAvailability,
  MedusaError,
  Modules,
  QueryContext,
} from "@medusajs/framework/utils"
import { createHash } from "crypto"
import { CATALOG_CACHE_PREFIX } from "../../../lib/constants"
import { StoreCatalogParamsType } from "./validators"

const CACHE_TTL_SECONDS = 120
const SIZE_OPTION_TITLES = ["size", "সাইজ"]

type CatalogVariant = {
  id: string
  title: string | null
  size: string | null
  available: boolean
  calculated_price: {
    calculated_amount: number
    original_amount: number
    currency_code: string
    calculated_price?: { price_list_type?: string | null }
  } | null
}

type CatalogProduct = {
  id: string
  title: string
  subtitle: string | null
  handle: string
  thumbnail: string | null
  images: string[]
  created_at: string
  collection_id: string | null
  variants: CatalogVariant[]
  min_price: number | null
}

/**
 * GET /store/catalog
 *
 * Product listing with the filters the storefront needs but the core
 * /store/products route doesn't offer: size (in stock), price range in the
 * customer's region currency, and price sorting. Results are cached in Redis
 * and invalidated by the catalog-cache subscriber whenever products, prices
 * or stock change.
 */
export async function GET(
  req: MedusaRequest<unknown, StoreCatalogParamsType>,
  res: MedusaResponse
) {
  const params = req.validatedQuery as unknown as StoreCatalogParamsType
  const salesChannelIds: string[] =
    (req as any).publishable_key_context?.sales_channel_ids ?? []

  if (!salesChannelIds.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Publishable key is not linked to a sales channel"
    )
  }

  const locale = (req as any).locale as string | undefined
  const cache = req.scope.resolve(Modules.CACHE)
  const cacheKey =
    CATALOG_CACHE_PREFIX +
    createHash("sha256")
      .update(JSON.stringify({ params, locale, salesChannelIds }))
      .digest("hex")

  const cached = await cache.get(cacheKey)
  if (cached) {
    res.setHeader("X-Catalog-Cache", "HIT")
    res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=60")
    return res.json(cached)
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: [region] } = await query.graph({
    entity: "region",
    fields: ["id", "currency_code"],
    filters: { id: params.region_id },
  })
  if (!region) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Region not found")
  }

  const { data: links } = await query.graph({
    entity: "product_sales_channel",
    fields: ["product_id"],
    filters: { sales_channel_id: salesChannelIds },
  })
  const productIds = [...new Set(links.map((l: any) => l.product_id as string))]

  const productFilters: Record<string, unknown> = {
    id: productIds,
    status: "published",
  }
  if (params.category_id.length) {
    productFilters.categories = { id: params.category_id }
  }
  if (params.collection_id.length) {
    productFilters.collection_id = params.collection_id
  }
  if (params.q) {
    productFilters.q = params.q
  }

  const { data: products } = productIds.length
    ? await query.graph(
        {
          entity: "product",
          fields: [
            "id",
            "title",
            "subtitle",
            "handle",
            "thumbnail",
            "images.url",
            "images.rank",
            "created_at",
            "collection_id",
            "options.id",
            "options.title",
            "variants.id",
            "variants.title",
            "variants.manage_inventory",
            "variants.allow_backorder",
            "variants.options.value",
            "variants.options.option_id",
            "variants.calculated_price.*",
          ],
          filters: productFilters,
          context: {
            variants: {
              calculated_price: QueryContext({
                region_id: region.id,
                currency_code: region.currency_code,
              }),
            },
          },
        },
        { locale }
      )
    : { data: [] as any[] }

  const variantIds = products.flatMap((p: any) =>
    (p.variants ?? []).map((v: any) => v.id as string)
  )
  const availability = variantIds.length
    ? await getVariantAvailability(query, {
        variant_ids: variantIds,
        sales_channel_id: salesChannelIds[0],
      })
    : {}

  const catalog: CatalogProduct[] = products.map((p: any) => {
    const sizeOptionIds = new Set(
      (p.options ?? [])
        .filter((o: any) => SIZE_OPTION_TITLES.includes(String(o.title).toLowerCase()))
        .map((o: any) => o.id)
    )
    const variants: CatalogVariant[] = (p.variants ?? []).map((v: any) => {
      const sizeValue =
        (v.options ?? []).find((o: any) => sizeOptionIds.has(o.option_id))?.value ??
        null
      const qty = availability[v.id]?.availability
      const available =
        !v.manage_inventory || v.allow_backorder || (qty ?? 0) > 0
      return {
        id: v.id,
        title: v.title,
        size: sizeValue,
        available,
        calculated_price: v.calculated_price
          ? {
              calculated_amount: Number(v.calculated_price.calculated_amount),
              original_amount: Number(v.calculated_price.original_amount),
              currency_code: v.calculated_price.currency_code,
              calculated_price: {
                price_list_type:
                  v.calculated_price.calculated_price?.price_list_type ?? null,
              },
            }
          : null,
      }
    })
    variants.sort(
      (a, b) =>
        Number(a.size) - Number(b.size) || String(a.size).localeCompare(String(b.size))
    )
    const prices = variants
      .map((v) => v.calculated_price?.calculated_amount)
      .filter((n): n is number => typeof n === "number")
    return {
      id: p.id,
      title: p.title,
      subtitle: p.subtitle ?? null,
      handle: p.handle,
      thumbnail: p.thumbnail,
      images: [...(p.images ?? [])]
        .sort((a: any, b: any) => (a.rank ?? 0) - (b.rank ?? 0))
        .slice(0, 2)
        .map((i: any) => i.url),
      created_at: p.created_at,
      collection_id: p.collection_id ?? null,
      variants,
      min_price: prices.length ? Math.min(...prices) : null,
    }
  })

  // Facets are computed before size/price filtering so the UI can show all options.
  const sizeSet = new Set<string>()
  let priceMin = Infinity
  let priceMax = 0
  for (const p of catalog) {
    for (const v of p.variants) {
      if (v.size && (!params.in_stock || v.available)) sizeSet.add(v.size)
      const amount = v.calculated_price?.calculated_amount
      if (typeof amount === "number") {
        priceMin = Math.min(priceMin, amount)
        priceMax = Math.max(priceMax, amount)
      }
    }
  }

  const filtered = catalog.filter((p) => {
    const candidates = p.variants.filter((v) => {
      if (params.in_stock && !v.available) return false
      if (params.size.length && (!v.size || !params.size.includes(v.size))) return false
      const amount = v.calculated_price?.calculated_amount
      if (params.min_price !== undefined && (amount ?? 0) < params.min_price) return false
      if (params.max_price !== undefined && (amount ?? Infinity) > params.max_price)
        return false
      return true
    })
    return candidates.length > 0
  })

  const sorters: Record<StoreCatalogParamsType["order"], (a: CatalogProduct, b: CatalogProduct) => number> = {
    price_asc: (a, b) => (a.min_price ?? Infinity) - (b.min_price ?? Infinity),
    price_desc: (a, b) => (b.min_price ?? 0) - (a.min_price ?? 0),
    created_at: (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
    title: (a, b) => a.title.localeCompare(b.title),
  }
  filtered.sort(sorters[params.order])

  const body = {
    products: filtered.slice(params.offset, params.offset + params.limit),
    count: filtered.length,
    offset: params.offset,
    limit: params.limit,
    facets: {
      sizes: [...sizeSet].sort((a, b) => Number(a) - Number(b) || a.localeCompare(b)),
      price: {
        min: Number.isFinite(priceMin) ? Math.floor(priceMin) : 0,
        max: Math.ceil(priceMax),
        currency_code: region.currency_code,
      },
    },
  }

  await cache.set(cacheKey, body, CACHE_TTL_SECONDS)
  res.setHeader("X-Catalog-Cache", "MISS")
  res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=60")
  res.json(body)
}
