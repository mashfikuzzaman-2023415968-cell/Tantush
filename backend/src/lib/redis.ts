import Redis from "ioredis"

let client: Redis | null = null

/**
 * Lazily created, shared Redis connection for custom code
 * (rate limiting, catalog cache versioning).
 */
export function getRedis(): Redis {
  if (!client) {
    client = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      keyPrefix: "tantush:",
      maxRetriesPerRequest: 2,
      // Queue commands while (re)connecting, but never let a slow Redis stall requests.
      enableOfflineQueue: true,
      connectTimeout: 2000,
      commandTimeout: 500,
    })
    client.on("error", () => {
      // Errors are surfaced to callers; avoid crashing the process on reconnect noise.
    })
  }
  return client
}
