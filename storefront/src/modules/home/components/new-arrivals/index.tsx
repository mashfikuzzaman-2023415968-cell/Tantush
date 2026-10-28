import type { CatalogProduct } from "@lib/data/catalog"
import type { Lang } from "@lib/i18n/config"
import type { Dictionary } from "@lib/i18n/dictionaries/en"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Reveal, Stagger, StaggerItem } from "@modules/common/components/motion/reveal"
import ProductCard from "@modules/products/components/product-card"

export default function NewArrivals({
  t,
  lang,
  products,
}: {
  t: Dictionary
  lang: Lang
  products: CatalogProduct[]
}) {
  if (!products.length) return null
  return (
    <section className="bg-ivory-100 py-20 small:py-28">
      <div className="content-container">
        <Reveal className="flex items-end justify-between mb-10 gap-6">
          <div>
            <p className="eyebrow mb-3">{t.home.newArrivalsEyebrow}</p>
            <h2 className="heading-lg">{t.home.newArrivalsTitle}</h2>
          </div>
          <LocalizedClientLink href="/store" className="link-underline text-sm text-espresso whitespace-nowrap">
            {t.home.viewAll} →
          </LocalizedClientLink>
        </Reveal>
        <Stagger as="ul" className="grid grid-cols-2 small:grid-cols-4 gap-x-4 gap-y-10 small:gap-x-6">
          {products.map((p) => (
            <StaggerItem as="li" key={p.id}>
              <ProductCard product={p} t={t} lang={lang} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
