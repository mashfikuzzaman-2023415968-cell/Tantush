import { HttpTypes } from "@medusajs/types"
import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL
const PUBLIC_MEDIA_URL = process.env.NEXT_PUBLIC_MEDIA_URL || ""
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "bd"
const IS_DEV = process.env.NODE_ENV === "development"

const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: Date.now(),
}

async function getRegionMap(cacheId: string) {
  const { regionMap, regionMapUpdated } = regionMapCache

  if (!BACKEND_URL) {
    throw new Error("proxy.ts: MEDUSA_BACKEND_URL is not set")
  }

  if (!regionMap.keys().next().value || regionMapUpdated < Date.now() - 3600 * 1000) {
    const { regions } = await fetch(`${BACKEND_URL}/store/regions`, {
      headers: { "x-publishable-api-key": PUBLISHABLE_API_KEY! },
      next: { revalidate: 3600, tags: [`regions-${cacheId}`] },
      cache: "force-cache",
    }).then(async (response) => {
      const json = await response.json()
      if (!response.ok) {
        throw new Error(json.message)
      }
      return json
    })

    if (!regions?.length) {
      throw new Error("No regions found. Run the backend seed or create a region in Medusa Admin.")
    }

    regions.forEach((region: HttpTypes.StoreRegion) => {
      region.countries?.forEach((c) => {
        regionMapCache.regionMap.set(c.iso_2 ?? "", region)
      })
    })
    regionMapCache.regionMapUpdated = Date.now()
  }

  return regionMapCache.regionMap
}

function getCountryCode(request: NextRequest, regionMap: Map<string, HttpTypes.StoreRegion>) {
  const urlCountryCode = request.nextUrl.pathname.split("/")[1]?.toLowerCase()
  // Cloudflare tells us the visitor country; useful if more regions are added later.
  const cfCountry = request.headers.get("cf-ipcountry")?.toLowerCase()

  if (urlCountryCode && regionMap.has(urlCountryCode)) return urlCountryCode
  if (cfCountry && regionMap.has(cfCountry)) return cfCountry
  if (regionMap.has(DEFAULT_REGION)) return DEFAULT_REGION
  return regionMap.keys().next().value
}

/**
 * Strict, nonce-based Content Security Policy. Only scripts carrying this
 * request's nonce (i.e. ones Next.js rendered) can run, which blocks injected
 * <script> tags even if an XSS bug slipped in somewhere.
 */
function buildCsp(nonce: string) {
  const mediaHosts = [BACKEND_URL, PUBLIC_MEDIA_URL]
    .filter(Boolean)
    .map((u) => {
      try {
        return new URL(u!).origin
      } catch {
        return ""
      }
    })
    .filter(Boolean)
    .join(" ")

  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${IS_DEV ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: ${mediaHosts}`,
    `font-src 'self' data:`,
    `connect-src 'self' ${mediaHosts} https://challenges.cloudflare.com${IS_DEV ? " ws:" : ""}`,
    // Cloudflare Turnstile (bot check) renders in an iframe
    `frame-src https://challenges.cloudflare.com`,
    `frame-ancestors 'none'`,
    `form-action 'self'`,
    `base-uri 'self'`,
    `object-src 'none'`,
    `manifest-src 'self'`,
    ...(IS_DEV ? [] : ["upgrade-insecure-requests"]),
  ].join("; ")
}

function withSecurity(response: NextResponse, csp: string) {
  response.headers.set("Content-Security-Policy", csp)
  return response
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64")
  const csp = buildCsp(nonce)

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-nonce", nonce)
  requestHeaders.set("Content-Security-Policy", csp)

  const next = () =>
    withSecurity(NextResponse.next({ request: { headers: requestHeaders } }), csp)

  // Static files never need region handling
  if (request.nextUrl.pathname.includes(".")) {
    return next()
  }

  const cacheIdCookie = request.cookies.get("_medusa_cache_id")
  const cacheId = cacheIdCookie?.value || crypto.randomUUID()

  let regionMap: Map<string, HttpTypes.StoreRegion>
  try {
    regionMap = await getRegionMap(cacheId)
  } catch (e) {
    if (IS_DEV) console.error(e)
    return new NextResponse("Store is temporarily unavailable. Please try again shortly.", {
      status: 503,
      headers: { "Retry-After": "30" },
    })
  }

  const countryCode = getCountryCode(request, regionMap)
  const firstSegment = request.nextUrl.pathname.split("/")[1]?.toLowerCase()
  const urlHasCountryCode = !!countryCode && firstSegment === countryCode

  if (urlHasCountryCode && cacheIdCookie) {
    return next()
  }

  if (urlHasCountryCode && !cacheIdCookie) {
    const response = next()
    response.cookies.set("_medusa_cache_id", cacheId, {
      maxAge: 60 * 60 * 24,
      httpOnly: true,
      sameSite: "lax",
      secure: !IS_DEV,
    })
    return response
  }

  if (!countryCode) {
    return new NextResponse("No region configured.", { status: 500 })
  }

  const redirectPath = request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname
  const redirectUrl = `${request.nextUrl.origin}/${countryCode}${redirectPath}${request.nextUrl.search}`
  return withSecurity(NextResponse.redirect(redirectUrl, 307), csp)
}

export const config = {
  matcher: [
    {
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|brand|images|robots.txt|sitemap.xml|.*\\.(?:png|svg|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
      missing: [{ type: "header", key: "next-router-prefetch" }],
    },
  ],
}
