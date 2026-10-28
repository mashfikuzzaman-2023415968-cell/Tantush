import {
  authenticate,
  defineMiddlewares,
  errorHandler,
  validateAndTransformBody,
  validateAndTransformQuery,
  type MedusaNextFunction,
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { MAX_QTY_PER_LINE } from "../lib/constants"
import {
  forbidClientFields,
  protectOrderDetails,
  requireHuman,
  sanitizeServerErrors,
  uploadSizeGuard,
  validateUploadedFiles,
} from "../lib/guards"
import { bodyIdentifier, rateLimit } from "../lib/rate-limit"
import { securityHeaders } from "../lib/security-headers"
import { AdminPosOrderSchema } from "./admin/pos/orders/validators"
import { StoreCatalogParams } from "./store/catalog/validators"
import { ConfirmEmailSchema } from "./store/email-verification/confirm/validators"

const MINUTE = 60
const HOUR = 60 * MINUTE

/** Reject absurd quantities early — COD orders are fulfilled manually. */
function capLineItemQuantity(req: MedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) {
  const quantity = (req.body as { quantity?: unknown } | undefined)?.quantity
  if (quantity !== undefined) {
    const n = Number(quantity)
    if (!Number.isInteger(n) || n < 0 || n > MAX_QTY_PER_LINE) {
      return next(
        new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `You can order up to ${MAX_QTY_PER_LINE} pieces of an item at a time. For bulk orders please contact us.`
        )
      )
    }
  }
  next()
}

const customerAuth = authenticate("customer", ["session", "bearer"])

export default defineMiddlewares({
  errorHandler: sanitizeServerErrors(errorHandler()),
  routes: [
    // ----------------------------------------------------------- everywhere
    { matcher: "/*", middlewares: [securityHeaders] },

    // ------------------------------------------------------------- webhooks
    {
      // Cash on delivery needs no payment webhooks. Medusa's generic
      // /hooks/payment/:provider accepts unauthenticated JSON and queues jobs,
      // so it stays closed until a gateway (with signature checks) is added.
      matcher: "/hooks/*",
      middlewares: [
        (_req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) =>
          process.env.ENABLE_PAYMENT_WEBHOOKS === "true"
            ? next()
            : res.status(404).json({ type: "not_found", message: "Not found" }),
      ],
    },

    // ---------------------------------------------- authentication (strict)
    {
      matcher: "/auth/customer/emailpass",
      methods: ["POST"],
      middlewares: [
        rateLimit({ name: "login-ip", windowSec: 15 * MINUTE, max: 20 }),
        rateLimit({ name: "login-account", windowSec: 15 * MINUTE, max: 6, keyFrom: bodyIdentifier }),
        requireHuman,
      ],
    },
    {
      matcher: "/auth/user/emailpass",
      methods: ["POST"],
      middlewares: [
        rateLimit({ name: "admin-login-ip", windowSec: 15 * MINUTE, max: 20 }),
        rateLimit({ name: "admin-login-account", windowSec: 15 * MINUTE, max: 6, keyFrom: bodyIdentifier }),
      ],
    },
    {
      matcher: "/auth/:actor/emailpass/register",
      methods: ["POST"],
      middlewares: [rateLimit({ name: "register", windowSec: HOUR, max: 5 }), requireHuman],
    },
    {
      matcher: "/auth/:actor/emailpass/reset-password",
      methods: ["POST"],
      middlewares: [
        rateLimit({ name: "reset-ip", windowSec: HOUR, max: 5 }),
        rateLimit({ name: "reset-account", windowSec: HOUR, max: 3, keyFrom: bodyIdentifier }),
      ],
    },
    {
      matcher: "/auth/:actor/emailpass/update",
      methods: ["POST"],
      middlewares: [rateLimit({ name: "reset-update", windowSec: HOUR, max: 10 })],
    },

    // --------------------------------------------------------------- store
    {
      matcher: "/store/*",
      bodyParser: { sizeLimit: "64kb" },
      middlewares: [rateLimit({ name: "store", windowSec: MINUTE, max: 300 })],
    },
    {
      // Clients may not write metadata / additional_data anywhere in the store API
      matcher: "/store/carts*",
      methods: ["POST"],
      middlewares: [forbidClientFields(["metadata", "additional_data", "data"])],
    },
    {
      matcher: "/store/customers*",
      methods: ["POST"],
      middlewares: [forbidClientFields(["metadata", "additional_data"])],
    },
    {
      matcher: "/store/customers",
      methods: ["POST"],
      middlewares: [rateLimit({ name: "customer-create", windowSec: HOUR, max: 5 })],
    },
    {
      matcher: "/store/carts",
      methods: ["POST"],
      middlewares: [rateLimit({ name: "cart-create", windowSec: HOUR, max: 60 })],
    },
    {
      matcher: "/store/carts/:id/line-items",
      methods: ["POST"],
      middlewares: [rateLimit({ name: "line-items", windowSec: MINUTE, max: 40 }), capLineItemQuantity],
    },
    {
      matcher: "/store/carts/:id/line-items/:line_id",
      methods: ["POST"],
      middlewares: [capLineItemQuantity],
    },
    {
      matcher: "/store/carts/:id/promotions",
      methods: ["POST"],
      // Stops brute-forcing promo codes
      middlewares: [rateLimit({ name: "promo", windowSec: 10 * MINUTE, max: 10 })],
    },
    {
      // Placing orders — COD orders cost real courier money, so throttle hard.
      matcher: "/store/carts/:id/complete",
      methods: ["POST"],
      middlewares: [rateLimit({ name: "checkout", windowSec: HOUR, max: 8 }), requireHuman],
    },
    {
      matcher: "/store/orders/:id",
      methods: ["GET"],
      middlewares: [
        authenticate("customer", ["session", "bearer"], { allowUnauthenticated: true }),
        rateLimit({ name: "order-lookup", windowSec: MINUTE, max: 30 }),
        protectOrderDetails,
      ],
    },
    {
      matcher: "/store/orders/*",
      methods: ["POST"],
      middlewares: [rateLimit({ name: "order-transfer", windowSec: HOUR, max: 10 })],
    },
    {
      matcher: "/store/catalog",
      methods: ["GET"],
      middlewares: [validateAndTransformQuery(StoreCatalogParams, {})],
    },
    {
      matcher: "/store/customers/me/email-verification",
      middlewares: [customerAuth],
    },
    {
      matcher: "/store/customers/me/email-verification",
      methods: ["POST"],
      middlewares: [rateLimit({ name: "verify-resend", windowSec: HOUR, max: 3 })],
    },
    {
      matcher: "/store/email-verification/confirm",
      methods: ["POST"],
      middlewares: [
        rateLimit({ name: "verify-confirm", windowSec: HOUR, max: 20 }),
        validateAndTransformBody(ConfirmEmailSchema),
      ],
    },

    // --------------------------------------------------------------- admin
    {
      matcher: "/admin/*",
      middlewares: [rateLimit({ name: "admin", windowSec: MINUTE, max: 600 }), uploadSizeGuard],
    },
    {
      matcher: "/admin/uploads",
      methods: ["POST"],
      middlewares: [validateUploadedFiles],
    },
    {
      matcher: "/admin/pos/orders",
      methods: ["POST"],
      middlewares: [
        rateLimit({ name: "pos", windowSec: MINUTE, max: 30 }),
        validateAndTransformBody(AdminPosOrderSchema),
      ],
    },
  ],
})
