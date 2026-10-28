"use client"

import { placeOrder } from "@lib/data/cart"
import { useI18n } from "@lib/i18n/context"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import BotGuard from "@modules/common/components/bot-guard"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { AnimatePresence, motion } from "motion/react"
import { useState, useTransition } from "react"

export default function ReviewStep({ cart }: { cart: HttpTypes.StoreCart }) {
  const { t } = useI18n()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [human, setHuman] = useState<string | null>(null)
  const needsHuman = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const a = cart.shipping_address
  const method = cart.shipping_methods?.[0]
  const email = cart.email?.endsWith(".invalid") ? null : cart.email

  const submit = () => {
    setError(null)
    startTransition(async () => {
      try {
        await placeOrder(undefined, human)
      } catch (e) {
        // redirect() inside the action surfaces as a special error; let Next handle it
        const message = (e as Error)?.message ?? ""
        if (message.includes("NEXT_REDIRECT")) throw e
        setError(message || t.common.error)
      }
    })
  }

  const Row = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="flex flex-col xsmall:flex-row gap-1 xsmall:gap-6 py-5">
      <dt className="xsmall:w-40 shrink-0 text-sm text-espresso/55">{title}</dt>
      <dd className="text-[15px] text-espresso">{children}</dd>
    </div>
  )

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-espresso">{t.checkout.review}</h2>
        <LocalizedClientLink href="/checkout?step=details" className="text-sm text-cocoa link-underline" data-testid="edit-address-button">
          {t.checkout.edit}
        </LocalizedClientLink>
      </div>

      <dl className="divide-y divide-espresso/10 border-y border-espresso/10">
        <Row title={t.checkout.shippingTo}>
          <span data-testid="shipping-address-summary">
            {a?.first_name} {a?.last_name}
            <br />
            {a?.address_1}
            {a?.address_2 ? `, ${a.address_2}` : ""}
            <br />
            {[a?.province, a?.city, a?.postal_code].filter(Boolean).join(", ")}
          </span>
        </Row>
        <Row title={t.checkout.contact}>
          <span data-testid="shipping-contact-summary">
            {a?.phone}
            {email && (
              <>
                <br />
                {email}
              </>
            )}
          </span>
        </Row>
        <Row title={t.checkout.delivery}>
          {method?.name} ·{" "}
          {convertToLocale({ amount: method?.amount ?? 0, currency_code: cart.currency_code })}
        </Row>
        <Row title={t.checkout.paymentMethod}>
          <span data-testid="payment-method-summary">{t.checkout.cod}</span>
        </Row>
      </dl>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800"
            role="alert"
            data-testid="place-order-error"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <BotGuard onToken={setHuman} resetKey={error} />

      <motion.button
        onClick={submit}
        disabled={pending || (needsHuman && !human)}
        whileTap={{ scale: 0.98 }}
        className="btn-primary w-full h-14 text-[15px]"
        data-testid="submit-order-button"
      >
        {pending && <span className="h-4 w-4 rounded-full border-2 border-ivory/30 border-t-ivory animate-spin" />}
        {pending ? t.checkout.placing : `${t.checkout.placeOrder} · ${convertToLocale({ amount: cart.total ?? 0, currency_code: cart.currency_code })}`}
      </motion.button>
      <p className="text-center text-xs text-espresso/55">{t.checkout.terms}</p>
    </div>
  )
}
