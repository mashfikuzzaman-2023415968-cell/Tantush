"use client"

import { useI18n } from "@lib/i18n/context"
import { convertToLocale } from "@lib/util/money"

type CartTotalsProps = {
  totals: {
    total?: number | null
    tax_total?: number | null
    currency_code: string
    item_subtotal?: number | null
    shipping_subtotal?: number | null
    discount_subtotal?: number | null
    shipping_methods?: unknown[] | null
  }
  showShipping?: boolean
}

export default function CartTotals({ totals, showShipping = true }: CartTotalsProps) {
  const { t } = useI18n()
  const money = (n?: number | null) =>
    convertToLocale({ amount: n ?? 0, currency_code: totals.currency_code })
  const hasShipping = !!totals.shipping_methods?.length

  return (
    <dl className="space-y-3 text-sm text-espresso/75">
      <div className="flex justify-between">
        <dt>{t.cart.subtotal}</dt>
        <dd data-testid="cart-subtotal" data-value={totals.item_subtotal || 0}>
          {money(totals.item_subtotal)}
        </dd>
      </div>
      {!!totals.discount_subtotal && (
        <div className="flex justify-between text-cocoa">
          <dt>{t.cart.discount}</dt>
          <dd data-testid="cart-discount">− {money(totals.discount_subtotal)}</dd>
        </div>
      )}
      {showShipping && (
        <div className="flex justify-between">
          <dt>{t.cart.shipping}</dt>
          <dd data-testid="cart-shipping">
            {hasShipping ? money(totals.shipping_subtotal) : <span className="text-espresso/50">{t.cart.calculatedAtCheckout}</span>}
          </dd>
        </div>
      )}
      {!!totals.tax_total && (
        <div className="flex justify-between">
          <dt>{t.cart.taxes}</dt>
          <dd data-testid="cart-taxes">{money(totals.tax_total)}</dd>
        </div>
      )}
      <div className="flex items-baseline justify-between border-t border-espresso/10 pt-4 text-espresso">
        <dt className="text-base">{t.cart.total}</dt>
        <dd className="font-display text-3xl" data-testid="cart-total" data-value={totals.total || 0}>
          {money(totals.total)}
        </dd>
      </div>
    </dl>
  )
}
