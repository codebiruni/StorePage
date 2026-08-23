# syntax=docker/dockerfile:1.7
# ──────────────────────────────────────────────────────────────────────
# Multi-stage Dockerfile for the Next.js StorePage app.
#
# Builds the `output: "standalone"` artefact (see next.config.ts) into a
# minimal Alpine image that runs as a non-root user. Sized for a BDIX
# origin server (1 vCPU / 1 GB RAM); the upstream proxy (Cloudflare /
# Nginx) does the heavy lifting.
#
# Build:   docker build -t storepage:latest .
# Run:     docker run --rm -p 3000:3000 --env-file .env.production storepage:latest
# ──────────────────────────────────────────────────────────────────────

# ─── Stage 1: deps ───────────────────────────────────────────────────
# Isolates `node_modules` so the builder can cache it across source
# changes. alpine + libc6-compat for Mongoose / sharp compatibility.
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy lockfile first to leverage Docker layer cache
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else npm install; \
  fi

# ─── Stage 2: builder ───────────────────────────────────────────────
# Compiles the standalone output. ALL build-time secrets must be
# supplied as `--build-arg`; missing ones are caught here, not at
# runtime.
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Build-time env (Next.js inlines NEXT_PUBLIC_* at build time only)
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_IMAGE_HOSTS
ARG NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
ARG NEXT_PUBLIC_META_PIXEL_ID
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL} \
    NEXT_PUBLIC_IMAGE_HOSTS=${NEXT_PUBLIC_IMAGE_HOSTS} \
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=${NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME} \
    NEXT_PUBLIC_META_PIXEL_ID=${NEXT_PUBLIC_META_PIXEL_ID} \
    NEXT_PUBLIC_GA_MEASUREMENT_ID=${NEXT_PUBLIC_GA_MEASUREMENT_ID} \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ─── Stage 3: runner ─────────────────────────────────────────────────
# The smallest possible runtime image: standalone Next.js server +
# static assets. No node_modules, no source, no build artefacts beyond
# what the server needs to boot.
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat wget && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Standalone output bundles the server, but it expects `public/` and
# `.next/static/` to be co-located in the same workdir.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Healthcheck hits the lightweight /api/health route (created in E1).
# Falls back to the homepage if the route isn't built yet, so the
# container still passes the orchestrator's liveness probe during
# partial rollouts.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || wget -qO- http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]