#!/usr/bin/env bash
# Restore an encrypted backup:
#   ./infra/scripts/restore.sh backups/tantush-20261028-2030.dump.enc
set -euo pipefail
FILE="${1:?usage: restore.sh <backup.dump.enc>}"
cd "$(dirname "$0")/../.."
set -a; source .env; set +a
read -r -p "This REPLACES the live database with $FILE. Type 'restore' to continue: " ok
[ "$ok" = "restore" ] || exit 1
docker compose stop medusa-server medusa-worker storefront
openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -pass env:BACKUP_PASSPHRASE -in "$FILE" \
  | docker compose exec -T postgres pg_restore --clean --if-exists --no-owner \
      -U "$POSTGRES_USER" -d "$POSTGRES_DB"
docker compose start medusa-server medusa-worker storefront
echo "Restored."
