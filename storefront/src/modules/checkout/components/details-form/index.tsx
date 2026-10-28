"use client"

import { saveCheckoutDetails, type CheckoutState } from "@lib/data/checkout"
import BotGuard from "@modules/common/components/bot-guard"
import { useI18n } from "@lib/i18n/context"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import { AnimatePresence, motion } from "motion/react"
import { useParams } from "next/navigation"
import { useActionState, useEffect, useRef, useState } from "react"
import { useFormStatus } from "react-dom"

function Field({
  name,
  label,
  error,
  hint,
  className,
  ...input
}: React.InputHTMLAttributes<HTMLInputElement> & {
  name: string
  label: string
  error?: string
  hint?: string
}) {
  return (
    <label className={clx("block", className)}>
      <span className="mb-1.5 block text-[13px] text-espresso/75">
        {label}
        {input.required && <span className="text-cocoa"> *</span>}
      </span>
      <input
        name={name}
        aria-invalid={!!error}
        className={clx(
          "h-12 w-full rounded-xl border bg-white/70 px-4 text-[15px] text-espresso outline-none transition-all duration-200 placeholder:text-espresso/30 focus:bg-white focus:shadow-[0_0_0_4px_rgba(161,129,101,0.18)]",
          error ? "border-rose-400" : "border-espresso/15 focus:border-espresso/60"
        )}
        {...input}
      />
      <AnimatePresence>
        {(error || hint) && (
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={clx("mt-1 block text-xs", error ? "text-rose-700" : "text-espresso/50")}
          >
            {error || hint}
          </motion.span>
        )}
      </AnimatePresence>
    </label>
  )
}

function Submit() {
  const { pending } = useFormStatus()
  const { t } = useI18n()
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full h-14 text-[15px]" data-testid="submit-address-button">
      {pending && <span className="h-4 w-4 rounded-full border-2 border-ivory/30 border-t-ivory animate-spin" />}
      {t.checkout.continueToReview} →
    </button>
  )
}

