import { getLocaleHeader } from "@lib/util/get-locale-header"
import Medusa, { FetchArgs, FetchInput } from "@medusajs/js-sdk"

// Defaults to standard port for Medusa server
let MEDUSA_BACKEND_URL = "http://localhost:9000"

if (process.env.MEDUSA_BACKEND_URL) {
  MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL
}

export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: process.env.NODE_ENV === "development",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
})

/**
 * The shopper's IP as set by the edge nginx (it overwrites X-Real-IP, so
 * browsers can't spoof it). Forwarding it lets the backend rate-limit per
 * shopper instead of treating the whole storefront as one client.
 */
async function getClientIpHeader(): Promise<Record<string, string>> {
  if (typeof window !== "undefined") return {}
  try {
    const { headers } = await import("next/headers")
    const ip = (await headers()).get("x-real-ip")
    return ip && ip.length <= 64 ? { "x-real-ip": ip } : {}
  } catch {
    // Outside a request (build time / ISR revalidation)
    return {}
  }
}

const originalFetch = sdk.client.fetch.bind(sdk.client)

sdk.client.fetch = async <T>(input: FetchInput, init?: FetchArgs): Promise<T> => {
  const headers = init?.headers ?? {}
  let localeHeader: Record<string, string | null> | undefined
  try {
    localeHeader = await getLocaleHeader()
    headers["x-medusa-locale"] ??= localeHeader["x-medusa-locale"]
  } catch {}

  const newHeaders = {
    ...localeHeader,
    ...(await getClientIpHeader()),
    ...headers,
  }
  init = {
    ...init,
    headers: newHeaders,
  }
  return originalFetch(input, init)
}
