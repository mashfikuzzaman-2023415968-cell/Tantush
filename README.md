# Tantush — সুতোয় গল্প, বুননে ঐতিহ্য

Production e-commerce platform for **Tantush**, a premium panjabi shop in Bangladesh.
Online orders (cash on delivery) and the physical showroom share **one inventory**,
managed from one admin.

Built on [Medusa v2](https://medusajs.com) (the official `medusa-starter-default`
and `nextjs-starter-medusa` structure), extended for the Bangladeshi market.

```
tantush/
├── backend/            Medusa v2 server + admin (Node 22, TypeScript)
│   ├── medusa-config.ts         Redis modules, worker split, hardened config
│   └── src/
│       ├── api/                 middlewares.ts (security, rate limits)
│       │   ├── store/catalog    size + price filtered listing (cached)
│       │   ├── store/shop-info  showroom details
│       │   └── admin/pos        record in-store sales
│       ├── admin/routes/pos     Showroom POS screen in the admin
│       ├── modules/             email-verification module, redacting notification provider
│       ├── workflows/           POS sale workflow, COD validation hook
│       ├── subscribers/         order alerts, cache invalidation
│       ├── jobs/                daily low-stock alert
│       └── scripts/seed.ts      Bangladesh store setup + catalogue
├── storefront/         Next.js 16 storefront (App Router, React 19)
│   └── src/
│       ├── lib/i18n             English / বাংলা dictionaries
│       ├── lib/data             Medusa data layer (server actions)
│       ├── modules/             UI modules (home, store, products, cart, checkout…)
│       └── proxy.ts             region routing + nonce-based CSP
├── infra/              nginx (edge + internal LB), postgres tuning, scripts
├── tests/security/     Automated security test suite
├── docker-compose.yml  Full production stack
└── docs/               Deployment, security, checklist, shop guide
```

## Features

| Area | What you get |
|---|---|
| Storefront | Animated, brand-faithful design · English ⇄ বাংলা (UI **and** product content) · size & price filters · sort · quick bag drawer · size guide · mobile-first |
| Checkout | Cash on delivery only · BD mobile validation · Inside / Outside Dhaka / showroom pickup · promo codes · one-page details → review |
| Offline shop | Showroom sales channel + **POS screen** in admin · shared stock · walk-in sales recorded as completed orders |
| Admin | Medusa admin: products, stock, orders, customers, promotions, price lists, Bangla translations |
| Security | Strict CSP with nonces · HSTS · distributed rate limiting (nginx + Redis) · server-side COD fraud checks · secrets validation · private DB network · see [docs/SECURITY.md](docs/SECURITY.md) |
| Performance | Redis cache, catalog cache with event invalidation, nginx static/image cache, Cloudflare CDN, AVIF/WebP images |
| Scale | 2× API replicas + 1 worker, 2× storefront replicas, least-connections load balancing, health checks |
| Ops | Nightly DB backups with retention, restore script, low-stock & new-order alerts, CI pipeline |

## Local development

Requirements: Node 22, PostgreSQL 16, Redis 7.

```bash
# 1. Backend
cd backend
cp .env.template .env            # adjust DATABASE_URL if needed
npm install
npx medusa db:migrate
npm run seed                     # prints the publishable API key
npx medusa user -e you@example.com -p 'a-strong-password'
npm run dev                      # http://localhost:9000/app  (admin)

# 2. Storefront (new terminal)
cd storefront
cp .env.template .env.local      # paste the publishable key
npm install
npm run dev                      # http://localhost:8000
```

## Security tests

```bash
PUBLISHABLE_KEY=pk_... ADMIN_EMAIL=... ADMIN_PASSWORD=... ORDER_ACCESS_SECRET=... \
node tests/security/run.mjs      # 25 checks against a running stack
```
Item-by-item audit: [docs/SECURITY-AUDIT.md](docs/SECURITY-AUDIT.md).

## Production

See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** (Oracle Cloud Always Free + Cloudflare, ~1 hour)
and tick through **[docs/PRODUCTION-CHECKLIST.md](docs/PRODUCTION-CHECKLIST.md)** before launch.

Running the shop day to day: **[docs/SHOP-GUIDE.md](docs/SHOP-GUIDE.md)**.
