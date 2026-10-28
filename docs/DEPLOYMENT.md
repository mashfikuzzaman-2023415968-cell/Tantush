# Deploying Tantush (Oracle Cloud Always Free + Cloudflare)

Total cost: **৳0 / month** for hosting (you only pay for the domain).
Time: about 1 hour the first time.

```
Visitor ──HTTPS──► Cloudflare (CDN · WAF · DDoS · bot protection)
                        │  only Cloudflare IPs may reach the server
                        ▼
                Oracle VM (4 ARM cores, 24 GB RAM)
                ┌──────────────── docker compose ────────────────┐
                │ nginx :443 ─┬─► storefront ×2                  │
                │             └─► medusa-server ×2 ◄── nginx-internal ◄─ storefront
                │ medusa-worker ×1   postgres   redis   backup    │
                └─────────────────────────────────────────────────┘
```

---

## 1. Create the server (Oracle Cloud)

1. Sign up at <https://www.oracle.com/cloud/free/> (needs a card for verification; Always Free resources are never charged).
   Choose a home region close to Bangladesh — **Singapore** or **Mumbai**.
2. **Compute → Instances → Create instance**
   - Image: **Ubuntu 24.04** (aarch64)
   - Shape: **Ampere VM.Standard.A1.Flex** → **4 OCPU, 24 GB RAM** (all Always Free)
   - Boot volume: 100 GB
   - Add your SSH public key.
   - If you get "Out of capacity", retry later or try another availability domain.
3. **Networking → your VCN → Security List**: add ingress rules for TCP **80** and **443** from `0.0.0.0/0`
   (the server firewall will narrow this to Cloudflare only). Keep **22** (SSH) — ideally restricted to your own IP.
4. Note the instance's **public IP**.

## 2. Prepare the server

```bash
ssh ubuntu@<PUBLIC_IP>

# Updates + automatic security patches
sudo apt update && sudo apt -y upgrade
sudo apt -y install unattended-upgrades fail2ban git
sudo dpkg-reconfigure -plow unattended-upgrades

# Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu && newgrp docker

# Oracle's Ubuntu image ships restrictive iptables rules; open 80/443
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo apt -y install iptables-persistent && sudo netfilter-persistent save

# SSH hardening: keys only
sudo sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart ssh

# 4 GB swap as a safety net during builds
sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 3. Domain + Cloudflare

1. Create a free account at <https://dash.cloudflare.com>, **Add a site** → your domain (e.g. `tantush.xyz`), Free plan.
2. At your domain registrar, replace the nameservers with the two Cloudflare gives you.
3. **DNS** (all **Proxied** / orange cloud):
   | Type | Name | Content |
   |---|---|---|
   | A | `@` | `<PUBLIC_IP>` |
   | A | `www` | `<PUBLIC_IP>` |
   | A | `api` | `<PUBLIC_IP>` |
4. **SSL/TLS → Overview**: **Full (strict)**.
   **SSL/TLS → Edge Certificates**: Always Use HTTPS **on**, Minimum TLS **1.2**, TLS 1.3 **on**, HSTS **on** (after you confirm the site works).
5. **SSL/TLS → Origin Server → Create Certificate** (RSA, hostnames `tantush.xyz, *.tantush.xyz`, 15 years).
   Save the certificate as `infra/nginx/certs/origin.pem` and the private key as `infra/nginx/certs/origin.key` on the server
   (`chmod 600` the key). Never commit them.
6. **SSL/TLS → Origin Server → Authenticated Origin Pulls**: **on**, then download the CA into the certs folder and
   uncomment the two `ssl_verify_client` lines in `infra/nginx/nginx.conf`. Now only Cloudflare can talk to your server.
7. **Security**:
   - **WAF → Managed rules**: enable the free Cloudflare managed ruleset.
   - **Bots**: Bot Fight Mode **on**.
   - **WAF → Rate limiting rules** (free plan includes one): `URI Path contains "/checkout" OR "/auth/"` → 20 requests / 10 s → Block.
   - Security level: Medium.
8. **Speed / Caching**: Brotli on; Caching level Standard; **Cache Rules** → `Hostname eq api.tantush.xyz AND URI Path starts with /static/` → Eligible for cache, Edge TTL 30 days.
9. **Bot protection (Turnstile, free)**: **Turnstile → Add widget** → hostname `tantush.xyz`, mode *Managed*.
   Put the keys in `.env` as `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` and rebuild the storefront.
   Login, registration and placing an order are then verified by the backend.
10. **Protect the admin** (strongly recommended, free): **Zero Trust → Access → Applications → Self-hosted**:
   domain `api.tantush.xyz`, path `app*` **and** a second rule for `admin*`; policy *Allow* → *Emails* → your & your father's email.
   The admin then asks for a one-time code by email before Medusa's own login.

## 4. Deploy

```bash
git clone <your-repo-url> tantush && cd tantush

