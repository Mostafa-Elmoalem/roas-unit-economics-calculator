# Production Deployment Guide: TrueROAS Calculator

This guide details how to deploy **TrueROAS & Unit Economics Calculator** using **Portainer** behind a Reverse Proxy (e.g. Nginx Proxy Manager / Traefik) on the shared server network (`airbot-stack_app-network`), leveraging our private image pipeline on GitHub Container Registry (`ghcr.io`).

---

## 1. Architecture Overview

```mermaid
flowchart LR
    A["Public User (HTTPS:443)"] --> B["Nginx Proxy Manager / Reverse Proxy"]
    
    subgraph ServerNetwork["Docker External Network: airbot-stack_app-network"]
        B -->|HTTP Internal:8080 /| C["trueroas-calculator (Container)"]
        B -->|HTTP Internal:3000 /api| F["trueroas-api (Container)"]
        C --> D["Nginx Unprivileged Engine (Port 8080)"]
        D --> E["Pre-built Static Bundle (/usr/share/nginx/html)"]
        F -->|5432 (compose network only)| G["trueroas-postgres (Container)"]
        G --> H["pgdata Volume"]
    end

    subgraph SecurityShield["Security & Hardening"]
        I["Read-Only Root Filesystem"]
        J["Non-Root Processes"]
        K["No Public Host Ports (Bypasses zero UFW rules)"]
        L["Content Security Policy & Strict Headers"]
    end

    C -.-> SecurityShield
    F -.-> SecurityShield
```

### Key Architectural Strengths:
1. **Zero Host Port Exposure**: No container publishes ports to `0.0.0.0` on the host, preventing bypass of Linux UFW firewall rules via Docker `iptables`.
2. **Internal Proxy Networking**: Communicates exclusively via the internal Docker bridge network (`airbot-stack_app-network`) directly with your reverse proxy.
3. **Hardened Unprivileged Containers**: The web app runs on `nginxinc/nginx-unprivileged:1.27-alpine` with `read_only: true` and non-root execution (UID 101); the api similarly runs `read_only: true` as the non-root `node` user.
4. **Private Data Plane**: PostgreSQL has no host ports and is reachable only by `trueroas-api` on the compose network; only the api knows the database credentials (AD-11).
5. **Lightweight & Fast**: The web image is ~21 MB, booting in milliseconds with <10 MB RAM; the api bundles Hono + Zod into a single ESM file served by Node 22.

---

## 2. Step-by-Step Server Deployment (Portainer)

### Step 1: Add GHCR Registry Credentials in Portainer (One-Time Setup)
Since your container image is **private**:
1. On GitHub: Go to **Settings** $\rightarrow$ **Developer settings** $\rightarrow$ **Personal access tokens** $\rightarrow$ **Tokens (classic)**.
2. Generate a token with the **`read:packages`** scope.
3. In Portainer: Navigate to **Settings** $\rightarrow$ **Registries** $\rightarrow$ **Add registry**.
4. Choose **Custom registry**:
   * **Name**: `GitHub Container Registry`
   * **Registry URL**: `ghcr.io`
   * **Authentication**: `ON`
   * **Username**: `Mostafa-Elmoalem`
   * **Password**: Paste your GitHub Personal Access Token.
5. Click **Add registry**.

---

### Step 2: Deploy the Stack in Portainer
1. In Portainer: Go to **Stacks** $\rightarrow$ **Add stack**.
2. **Name**: `trueroas-calculator`
3. Under **Build method**, select **Web editor** (or **Repository**) and use the project's [`docker-compose.yml`](file:///d:/Other/.MY%20Work/Software%20Development/DEV%20work%20-%20new%20ideas/ROAS-Ecommerce%20breakeEvenn/docker-compose.yml):

```yaml
services:
  app:
    image: ghcr.io/mostafa-elmoalem/roas-unit-economics-calculator:latest
    pull_policy: always
    container_name: trueroas-calculator
    restart: unless-stopped
    expose:
      - "8080"
    read_only: true
    tmpfs:
      - /tmp
    security_opt:
      - no-new-privileges:true
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://127.0.0.1:8080/health || exit 1"]
      interval: 30s
      timeout: 3s
      start_period: 5s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 256M
        reservations:
          cpus: "0.1"
          memory: 64M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    networks:
      - default
      - proxy-network

  api:
    image: ghcr.io/mostafa-elmoalem/roas-unit-economics-calculator-api:latest
    pull_policy: always
    container_name: trueroas-api
    restart: unless-stopped
    expose:
      - "3000"
    environment:
      PORT: 3000
      DATABASE_URL: postgres://${POSTGRES_USER:-trueroas}:${POSTGRES_PASSWORD:-trueroas}@postgres:5432/${POSTGRES_DB:-trueroas}
      RATE_LIMIT_PER_MINUTE: ${RATE_LIMIT_PER_MINUTE:-60}
    read_only: true
    tmpfs:
      - /tmp
    security_opt:
      - no-new-privileges:true
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://127.0.0.1:3000/health || exit 1"]
      interval: 30s
      timeout: 3s
      start_period: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 256M
        reservations:
          cpus: "0.1"
          memory: 64M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - default
      - proxy-network

  postgres:
    image: postgres:18.6-alpine
    container_name: trueroas-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-trueroas}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-trueroas}
      POSTGRES_DB: ${POSTGRES_DB:-trueroas}
    volumes:
      - pgdata:/var/lib/postgresql
    security_opt:
      - no-new-privileges:true
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-trueroas} -d ${POSTGRES_DB:-trueroas}"]
      interval: 10s
      timeout: 5s
      start_period: 10s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M
        reservations:
          cpus: "0.1"
          memory: 128M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    networks:
      - default

volumes:
  pgdata:

networks:
  default:
  proxy-network:
    external: true
    name: ${PROXY_NETWORK:-airbot-stack_app-network}
```

