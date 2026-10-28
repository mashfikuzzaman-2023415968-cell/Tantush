import { getDictionary } from "@lib/i18n/server"
import { localizeDigits } from "@lib/i18n/config"
import { HttpTypes } from "@medusajs/types"
import CartLine from "@modules/cart/components/cart-line"
import PromoCode from "@modules/cart/components/promo-code"
import CartTotals from "@modules/common/components/cart-totals"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Reveal } from "@modules/common/components/motion/reveal"

export default async function CartTemplate({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) {
  const { t, lang } = await getDictionary()
  const items = [...(cart?.items ?? [])].sort((a, b) => ((a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1))
  const count = items.reduce((n, i) => n + i.quantity, 0)

  if (!cart || !items.length) {
    return (
      <div className="content-container py-28 text-center" data-testid="cart-container">
        <Reveal>
          <h1 className="heading-lg">{t.cart.empty}</h1>
          <p className="mt-4 text-espresso/60">{t.cart.emptyBody}</p>
          <LocalizedClientLink href="/store" className="btn-primary mt-8">
            {t.cart.continueShopping}
          </LocalizedClientLink>
        </Reveal>
      </div>
    )
  }

  return (
    <div className="content-container py-12 small:py-16" data-testid="cart-container">
      <Reveal>
        <h1 className="heading-lg">
          {t.cart.title} <span className="text-tan-500 text-2xl">({localizeDigits(count, lang)})</span>
        </h1>
      </Reveal>
      <div className="mt-10 grid grid-cols-1 small:grid-cols-[1fr_400px] gap-12 small:gap-16">
        <div>
          {!customer && (
            <div className="mb-4 flex items-center justify-between rounded-2xl bg-ivory-200 px-5 py-4 text-sm">
              <span className="text-espresso/75">
                {t.cart.signInPrompt} {t.cart.signInPromptBody}
              </span>
              <LocalizedClientLink href="/account" className="link-underline text-espresso whitespace-nowrap ml-4" data-testid="sign-in-button">
                {t.cart.signIn}
              </LocalizedClientLink>
            </div>
          )}
          <ul className="divide-y divide-espresso/10 border-y border-espresso/10">
            {items.map((item) => (
              <CartLine key={item.id} item={item} currencyCode={cart.currency_code} />
            ))}
          </ul>
        </div>
        <aside>
          <div className="small:sticky small:top-32 card-surface p-7 space-y-6">
            <h2 className="font-display text-2xl text-espresso">{t.checkout.summary}</h2>
            <PromoCode cart={cart} />
            <CartTotals totals={cart} />
            <LocalizedClientLink href="/checkout?step=details" className="btn-primary w-full h-14" data-testid="checkout-button">
              {t.cart.checkout} →
            </LocalizedClientLink>
            <p className="text-center text-xs text-espresso/60">{t.product.codBadge}</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
