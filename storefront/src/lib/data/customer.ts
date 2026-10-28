"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { updateTag } from "next/cache"
import { redirect } from "next/navigation"
import {
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
  getCartId,
  removeAuthToken,
  removeCartId,
  setAuthToken,
} from "./cookies"

export const retrieveCustomer =
  async (): Promise<HttpTypes.StoreCustomer | null> => {
    const authHeaders = await getAuthHeaders()

    if (!authHeaders) return null

    const headers = {
      ...authHeaders,
    }

    const next = {
      ...(await getCacheOptions("customers")),
    }

    return await sdk.client
      .fetch<{ customer: HttpTypes.StoreCustomer }>(`/store/customers/me`, {
        method: "GET",
        query: {
          fields: "*orders",
        },
        headers,
        next,
        cache: "force-cache",
      })
      .then(({ customer }) => customer)
      .catch(() => null)
  }

export const updateCustomer = async (body: HttpTypes.StoreUpdateCustomer) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const updateRes = await sdk.store.customer
    .update(body, {}, headers)
    .then(({ customer }) => customer)
    .catch(medusaError)

  const cacheTag = await getCacheTag("customers")
  updateTag(cacheTag)

  return updateRes
}

/** Headers proving a human submitted the form (Cloudflare Turnstile). */
function humanHeaders(formData: FormData): Record<string, string> {
  const token = formData.get("cf-turnstile-response")
  return typeof token === "string" && token ? { "x-turnstile-token": token } : {}
}

/** Bots fill every field; humans never see the hidden "website" field. */
const isBot = (formData: FormData) => String(formData.get("website") ?? "") !== ""

export async function signup(_currentState: unknown, formData: FormData) {
  const clean = (key: string, max: number) =>
    String(formData.get(key) ?? "")
      .replace(/[\u0000-\u001f\u007f<>]/g, "")
      .trim()
      .slice(0, max)

  const password = String(formData.get("password") ?? "")
  const customerForm = {
    email: clean("email", 254).toLowerCase(),
    first_name: clean("first_name", 60),
    last_name: clean("last_name", 60),
    phone: clean("phone", 16).replace(/[\s-]/g, ""),
  }

  if (isBot(formData)) {
    return "Could not create the account. Please try again."
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(customerForm.email)) {
    return "Please enter a valid email address."
  }
  if (!customerForm.first_name || !customerForm.last_name) {
    return "Please enter your name."
  }
  if (customerForm.phone && !/^(?:\+?88)?01[3-9]\d{8}$/.test(customerForm.phone)) {
    return "Please enter a valid Bangladeshi mobile number."
  }
  if (password.length < 8 || password.length > 128) {
    return "Password must be 8–128 characters long."
  }

  try {
    const { token: registrationToken } = await sdk.client.fetch<{ token: string }>(
      "/auth/customer/emailpass/register",
      {
        method: "POST",
        body: { email: customerForm.email, password },
        headers: humanHeaders(formData),
      }
    )

    await sdk.store.customer.create(
      customerForm,
      {},
      { authorization: `Bearer ${registrationToken}` }
    )

    // Exchange the registration token for a session token bound to the new
    // customer (a second login would need another human-check token).
    const { token } = await sdk.client.fetch<{ token: string }>("/auth/token/refresh", {
      method: "POST",
      headers: { authorization: `Bearer ${registrationToken}` },
    })
    await setAuthToken(token)

    updateTag(await getCacheTag("customers"))
    await transferCart()
    return null
  } catch (error: any) {
    const message = String(error?.message ?? "")
    if (/human check|too many/i.test(message)) return message
    // Never reveal whether an email is already registered (account enumeration)
    return "Could not create the account. If you already have one, please sign in instead."
  }
}

export async function login(_currentState: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 254)
  const password = String(formData.get("password") ?? "").slice(0, 128)

  if (isBot(formData) || !email || !password) {
    return "Invalid email or password."
  }

  try {
    const { token } = await sdk.client.fetch<{ token: string }>("/auth/customer/emailpass", {
      method: "POST",
      body: { email, password },
      headers: humanHeaders(formData),
    })
    await setAuthToken(token)
    updateTag(await getCacheTag("customers"))
  } catch (error: any) {
    const message = String(error?.message ?? "")
    return /human check|too many/i.test(message) ? message : "Invalid email or password."
  }

  try {
    await transferCart()
  } catch {
    // Signed in; a stale guest cart shouldn't block login
  }
}

export async function signout(countryCode: string) {
  await sdk.auth.logout()

  await removeAuthToken()

  const customerCacheTag = await getCacheTag("customers")
  updateTag(customerCacheTag)

  await removeCartId()

  const cartCacheTag = await getCacheTag("carts")
  updateTag(cartCacheTag)

  redirect(`/${countryCode}/account`)
}

export async function transferCart() {
  const cartId = await getCartId()

  if (!cartId) {
    return
  }

  const headers = await getAuthHeaders()

  await sdk.store.cart.transferCart(cartId, {}, headers)

  const cartCacheTag = await getCacheTag("carts")
  updateTag(cartCacheTag)
}

export const addCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<any> => {
  const isDefaultBilling = (currentState.isDefaultBilling as boolean) || false
  const isDefaultShipping = (currentState.isDefaultShipping as boolean) || false

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
    phone: formData.get("phone") as string,
    is_default_billing: isDefaultBilling,
    is_default_shipping: isDefaultShipping,
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .createAddress(address, {}, headers)
    .then(async ({ customer }) => {
      const customerCacheTag = await getCacheTag("customers")
      updateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const deleteCustomerAddress = async (
  addressId: string
): Promise<void> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.customer
    .deleteAddress(addressId, headers)
    .then(async () => {
      const customerCacheTag = await getCacheTag("customers")
      updateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const updateCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<any> => {
  const addressId =
    (currentState.addressId as string) || (formData.get("addressId") as string)

  if (!addressId) {
    return { success: false, error: "Address ID is required" }
  }

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
  } as HttpTypes.StoreUpdateCustomerAddress

  const phone = formData.get("phone") as string

  if (phone) {
    address.phone = phone
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .updateAddress(addressId, address, {}, headers)
    .then(async () => {
      const customerCacheTag = await getCacheTag("customers")
      updateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

// ---------------------------------------------------------------- email verification

export async function getEmailVerified(): Promise<boolean | null> {
  const headers = await getAuthHeaders()
  if (!("authorization" in headers)) return null
  return sdk.client
    .fetch<{ verified: boolean }>("/store/customers/me/email-verification", {
      method: "GET",
      headers,
      cache: "no-store",
    })
    .then((r) => r.verified)
    .catch(() => null)
}

export async function resendVerificationEmail(): Promise<"sent" | "verified" | "error"> {
  const headers = await getAuthHeaders()
  if (!("authorization" in headers)) return "error"
  return sdk.client
    .fetch<{ sent?: boolean; verified?: boolean }>("/store/customers/me/email-verification", {
      method: "POST",
      headers,
    })
    .then((r) => (r.verified ? "verified" : "sent"))
    .catch(() => "error")
}

export async function confirmEmail(token: string): Promise<boolean> {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{20,100}$/.test(token)) return false
  return sdk.client
    .fetch<{ verified: boolean }>("/store/email-verification/confirm", {
      method: "POST",
      body: { token },
    })
    .then((r) => r.verified)
    .catch(() => false)
}
