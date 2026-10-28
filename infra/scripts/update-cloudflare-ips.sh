#!/usr/bin/env bash
# Regenerates nginx real-IP config + host firewall rules from Cloudflare's published ranges.
# Run monthly (cron) on the server:  sudo ./infra/scripts/update-cloudflare-ips.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
OUT=infra/nginx/conf.d/cloudflare-ips.conf
v4=$(curl -fsS https://www.cloudflare.com/ips-v4)
v6=$(curl -fsS https://www.cloudflare.com/ips-v6)
{
  echo "# Cloudflare edge ranges — generated $(date -u +%F). Do not edit by hand."
  for ip in $v4 $v6; do echo "set_real_ip_from $ip;"; done
} > "$OUT.tmp" && mv "$OUT.tmp" "$OUT"
docker compose exec -T nginx nginx -s reload || true

# Only Cloudflare may reach ports 80/443 (blocks attackers bypassing the CDN/WAF).
if command -v iptables >/dev/null; then
  iptables -N CLOUDFLARE 2>/dev/null || iptables -F CLOUDFLARE
  for ip in $v4; do iptables -A CLOUDFLARE -s "$ip" -p tcp -m multiport --dports 80,443 -j ACCEPT; done
  iptables -A CLOUDFLARE -p tcp -m multiport --dports 80,443 -j DROP
  iptables -C DOCKER-USER -j CLOUDFLARE 2>/dev/null || iptables -I DOCKER-USER -j CLOUDFLARE
  echo "Firewall updated (DOCKER-USER -> CLOUDFLARE chain)."
fi
echo "Updated $OUT"
