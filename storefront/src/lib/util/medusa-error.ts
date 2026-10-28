/**
 * Normalises errors from the Medusa JS SDK into a user-presentable Error.
 * Never logs headers or request bodies (they can contain auth tokens / PII).
 */
export default function medusaError(error: any): never {
  const raw =
    error?.response?.data?.message ??
    (typeof error?.response?.data === "string" ? error.response.data : undefined) ??
    error?.message ??
    "Something went wrong"

  const status = error?.status ?? error?.response?.status
  if (process.env.NODE_ENV !== "production") {
    console.error(`[medusa] ${status ?? ""} ${raw}`)
  }

  const message = String(raw).replace(/^Error setting up the request:\s*/i, "").trim()
  throw new Error(message.charAt(0).toUpperCase() + message.slice(1))
}