./infra/scripts/generate-secrets.sh          # creates .env with strong random secrets
nano .env                                    # set SHOP_DOMAIN, API_DOMAIN, MEDIA_URL, phone, email…
# Save BACKUP_PASSPHRASE in a password manager — encrypted backups can't be restored without it.
sudo install -d -o 70 -g 70 -m 700 backups  # backup container runs as the postgres user (uid 70)

# Copy the Cloudflare origin certificate files into infra/nginx/certs/ (see step 3.5)

docker compose build medusa-server
docker compose run --rm medusa-migrate                         # create tables
docker compose run --rm medusa-migrate npx medusa exec ./src/scripts/seed.js   # first install only
docker compose run --rm medusa-migrate npx medusa user -e owner@example.com -p 'Use-A-Long-Unique-Password'
```

The seed prints **`Publishable API key: pk_…`** — put it in `.env` as `MEDUSA_PUBLISHABLE_KEY`, then:

```bash
docker compose build                 # storefront bakes the key in at build time
docker compose up -d
docker compose ps                    # everything "healthy" after ~1 minute
sudo ./infra/scripts/update-cloudflare-ips.sh   # lock ports 80/443 to Cloudflare
```

Open `https://tantush.xyz` and `https://api.tantush.xyz/app` 🎉

> Seed data note: the seed product photos are cropped from the brand banner. Replace them with real
> product photography in the admin before launch (see SHOP-GUIDE.md).

## 5. Updates

```bash
cd tantush && git pull
docker compose build
docker compose run --rm medusa-migrate     # safe to run every time
docker compose up -d                       # rolling: replicas restart one by one
docker image prune -f
```

## 6. Scheduled maintenance (crontab -e)

```cron
# Refresh Cloudflare ranges + firewall monthly
0 4 1 * *  cd /home/ubuntu/tantush && sudo ./infra/scripts/update-cloudflare-ips.sh >> /var/log/cf-ips.log 2>&1
# Copy backups off the server nightly (Oracle Object Storage has 20 GB free)
0 3 * * *  rclone sync /home/ubuntu/tantush/backups oracle:tantush-backups --max-age 3d
```

Restore a backup (decrypts with `BACKUP_PASSPHRASE` from `.env`):
`./infra/scripts/restore.sh backups/tantush-YYYYMMDD-HHMM.dump.enc`.

## 5b. Security test the live site

```bash
SHOP_URL=https://tantush.xyz API_URL=https://api.tantush.xyz PUBLISHABLE_KEY=pk_... \
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='…' ORDER_ACCESS_SECRET=… \
node tests/security/run.mjs        # expect: all checks passed
```
It creates two throw-away customers and one test order — cancel the order in the admin afterwards.

## 7. Scaling up

* More traffic → raise `STOREFRONT_REPLICAS` / `MEDUSA_SERVER_REPLICAS` in `.env`, `docker compose up -d`.
  nginx re-resolves Docker DNS every 10 s and balances across the new replicas (least connections).
* Product images → move to Oracle Object Storage or Cloudflare R2 by setting the `S3_*` variables.
* Database → Postgres can move to a managed service by changing `DATABASE_URL` (set `DATABASE_SSL=true`).
* Multiple servers → put the stack behind Cloudflare Load Balancing, move Postgres/Redis to managed services.

## Troubleshooting

| Symptom | Check |
|---|---|
| 521/522 from Cloudflare | `docker compose ps`; port 443 open in Oracle security list and iptables |
| 525/526 SSL errors | Origin cert files exist; SSL mode is Full (strict) |
| Storefront 503 "temporarily unavailable" | `docker compose logs medusa-server`; publishable key correct |
| Images missing | `MEDIA_URL` matches where images are served; rebuild storefront after changing it |
| Everyone gets 429 | `TRUST_PROXY=true` in compose and the Cloudflare IP list is current |
