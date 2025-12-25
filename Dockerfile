FROM node:20-alpine AS base
RUN npm install -g pnpm prisma@6.19.1
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# ---------------- BUILDER ----------------
FROM base AS builder
ENV CI=true
WORKDIR /app

COPY package*.json pnpm-lock.yaml ./
COPY prisma ./prisma/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm prisma generate

COPY . .
RUN pnpm build

# ---------------- PROD DEPS ----------------
FROM base AS prod-deps
ENV CI=true
WORKDIR /app

COPY package*.json pnpm-lock.yaml ./
COPY prisma ./prisma/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile
RUN pnpm prisma generate

# ---------------- RUNTIME ----------------
FROM node:20-alpine AS runtime

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

COPY --from=prod-deps  /app/node_modules ./node_modules
COPY --from=prod-deps  /app/prisma ./prisma
COPY --from=builder    /app/dist ./dist
COPY package*.json ./

USER nestjs

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# ✅ START APP AT RUNTIME
CMD ["node", "./dist/src/main.js"]