export default function DetailsForm({
  cart,
  customer,
  shippingOptions,
}: {
  cart: HttpTypes.StoreCart
  customer: HttpTypes.StoreCustomer | null
  shippingOptions: HttpTypes.StoreCartShippingOption[]
}) {
  const { t, lang } = useI18n()
  const { countryCode } = useParams()
  const [state, action] = useActionState<CheckoutState, FormData>(saveCheckoutDetails, null)
  const fe = state?.fieldErrors ?? {}

  const saved = cart.shipping_address
  const defaultAddress = customer?.addresses?.find((a) => a.is_default_shipping) ?? customer?.addresses?.[0]
  const initial = {
    first_name: saved?.first_name || customer?.first_name || defaultAddress?.first_name || "",
    last_name: saved?.last_name || customer?.last_name || defaultAddress?.last_name || "",
    phone: saved?.phone || customer?.phone || defaultAddress?.phone || "",
    email: cart.email?.endsWith(".invalid") ? "" : cart.email || customer?.email || "",
    address_1: saved?.address_1 || defaultAddress?.address_1 || "",
    address_2: saved?.address_2 || defaultAddress?.address_2 || "",
    city: saved?.city || defaultAddress?.city || "",
    province: saved?.province || defaultAddress?.province || "",
    postal_code: saved?.postal_code || defaultAddress?.postal_code || "",
  }

  // Home delivery cheapest-first, showroom pickup last
  const options = [...shippingOptions].sort((a, b) => {
    const pa = (a as any).service_zone?.fulfillment_set?.type === "pickup" ? 1 : 0
    const pb = (b as any).service_zone?.fulfillment_set?.type === "pickup" ? 1 : 0
    return pa - pb || (a.amount ?? 0) - (b.amount ?? 0)
  })
  const currentMethod = cart.shipping_methods?.[0]?.shipping_option_id
  const [option, setOption] = useState<string>(currentMethod ?? options[0]?.id ?? "")

  // Move focus to the first invalid field after a failed submit
  const formRef = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (!state?.fieldErrors) return
    const el = formRef.current?.querySelector<HTMLInputElement>('[aria-invalid="true"]')
    el?.focus()
    el?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [state])

  return (
    <form ref={formRef} action={action} className="space-y-10" noValidate>
      <input type="hidden" name="lang" value={lang} />
      <BotGuard />
      <input type="hidden" name="country_code" value={String(countryCode ?? "bd")} />

      <section>
        <h2 className="font-display text-2xl text-espresso mb-5">{t.checkout.contact}</h2>
        <div className="grid grid-cols-1 xsmall:grid-cols-2 gap-4">
          <Field name="first_name" label={t.checkout.firstName} defaultValue={initial.first_name} autoComplete="given-name" required error={fe.first_name} maxLength={60} data-testid="shipping-first-name-input" />
          <Field name="last_name" label={t.checkout.lastName} defaultValue={initial.last_name} autoComplete="family-name" maxLength={60} data-testid="shipping-last-name-input" />
          <Field
            name="phone"
            type="tel"
            inputMode="tel"
            label={t.checkout.phone}
            placeholder="01XXXXXXXXX"
            defaultValue={initial.phone}
            autoComplete="tel"
            required
            error={fe.phone}
            hint={t.checkout.phoneHint}
            maxLength={16}
            data-testid="shipping-phone-input"
          />
          <Field name="email" type="email" label={t.checkout.email} defaultValue={initial.email} autoComplete="email" error={fe.email} maxLength={254} data-testid="shipping-email-input" />
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl text-espresso mb-5">{t.checkout.address}</h2>
        <div className="grid grid-cols-1 xsmall:grid-cols-2 gap-4">
          <Field name="address_1" label={t.checkout.address1} defaultValue={initial.address_1} autoComplete="address-line1" required error={fe.address_1} className="xsmall:col-span-2" maxLength={200} data-testid="shipping-address-input" />
          <Field name="address_2" label={t.checkout.address2} defaultValue={initial.address_2} autoComplete="address-line2" className="xsmall:col-span-2" maxLength={120} />
          <Field name="province" label={t.checkout.area} defaultValue={initial.province} autoComplete="address-level3" maxLength={60} data-testid="shipping-province-input" />
          <Field name="city" label={t.checkout.city} defaultValue={initial.city} autoComplete="address-level2" required error={fe.city} maxLength={60} placeholder="Dhaka" data-testid="shipping-city-input" />
          <Field name="postal_code" label={t.checkout.postalCode} defaultValue={initial.postal_code} autoComplete="postal-code" inputMode="numeric" maxLength={10} data-testid="shipping-postal-code-input" />
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl text-espresso mb-2">{t.checkout.delivery}</h2>
        <p className="text-xs text-espresso/55 mb-5">{t.checkout.insideDhakaHint}</p>
        <div className="grid gap-3" role="radiogroup">
          {options.map((o) => {
            const active = option === o.id
            return (
              <label
                key={o.id}
                className={clx(
                  "relative flex cursor-pointer items-center gap-4 rounded-2xl border px-5 py-4 transition-all duration-300",
                  active ? "border-espresso bg-white shadow-[0_8px_24px_-16px_rgba(59,42,20,0.6)]" : "border-espresso/15 hover:border-espresso/40"
                )}
                data-testid="delivery-option-radio"
              >
                <input type="radio" name="shipping_option_id" value={o.id} checked={active} onChange={() => setOption(o.id)} className="sr-only" />
                <span className={clx("grid h-5 w-5 place-items-center rounded-full border transition-colors", active ? "border-espresso" : "border-espresso/30")}>
                  <motion.span className="h-2.5 w-2.5 rounded-full bg-espresso" initial={false} animate={{ scale: active ? 1 : 0 }} />
                </span>
                <span className="flex-1">
                  <span className="block text-[15px] text-espresso">{o.type?.label || o.name}</span>
                  {o.type?.description && <span className="block text-xs text-espresso/55">{o.type.description}</span>}
                </span>
                <span className="text-espresso">
                  {o.amount ? convertToLocale({ amount: o.amount, currency_code: cart.currency_code }) : "৳0"}
                </span>
              </label>
            )
          })}
        </div>
        {fe.shipping_option_id && <p className="mt-2 text-xs text-rose-700">{fe.shipping_option_id}</p>}
      </section>

      <section>
        <h2 className="font-display text-2xl text-espresso mb-5">{t.checkout.payment}</h2>
        <div className="flex items-start gap-4 rounded-2xl border border-espresso bg-white px-5 py-4" data-testid="payment-method-cod">
          <span className="grid h-5 w-5 mt-0.5 place-items-center rounded-full border border-espresso">
            <span className="h-2.5 w-2.5 rounded-full bg-espresso" />
          </span>
          <span>
            <span className="block text-[15px] text-espresso">{t.checkout.cod}</span>
            <span className="block text-xs text-espresso/55">{t.checkout.codBody}</span>
          </span>
        </div>
      </section>

      <AnimatePresence>
        {state?.error && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800"
            role="alert"
            data-testid="address-error-message"
          >
            {state.error}
          </motion.p>
        )}
      </AnimatePresence>

      <Submit />
    </form>
  )
}
