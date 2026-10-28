const { loadEnvConfig } = require("@next/env")

// Make .env* values available while this config is evaluated (image hosts below)
loadEnvConfig(process.cwd())

const checkEnvVariables = require("./check-env-variables")

checkEnvVariables()

/**
 * Hosts allowed to serve product images to next/image.
 * Defaults to the Medusa backend; add your S3 / R2 / Object Storage public URL
 * via NEXT_PUBLIC_MEDIA_URL.
 */
const imageHosts = [process.env.MEDUSA_BACKEND_URL, process.env.NEXT_PUBLIC_MEDIA_URL]
  .filter(Boolean)
  .map((value) => {
    const url = new URL(value)
    return {
      protocol: url.protocol.replace(":", ""),
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
    }
  })

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
]

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  // Self-contained server bundle for the Docker image
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === "development",
    },
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "256kb",
      // Server actions are only accepted from these origins (CSRF protection)
      allowedOrigins: (process.env.SERVER_ACTIONS_ALLOWED_ORIGINS || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 480, 640, 828, 1080, 1280, 1600, 1920],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    remotePatterns: imageHosts,
    // Next blocks image hosts on private IPs (SSRF protection). Only enable for
    // local development where the backend runs on localhost.
    dangerouslyAllowLocalIP: process.env.NEXT_IMAGE_ALLOW_LOCAL_IP === "true",
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/brand/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }],
      },
    ]
  },
}

module.exports = nextConfig
