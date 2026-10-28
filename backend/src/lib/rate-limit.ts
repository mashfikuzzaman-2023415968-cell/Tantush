import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { createHash } from "crypto"
import { getClientIp } from "./client-ip"
import { getRedis } from "./redis"

type RateLimitOptions = {
  /** Unique name for this limiter, used in the Redis key. */
  name: string
  /** Window length in seconds. */
  windowSec: number
  /** Max requests per window per key. */
  max: number
  /**
   * Optional extra key component (e.g. the email being logged into) so an
   * attacker rotating IPs still gets throttled per account.
   */
  keyFrom?: (req: MedusaRequest) => string | undefined
}

// Atomic fixed-window counter: INCR and set expiry on first hit.
const SCRIPT = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then
  redis.call("EXPIRE", KEYS[1], ARGV[1])
end
local ttl = redis.call("TTL", KEYS[1])
return { current, ttl }
`

const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex").slice(0, 32)

/**
 * Distributed rate limiter backed by Redis, so limits hold across every
 * Medusa replica behind the load balancer. Fails open if Redis is down
 * (nginx + Cloudflare limits still apply) rather than taking the shop offline.
 */
export function rateLimit(opts: RateLimitOptions) {
  return async (
    req: MedusaRequest,
    res: MedusaResponse,
    next: MedusaNextFunction
  ) => {
    if (process.env.RATE_LIMIT_DISABLED === "true") {
      return next()
    }

    const parts = [getClientIp(req)]
    const extra = opts.keyFrom?.(req)
    if (extra) parts.push(extra.toLowerCase())
    const key = `rl:${opts.name}:${hash(parts.join("|"))}`

    try {
      const [count, ttl] = (await getRedis().eval(
        SCRIPT,
        1,
        key,
        String(opts.windowSec)
      )) as [number, number]

      const remaining = Math.max(0, opts.max - count)
      res.setHeader("RateLimit-Limit", String(opts.max))
      res.setHeader("RateLimit-Remaining", String(remaining))
      res.setHeader("RateLimit-Reset", String(Math.max(ttl, 0)))

      if (count > opts.max) {
        res.setHeader("Retry-After", String(Math.max(ttl, 1)))
        return res.status(429).json({
          type: "too_many_requests",
          message: "Too many requests. Please wait a moment and try again.",
        })
      }
    } catch (e) {
      req.scope
        ?.resolve("logger")
        ?.warn(`[rate-limit] ${opts.name} skipped: ${(e as Error).message}`)
    }

    return next()
  }
}

/** Reads `email` / `identifier` from a JSON body for per-account throttling. */
export const bodyIdentifier = (req: MedusaRequest) => {
  const body = (req.body ?? {}) as Record<string, unknown>
  const id = body.email ?? body.identifier
  return typeof id === "string" ? id.slice(0, 254) : undefined
}
