import type { Dictionary } from "@lib/i18n/dictionaries/en"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Reveal, Stagger, StaggerItem } from "@modules/common/components/motion/reveal"
import Image from "next/image"

export type CategoryTile = { id: string; name: string; handle: string; image: string | null }

export default function CategoryTiles({ t, tiles }: { t: Dictionary; tiles: CategoryTile[] }) {
  if (!tiles.length) return null
  return (
    <section className="content-container py-20 small:py-28">
      <Reveal className="flex items-end justify-between mb-10">
        <div>
          <p className="eyebrow mb-3">{t.home.categoriesEyebrow}</p>
          <h2 className="heading-lg">{t.home.categoriesTitle}</h2>
        </div>
      </Reveal>
      <Stagger className="grid grid-cols-1 xsmall:grid-cols-3 gap-4 small:gap-6" stagger={0.12}>
        {tiles.map((c, i) => (
          <StaggerItem key={c.id}>
            <LocalizedClientLink
              href={`/categories/${c.handle}`}
              className={`group relative block overflow-hidden rounded-2xl bg-ivory-200 ${i === 1 ? "aspect-[3/4] xsmall:translate-y-10" : "aspect-[3/4]"}`}
            >
              {c.image && (
                <Image
                  src={c.image}
                  alt={c.name}
                  fill
                  sizes="(max-width: 512px) 100vw, 33vw"
                  className="object-cover transition-transform [transition-duration:1400ms] ease-silk group-hover:scale-110"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-espresso/70 via-espresso/10 to-transparent transition-opacity duration-500 group-hover:opacity-90" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-ivory flex items-end justify-between">
                <h3 className="font-display text-3xl">{c.name}</h3>
                <span className="grid h-11 w-11 place-items-center rounded-full border border-ivory/40 transition-all duration-500 ease-silk group-hover:bg-ivory group-hover:text-espresso group-hover:rotate-[-45deg]">
                  →
                </span>
              </div>
            </LocalizedClientLink>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  )
}
