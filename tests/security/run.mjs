#!/usr/bin/env node
/**
 * Tantush security test suite — runs against a live stack.
 *
 *   SHOP_URL=https://tantush.xyz API_URL=https://api.tantush.xyz \
 *   PUBLISHABLE_KEY=pk_... ADMIN_EMAIL=... ADMIN_PASSWORD=... \
 *   node tests/security/run.mjs
 *
 * Creates two throw-away customers and one guest order. Rate-limit tests use
 * random identities so real users are never locked out. Requires Node 20+.
 */

const SHOP = (process.env.SHOP_URL || "http://localhost:8000").replace(/\/$/, "")
const API = (process.env.API_URL || "http://localhost:9000").replace(/\/$/, "")
const PK = process.env.PUBLISHABLE_KEY
const ADMIN_EMAIL = process.env.ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
const KNOWN_SECRETS = (process.env.KNOWN_SECRETS || "").split(",").filter((s) => s.length >= 12)

if (!PK) {
  console.error("PUBLISHABLE_KEY is required")
  process.exit(2)
}

const results = []
const check = async (id, name, fn) => {
  try {
    const detail = await fn()
    results.push({ id, name, ok: true, detail: detail || "" })
  } catch (e) {
    results.push({ id, name, ok: false, detail: e.message })
  }
}
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg)
}
const rnd = () => Math.random().toString(36).slice(2, 10)

async function api(path, { method = "GET", body, token, headers = {}, key = PK } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: {
      "content-type": "application/json",
      ...(key ? { "x-publishable-api-key": key } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  })
  let json = null
  try {
    json = await res.json()
  } catch {}
  return { status: res.status, headers: res.headers, json }
}

async function newCustomer() {
  const email = `sec-${rnd()}@example.com`
  const password = `Pw-${rnd()}-${rnd()}`
  const reg = await api("/auth/customer/emailpass/register", { method: "POST", body: { email, password } })
  assert(reg.json?.token, `register failed: ${reg.status} ${reg.json?.message}`)
  await api("/store/customers", { method: "POST", token: reg.json.token, body: { email, first_name: "Sec", last_name: "Test" } })
  const login = await api("/auth/customer/emailpass", { method: "POST", body: { email, password } })
  assert(login.json?.token, `login failed: ${login.status}`)
  return { email, token: login.json.token }
}

async function guestOrder() {
  const { json: r } = await api("/store/regions")
  const region = r.regions[0].id
  const { json: p } = await api("/store/products?limit=1&fields=*variants")
  const variant = p.products[0].variants[0].id
  const { json: c } = await api("/store/carts", { method: "POST", body: { region_id: region } })
  const cart = c.cart.id
  await api(`/store/carts/${cart}/line-items`, { method: "POST", body: { variant_id: variant, quantity: 1 } })
  const address = { first_name: "Sec", last_name: "Test", address_1: "House 1, Road 2", city: "Dhaka", country_code: "bd", phone: "01712345678" }
  await api(`/store/carts/${cart}`, { method: "POST", body: { email: `guest-${rnd()}@example.com`, shipping_address: address, billing_address: address } })
  const { json: so } = await api(`/store/shipping-options?cart_id=${cart}`)
  await api(`/store/carts/${cart}/shipping-methods`, { method: "POST", body: { option_id: so.shipping_options[0].id } })
  const { json: pc } = await api("/store/payment-collections", { method: "POST", body: { cart_id: cart } })
  await api(`/store/payment-collections/${pc.payment_collection.id}/payment-sessions`, { method: "POST", body: { provider_id: "pp_system_default" } })
  const done = await api(`/store/carts/${cart}/complete`, { method: "POST" })
  assert(done.json?.type === "order", `could not place test order: ${done.status} ${done.json?.message}`)
  return { order: done.json.order, cart, variant, region }
}

// ---------------------------------------------------------------------------

await check("headers", "Storefront security headers (CSP nonce, HSTS, XFO, nosniff…)", async () => {
  const res = await fetch(`${SHOP}/bd`, { redirect: "manual" })
  const h = res.headers
  const csp = h.get("content-security-policy") || ""
  assert(/script-src[^;]*'nonce-[A-Za-z0-9+/=]+'/.test(csp), "CSP missing script nonce")
  assert(!/script-src[^;]*'unsafe-inline'/.test(csp), "CSP allows unsafe-inline scripts")
  assert(csp.includes("frame-ancestors 'none'"), "CSP missing frame-ancestors")
  assert(csp.includes("object-src 'none'"), "CSP missing object-src none")
  assert(h.get("strict-transport-security")?.includes("max-age=63072000"), "HSTS missing")
  assert(h.get("x-frame-options") === "DENY", "X-Frame-Options missing")
  assert(h.get("x-content-type-options") === "nosniff", "nosniff missing")
  assert(h.get("referrer-policy"), "Referrer-Policy missing")
  assert(h.get("permissions-policy"), "Permissions-Policy missing")
  assert(!h.get("x-powered-by"), "X-Powered-By exposed")
})

