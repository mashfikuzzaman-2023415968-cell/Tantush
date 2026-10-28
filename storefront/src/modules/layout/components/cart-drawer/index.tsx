"use client"

import { useI18n } from "@lib/i18n/context"
import { localizeDigits } from "@lib/i18n/config"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import DeleteButton from "@modules/common/components/delete-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { AnimatePresence, motion } from "motion/react"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

const BagIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
    <path d="M5 8h14l-1.2 12.1a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9L5 8Z" />
    <path d="M9 10V6.5a3 3 0 0 1 6 0V10" strokeLinecap="round" />
  </svg>
)

/**
 * Slide-in bag. Opens automatically when an item is added so shoppers get
 * instant confirmation without leaving the product page.
 */
export default function CartDrawer({ cart }: { cart?: HttpTypes.StoreCart | null }) {
  const { t, lang } = useI18n()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  const totalItems = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0
  const prevCount = useRef(totalItems)
  const [bump, setBump] = useState(0)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (totalItems > prevCount.current && !pathname.includes("/cart")) {
      setOpen(true)
      setBump((b) => b + 1)
    }
    prevCount.current = totalItems
  }, [totalItems, pathname])

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open])

  const items = [...(cart?.items ?? [])].sort((a, b) =>
    (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
  )

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative flex items-center gap-2 h-10 px-2 text-espresso hover:text-cocoa transition-colors"
        aria-label={`${t.nav.cart} (${totalItems})`}
        data-testid="nav-cart-link"
      >
        <BagIcon className="h-6 w-6" />
        <span
          key={bump}
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-cocoa text-ivory text-[10px] leading-[18px] text-center animate-bump"
        >
          {localizeDigits(totalItems, lang)}
        </span>
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label={t.cart.title}>
                <motion.div
                  className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setOpen(false)}
                />
                <motion.aside
                  className="absolute right-0 top-0 h-full w-full max-w-[440px] bg-ivory-50 shadow-2xl flex flex-col"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", stiffness: 260, damping: 32 }}
                  data-testid="nav-cart-dropdown"
                >
                  <div className="flex items-center justify-between px-6 h-20 border-b border-espresso/10">
                    <h2 className="font-display text-2xl text-espresso">
                      {t.cart.title}{" "}
                      <span className="text-tan-600 text-lg">({localizeDigits(totalItems, lang)})</span>
                    </h2>
                    <button
                      onClick={() => setOpen(false)}
                      className="h-10 w-10 rounded-full hover:bg-ivory-200 grid place-items-center transition-colors"
                      aria-label={t.nav.close}
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="1.5">
                        <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>

                  {items.length ? (
                    <>
                      <ul className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-espresso/10 no-scrollbar">
                        {items.map((item, i) => (
                          <motion.li
                            key={item.id}
                            className="flex gap-4 py-4"
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.08 + i * 0.05 }}
                            data-testid="cart-item"
                          >
                            <LocalizedClientLink href={`/products/${item.product_handle}`} className="w-20 shrink-0">
                              <Thumbnail thumbnail={item.thumbnail} images={item.variant?.product?.images} size="full" />
                            </LocalizedClientLink>
                            <div className="flex-1 min-w-0 flex flex-col">
                              <LocalizedClientLink
                                href={`/products/${item.product_handle}`}
                                className="font-display text-lg leading-tight text-espresso hover:text-cocoa line-clamp-2"
                              >
                                {item.product_title}
                              </LocalizedClientLink>
                              <p className="text-xs text-espresso/60 mt-1">
                                {t.cart.size}: {item.variant_title} · {t.cart.qty}:{" "}
                                {localizeDigits(item.quantity, lang)}
                              </p>
                              <div className="mt-auto flex items-center justify-between pt-2">
                                <span className="text-sm text-espresso">
                                  {convertToLocale({
                                    amount: item.total ?? item.unit_price * item.quantity,
                                    currency_code: cart?.currency_code ?? "bdt",
                                  })}
                                </span>
                                <DeleteButton id={item.id} className="text-xs">
                                  {t.cart.remove}
                                </DeleteButton>
                              </div>
                            </div>
                          </motion.li>
                        ))}
                      </ul>
                      <div className="border-t border-espresso/10 px-6 py-5 space-y-4 bg-ivory-100">
                        <div className="flex items-center justify-between">
                          <span className="text-espresso/70">{t.cart.subtotal}</span>
                          <span className="font-display text-2xl text-espresso" data-testid="cart-subtotal">
                            {convertToLocale({ amount: cart?.subtotal ?? 0, currency_code: cart?.currency_code ?? "bdt" })}
                          </span>
                        </div>
                        <p className="text-xs text-espresso/60">{t.product.codBadge}</p>
                        <div className="grid grid-cols-2 gap-3">
                          <LocalizedClientLink href="/cart" className="btn-outline" data-testid="go-to-cart-button">
                            {t.cart.viewBag}
                          </LocalizedClientLink>
                          <LocalizedClientLink href="/checkout?step=address" className="btn-primary">
                            {t.cart.checkout}
                          </LocalizedClientLink>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-10 gap-4">
                      <BagIcon className="h-14 w-14 text-tan-400" />
                      <p className="font-display text-2xl text-espresso">{t.cart.empty}</p>
                      <p className="text-sm text-espresso/60">{t.cart.emptyBody}</p>
                      <LocalizedClientLink href="/store" className="btn-primary mt-2" onClick={() => setOpen(false)}>
                        {t.cart.continueShopping}
                      </LocalizedClientLink>
                    </div>
                  )}
                </motion.aside>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  )
}
