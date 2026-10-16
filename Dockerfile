# ==========================================
# Stage 1: Build the Vite production bundle
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies using clean install
COPY package.json package-lock.json ./
RUN npm ci --no-audit

# Copy application source and build configurations
COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html ./
COPY src/ ./src/
COPY public/ ./public/

# Compile TypeScript and bundle with Vite
RUN npm run build

# ==========================================
# Stage 2: Serve static bundle via Nginx
# ==========================================
FROM nginx:1.27-alpine AS runner

# Remove default nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy built static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check to ensure Nginx is serving traffic
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
