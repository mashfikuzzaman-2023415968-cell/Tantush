import type { Showroom as ShowroomType } from "@lib/data/shop"
import type { Dictionary } from "@lib/i18n/dictionaries/en"
import { Reveal } from "@modules/common/components/motion/reveal"

export default function Showroom({ t, showrooms }: { t: Dictionary; showrooms: ShowroomType[] }) {
  const shop = showrooms[0]
  const address = shop
    ? [shop.address_1, shop.address_2, shop.city, shop.postal_code].filter(Boolean).join(", ")
    : ""
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Tantush ${address}`)}`

  return (
    <section id="showroom" className="content-container py-20 small:py-28 scroll-mt-28">
      <div className="grid grid-cols-1 small:grid-cols-2 gap-10 items-center rounded-[32px] bg-ivory-200 p-8 small:p-16 grain overflow-hidden">
        <Reveal>
          <p className="eyebrow mb-4">{t.home.showroomEyebrow}</p>
          <h2 className="heading-lg text-balance">{t.home.showroomTitle}</h2>
          <p className="mt-5 text-espresso/75 leading-relaxed max-w-lg">{t.home.showroomBody}</p>
        </Reveal>
        <Reveal delay={0.15} className="card-surface p-8 space-y-4">
          <p className="font-display text-2xl text-espresso">{shop?.name ?? "Tantush"}</p>
          {address && <p className="text-espresso/75">{address}</p>}
          {shop?.phone && (
            <a href={`tel:${shop.phone}`} className="block text-espresso link-underline w-fit">
              {shop.phone}
            </a>
          )}
          <p className="text-sm text-tan-600">{t.home.showroomHours}</p>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn-primary mt-2">
            {t.home.directions} ↗
          </a>
        </Reveal>
      </div>
    </section>
  )
}
