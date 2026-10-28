# Security overview

> Item-by-item audit against the common pre-launch checklists, with how each item is
> verified: **[SECURITY-AUDIT.md](SECURITY-AUDIT.md)**. Automated suite: `tests/security/run.mjs`.

No system is "vulnerability-free", but Tantush is built in layers so a single mistake
doesn't expose customers or the shop. This is what each layer does and how it was verified.

## Layers

| Layer | Controls |
|---|---|
| **Cloudflare** | DDoS absorption, managed WAF rules, bot fight mode, edge rate limiting, TLS 1.2+, HSTS, origin IP hidden. Optional Zero Trust Access in front of the admin. |
| **Host** | Ports 80/443 accept **only Cloudflare IP ranges** (`update-cloudflare-ips.sh`); Authenticated Origin Pulls (mTLS); SSH keys only; unattended security upgrades; fail2ban. |
| **nginx (edge)** | Rejects unknown Host headers and raw-IP access; per-IP rate limits (pages, API, auth, checkout, admin); connection limits; slowloris timeouts; body-size limits; real-IP only trusted from Cloudflare; no server tokens. |
| **Docker** | Database & Redis on an `internal` network with **no route to the internet** and no published ports; containers run as non-root with `no-new-privileges` and all Linux capabilities dropped; resource limits; log rotation. |
| **Medusa backend** | Refuses to start in production with missing/short secrets (no "supersecret" fallback); strict CORS per domain; scrypt-hashed passwords (Medusa auth); Redis-backed **distributed rate limiter** (works across replicas) on login (per IP *and* per account), registration, password reset, promo codes, checkout, cart creation; JSON body limit 64 kB on store routes; `restrictedFields` so store APIs can't expand order data; strict query validation (unknown params rejected); `Cache-Control: no-store` on all personal data; security headers on every response. |
| **COD fraud rules** (server-side workflow hook — can't be bypassed via the API) | Valid Bangladeshi mobile number required; address required; Bangladesh only; max 10 pieces per item; max order value (`COD_MAX_ORDER_TOTAL`); "Inside Dhaka" rate only for Dhaka addresses. |
| **Storefront** | Nonce-based **Content-Security-Policy** with `strict-dynamic` (blocks injected scripts), `frame-ancestors 'none'`, `form-action 'self'`, `object-src 'none'`; HSTS; X-Frame-Options; Permissions-Policy; auth/cart cookies are `httpOnly`, `secure`, `sameSite=strict`; Server Actions only accept same-origin requests (CSRF); all form input trimmed, length-capped, control characters stripped and validated server-side; URL filter params whitelisted before reaching the API; order confirmation hides address/phone unless viewed by the browser that placed the order or its owner; JSON-LD escaped; images only from allow-listed hosts and never from private IPs (SSRF protection). |
| **Data** | Nightly `pg_dump`, **AES-256 encrypted** before it leaves the container, with retention + off-site copy; Postgres SCRAM auth; slow-query logging; statement timeouts. Guest order details only returned to the buyer (HMAC proof) or the owning customer. |
| **Bots** | Honeypot on login/register/checkout; Cloudflare Turnstile verified server-side on login, register and order placement; Cloudflare Bot Fight Mode. |
| **Accounts** | Email verification (hashed single-use tokens, link token in URL fragment); no account enumeration on signup; client `metadata` writes blocked. |
| **Supply chain** | Next.js 16.4 / React 19.2 (current patched lines, `npm audit`: 0 issues); Medusa 2.22.1 with overrides that cleared all *high* advisories in its dependency tree; CI runs `npm audit --audit-level=high` on every push. |

## Verified during development

* COD hook rejects: invalid phone, Inside-Dhaka rate for a Chattogram address, quantity 50 — via direct API calls, not just the UI.
* Login brute force: 7th attempt within 15 minutes → `429` (backend) and the edge nginx limit independently.
* Unknown query parameters on `/store/catalog` → `400`.
* POS endpoint without admin session → `401`.
* Production build served with the strict CSP: full checkout in English and Bangla with zero console errors.
* nginx: unknown Host / raw IP connections dropped; static assets cached (`MISS` → `HIT`).

## Your responsibilities

* Keep `.env` and `infra/nginx/certs/*` private (`chmod 600`). Never commit them.
* Use long unique passwords for admin users; give staff their own accounts; remove ex-staff.
* Turn on Cloudflare Access for `/app` and `/admin` (free, 10 minutes — see DEPLOYMENT.md).
* Update monthly: `git pull && docker compose build && docker compose up -d`.
* Test a backup restore once a quarter.

## Reporting

Found a problem? Email the shop owner privately; please don't post it publicly.
