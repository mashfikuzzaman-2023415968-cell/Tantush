import { listCatalog } from "@lib/data/catalog"
import { fmt, localizeDigits } from "@lib/i18n/config"
import { getDictionary } from "@lib/i18n/server"
import { Reveal, Stagger, StaggerItem } from "@modules/common/components/motion/reveal"
import ProductCard from "@modules/products/components/product-card"
import Filters from "@modules/store/components/filters"
import Pagination from "@modules/store/components/pagination"
import SortSelect from "@modules/store/components/sort-select"
import { parseCatalogParams, type RawSearchParams } from "@modules/store/search-params"

const PAGE_SIZE = 12

/**
 * Shared listing page for /store, /categories/* and /collections/*.
 * Filtering, sorting and pagination all live in the URL, so every view is
 * shareable and cacheable.
 */
export default async function CatalogTemplate({
  countryCode,
  searchParams,
  basePath,
  title,
  eyebrow,
  description,
  categoryIds,
  collectionIds,
}: {
  countryCode: string
  searchParams: RawSearchParams
  basePath: string
  title: string
  eyebrow?: string
  description?: string | null
  categoryIds?: string[]
  collectionIds?: string[]
}) {
  const filters = parseCatalogParams(searchParams)
  const [{ t, lang }, catalog] = await Promise.all([
    getDictionary(),
    listCatalog({
      countryCode,
      sizes: filters.sizes,
      minPrice: filters.min,
      maxPrice: filters.max,
      order: filters.sort,
      page: filters.page,
      limit: PAGE_SIZE,
      categoryIds,
      collectionIds,
    }),
  ])
  const totalPages = Math.max(1, Math.ceil(catalog.count / PAGE_SIZE))
  const query: Record<string, string> = {}
  if (filters.sizes.length) query.size = filters.sizes.join(",")
  if (filters.min !== undefined) query.min = String(filters.min)
  if (filters.max !== undefined) query.max = String(filters.max)
  if (filters.sort !== "created_at") query.sort = filters.sort
  const gridKey = JSON.stringify({ ...query, page: filters.page })

  return (
    <div className="pb-24" data-testid="category-container">
      <header className="relative overflow-hidden grain bg-ivory-200 border-b border-espresso/10">
        <div className="content-container py-14 small:py-20">
          <Reveal>
            {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
            <h1 className="heading-xl">{title}</h1>
            {description && <p className="mt-4 max-w-xl text-espresso/70">{description}</p>}
          </Reveal>
        </div>
      </header>

      <div className="content-container flex gap-12 pt-10">
        <Filters
          variant="sidebar"
          sizes={catalog.facets.sizes}
          priceBounds={catalog.facets.price}
          selectedSizes={filters.sizes}
          min={filters.min}
          max={filters.max}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4 mb-8">
            <p className="text-sm text-espresso/60">
              {fmt(t.store.results, { count: localizeDigits(catalog.count, lang) })}
            </p>
            <div className="flex items-center gap-3">
              <Filters
                variant="sheet"
                sizes={catalog.facets.sizes}
                priceBounds={catalog.facets.price}
                selectedSizes={filters.sizes}
                min={filters.min}
                max={filters.max}
              />
              <SortSelect value={filters.sort} />
            </div>
          </div>

          {catalog.products.length ? (
            <div className="transition-opacity duration-300 [body[data-catalog-pending]_&]:opacity-40">
              <Stagger key={gridKey} as="ul" className="grid grid-cols-2 medium:grid-cols-3 gap-x-4 gap-y-12 small:gap-x-6">
                {catalog.products.map((p, i) => (
                  <StaggerItem as="li" key={p.id}>
                    <ProductCard product={p} t={t} lang={lang} priority={i < 3} />
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
          ) : (
            <div className="py-24 text-center">
              <p className="font-display text-3xl text-espresso">{t.store.noResults}</p>
              <p className="mt-3 text-espresso/60">{t.store.noResultsHint}</p>
            </div>
          )}

          <Pagination
            page={filters.page}
            totalPages={totalPages}
            basePath={basePath}
            query={query}
            t={t}
            lang={lang}
          />
        </div>
      </div>
    </div>
  )
}
