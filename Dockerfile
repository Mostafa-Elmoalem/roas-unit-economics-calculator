# ==========================================
# Stage 1: Build the Vite production bundle
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first (layer caching: only re-runs when lockfile changes)
COPY package.json package-lock.json ./
RUN npm ci --no-audit --ignore-scripts

# Copy application source and build configurations
COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html ./
COPY src/ ./src/
COPY shared/ ./shared/
COPY public/ ./public/

# Compile TypeScript and bundle with Vite
RUN npm run build


# ==========================================
# Stage 2: Serve static bundle via Unprivileged Nginx
# ==========================================
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runner

LABEL org.opencontainers.image.source="https://github.com/Mostafa-Elmoalem/roas-unit-economics-calculator"
LABEL org.opencontainers.image.description="TrueROAS E-Commerce Break-Even ROAS & Unit Economics Calculator"

# Copy custom Nginx configuration (port 8080 non-root)
COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static assets from builder stage
COPY --chown=nginx:nginx --from=builder /app/dist /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health || exit 1

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
