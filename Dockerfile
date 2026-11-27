# syntax=docker/dockerfile:1.7
#
# Three ways to use this file:
#   docker build -t motion-portfolio .                      render everything and serve it (slow, needs only Docker)
#   docker build --target web-prebuilt -t motion-portfolio .  serve a site/dist built outside Docker (what CI does)
#   docker build --target toolchain -t motion-toolchain .   a render environment:
#     docker run --rm -v "$PWD/out:/app/out" motion-toolchain npm run render

# Node, ffmpeg and the libraries Remotion's headless Chrome needs, with dependencies installed.
FROM node:22-bookworm-slim AS toolchain
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      ca-certificates ffmpeg \
      libnss3 libdbus-1-3 libatk1.0-0 libgbm-dev libasound2 libxrandr2 libxkbcommon-dev \
      libxfixes3 libxcomposite1 libxdamage1 libatk-bridge2.0-0 libpango-1.0-0 libcairo2 libcups2 \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund && npx remotion browser ensure
COPY . .

# Renders every piece, cuts the showreel and builds the page.
FROM toolchain AS site
RUN npm run render && npm run showreel && npm run site

# The page, served by nginx, from a site/dist built before `docker build`.
FROM nginx:1.27-alpine AS web-prebuilt
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY site/dist /usr/share/nginx/html
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1

# The default: the same server, with the page built inside Docker by the `site` stage.
FROM nginx:1.27-alpine AS web
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=site /app/site/dist /usr/share/nginx/html
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
