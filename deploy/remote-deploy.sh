#!/usr/bin/env bash
# Runs on the VM, piped over SSH by the deploy job: pulls the image CI just
# pushed, swaps the running container and waits for it to answer.
#   IMAGE=ghcr.io/darkboy17/motion-portfolio TAG=<sha> bash -s < deploy/remote-deploy.sh
set -euo pipefail
: "${IMAGE:?set IMAGE}" "${TAG:?set TAG}"
NAME=motion-portfolio

# The registry login (done just before this script) is only needed for the pull.
trap 'docker logout ghcr.io >/dev/null 2>&1 || true' EXIT

docker pull "$IMAGE:$TAG"
docker rm -f "$NAME" >/dev/null 2>&1 || true
docker run -d --name "$NAME" --restart unless-stopped -p 80:80 --memory 128m "$IMAGE:$TAG"

for _ in $(seq 1 30); do
  if curl -fs http://127.0.0.1/healthz >/dev/null; then
    echo "Serving $IMAGE:$TAG"
    # Keep a week of earlier images for rollback; drop the rest.
    docker image prune -af --filter "until=168h" >/dev/null
    exit 0
  fi
  sleep 1
done
echo "The new container did not become healthy:" >&2
docker logs --tail 50 "$NAME" >&2
exit 1
