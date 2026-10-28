import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

/**
 * Baseline security headers for every API response. HSTS and the
 * storefront CSP are set at the edge (nginx / Next.js).
 */
export function securityHeaders(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  res.removeHeader("X-Powered-By")
  res.setHeader("X-Content-Type-Options", "nosniff")
  res.setHeader("X-Frame-Options", "SAMEORIGIN")
  res.setHeader("Cross-Origin-Resource-Policy", "same-site")
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin")
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin")
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
  )

  // Customer / admin data must never be stored by shared caches.
  // (originalUrl: Express rewrites req.path relative to the middleware mount.)
  const path = (req.originalUrl || req.url).split("?")[0]
  if (/^\/(admin|auth|store\/(customers|carts|orders|payment-collections|email-verification))(\/|$)/.test(path)) {
    res.setHeader("Cache-Control", "no-store")
  }
  next()
}
