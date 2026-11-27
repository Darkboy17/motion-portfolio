#!/usr/bin/env bash
# Runs on the VM, piped over SSH by the deploy job. Pulls the image CI just
# pushed and (re)starts two containers on one Docker network:
#   motion-portfolio  nginx serving the page (not exposed to the internet)
#   edge              Caddy on ports 80 and 443: HTTPS, certificates, redirects
# The Caddyfile is copied to ~/edge/Caddyfile just before this runs.
#   IMAGE=... TAG=<sha> SITE_DOMAIN=example.org PUBLIC_IP=1.2.3.4 bash -s < deploy/remote-deploy.sh
set -euo pipefail
: "${IMAGE:?set IMAGE}" "${TAG:?set TAG}" "${SITE_DOMAIN:?set SITE_DOMAIN}" "${PUBLIC_IP:?set PUBLIC_IP}"
SITE=motion-portfolio
EDGE=edge
NET=web
CADDY=caddy:2.10-alpine

# The registry login (done just before this script) is only needed for the pull.
trap 'docker logout ghcr.io >/dev/null 2>&1 || true' EXIT

docker pull "$IMAGE:$TAG"
docker pull -q "$CADDY" >/dev/null
docker network inspect "$NET" >/dev/null 2>&1 || docker network create "$NET" >/dev/null

docker rm -f "$SITE" >/dev/null 2>&1 || true
docker run -d --name "$SITE" --network "$NET" --restart unless-stopped --memory 128m "$IMAGE:$TAG"

# Certificates live in the caddy_data volume, so recreating the edge doesn't re-issue them.
docker rm -f "$EDGE" >/dev/null 2>&1 || true
docker run -d --name "$EDGE" --network "$NET" --restart unless-stopped --memory 96m \
  -p 80:80 -p 443:443 \
  -e SITE_DOMAIN="$SITE_DOMAIN" -e PUBLIC_IP="$PUBLIC_IP" \
  -v "$HOME/edge/Caddyfile:/etc/caddy/Caddyfile:ro" \
  -v caddy_data:/data -v caddy_config:/config \
  "$CADDY"

# Healthy means the page answers through Caddy over HTTPS, with a valid certificate.
# The first deploy also waits for Let's Encrypt, so allow a couple of minutes.
for _ in $(seq 1 60); do
  if curl -fs --resolve "$SITE_DOMAIN:443:127.0.0.1" "https://$SITE_DOMAIN/healthz" >/dev/null; then
    echo "Serving $IMAGE:$TAG at https://$SITE_DOMAIN"
    # Keep a week of earlier images for rollback; drop the rest.
    docker image prune -af --filter "until=168h" >/dev/null
    exit 0
  fi
  sleep 2
done
echo "The site did not come up over HTTPS:" >&2
docker logs --tail 30 "$SITE" >&2
docker logs --tail 50 "$EDGE" >&2
exit 1
