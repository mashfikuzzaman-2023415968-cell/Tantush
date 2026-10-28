import { fmt, localizeDigits } from "@lib/i18n/config"
import { getDictionary } from "@lib/i18n/server"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import CartTotals from "@modules/common/components/cart-totals"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Reveal } from "@modules/common/components/motion/reveal"
import Thumbnail from "@modules/products/components/thumbnail"
import SuccessMark from "@modules/order/components/success-mark"

const SHOP_PHONE = process.env.NEXT_PUBLIC_SHOP_PHONE

export default async function OrderCompletedTemplate({
  order,
  showPrivate,
}: {
  order: HttpTypes.StoreOrder
  /** Address & phone are only shown to the browser that placed the order. */
  showPrivate: boolean
}) {
  const { t, lang } = await getDictionary()
  const a = order.shipping_address
  const method = order.shipping_methods?.[0]
  const total = convertToLocale({ amount: order.total, currency_code: order.currency_code })

  return (
    <div className="content-container max-w-3xl py-16 small:py-24" data-testid="order-complete-container">
      <div className="text-center">
        <SuccessMark />
        <Reveal delay={0.4}>
          <h1 className="heading-lg mt-10">{t.order.thankYou}</h1>
          <p className="mt-3 text-lg text-espresso/75">{t.order.placed}</p>
          <p className="mt-6 inline-flex items-center gap-3 rounded-full bg-ivory-200 px-5 py-2.5 text-sm text-espresso">
            {t.order.number}
            <span className="font-display text-xl" data-testid="order-id">
              #{localizeDigits(order.display_id ?? "", lang)}
            </span>
          </p>
          <p className="mx-auto mt-6 max-w-md text-espresso/70">
            {t.order.callSoon} {fmt(t.order.payOnDelivery, { amount: total })}
          </p>
        </Reveal>
      </div>

      <Reveal delay={0.6} className="mt-14 card-surface p-6 small:p-8 space-y-8">
        <div>
          <h2 className="font-display text-2xl text-espresso mb-4">{t.order.summary}</h2>
          <ul className="divide-y divide-espresso/10">
            {(order.items ?? []).map((item) => (
              <li key={item.id} className="flex items-center gap-4 py-4" data-testid="product-row">
                <div className="w-14 shrink-0">
                  <Thumbnail thumbnail={item.thumbnail} size="full" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-lg text-espresso truncate">{item.product_title}</p>
                  <p className="text-xs text-espresso/60">
                    {t.cart.size}: {localizeDigits(item.variant_title ?? "", lang)} · {t.cart.qty}: {localizeDigits(item.quantity, lang)}
                  </p>
                </div>
                <p className="text-espresso">
                  {convertToLocale({ amount: item.total ?? 0, currency_code: order.currency_code })}
                </p>
              </li>
            ))}
          </ul>
        </div>
        <CartTotals totals={order as any} />
        <div className="grid grid-cols-1 xsmall:grid-cols-2 gap-6 border-t border-espresso/10 pt-6 text-sm">
          <div>
            <p className="eyebrow mb-2">{t.order.delivery}</p>
            <p className="text-espresso">{method?.name}</p>
            {showPrivate && a && (
              <p className="mt-1 text-espresso/70" data-testid="shipping-address-summary">
                {a.first_name} {a.last_name}, {a.address_1}, {a.city}
                <br />
                {a.phone}
              </p>
            )}
          </div>
          <div>
            <p className="eyebrow mb-2">{t.checkout.paymentMethod}</p>
            <p className="text-espresso">{t.checkout.cod}</p>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.7} className="mt-10 text-center space-y-4">
        <p className="text-sm text-espresso/60">
          {t.order.help} {t.order.helpBody}
          {SHOP_PHONE && (
            <>
              {" "}
              <a href={`tel:${SHOP_PHONE.replace(/[^+\d]/g, "")}`} className="link-underline text-espresso">
                {SHOP_PHONE}
              </a>
            </>
          )}
        </p>
        <LocalizedClientLink href="/store" className="btn-primary">
          {t.order.continue}
        </LocalizedClientLink>
      </Reveal>
    </div>
  )
}
