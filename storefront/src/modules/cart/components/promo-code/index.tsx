"use client"

import { applyPromotions } from "@lib/data/cart"
import { removePromotion } from "@lib/data/checkout"
import { useI18n } from "@lib/i18n/context"
import { HttpTypes } from "@medusajs/types"
import { AnimatePresence, motion } from "motion/react"
import { useState, useTransition } from "react"

export default function PromoCode({ cart }: { cart: HttpTypes.StoreCart }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const applied = (cart.promotions ?? []).filter((p) => p.code)

  const apply = () => {
    const c = code.trim().toUpperCase()
    if (!/^[A-Z0-9_-]{2,32}$/.test(c)) return
    setError(null)
    startTransition(async () => {
      try {
        const existing = applied.map((p) => p.code!).filter(Boolean)
        await applyPromotions([...existing, c])
        setCode("")
      } catch (e) {
        setError((e as Error).message)
      }
    })
  }

  return (
    <div className="space-y-3">
      {applied.map((p) => (
        <div key={p.id} className="flex items-center justify-between rounded-xl bg-ivory-200 px-4 py-2.5 text-sm">
          <span className="font-medium tracking-wider text-cocoa" data-testid="discount-code">{p.code}</span>
          <button
            onClick={() => startTransition(() => removePromotion(p.code!))}
            className="text-xs text-espresso/60 hover:text-espresso"
            data-testid="remove-discount-button"
          >
            {t.cart.remove}
          </button>
        </div>
      ))}
      <button onClick={() => setOpen((o) => !o)} className="text-sm text-cocoa link-underline" data-testid="add-discount-button">
        {t.cart.addPromo}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
            onSubmit={(e) => {
              e.preventDefault()
              apply()
            }}
          >
            <div className="flex gap-2 pt-1">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t.cart.promoCode}
                maxLength={32}
                autoComplete="off"
                className="h-11 flex-1 rounded-full border border-espresso/20 bg-white/60 px-4 text-sm uppercase tracking-wider outline-none focus:border-espresso"
                data-testid="discount-input"
              />
              <button disabled={pending || !code.trim()} className="btn-outline h-11 px-5 text-sm" data-testid="discount-apply-button">
                {t.cart.apply}
              </button>
            </div>
            {error && <p className="mt-2 text-xs text-rose-700" data-testid="discount-error-message">{error}</p>}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
