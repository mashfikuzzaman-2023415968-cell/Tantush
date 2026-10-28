import type {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createHmac, randomUUID, timingSafeEqual } from "crypto"

// ---------------------------------------------------------------------------
// Field tampering
// ---------------------------------------------------------------------------

/**
 * Medusa's store API lets clients write free-form `metadata` (and
 * `additional_data`) on carts, line items and customers. Metadata is copied
 * onto orders and our own code relies on it, so shoppers must never set it.
 */
export function forbidClientFields(fields: string[] = ["metadata", "additional_data"]) {
  return (req: MedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) => {
    const body = req.body as Record<string, unknown> | undefined
    if (body && typeof body === "object") {
      const found = fields.filter((f) => body[f] !== undefined && body[f] !== null)
      if (found.length) {
        return next(
          new MedusaError(
            MedusaError.Types.NOT_ALLOWED,
            `Field(s) not allowed: ${found.join(", ")}`
          )
        )
      }
    }
    next()
  }
}

// ---------------------------------------------------------------------------
// Uploads (admin only)
// ---------------------------------------------------------------------------

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
const MAX_FILES = 10

/** Runs BEFORE Medusa's in-memory multer: refuse oversized bodies up front. */
export function uploadSizeGuard(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  const path = (req.originalUrl || req.url).split("?")[0]
  if (req.method === "POST" && /^\/admin\/uploads\/?$/.test(path)) {
    const length = Number(req.headers["content-length"] ?? NaN)
    if (!Number.isFinite(length)) {
      return res.status(411).json({ type: "invalid_data", message: "Content-Length required" })
    }
    if (length > MAX_UPLOAD_BYTES * MAX_FILES) {
      return res.status(413).json({ type: "invalid_data", message: "Upload too large" })
    }
  }
  next()
}

/** Identify images by their magic bytes, never by the client-supplied name/type. */
function sniffImage(buf: Buffer): "jpg" | "png" | "webp" | "gif" | "avif" | null {
  if (buf.length < 12) return null
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg"
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png"
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp"
  if (buf.toString("ascii", 0, 6) === "GIF87a" || buf.toString("ascii", 0, 6) === "GIF89a") return "gif"
  if (buf.toString("ascii", 4, 12) === "ftypavif" || buf.toString("ascii", 4, 12) === "ftypavis") return "avif"
  return null
}

/**
 * Runs AFTER multer: only real raster images (no SVG/HTML/scripts), size and
 * count capped, and the stored file name forced to a safe extension.
 */
export function validateUploadedFiles(req: MedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) {
  const files = ((req as any).files ?? []) as Array<{
    originalname: string
    mimetype: string
    size: number
    buffer: Buffer
  }>
  if (files.length > MAX_FILES) {
    return next(new MedusaError(MedusaError.Types.INVALID_DATA, `At most ${MAX_FILES} files per upload`))
  }
  for (const f of files) {
    if (f.size > MAX_UPLOAD_BYTES) {
      return next(new MedusaError(MedusaError.Types.INVALID_DATA, "Each image must be 10 MB or smaller"))
    }
    const kind = sniffImage(f.buffer)
    if (!kind) {
      return next(
        new MedusaError(MedusaError.Types.INVALID_DATA, "Only JPG, PNG, WebP, AVIF or GIF images can be uploaded")
      )
    }
    const base = f.originalname.replace(/\.[^.]*$/, "").replace(/[^A-Za-z0-9_-]+/g, "-").slice(0, 60) || "image"
    f.originalname = `${base}.${kind}`
    f.mimetype = kind === "jpg" ? "image/jpeg" : `image/${kind}`
  }
  next()
}

// ---------------------------------------------------------------------------
// Order privacy (record-level access)
// ---------------------------------------------------------------------------

const ORDER_ACCESS_SECRET = process.env.ORDER_ACCESS_SECRET || ""

/** HMAC the storefront presents to prove "this browser placed this order". */
export function orderAccessProof(orderId: string) {
  return createHmac("sha256", ORDER_ACCESS_SECRET).update(`order:${orderId}`).digest("hex")
}

function hasValidOrderProof(req: MedusaRequest, orderId: string) {
  const header = req.headers["x-order-access"]
  if (!ORDER_ACCESS_SECRET || typeof header !== "string" || header.length !== 64) return false
  const expected = Buffer.from(orderAccessProof(orderId))
  const given = Buffer.from(header)
  return given.length === expected.length && timingSafeEqual(given, expected)
}

const PRIVATE_ORDER_FIELDS = ["email", "shipping_address", "billing_address", "customer", "customer_id", "transactions"]

/**
 * Medusa returns full guest orders to anyone who knows the order ID.
 * Personal data is now only returned to the logged-in owner, or to the
 * storefront server holding a signed proof for the browser that placed it.
 */
export function protectOrderDetails(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  const orderId = req.params.id
  const actorId = (req as AuthenticatedMedusaRequest).auth_context?.actor_id
  const originalJson = res.json.bind(res)

  res.json = ((body: any) => {
    const order = body?.order
    if (order && res.statusCode < 400) {
      const isOwner = !!actorId && !!order.customer_id && order.customer_id === actorId
      if (!isOwner && !hasValidOrderProof(req, orderId)) {
        for (const f of PRIVATE_ORDER_FIELDS) delete order[f]
      }
    }
    return originalJson(body)
  }) as typeof res.json

  next()
}

// ---------------------------------------------------------------------------
// Bot protection (Cloudflare Turnstile)
// ---------------------------------------------------------------------------

const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY || ""

/**
 * Verifies a Cloudflare Turnstile token sent in `x-turnstile-token`.
 * Enforced server-side so bots can't skip it by calling the API directly.
 * No-op until TURNSTILE_SECRET_KEY is configured.
 */
export function requireHuman(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  if (!TURNSTILE_SECRET) return next()
  const token = req.headers["x-turnstile-token"]
  if (typeof token !== "string" || !token || token.length > 2048) {
    return res.status(403).json({ type: "not_allowed", message: "Please complete the human check." })
  }
  const body = new URLSearchParams({ secret: TURNSTILE_SECRET, response: token })
  const ip = req.headers["x-real-ip"]
  if (typeof ip === "string") body.set("remoteip", ip)

  fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
    signal: AbortSignal.timeout(5000),
  })
    .then((r) => r.json() as Promise<{ success: boolean }>)
    .then((r) =>
      r.success
        ? next()
        : res.status(403).json({ type: "not_allowed", message: "Human check failed. Please try again." })
    )
    .catch(() =>
      res.status(503).json({ type: "unexpected_state", message: "Verification unavailable, please retry." })
    )
}

// ---------------------------------------------------------------------------
// Error responses
// ---------------------------------------------------------------------------

/**
 * Wraps Medusa's error handler so 5xx responses never expose internal
 * messages (e.g. database errors). Clients get a reference ID; the full
 * error is logged server-side under that ID.
 */
export function sanitizeServerErrors(
  core: (err: any, req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => void
) {
  return (err: any, req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
    const originalJson = res.json.bind(res)
    res.json = ((body: any) => {
      if (res.statusCode >= 500) {
        const ref = randomUUID().slice(0, 8)
        req.scope
          ?.resolve(ContainerRegistrationKeys.LOGGER)
          ?.error(`[error ${ref}] ${req.method} ${req.path}: ${err?.stack || err?.message || err}`)
        return originalJson({
          type: "unknown_error",
          message: `Something went wrong. Reference: ${ref}`,
        })
      }
      return originalJson(body)
    }) as typeof res.json
    return core(err, req, res, next)
  }
}
