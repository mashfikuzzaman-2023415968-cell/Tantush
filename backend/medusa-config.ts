import { defineConfig, loadEnv, Modules } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const IS_PROD = process.env.NODE_ENV === "production"

/**
 * Fail fast on insecure configuration in production instead of silently
 * falling back to defaults (e.g. the well-known "supersecret").
 */
function requireEnv(key: string, opts: { minLength?: number } = {}): string {
  const value = process.env[key]
  if (!value) {
    if (IS_PROD) {
      throw new Error(`[config] Missing required environment variable ${key}`)
    }
    return `dev-only-${key.toLowerCase()}-change-me-0123456789abcdef`
  }
  if (IS_PROD && opts.minLength && value.length < opts.minLength) {
    throw new Error(
      `[config] ${key} must be at least ${opts.minLength} characters in production`
    )
  }
  return value
}

const DATABASE_URL = requireEnv("DATABASE_URL")
const REDIS_URL = requireEnv("REDIS_URL")
const JWT_SECRET = requireEnv("JWT_SECRET", { minLength: 48 })
const COOKIE_SECRET = requireEnv("COOKIE_SECRET", { minLength: 48 })
const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

/**
 * WORKER_MODE lets the same image run as an API node ("server") behind the
 * load balancer, or as the single background worker ("worker") that processes
 * subscribers, scheduled jobs and workflow steps.
 */
const WORKER_MODE = (process.env.MEDUSA_WORKER_MODE || "shared") as
  | "shared"
  | "worker"
  | "server"

const fileProvider = process.env.S3_BUCKET
  ? {
      // Any S3 compatible storage: Oracle Object Storage, Cloudflare R2, AWS S3
      resolve: "@medusajs/medusa/file-s3",
      id: "s3",
      options: {
        file_url: process.env.S3_FILE_URL,
        access_key_id: process.env.S3_ACCESS_KEY_ID,
        secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
        region: process.env.S3_REGION,
        bucket: process.env.S3_BUCKET,
        endpoint: process.env.S3_ENDPOINT,
        additional_client_config: {
          forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
        },
      },
    }
  : {
      resolve: "@medusajs/medusa/file-local",
      id: "local",
      options: {
        upload_dir: "static",
        backend_url: `${BACKEND_URL}/static`,
      },
    }

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: DATABASE_URL,
    databaseDriverOptions: IS_PROD && process.env.DATABASE_SSL === "true"
      ? { connection: { ssl: { rejectUnauthorized: false } } }
      : undefined,
    redisUrl: REDIS_URL,
    redisPrefix: "tantush:",
    workerMode: WORKER_MODE,
    sessionOptions: {
      name: "tantush.sid",
      ttl: 1000 * 60 * 60 * 8, // 8h admin sessions
    },
    cookieOptions: {
      sameSite: "lax",
      secure: IS_PROD,
      httpOnly: true,
    },
    http: {
      storeCors: requireEnv("STORE_CORS"),
      adminCors: requireEnv("ADMIN_CORS"),
      authCors: requireEnv("AUTH_CORS"),
      jwtSecret: JWT_SECRET,
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || "2d",
      cookieSecret: COOKIE_SECRET,
      compression: {
        // nginx also compresses; keep app-level compression for direct hits
        enabled: true,
        level: 6,
        memLevel: 8,
        threshold: 1024,
      },
      // Never allow store API callers to expand order relations from other entities
      restrictedFields: {
        store: ["order", "orders"],
      },
    },
  },
  admin: {
    disable: process.env.MEDUSA_ADMIN_DISABLED === "true",
    path: "/app",
    backendUrl: BACKEND_URL,
  },
  featureFlags: {
    // Bangla / English product content via the Translation module
    translation: true,
  },
  modules: [
    {
      resolve: "@medusajs/medusa/cache-redis",
      options: { redisUrl: REDIS_URL, ttl: 60 },
    },
    {
      resolve: "@medusajs/medusa/event-bus-redis",
      options: {
        redisUrl: REDIS_URL,
        jobOptions: { removeOnComplete: { age: 3600, count: 1000 }, removeOnFail: { age: 86400 } },
      },
    },
    {
      resolve: "@medusajs/medusa/workflow-engine-redis",
      options: { redis: { redisUrl: REDIS_URL } },
    },
    {
      resolve: "@medusajs/medusa/locking",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/locking-redis",
            id: "locking-redis",
            is_default: true,
            options: { redisUrl: REDIS_URL },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/file",
      options: { providers: [fileProvider] },
    },
    {
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [
          {
            // Logs notifications without customer data; swap for an SMS /
            // email provider (e.g. SendGrid, SSL Wireless) when ready.
            resolve: "./src/modules/notification-log",
            id: "log",
            options: { channels: ["email", "sms", "feed"] },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/translation",
    },
    {
      resolve: "./src/modules/email-verification",
    },
    {
      // Cash on delivery is served by the built-in manual payment provider
      // (pp_system_default) — no third-party gateway needed.
      resolve: "@medusajs/medusa/payment",
      options: { providers: [] },
    },
    {
      key: Modules.FULFILLMENT,
      resolve: "@medusajs/medusa/fulfillment",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/fulfillment-manual",
            id: "manual",
          },
        ],
      },
    },
  ],
})
