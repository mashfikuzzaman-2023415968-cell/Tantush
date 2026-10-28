"use server"

import { sdk } from "@lib/config"
import { getCacheOptions } from "./cookies"
import { getRegion } from "./regions"

export type CatalogVariant = {
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

export type CatalogProduct = {
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

export type CatalogSort = "created_at" | "price_asc" | "price_desc" | "title"

export type CatalogQuery = {
  countryCode: string
  sizes?: string[]
  minPrice?: number
  maxPrice?: number
  categoryIds?: string[]
  collectionIds?: string[]
  q?: string
  order?: CatalogSort
  page?: number
  limit?: number
}

export type CatalogResponse = {
  products: CatalogProduct[]
  count: number
  offset: number
  limit: number
  facets: {
    sizes: string[]
    price: { min: number; max: number; currency_code: string }
  }
}

const EMPTY: CatalogResponse = {
  products: [],
  count: 0,
  offset: 0,
  limit: 12,
  facets: { sizes: [], price: { min: 0, max: 0, currency_code: "bdt" } },
}

/**
 * Filtered product listing from the backend's /store/catalog route
 * (size + price filters, price sorting). Responses are cached by Next's data
 * cache (tagged so cart/locale changes can revalidate) and in Redis upstream.
 */
export async function listCatalog(query: CatalogQuery): Promise<CatalogResponse> {
  const region = await getRegion(query.countryCode)
  if (!region) {
    return EMPTY
  }

  const limit = query.limit ?? 12
  const page = Math.max(1, query.page ?? 1)

  const params: Record<string, string> = {
    region_id: region.id,
    limit: String(limit),
    offset: String((page - 1) * limit),
    order: query.order ?? "created_at",
  }
  if (query.sizes?.length) params.size = query.sizes.join(",")
  if (query.categoryIds?.length) params.category_id = query.categoryIds.join(",")
  if (query.collectionIds?.length) params.collection_id = query.collectionIds.join(",")
  if (query.q) params.q = query.q
  if (query.minPrice !== undefined) params.min_price = String(query.minPrice)
  if (query.maxPrice !== undefined) params.max_price = String(query.maxPrice)

  const next = { revalidate: 60, ...(await getCacheOptions("products")) }

  return sdk.client
    .fetch<CatalogResponse>("/store/catalog", {
      method: "GET",
      query: params,
      next,
      cache: "force-cache",
    })
    .catch(() => EMPTY)
}
