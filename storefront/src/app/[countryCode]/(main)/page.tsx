import { listCatalog } from "@lib/data/catalog"
import { listCategories } from "@lib/data/categories"
import { getShowrooms } from "@lib/data/shop"
import { getDictionary } from "@lib/i18n/server"
import { Marquee } from "@modules/common/components/motion/marquee"
import CategoryTiles from "@modules/home/components/category-tiles"
import Hero from "@modules/home/components/hero"
import NewArrivals from "@modules/home/components/new-arrivals"
import Showroom from "@modules/home/components/showroom"
import Story from "@modules/home/components/story"
import Values from "@modules/home/components/values"

export default async function Home(props: { params: Promise<{ countryCode: string }> }) {
  const { countryCode } = await props.params
  const [{ t, lang }, latest, categories, showrooms] = await Promise.all([
    getDictionary(),
    listCatalog({ countryCode, limit: 8, order: "created_at" }),
    listCategories({ limit: 3, fields: "id,name,handle,parent_category_id" }).catch(() => []),
    getShowrooms(),
  ])

  const tiles = await Promise.all(
    categories
      .filter((c) => !c.parent_category_id)
      .slice(0, 3)
      .map(async (c) => {
        const { products } = await listCatalog({ countryCode, categoryIds: [c.id], limit: 1 })
        return { id: c.id, name: c.name, handle: c.handle, image: products[0]?.thumbnail ?? null }
      })
  )

  return (
    <>
      <Hero />
      <Values t={t} />
      <CategoryTiles t={t} tiles={tiles} />
      <NewArrivals t={t} lang={lang} products={latest.products} />
      <div className="py-10 small:py-14 border-y border-espresso/10 overflow-hidden">
        <Marquee
          items={["সুতোয় গল্প", "Tantush", "বুননে ঐতিহ্য", "Handcrafted in Bangladesh"]}
          className="font-display text-5xl small:text-7xl text-espresso/90"
        />
      </div>
      <Story t={t} lang={lang} />
      <Showroom t={t} showrooms={showrooms} />
    </>
  )
}
