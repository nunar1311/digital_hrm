# syntax=docker/dockerfile:1
# ============================================================
# Digital HRM — Next.js + Socket.IO Custom Server Dockerfile
# ============================================================

# ── Stage 1: Install dependencies ──────────────────────────
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

RUN pnpm install --frozen-lockfile --prefer-offline

# ── Stage 2: Build application ─────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# DATABASE_URL needed for prisma generate
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Generate Prisma client
RUN pnpm prisma generate

# Limit RAM usage on low-spec VPS
ENV NODE_OPTIONS="--max-old-space-size=1024"
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

# ── Stage 3: Production runner ─────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Create non-root system user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy full node_modules (needed for custom server.ts + tsx)
COPY --from=builder /app/node_modules ./node_modules

# Copy package files
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Copy custom server entry point
COPY --from=builder /app/server.ts ./server.ts

# Copy Next.js build output
COPY --from=builder /app/.next ./.next

# Copy public assets
COPY --from=builder /app/public ./public

# Copy Prisma artifacts
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/prisma ./prisma

# Copy source (needed for server.ts dynamic imports at runtime)
COPY --from=builder /app/src ./src

# Create uploads directory
RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads
RUN chown -R nextjs:nodejs /app/.next

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget -qO- http://localhost:3000/api/health || exit 1

# Run custom server with tsx (supports TypeScript + Socket.IO)
CMD ["node", "--import", "tsx", "server.ts"]
