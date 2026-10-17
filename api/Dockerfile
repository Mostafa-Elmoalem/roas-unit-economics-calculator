# ==========================================
# Stage 1: Dependencies (full, for build + dev)
# ==========================================
FROM node:22-alpine AS deps
WORKDIR /app/api
COPY api/package.json api/package-lock.json ./
RUN npm ci --no-audit --ignore-scripts


# ==========================================
# Stage 2: Dev target — tsx watch; docker-compose.dev.yml bind-mounts the sources
# ==========================================
FROM deps AS dev
WORKDIR /app/api
COPY api/tsconfig.json api/vitest.config.ts ./
COPY api/src ./src
COPY shared /app/shared
EXPOSE 3000
CMD ["npm", "run", "dev"]


# ==========================================
# Stage 3: Bundle the server (esbuild -> dist/server.mjs; pg stays external)
# ==========================================
FROM deps AS build
WORKDIR /app/api
COPY api/tsconfig.json ./
COPY api/src ./src
COPY shared /app/shared
RUN npm run build


# ==========================================
# Stage 4: Runtime (production dependencies only)
# ==========================================
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

LABEL org.opencontainers.image.source="https://github.com/Mostafa-Elmoalem/roas-unit-economics-calculator"
LABEL org.opencontainers.image.description="TrueROAS api — ingest service (Hono + Postgres)"

COPY api/package.json api/package-lock.json ./
RUN npm ci --omit=dev --no-audit --ignore-scripts && npm cache clean --force

COPY --from=build /app/api/dist ./dist
COPY --from=build /app/api/src/db/sql ./dist/sql

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1

CMD ["node", "dist/server.mjs"]
