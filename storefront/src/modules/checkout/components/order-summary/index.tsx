import { getDictionary } from "@lib/i18n/server"
import { HttpTypes } from "@medusajs/types"
import CartLine from "@modules/cart/components/cart-line"
import PromoCode from "@modules/cart/components/promo-code"
import CartTotals from "@modules/common/components/cart-totals"

export default async function OrderSummary({ cart }: { cart: HttpTypes.StoreCart }) {
  const { t } = await getDictionary()
  return (
    <aside className="small:sticky small:top-28 card-surface p-6 small:p-7 space-y-6">
      <h2 className="font-display text-2xl text-espresso">{t.checkout.summary}</h2>
      <ul className="divide-y divide-espresso/10 -my-4 max-h-[340px] overflow-y-auto no-scrollbar">
        {(cart.items ?? []).map((item) => (
          <CartLine key={item.id} item={item} currencyCode={cart.currency_code} compact />
        ))}
      </ul>
      <div className="border-t border-espresso/10 pt-5">
        <PromoCode cart={cart} />
      </div>
      <CartTotals totals={cart} />
    </aside>
  )
}