> **Environment:** in Portainer, add the stack environment variables `POSTGRES_USER`,
> `POSTGRES_PASSWORD` (use a strong value — the `trueroas` default is a local-dev
> convenience only), `POSTGRES_DB`, `RATE_LIMIT_PER_MINUTE` and `PROXY_NETWORK`.
> The api builds its `DATABASE_URL` from the `POSTGRES_*` values and reaches
> Postgres over the compose network; PostgreSQL itself never gets a host port.

4. Click **Deploy the stack**.

---

### Step 3: Configure Reverse Proxy (e.g. Nginx Proxy Manager)
1. In Nginx Proxy Manager (or your server's proxy): Go to **Proxy Hosts** $\rightarrow$ **Add Proxy Host**.
2. **Details Tab**:
   * **Domain Names**: `roas.yourdomain.com` (or your chosen subdomain)
   * **Scheme**: `http`
   * **Forward Hostname / IP**: `trueroas-calculator` *(resolved via Docker DNS on `airbot-stack_app-network`)*
   * **Forward Port**: `8080`
   * Check **Cache Assets**
   * Check **Block Common Exploits**
   * Check **Websockets Support**
3. **Custom Locations Tab** (Phase 2 telemetry ingest): add one location so the app's
   same-origin `POST /api/ingest` calls reach the api container:
   * **Location**: `/api`
   * **Scheme**: `http`
   * **Forward Hostname / IP**: `trueroas-api`
   * **Forward Port**: `3000`
   * The path is preserved, so `/api/ingest` arrives at the api intact. Without this
     location the app still works — telemetry flushes simply keep failing silently and
     items stay queued on the device.
4. **SSL Tab**:
   * Request a new **Let's Encrypt** SSL Certificate
   * Check **Force SSL**
   * Check **HTTP/2 Support**
   * Check **HSTS Enabled**
5. Click **Save**.

Your app is now live and secured over HTTPS!

---

### Step 4: Fully Automated Redeployment via Webhook (CI/CD)
1. In Portainer, open your deployed stack (`trueroas-calculator`).
2. Toggle **Webhook** to **ON** and copy the generated Webhook URL.
3. On GitHub: In this repository, go to **Settings** $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions**.
4. Add secret:
   * **Name**: `PORTAINER_WEBHOOK_URL`
   * **Value**: Your copied Portainer Webhook URL.

Whenever you `git push` to `main`, GitHub Actions automatically:
1. Validates code — web (`oxlint`, `tsc -b`, `vitest`) **and** api (`tsc --noEmit`, `vitest`).
2. Builds and tags both multi-arch container images (web + api).
3. Pushes the private images to `ghcr.io` (`…/roas-unit-economics-calculator` and `…/roas-unit-economics-calculator-api`).
4. Triggers the Portainer Webhook to immediately pull the new images and reload the containers with zero downtime!

---

## 3. Useful Operational Commands

```bash
# Check container health and status
docker ps --filter "name=trueroas-calculator"
docker ps --filter "name=trueroas-api"
docker ps --filter "name=trueroas-postgres"

# View real-time web server logs
docker logs -f trueroas-calculator

# View real-time api logs (structured JSON request lines)
docker logs -f trueroas-api

# Manually test the internal health checks
docker exec trueroas-calculator wget -qO- http://127.0.0.1:8080/health
docker exec trueroas-api wget -qO- http://127.0.0.1:3000/health

# Inspect Postgres data (no host port; go through the container)
docker exec -it trueroas-postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "select count(*) from usage_events;"
```

## 4. PWA Artifacts

The web image ships an installable app shell (`dist/sw.js`, `dist/manifest.webmanifest`, icons). Cache policy for these artifacts:

- `dist/sw.js` and `dist/manifest.webmanifest` must **never be cached** by any layer — the stacked nginx block already answers them with `Cache-Control: no-cache, no-store, must-revalidate`; any CDN or reverse proxy in front (NPM, Cloudflare, …) must pass them through un-cached. A stale service worker keeps the old shell alive across deploys and defeats the update flow.
- Updates are **user-prompted**: when a new build is deployed, the running app shows an in-app toast (Reload / Dismiss). An update activates only after some tab accepts it — then the already-prompted tabs (including dismissed ones) follow the activation with a reload (vite-plugin-pwa prompt-flow behavior, human-approved); a prompt that never sees an activation re-surfaces on the next session.
- On the first data save of a session the app requests `navigator.storage.persist()` once (silent, fire-and-forget) so local data resists browser eviction.
