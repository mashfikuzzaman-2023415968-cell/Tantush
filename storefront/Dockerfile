# syntax=docker/dockerfile:1.7
# ---------------------------------------------------------------- deps stage
FROM node:25-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---------------------------------------------------------------- build stage
FROM node:25-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* values are inlined into the browser bundle at build time.
ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_DEFAULT_REGION=bd
ARG NEXT_PUBLIC_MEDIA_URL
ARG NEXT_PUBLIC_SHOP_PHONE
ARG NEXT_PUBLIC_SHOP_EMAIL
ARG NEXT_PUBLIC_FACEBOOK_URL
ARG NEXT_PUBLIC_INSTAGRAM_URL
ARG MEDUSA_BACKEND_URL
ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY \
    NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_PUBLIC_DEFAULT_REGION=$NEXT_PUBLIC_DEFAULT_REGION \
    NEXT_PUBLIC_MEDIA_URL=$NEXT_PUBLIC_MEDIA_URL \
    NEXT_PUBLIC_SHOP_PHONE=$NEXT_PUBLIC_SHOP_PHONE \
    NEXT_PUBLIC_SHOP_EMAIL=$NEXT_PUBLIC_SHOP_EMAIL \
    NEXT_PUBLIC_FACEBOOK_URL=$NEXT_PUBLIC_FACEBOOK_URL \
    NEXT_PUBLIC_INSTAGRAM_URL=$NEXT_PUBLIC_INSTAGRAM_URL \
    MEDUSA_BACKEND_URL=$MEDUSA_BACKEND_URL
RUN npm run build

# -------------------------------------------------------------- runtime stage
FROM node:25-bookworm-slim AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8000 \
    HOSTNAME=0.0.0.0
RUN apt-get update \
 && apt-get install -y --no-install-recommends tini curl \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 8000
HEALTHCHECK --interval=20s --timeout=5s --start-period=40s --retries=5 \
  CMD curl -fsS -o /dev/null http://127.0.0.1:8000/robots.txt || exit 1
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "server.js"]
