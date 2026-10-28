import { listCatalog } from "@lib/data/catalog"
import { getDictionary } from "@lib/i18n/server"
import { HttpTypes } from "@medusajs/types"
import { Reveal, Stagger, StaggerItem } from "@modules/common/components/motion/reveal"
import ProductCard from "@modules/products/components/product-card"

export default async function RelatedProducts({
  product,
  countryCode,
}: {
  product: HttpTypes.StoreProduct
  countryCode: string
}) {
  const [{ t, lang }, sameCollection, all] = await Promise.all([
    getDictionary(),
    product.collection_id
      ? listCatalog({ countryCode, collectionIds: [product.collection_id], limit: 8 })
      : Promise.resolve(null),
    listCatalog({ countryCode, limit: 12 }),
  ])

  const seen = new Set([product.id])
  const products = [...(sameCollection?.products ?? []), ...all.products]
    .filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)))
    .slice(0, 4)

  if (!products.length) return null

  return (
    <section>
      <Reveal>
        <h2 className="heading-md mb-10">{t.product.related}</h2>
      </Reveal>
      <Stagger as="ul" className="grid grid-cols-2 small:grid-cols-4 gap-x-4 gap-y-10 small:gap-x-6">
        {products.map((p) => (
          <StaggerItem as="li" key={p.id}>
            <ProductCard product={p} t={t} lang={lang} />
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  )
}
