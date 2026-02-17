# ---------- BUILD STAGE ----------
FROM node:22 AS build

# Enable pnpm via corepack
RUN corepack enable

WORKDIR /app

# Copy dependency files first (better caching)
COPY package.json pnpm-lock.yaml ./

# Copy prisma schema BEFORE install (important for postinstall)
COPY src/db/prisma ./src/db/prisma

# Install all deps (including dev for build)
RUN pnpm install

# Copy rest of source
COPY . .

RUN pnpm run build

# ---------- PRODUCTION STAGE ----------
FROM node:22-slim AS production

WORKDIR /app

# Install only what Prisma needs
RUN apt-get update \
    && apt-get install -y openssl \
    && rm -rf /var/lib/apt/lists/*

# Copy only necessary files
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/views ./views
COPY --from=build /app/assets ./assets
COPY --from=build /app/.env.prod .env

COPY certificates/ca.pem /app/certificates/ca.pem

EXPOSE 3002

#Backend entry 
CMD ["node", "dist/main.js"]
