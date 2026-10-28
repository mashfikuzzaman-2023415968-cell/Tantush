import type { MedusaRequest } from "@medusajs/framework/http"

const TRUST_PROXY = process.env.TRUST_PROXY === "true"

/**
 * Resolve the real client IP.
 *
 * In production the chain is Cloudflare -> nginx -> Medusa. nginx restores the
 * visitor IP from CF-Connecting-IP (only for Cloudflare source ranges) and
 * forwards it as X-Real-IP. We only trust that header when TRUST_PROXY=true,
 * otherwise anybody could spoof it to dodge rate limits.
 */
export function getClientIp(req: MedusaRequest): string {
  if (TRUST_PROXY) {
    const real = req.headers["x-real-ip"]
    if (typeof real === "string" && real.length && real.length <= 64) {
      return real.trim()
    }
  }
  return req.socket?.remoteAddress || "unknown"
}
