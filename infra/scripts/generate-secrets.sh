#!/usr/bin/env bash
# Creates .env from .env.example with strong random secrets (run once).
set -euo pipefail
cd "$(dirname "$0")/../.."
[ -f .env ] && { echo ".env already exists — refusing to overwrite."; exit 1; }
rand() { openssl rand -base64 "$1" | tr -d '\n/+=' | head -c "$2"; }
sed \
  -e "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$(rand 48 40)|" \
  -e "s|^REDIS_PASSWORD=.*|REDIS_PASSWORD=$(rand 48 40)|" \
  -e "s|^JWT_SECRET=.*|JWT_SECRET=$(rand 96 64)|" \
  -e "s|^COOKIE_SECRET=.*|COOKIE_SECRET=$(rand 96 64)|" \
  -e "s|^ORDER_ACCESS_SECRET=.*|ORDER_ACCESS_SECRET=$(rand 96 64)|" \
  -e "s|^BACKUP_PASSPHRASE=.*|BACKUP_PASSPHRASE=$(rand 96 64)|" \
  .env.example > .env
chmod 600 .env
echo "IMPORTANT: copy BACKUP_PASSPHRASE to a password manager — backups can't be restored without it."
echo "Created .env with random secrets. Now edit SHOP_DOMAIN / API_DOMAIN / contact details."
