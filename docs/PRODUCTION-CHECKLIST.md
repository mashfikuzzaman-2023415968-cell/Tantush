# Production launch checklist

Tick everything before announcing the website.

## Infrastructure
- [ ] Oracle VM: Ubuntu 24.04 ARM, 4 OCPU / 24 GB, unattended-upgrades on, swap configured
- [ ] SSH: key-only, root login disabled, port 22 restricted to your IP in the Oracle security list
- [ ] Docker installed; `docker compose ps` shows every service **healthy**
- [ ] `update-cloudflare-ips.sh` run → ports 80/443 accept Cloudflare only (test: `curl https://<server-ip>` from your laptop fails)
- [ ] Nightly **encrypted** backup (`*.dump.enc`) appears in `backups/`; off-site copy (rclone) configured
- [ ] `BACKUP_PASSPHRASE` stored in a password manager (not only on the server)
- [ ] Restore tested once on a copy (`infra/scripts/restore.sh`)

## Cloudflare
- [ ] Nameservers switched; `@`, `www`, `api` proxied (orange cloud)
- [ ] SSL **Full (strict)** with Origin Certificate; Always Use HTTPS; min TLS 1.2
- [ ] Authenticated Origin Pulls on + `ssl_verify_client on` in nginx
- [ ] HSTS enabled (after confirming HTTPS works everywhere)
- [ ] WAF managed rules, Bot Fight Mode, rate limiting rule for `/checkout` & `/auth/`
- [ ] Turnstile widget created; `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` set; storefront rebuilt
- [ ] Zero Trust Access protecting `api.<domain>/app*` and `/admin*`
- [ ] Cache rule for `api.<domain>/static/*`

## Secrets & config
- [ ] `.env` created by `generate-secrets.sh` (JWT/COOKIE ≥ 48 chars, DB & Redis passwords random), `chmod 600`
- [ ] `SHOP_DOMAIN`, `API_DOMAIN`, `MEDIA_URL` correct; storefront rebuilt after changing them
- [ ] `MEDUSA_PUBLISHABLE_KEY` set; storefront rebuilt
- [ ] Shop phone / email / Facebook / Instagram filled in
- [ ] `COD_MAX_ORDER_TOTAL` reviewed with the owner

## Store setup (Admin → `https://api.<domain>/app`)
- [ ] Owner admin account with a strong unique password; seed admin removed if different
- [ ] **Settings → Locations**: showroom address & phone updated (shows on the website)
- [ ] Delivery prices reviewed (Settings → Locations → shipping options)
- [ ] Real product photos uploaded; demo products edited or deleted
- [ ] Every product has: sizes, prices (BDT), stock per size, category, Bangla translation
- [ ] Promo code `TANTUSH10` kept / changed / deleted on purpose
- [ ] Size guide measurements match your pattern (`storefront/src/modules/products/components/size-guide`)
- [ ] Order notification target (`SHOP_NOTIFY_TO`) set; SMS / email provider configured (needed for verification emails)

## Functional tests (on the live domain)
- [ ] Home, shop, filters (size + price), sorting, pagination, product pages in **English and বাংলা**
- [ ] Place a COD order (Inside Dhaka) → order appears in Admin → Orders
- [ ] Place an order with showroom pickup
- [ ] Record a sale in **Showroom POS** → stock drops on the website
- [ ] Customer sign-up, login, order history, address book
- [ ] Mobile phone test (Android Chrome + iPhone Safari)
- [ ] Lighthouse (Chrome DevTools) on home & product page: Performance ≥ 85, Accessibility ≥ 90, SEO ≥ 95

## Security spot checks
- [ ] `node tests/security/run.mjs` against the live domains → **all checks passed** (see docs/SECURITY-AUDIT.md)
- [ ] <https://securityheaders.com/?q=https://YOUR_DOMAIN> → grade **A** or better
- [ ] <https://www.ssllabs.com/ssltest/> → **A**
- [ ] 7 wrong logins in a row → blocked (429)
- [ ] `https://api.<domain>/app` asks for Cloudflare Access code first

## SEO & legal
- [ ] `https://<domain>/sitemap.xml` and `/robots.txt` load
- [ ] Google Search Console: domain verified, sitemap submitted
- [ ] Facebook Business page links to the site; share preview shows the brand image
- [ ] Exchange / delivery policy text agreed with the owner
- [ ] Trade licence / e-commerce registration (DBID) details as required by Bangladesh's Digital Commerce guidelines
