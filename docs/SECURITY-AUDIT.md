# Pre-launch security audit

Both popular "have Claude check this before launch" lists, merged (36 distinct items),
checked against this codebase. **Automated** means it's verified by
`tests/security/run.mjs` (25 checks, all passing) or the UI/flow tests; re-run
them after every change and against the live site before launch:

```bash
SHOP_URL=https://tantush.xyz API_URL=https://api.tantush.xyz \
PUBLISHABLE_KEY=pk_... ADMIN_EMAIL=... ADMIN_PASSWORD=... \
ORDER_ACCESS_SECRET=... node tests/security/run.mjs
```

Some items come from Supabase-style stacks (public DB key, row-level security).
Tantush has no database exposed to browsers — every request goes through Medusa's
API — so those items are mapped to their real equivalent here.

| # | Item | Status | How it's done here | Verified by |
|---|---|---|---|---|
| 1 | Hide API keys / server-side secrets | ✅ | Secrets live only in server `.env` (chmod 600) and container env. The browser gets only the *publishable* key (read-only, scoped to the online sales channel). Server-only values (`ORDER_ACCESS_SECRET`, `TURNSTILE_SECRET_KEY`, DB/Redis/JWT) are never `NEXT_PUBLIC_*`. | `secrets` test scans every shipped JS chunk for key patterns and the real secret values |
| 2 | Purge git secrets / keep `.env` off GitHub | ✅ | `.env`, `.env.local`, certs, backups are git-ignored; only templates with placeholders are tracked. Full history scanned with detect-secrets + exact-value search: no real secrets. CI runs **gitleaks** on every push. | detect-secrets, `git log -p` value search, gitleaks in CI |
| 3 | "Public DB key" | ✅ (mapped) | Equivalent = Medusa publishable key: safe to expose, only reads catalogue/cart routes for the *Tantush Online* channel; showroom channel and admin are unreachable with it. | `publishable-key` test |
| 4 | Row-level security | ✅ (mapped) | Postgres is on an internal Docker network, never reachable from browsers. Record ownership is enforced in the API: customers only see their own orders/addresses; guest order details are stripped unless the requester owns the order or holds an HMAC proof (Medusa's default returned full guest orders to anyone with the ID — fixed). | `record-access` tests (5) |
| 5 | Encrypt sensitive data | ✅ | In transit: TLS 1.2+ end-to-end (Cloudflare Full-strict + origin cert + optional mTLS). At rest: passwords scrypt-hashed, verification tokens stored as SHA-256 only, Oracle block volumes AES-256 encrypted by default, nightly backups **AES-256 encrypted** (PBKDF2 600k) before leaving the DB container. | backup encrypt/decrypt round-trip test |
| 6 | Enforce server-side auth / server-side access | ✅ | All `/admin/*` (incl. custom POS routes) require an admin session/JWT; customer routes require customer auth; account pages check the session on the server. Customer tokens are rejected by admin routes. | `admin-auth` tests |
| 7 | Lock record access | ✅ | See #4 + Medusa scopes `/store/customers/me/*` to the token's customer. | `record-access` tests |
| 8 | Block field tampering | ✅ | Strict zod schemas (unknown fields → 400). Prices are always computed server-side (`unit_price` rejected). Client `metadata`/`additional_data` blocked on carts, line items and customers (it was writable by default and copied to orders). POS orders identified by sales channel, never by client data. | `tampering` tests |
| 9 | Secure session cookies | ✅ | Auth/cart cookies: `httpOnly`, `secure`, `sameSite=strict`; admin session: `httpOnly`, `secure`, `sameSite=lax`, 8 h TTL, signed with a ≥48-char secret. | code review (`lib/data/cookies.ts`, `medusa-config.ts`) |
| 10 | Hash passwords | ✅ | Medusa emailpass uses **scrypt** (N=2¹⁵, r=8, p=1) — stronger than default bcrypt. Min length 8 enforced server-side. | DB inspection |
| 11 | Rate-limit login / requests | ✅ | Redis-backed limiter shared by all replicas: login 6/15 min per account + 20 per IP, register, reset, promo codes, checkout, cart creation, verification. nginx adds per-IP request/connection limits; Cloudflare adds an edge rule. | `rate-limit` tests (blocked at attempt 7) |
| 12 | Bot protection | ✅ | Honeypot field on login/register/checkout (always on) + **Cloudflare Turnstile** verified *by the backend* on login, register and order placement (set `TURNSTILE_*` keys) + Cloudflare Bot Fight Mode. | UI test (honeypot refused) |
| 13 | Parameterised queries | ✅ | All DB access goes through MikroORM/Knex with bound parameters; no raw SQL in custom code. | `sqli` test (3 payloads inert) |
| 14 | Validate all input / form inputs | ✅ | zod on every custom API route; server actions trim, length-cap, strip control chars and validate (BD phone, email, password length); URL filters whitelisted. | `validation` test |
| 15 | Escape user content / block XSS | ✅ | React escapes all output; the only raw HTML is JSON-LD with `<` escaped; nonce-based CSP with `strict-dynamic` blocks injected scripts even if a bug slipped in. | `xss` test, `headers` test |
| 16 | Restrict / validate file uploads | ✅ | Admin-only. Size checked from `Content-Length` *before* Medusa buffers anything (413); max 10 files × 10 MB; type decided by magic bytes — JPG/PNG/WebP/AVIF/GIF only (SVG/HTML refused); filename & extension rewritten; nginx serves uploads with `CSP: sandbox` + `nosniff`. | `uploads` tests (3) |
| 17 | Trim API responses | ✅ | Catalog/POS routes return only needed fields; `restrictedFields` stops order expansion from store routes; guest order PII stripped; 5xx bodies replaced with a reference ID. | `record-access`, `errors` tests |
| 18 | Security headers | ✅ | Storefront: CSP (nonce), HSTS preload, XFO DENY, nosniff, Referrer-Policy, Permissions-Policy, COOP. API: nosniff, XFO, CORP, `no-store` on personal data (also enforced by nginx for error responses). | `headers` tests (3) |
| 19 | Force HTTPS | ✅ | Cloudflare "Always HTTPS" + nginx 301 + HSTS (2 y, preload) + CSP `upgrade-insecure-requests`; raw-IP/unknown-host connections dropped. | nginx run test |
| 20 | Scan / patch dependencies | ✅ | Next 16.4 / React 19.2 (0 advisories); Medusa 2.22.1 with overrides (high advisories 75 → 0; 12 low/moderate remain inside Medusa's pinned packages). `npm audit` in CI; **Dependabot** weekly PRs for npm, Docker and Actions. | `npm audit` |
| 21 | Protect admin routes | ✅ | Admin auth + its own login rate limit + Cloudflare Access (email OTP) in front of `/app` & `/admin` + optional IP allow-list in nginx. Admin disabled on the worker. | `admin-auth` tests |
| 22 | Verify email | ✅ | New `email-verification` Medusa module: 32-byte single-use token, 24 h expiry, only its hash stored, link token in the URL **fragment** (never reaches servers/logs), resend rate-limited, changing email resets verification, account banner. | UI test (verify, reuse refused), `email-verify` test |
| 23 | No local auth tokens | ✅ | JWT kept in an `httpOnly` cookie, never in `localStorage`/`sessionStorage` (none used anywhere). | code search |
| 24 | No secrets in logs | ✅ | Custom notification provider logs only channel/template/masked recipient in production (verified: token, phone, email absent). Error helper never logs headers. nginx logs contain no tokens (verification uses URL fragments, auth uses headers/bodies). | production log check |
| 25 | Verify webhooks | ✅ (N/A → closed) | Cash on delivery uses no webhooks. Medusa's generic `/hooks/payment/*` accepted unauthenticated JSON and queued jobs — now closed (404) in app and nginx until a gateway (whose signatures Medusa verifies) is added. | `webhooks` test |
| 26 | Tighten CORS | ✅ | Exact origins only: store → shop domain, admin → API domain, auth → both. | `cors` test |
| 27 | Production debug off | ✅ | `NODE_ENV=production`, SDK debug only in dev, no source maps shipped (storefront & admin), telemetry disabled, generic 5xx messages. | `errors` test, build output check |
| 28 | Claude security scan | ✅ | This audit: code review of every custom route/middleware/action plus the automated suites. Fixed during the audit: guest order PII exposure, metadata tampering (alert suppression), unbounded in-memory uploads, account-enumeration message on signup, open webhook endpoint, headers middleware path bug, 5xx detail leakage. | this document |

### Beyond the lists (already in place)
Cash-on-delivery fraud rules in a checkout workflow hook (BD phone, Dhaka rate only for Dhaka, quantity and value caps),
Cloudflare-only firewall + authenticated origin pulls, containers non-root with all capabilities dropped,
DB/Redis on an internet-less network, Redis `noeviction`, `FLUSHALL`/`DEBUG` disabled, nightly encrypted backups with restore script.

### Known limits (honest)
* 12 low/moderate npm advisories remain inside Medusa's own pinned dependencies (build tooling, not request handling); Dependabot will pick up fixes as Medusa releases them.
* Customer accounts are optional for COD, so email verification informs rather than gates ordering; the shop's confirmation call is the real order check.
* Real email/SMS delivery needs a provider (e.g. SendGrid, SSL Wireless) configured in `medusa-config.ts`.
