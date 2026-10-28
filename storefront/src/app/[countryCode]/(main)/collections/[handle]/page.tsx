import { getCollectionByHandle } from "@lib/data/collections"
import { getDictionary } from "@lib/i18n/server"
import CatalogTemplate from "@modules/store/templates/catalog-template"
import type { RawSearchParams } from "@modules/store/search-params"
import { Metadata } from "next"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ handle: string; countryCode: string }>
  searchParams: Promise<RawSearchParams>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { handle } = await props.params
  const collection = await getCollectionByHandle(handle).catch(() => null)
  if (!collection) notFound()
  return { title: collection.title }
}

export default async function CollectionPage(props: Props) {
  const [{ handle, countryCode }, searchParams, { t }] = await Promise.all([
    props.params,
    props.searchParams,
    getDictionary(),
  ])
  const collection = await getCollectionByHandle(handle).catch(() => null)
  if (!collection) notFound()

  return (
    <CatalogTemplate
      countryCode={countryCode}
      searchParams={searchParams}
      basePath={`/${countryCode}/collections/${handle}`}
      title={collection.title}
      eyebrow={t.store.collections}
      collectionIds={[collection.id]}
    />
  )
}
