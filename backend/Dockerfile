# syntax=docker/dockerfile:1.7
# ---------------------------------------------------------------- build stage
FROM node:25-bookworm-slim AS build
WORKDIR /app
ENV NODE_ENV=development
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# Compiles the server to .medusa/server and bundles the admin dashboard
RUN npx medusa build \
 && cd .medusa/server \
 && npm ci --omit=dev --no-audit --no-fund \
 && npm cache clean --force

# -------------------------------------------------------------- runtime stage
FROM node:25-bookworm-slim AS runtime
ENV NODE_ENV=production \
    MEDUSA_DISABLE_TELEMETRY=true \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    PORT=9000
RUN apt-get update \
 && apt-get install -y --no-install-recommends tini curl \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build --chown=node:node /app/.medusa/server ./
# Seed product photos + uploads (local file provider). Mount a volume here in prod.
COPY --chown=node:node static ./static
USER node
EXPOSE 9000
HEALTHCHECK --interval=20s --timeout=5s --start-period=60s --retries=5 \
  CMD curl -fsS http://127.0.0.1:9000/health || exit 1
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["npx", "medusa", "start"]
