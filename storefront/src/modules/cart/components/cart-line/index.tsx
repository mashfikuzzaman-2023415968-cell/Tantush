"use client"

import { deleteLineItem, updateLineItem } from "@lib/data/cart"
import { localizeDigits } from "@lib/i18n/config"
import { useI18n } from "@lib/i18n/context"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { motion } from "motion/react"
import { useState, useTransition } from "react"

const MAX_QTY = 10

export default function CartLine({
  item,
  currencyCode,
  compact = false,
}: {
  item: HttpTypes.StoreCartLineItem
  currencyCode: string
  compact?: boolean
}) {
  const { t, lang } = useI18n()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const stock = item.variant?.manage_inventory
    ? Math.min(MAX_QTY, (item.variant?.inventory_quantity ?? MAX_QTY))
    : MAX_QTY

  const setQty = (quantity: number) => {
    setError(null)
    startTransition(async () => {
      try {
        await updateLineItem({ lineId: item.id, quantity })
      } catch (e) {
        setError((e as Error).message)
      }
    })
  }
  const remove = () => startTransition(async () => void (await deleteLineItem(item.id).catch(() => {})))

  return (
    <motion.li
      layout
      exit={{ opacity: 0, x: -30 }}
      className={clx("flex gap-5 py-6 transition-opacity", pending && "opacity-50")}
      data-testid="product-row"
    >
      <LocalizedClientLink href={`/products/${item.product_handle}`} className={compact ? "w-16 shrink-0" : "w-24 small:w-28 shrink-0"}>
        <Thumbnail thumbnail={item.thumbnail} images={item.variant?.product?.images} size="full" />
      </LocalizedClientLink>
      <div className="flex flex-1 flex-col min-w-0">
        <div className="flex justify-between gap-4">
          <div className="min-w-0">
            <LocalizedClientLink
              href={`/products/${item.product_handle}`}
              className="font-display text-xl leading-tight text-espresso hover:text-cocoa line-clamp-2"
              data-testid="product-title"
            >
              {item.product_title}
            </LocalizedClientLink>
            <p className="mt-1 text-xs text-espresso/60" data-testid="product-variant">
              {t.cart.size}: {localizeDigits(item.variant_title ?? "", lang)}
            </p>
          </div>
          <p className="text-espresso whitespace-nowrap" data-testid="product-price">
            {convertToLocale({ amount: item.total ?? item.unit_price * item.quantity, currency_code: currencyCode })}
          </p>
        </div>

        {!compact && (
          <div className="mt-auto flex items-center justify-between pt-4">
            <div className="flex h-10 items-center rounded-full border border-espresso/20">
              <button
                className="h-full w-10 text-espresso disabled:opacity-30"
                disabled={pending || item.quantity <= 1}
                onClick={() => setQty(item.quantity - 1)}
                aria-label="−"
              >
                −
              </button>
              <span className="w-6 text-center text-sm tabular-nums" data-testid="product-select-button">
                {localizeDigits(item.quantity, lang)}
              </span>
              <button
                className="h-full w-10 text-espresso disabled:opacity-30"
                disabled={pending || item.quantity >= stock}
                onClick={() => setQty(item.quantity + 1)}
                aria-label="+"
              >
                +
              </button>
            </div>
            <button onClick={remove} disabled={pending} className="text-xs text-espresso/60 hover:text-cocoa link-underline" data-testid="product-delete-button">
              {t.cart.remove}
            </button>
          </div>
        )}
        {compact && (
          <p className="text-xs text-espresso/60 mt-1">
            {t.cart.qty}: {localizeDigits(item.quantity, lang)}
          </p>
        )}
        {error && <p className="mt-2 text-xs text-rose-700">{error}</p>}
      </div>
    </motion.li>
  )
}
