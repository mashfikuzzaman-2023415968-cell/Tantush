import { getCategoryByHandle } from "@lib/data/categories"
import { getDictionary } from "@lib/i18n/server"
import CatalogTemplate from "@modules/store/templates/catalog-template"
import type { RawSearchParams } from "@modules/store/search-params"
import { Metadata } from "next"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ category: string[]; countryCode: string }>
  searchParams: Promise<RawSearchParams>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { category } = await props.params
  const productCategory = await getCategoryByHandle(category).catch(() => null)
  if (!productCategory) notFound()
  return {
    title: productCategory.name,
    description: productCategory.description || undefined,
  }
}

export default async function CategoryPage(props: Props) {
  const [{ category, countryCode }, searchParams, { t }] = await Promise.all([
    props.params,
    props.searchParams,
    getDictionary(),
  ])
  const productCategory = await getCategoryByHandle(category).catch(() => null)
  if (!productCategory) notFound()

  const ids = [productCategory.id, ...(productCategory.category_children ?? []).map((c) => c.id)]

  return (
    <CatalogTemplate
      countryCode={countryCode}
      searchParams={searchParams}
      basePath={`/${countryCode}/categories/${category.join("/")}`}
      title={productCategory.name}
      eyebrow={t.store.categories}
      description={productCategory.description}
      categoryIds={ids}
    />
  )
}
