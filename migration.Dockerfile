FROM node:22-slim

WORKDIR /app

# Enable pnpm
RUN corepack enable

# Install dependencies for Prisma
RUN apt-get update \
    && apt-get install -y openssl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy Prisma schema
COPY src/db/prisma ./src/db/prisma

# Generate Prisma client
RUN pnpm run prisma:generate

# Run migration
CMD ["pnpm", "run", "prisma:dev:deploy"]