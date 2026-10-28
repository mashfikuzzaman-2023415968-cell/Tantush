"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { updateTag } from "next/cache"
import { redirect } from "next/navigation"
import { retrieveCart } from "./cart"
import { getAuthHeaders, getCacheTag, getCartId } from "./cookies"

export type CheckoutFieldErrors = Partial<
  Record<"first_name" | "phone" | "address_1" | "city" | "email" | "shipping_option_id", string>
>

export type CheckoutState = { error?: string; fieldErrors?: CheckoutFieldErrors } | null

const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const COD_PROVIDER = "pp_system_default"

/** Trims, strips control characters / angle brackets and caps length. */
const str = (fd: FormData, key: string, max = 120) =>
  String(fd.get(key) ?? "")
    .replace(/[\u0000-\u001f\u007f<>]/g, "")
    .trim()
    .slice(0, max)

/**
 * One-step checkout for cash on delivery: saves contact + address, picks the
 * delivery option and opens the COD payment session, then moves to review.
 * The backend's COD hook validates all of this again before an order is made.
 */
export async function saveCheckoutDetails(
  _prev: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  const cartId = await getCartId()
  const lang = str(formData, "lang", 2) === "bn" ? "bn" : "en"
  const msg = (en: string, bn: string) => (lang === "bn" ? bn : en)

  // Honeypot: real shoppers never see or fill the "website" field
  if (String(formData.get("website") ?? "") !== "") {
    return { error: msg("Something went wrong. Please try again.", "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।") }
  }

  if (!cartId) {
    return { error: msg("Your bag has expired. Please add the items again.", "আপনার ব্যাগের মেয়াদ শেষ। আবার পণ্য যোগ করুন।") }
  }

  const phone = str(formData, "phone", 20).replace(/[\s-]/g, "")
  const email = str(formData, "email", 254).toLowerCase()
  const fields = {
    first_name: str(formData, "first_name", 60),
    last_name: str(formData, "last_name", 60),
    address_1: str(formData, "address_1", 200),
    address_2: str(formData, "address_2", 120),
    city: str(formData, "city", 60),
    province: str(formData, "province", 60),
    postal_code: str(formData, "postal_code", 10),
  }
  const shippingOptionId = str(formData, "shipping_option_id", 64)

  const fieldErrors: CheckoutFieldErrors = {}
  if (!fields.first_name) fieldErrors.first_name = msg("Please enter your name", "আপনার নাম লিখুন")
  if (!BD_PHONE.test(phone))
    fieldErrors.phone = msg(
      "Enter a valid mobile number, e.g. 01712345678",
      "সঠিক মোবাইল নম্বর লিখুন, যেমন 01712345678"
    )
  if (fields.address_1.length < 5)
    fieldErrors.address_1 = msg("Please enter your full address", "পূর্ণ ঠিকানা লিখুন")
  if (!fields.city) fieldErrors.city = msg("Please enter your city or district", "শহর বা জেলা লিখুন")
  if (email && !EMAIL.test(email))
    fieldErrors.email = msg("Enter a valid email or leave it empty", "সঠিক ইমেইল লিখুন অথবা ফাঁকা রাখুন")
  if (!/^so_[A-Za-z0-9]+$/.test(shippingOptionId))
    fieldErrors.shipping_option_id = msg("Choose a delivery option", "ডেলিভারি পদ্ধতি বেছে নিন")

  if (Object.keys(fieldErrors).length) {
    return { fieldErrors }
  }

  const headers = { ...(await getAuthHeaders()) }
  const address = { ...fields, phone, country_code: "bd" }
  // Email is optional for COD. Orders still need one, so fall back to the
  // reserved, never-deliverable ".invalid" TLD (RFC 2606) tied to the phone.
  const orderEmail = email || `guest-${phone.replace(/\D/g, "")}@tantush.invalid`

  try {
    await sdk.store.cart.update(
      cartId,
      { email: orderEmail, shipping_address: address, billing_address: address },
      {},
      headers
    )
    await sdk.store.cart.addShippingMethod(cartId, { option_id: shippingOptionId }, {}, headers)

    const cart = await retrieveCart(cartId, "id,*payment_collection,*payment_collection.payment_sessions,region_id,currency_code,total")
    if (!cart) throw new Error("Cart not found")
    const hasCod = cart.payment_collection?.payment_sessions?.some(
      (s) => s.provider_id === COD_PROVIDER && s.status === "pending"
    )
    if (!hasCod) {
      await sdk.store.payment.initiatePaymentSession(cart, { provider_id: COD_PROVIDER }, {}, headers)
    }
  } catch (e) {
    try {
      medusaError(e)
    } catch (err) {
      return { error: (err as Error).message }
    }
    return { error: msg("Something went wrong. Please try again.", "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।") }
  } finally {
    updateTag(await getCacheTag("carts"))
    updateTag(await getCacheTag("fulfillment"))
  }

  const countryCode = str(formData, "country_code", 2).toLowerCase() || "bd"
  redirect(`/${/^[a-z]{2}$/.test(countryCode) ? countryCode : "bd"}/checkout?step=review`)
}

export async function removePromotion(code: string) {
  const cartId = await getCartId()
  if (!cartId) return
  const headers = { ...(await getAuthHeaders()) }
  await sdk.client
    .fetch(`/store/carts/${cartId}/promotions`, {
      method: "DELETE",
      body: { promo_codes: [code] },
      headers,
    })
    .catch(medusaError)
  updateTag(await getCacheTag("carts"))
}
