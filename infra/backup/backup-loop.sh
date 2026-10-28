#!/bin/sh
# Nightly encrypted backup of the shop database at 02:30 Asia/Dhaka (20:30 UTC).
# Output: AES-256 (PBKDF2, 600k iterations) encrypted custom-format pg_dump.
set -eu
: "${BACKUP_PASSPHRASE:?BACKUP_PASSPHRASE must be set}"
RETENTION="${BACKUP_RETENTION_DAYS:-14}"
umask 077

while true; do
  now=$(date -u +%H%M)
  if [ "$now" = "2030" ] || [ ! -f /backups/.initial-done ]; then
    file="/backups/tantush-$(date -u +%Y%m%d-%H%M).dump.enc"
    echo "[backup] writing $file"
    if pg_dump --format=custom --compress=9 --no-owner \
      | openssl enc -aes-256-cbc -salt -pbkdf2 -iter 600000 -pass env:BACKUP_PASSPHRASE -out "$file.partial"; then
      mv "$file.partial" "$file"
      touch /backups/.initial-done
      find /backups -name 'tantush-*.dump.enc' -mtime +"$RETENTION" -delete
      echo "[backup] done"
    else
      rm -f "$file.partial"
      echo "[backup] FAILED" >&2
    fi
    sleep 61
  fi
  sleep 30
done
