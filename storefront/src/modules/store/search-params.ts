import type { CatalogSort } from "@lib/data/catalog"

export type RawSearchParams = Record<string, string | string[] | undefined>

export type CatalogFilters = {
  sizes: string[]
  min?: number
  max?: number
  sort: CatalogSort
  page: number
}

const SORTS: CatalogSort[] = ["created_at", "price_asc", "price_desc", "title"]

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

const toInt = (v: string | undefined) => {
  if (!v || !/^\d{1,7}$/.test(v)) return undefined
  return Number(v)
}

/** Parses + sanitises URL filters so arbitrary input never reaches the API. */
export function parseCatalogParams(sp: RawSearchParams): CatalogFilters {
  const sizes = (first(sp.size) ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[A-Za-z0-9]{1,5}$/.test(s))
    .slice(0, 10)
  const sort = SORTS.includes(first(sp.sort) as CatalogSort) ? (first(sp.sort) as CatalogSort) : "created_at"
  const page = Math.min(Math.max(toInt(first(sp.page)) ?? 1, 1), 200)
  return { sizes, min: toInt(first(sp.min)), max: toInt(first(sp.max)), sort, page }
}
