# Multi-stage Dockerfile for Next.js app with custom server (server.js)
FROM node:20-slim AS builder
WORKDIR /app

# Install system deps needed by Prisma (OpenSSL)
RUN apt-get update && apt-get install -y openssl libssl-dev --no-install-recommends \
	&& rm -rf /var/lib/apt/lists/*

# Copy package files and prisma schema prior to installing node modules
# so `prisma generate` triggered by postinstall can find the schema.
COPY package.json package-lock.json* ./
COPY prisma ./prisma

# Install only deps needed for build
RUN npm ci --no-audit --no-fund

# Copy remaining source
COPY . .

# Generate Prisma client and build Next app
RUN npx prisma generate
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy production artifacts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/lib ./lib

EXPOSE 3000

CMD ["node", "server.js"]
