# Build stage
FROM node:22-alpine AS builder
RUN npm install -g pnpm
WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/tsconfig-base/package.json ./packages/tsconfig-base/
COPY packages/db/package.json ./packages/db/
COPY packages/trpc-contract/package.json ./packages/trpc-contract/

# Install ALL dependencies (for building)
RUN pnpm install --frozen-lockfile

COPY apps/backend ./apps/backend
COPY packages ./packages

# Build with tsup (bundles @repo/* packages)
WORKDIR /app
RUN pnpm build
# RUN pnpm --filter backend db:push
RUN pnpm --filter backend db:generate
RUN pnpm --filter backend db:migrate


# Production stage
FROM node:22-alpine AS production
RUN npm install -g pnpm
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/tsconfig-base/package.json ./packages/tsconfig-base/
COPY packages/db/package.json ./packages/db/
COPY packages/trpc-contract/package.json ./packages/trpc-contract/

RUN pnpm install --frozen-lockfile --prod

# Copy dist and necessary files
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/database.sqlite ./apps/backend/database.sqlite
COPY --from=builder /app/apps/backend/src/maps ./apps/backend/src/maps


ENV NODE_ENV=production

EXPOSE 4000

CMD ["pnpm", "--filter", "backend", "start"]