await check("headers", "API security headers + no framework fingerprint", async () => {
  const { headers: h } = await api("/store/regions")
  assert(h.get("x-content-type-options") === "nosniff", "nosniff missing")
  assert(h.get("x-frame-options"), "X-Frame-Options missing")
  assert(!h.get("x-powered-by"), "X-Powered-By exposed")
})

await check("secrets", "No secrets in the browser JavaScript bundle", async () => {
  const html = await (await fetch(`${SHOP}/bd`)).text()
  const chunks = [...new Set(html.match(/\/_next\/static\/[^"']+\.js/g) || [])]
  assert(chunks.length > 0, "no JS chunks found")
  const patterns = [/-----BEGIN [A-Z ]*PRIVATE KEY/, /postgres(ql)?:\/\/[^"'\s]+:[^"'\s]+@/, /redis:\/\/:[^"'\s]+@/, /sk_live_[0-9a-zA-Z]{10,}/, /JWT_SECRET|COOKIE_SECRET|ORDER_ACCESS_SECRET|TURNSTILE_SECRET/]
  for (const c of chunks) {
    const js = await (await fetch(SHOP + c)).text()
    for (const p of patterns) assert(!p.test(js), `pattern ${p} found in ${c}`)
    for (const s of KNOWN_SECRETS) assert(!js.includes(s), `a known secret value is in ${c}`)
  }
  return `${chunks.length} chunks scanned`
})

await check("cors", "CORS rejects foreign origins", async () => {
  const { headers } = await api("/store/regions", { headers: { origin: "https://evil.example" } })
  const acao = headers.get("access-control-allow-origin")
  assert(acao !== "*" && acao !== "https://evil.example", `ACAO=${acao}`)
})

await check("webhooks", "Unused payment webhook endpoint is closed", async () => {
  const r = await api("/hooks/payment/pp_system_default", { method: "POST", key: null, body: { x: 1 } })
  assert(r.status === 404, `→ ${r.status}`)
})

await check("publishable-key", "Store API requires a valid publishable key", async () => {
  const none = await api("/store/products", { key: null })
  const fake = await api("/store/products", { key: "pk_fake" })
  assert(none.status >= 400 && fake.status >= 400, `got ${none.status}/${fake.status}`)
})

await check("admin-auth", "Admin & POS routes reject unauthenticated requests", async () => {
  for (const [m, p] of [["GET", "/admin/products"], ["GET", "/admin/orders"], ["GET", "/admin/pos/products?q=pa"], ["POST", "/admin/pos/orders"], ["POST", "/admin/uploads"]]) {
    const r = await api(p, { method: m, key: null, body: m === "POST" ? {} : undefined })
    assert(r.status === 401, `${m} ${p} → ${r.status}`)
  }
})

const c1 = await newCustomer().catch((e) => ({ error: e }))
const c2 = await newCustomer().catch((e) => ({ error: e }))

await check("admin-auth", "Customer tokens can't reach the admin API", async () => {
  assert(!c1.error, c1.error?.message)
  const r = await api("/admin/orders", { token: c1.token, key: null })
  assert(r.status === 401 || r.status === 403, `→ ${r.status}`)
})

await check("headers", "Personal data responses are never cacheable", async () => {
  const me = await api("/store/customers/me", { token: c1.token })
  assert(me.status === 200, `→ ${me.status}`)
  assert(me.headers.get("cache-control") === "no-store", `cache-control=${me.headers.get("cache-control")}`)
})

await check("tampering", "Clients can't write metadata on customers", async () => {
  const r = await api("/store/customers/me", { method: "POST", token: c1.token, body: { metadata: { vip: true } } })
  assert(r.status === 400, `→ ${r.status}`)
})

let fixture
await check("tampering", "Clients can't set prices, metadata or extra fields on carts", async () => {
  fixture = await guestOrder()
  const { json: c } = await api("/store/carts", { method: "POST", body: { region_id: fixture.region } })
  const cart = c.cart.id
  const price = await api(`/store/carts/${cart}/line-items`, { method: "POST", body: { variant_id: fixture.variant, quantity: 1, unit_price: 1 } })
  assert(price.status === 400, `unit_price accepted → ${price.status}`)
  const meta = await api(`/store/carts/${cart}`, { method: "POST", body: { metadata: { source: "pos" } } })
  assert(meta.status === 400, `cart metadata accepted → ${meta.status}`)
  const lineMeta = await api(`/store/carts/${cart}/line-items`, { method: "POST", body: { variant_id: fixture.variant, quantity: 1, metadata: { x: 1 } } })
  assert(lineMeta.status === 400, `line item metadata accepted → ${lineMeta.status}`)
  const qty = await api(`/store/carts/${cart}/line-items`, { method: "POST", body: { variant_id: fixture.variant, quantity: 500 } })
  assert(qty.status === 400, `quantity 500 accepted → ${qty.status}`)
})

await check("record-access", "Guest order: personal data hidden without proof", async () => {
  const r = await api(`/store/orders/${fixture.order.id}`)
  assert(r.status === 200, `→ ${r.status}`)
  const o = r.json.order
  assert(!o.shipping_address && !o.email && !o.billing_address, "address/email leaked")
})

await check("record-access", "Guest order: forged proof rejected", async () => {
  const r = await api(`/store/orders/${fixture.order.id}`, { headers: { "x-order-access": "0".repeat(64) } })
  assert(!r.json.order.shipping_address, "forged proof accepted")
})

if (process.env.ORDER_ACCESS_SECRET) {
  await check("record-access", "Guest order: buyer with a valid signed proof sees their details", async () => {
    const { createHmac } = await import("node:crypto")
    const proof = createHmac("sha256", process.env.ORDER_ACCESS_SECRET).update(`order:${fixture.order.id}`).digest("hex")
    const r = await api(`/store/orders/${fixture.order.id}?fields=*shipping_address,+email`, { headers: { "x-order-access": proof } })
    assert(r.json.order?.shipping_address?.city === "Dhaka", "valid proof did not return the address")
  })
}

await check("record-access", "Another customer can't see someone's order details or list", async () => {
  const r = await api(`/store/orders/${fixture.order.id}`, { token: c2.token })
  assert(!r.json.order?.shipping_address && !r.json.order?.email, "PII returned to another customer")
  const list = await api("/store/orders", { token: c2.token })
  assert((list.json.orders || []).every((o) => o.id !== fixture.order.id), "order visible in another customer's list")
})

await check("record-access", "Customer can't read or edit another customer's address", async () => {
  const add = await api("/store/customers/me/addresses", {
    method: "POST",
    token: c1.token,
    body: { first_name: "A", last_name: "B", address_1: "Road 1", city: "Dhaka", country_code: "bd", phone: "01712345678" },
  })
  const addr = add.json?.customer?.addresses?.[0]?.id
  assert(addr, `could not create address (${add.status})`)
  const read = await api(`/store/customers/me/addresses/${addr}`, { token: c2.token })
  assert(read.status === 404 || read.status === 401, `read → ${read.status}`)
  const edit = await api(`/store/customers/me/addresses/${addr}`, { method: "POST", token: c2.token, body: { city: "Hacked" } })
  assert(edit.status >= 400, `edit → ${edit.status}`)
})

await check("validation", "Strict input validation (unknown params rejected)", async () => {
  const { json: r } = await api("/store/regions")
  const bad = await api(`/store/catalog?region_id=${r.regions[0].id}&is_admin=true`)
  assert(bad.status === 400, `unknown param → ${bad.status}`)
  const badRegion = await api(`/store/catalog?region_id=1;DROP TABLE product`)
  assert(badRegion.status === 400, `malformed id → ${badRegion.status}`)
})

await check("sqli", "Search input is parameterised (SQL injection payloads are inert)", async () => {
  const { json: r } = await api("/store/regions")
  for (const q of ["' OR 1=1 --", "\"; DROP TABLE product; --", "%' UNION SELECT password FROM provider_identity --"]) {
    const res = await api(`/store/catalog?region_id=${r.regions[0].id}&q=${encodeURIComponent(q)}`)
    assert(res.status === 200 && res.json.count === 0, `payload ${q} → ${res.status} count=${res.json?.count}`)
  }
  const p = await api("/store/products?q=" + encodeURIComponent("' OR '1'='1"))
  assert(p.status === 200 && p.json.count === 0, `products q → ${p.status} ${p.json?.count}`)
})

await check("xss", "Reflected input is never rendered as HTML", async () => {
  const payload = `<script>alert(1)</script>`
  const html = await (await fetch(`${SHOP}/bd/store?size=${encodeURIComponent(payload)}&sort=${encodeURIComponent(payload)}`)).text()
  assert(!html.includes(payload), "payload reflected unescaped")
})

await check("errors", "Production errors don't leak stack traces", async () => {
  const r = await api("/store/carts/does-not-exist")
  const text = JSON.stringify(r.json || {})
  assert(!/at .*\.js:\d+|node_modules|stack/i.test(text), "stack trace in response")
  const r2 = await api("/store/email-verification/confirm", { method: "POST", body: { token: "x".repeat(43) } })
  assert(r2.status === 400 && !/sql|select|relation/i.test(JSON.stringify(r2.json)), "DB detail leaked")
})

await check("rate-limit", "Login brute force is blocked (per account)", async () => {
  const email = `nobody-${rnd()}@example.com`
  let blockedAt = 0
  for (let i = 1; i <= 9; i++) {
    const r = await api("/auth/customer/emailpass", { method: "POST", body: { email, password: "wrong" } })
    if (r.status === 429) {
      blockedAt = i
      break
    }
  }
  assert(blockedAt > 0 && blockedAt <= 8, `never rate limited`)
  return `blocked at attempt ${blockedAt}`
})

await check("rate-limit", "Rate-limit headers advertised", async () => {
  const { headers } = await api("/store/regions")
  assert(headers.get("ratelimit-limit") && headers.get("ratelimit-remaining"), "missing RateLimit-* headers")
})

await check("email-verify", "Email verification: bogus / reused tokens rejected", async () => {
  const r = await api("/store/email-verification/confirm", { method: "POST", body: { token: "A".repeat(43) } })
  assert(r.status === 400, `→ ${r.status}`)
  const status = await api("/store/customers/me/email-verification", { token: c1.token })
  assert(status.json?.verified === false, "new account reported as verified")
  const anon = await api("/store/customers/me/email-verification")
  assert(anon.status === 401, `anonymous → ${anon.status}`)
})

if (ADMIN_EMAIL && ADMIN_PASSWORD) {
  const login = await api("/auth/user/emailpass", { method: "POST", key: null, body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } })
  const admin = login.json?.token
  const upload = async (name, type, bytes) => {
    const form = new FormData()
    form.append("files", new Blob([bytes], { type }), name)
    const res = await fetch(`${API}/admin/uploads`, { method: "POST", headers: { authorization: `Bearer ${admin}` }, body: form })
    return res.status
  }
  await check("uploads", "Uploads: SVG / HTML / disguised files rejected, real images accepted", async () => {
    assert(admin, `admin login failed (${login.status})`)
    const svg = await upload("x.svg", "image/svg+xml", `<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>`)
    assert(svg === 400, `svg → ${svg}`)
    const html = await upload("x.png", "image/png", `<html><script>alert(1)</script></html>`)
    assert(html === 400, `html disguised as png → ${html}`)
    // 1×1 transparent PNG
    const png = Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/58BAwAI/AL+hc2rNAAAAABJRU5ErkJggg==", "base64"))
    const ok = await upload("tiny.png", "image/png", png)
    assert(ok === 200, `valid png → ${ok}`)
  })
  await check("uploads", "Oversized uploads refused before being buffered", async () => {
    // Announce a 500 MB body but send nothing: the server must answer 413 immediately.
    const { request } = await import(API.startsWith("https") ? "node:https" : "node:http")
    const status = await new Promise((resolve, reject) => {
      const req = request(`${API}/admin/uploads`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${admin}`,
          "content-type": "multipart/form-data; boundary=x",
          "content-length": String(500 * 1024 * 1024),
        },
      })
      req.on("response", (res) => {
        resolve(res.statusCode)
        req.destroy()
      })
      req.on("error", (e) => (e.code === "ECONNRESET" ? null : reject(e)))
      req.write("--x\r\n")
      setTimeout(() => reject(new Error("server waited for the body (no early rejection)")), 5000)
    })
    assert(status === 413, `→ ${status}`)
  })
} else {
  results.push({ id: "uploads", name: "Upload validation (set ADMIN_EMAIL/ADMIN_PASSWORD to run)", ok: true, detail: "skipped" })
}

// ---------------------------------------------------------------------------
const pad = (s, n) => (s + " ".repeat(n)).slice(0, n)
let failed = 0
for (const r of results) {
  if (!r.ok) failed++
  console.log(`${r.ok ? "✅" : "❌"} ${pad(r.id, 14)} ${r.name}${r.detail ? `  — ${r.detail}` : ""}`)
}
console.log(`\n${results.length - failed}/${results.length} passed`)
process.exit(failed ? 1 : 0)
