import { getDictionary } from "@lib/i18n/server"
import CatalogTemplate from "@modules/store/templates/catalog-template"
import type { RawSearchParams } from "@modules/store/search-params"
import { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary()
  return { title: t.store.title, description: t.meta.description }
}

export default async function StorePage(props: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<RawSearchParams>
}) {
  const [{ countryCode }, searchParams, { t }] = await Promise.all([
    props.params,
    props.searchParams,
    getDictionary(),
  ])
  return (
    <CatalogTemplate
      countryCode={countryCode}
      searchParams={searchParams}
      basePath={`/${countryCode}/store`}
      title={t.store.title}
      eyebrow="Tantush"
    />
  )
}
