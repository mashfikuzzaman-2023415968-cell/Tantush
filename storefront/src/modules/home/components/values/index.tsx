import type { Dictionary } from "@lib/i18n/dictionaries/en"
import { Stagger, StaggerItem } from "@modules/common/components/motion/reveal"

const icons = {
  cod: (
    <path d="M3 7h18v10H3zM7 12h.01M17 12h.01M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
  ),
  exchange: <path d="M4 9h13l-3-3M20 15H7l3 3" />,
  delivery: (
    <path d="M3 6h11v9H3zM14 9h4l3 3v3h-7M7.5 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM17.5 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
  ),
  fabric: <path d="M6 3v18M10 3v18M14 3v18M4 9c4-3 12 3 16 0M4 15c4-3 12 3 16 0" />,
}

export default function Values({ t }: { t: Dictionary }) {
  const items = [
    { icon: icons.cod, title: t.home.valuesCod, body: t.home.valuesCodBody },
    { icon: icons.exchange, title: t.home.valuesExchange, body: t.home.valuesExchangeBody },
    { icon: icons.delivery, title: t.home.valuesDelivery, body: t.home.valuesDeliveryBody },
    { icon: icons.fabric, title: t.home.valuesFabric, body: t.home.valuesFabricBody },
  ]
  return (
    <section className="border-y border-espresso/10 bg-ivory-50">
      <Stagger className="content-container grid grid-cols-2 small:grid-cols-4 divide-espresso/10 small:divide-x">
        {items.map((it) => (
          <StaggerItem key={it.title} className="flex flex-col small:flex-row items-start small:items-center gap-3 px-2 small:px-8 py-8">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ivory-200 text-cocoa">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                {it.icon}
              </svg>
            </span>
            <div>
              <p className="text-[15px] font-medium text-espresso">{it.title}</p>
              <p className="text-xs text-espresso/60 mt-0.5">{it.body}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  )
}
