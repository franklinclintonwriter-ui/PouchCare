# Hosting the API on Docker Desktop (always-on)

This stack runs **PostgreSQL**, **Redis**, the **PouchCare API**, and **Caddy** (HTTPS for `api.pouchcare.com`) with `restart: unless-stopped`, suitable for leaving on for weeks on a desktop with Docker Desktop.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS) with WSL2 backend on Windows.
- Repo cloned on the machine that will run 24/7 (or as long as the PC is on).

## Production vs development API (no cross-talk)

| | Production | Development |
|--|------------|-------------|
| **Compose file** | `docker-compose.hosting.yml` | `docker-compose.hosting.dev.yml` |
| **Public URL** | `https://api.pouchcare.com` | `https://api-dev.pouchcare.com` |
| **API env file** | `apps/api/.env` | `apps/api/.env.dev` (copy from `apps/api/.env.dev.example`) |
| **DB / Redis** | `pouchcare` DB, volumes `pouchcare_*` | `pouchcare_dev` DB, volumes `pouchcare_dev_*` |
| **Host ports** | API **7000**, Postgres **5432**, Redis **6379** | API **7001**, Postgres **5433**, Redis **6380** |
| **Start** | `npm run docker:hosting` | `npm run docker:hosting:dev` (Compose project **`pouchcare-dev`**, separate from prod) |

Run **both** stacks on the same host only if you need prod and dev APIs together. The **production** Caddy container serves **both** hostnames: `api.pouchcare.com` → container `api`, and `api-dev.pouchcare.com` → `host.docker.internal:7001` (the dev API). Restart Caddy after changing `deploy/Caddyfile` (`docker compose -f docker-compose.hosting.yml up -d caddy`).

Before the first `npm run docker:hosting:dev`, copy `apps/api/.env.dev.example` to **`apps/api/.env.dev`** and set **`JWT_SECRET`** / **`JWT_REFRESH_SECRET`** (must **not** match production `apps/api/.env`).

**DNS:** add an **A** (or **AAAA**) record for `api-dev.pouchcare.com` to the same origin as `api` if you use Caddy TLS, or configure a separate **Cloudflare Tunnel** hostname for `api-dev` → `http://host.docker.internal:7001` (see `deploy/cloudflared/README-docker.md`).

**Cloudflare Pages (dev):** build with `VITE_API_URL=https://api-dev.pouchcare.com` and `VITE_WS_URL=wss://api-dev.pouchcare.com/v1/realtime`. Add your Pages origins to **`ALLOWED_ORIGINS`** in `apps/api/.env.dev` on the server.

## 1. Environment

1. Ensure `apps/api/.env` exists (copy from `apps/api/.env.example` if needed).
2. Set strong secrets (32+ characters each):

   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`

3. Set **`ALLOWED_ORIGINS`** in `apps/api/.env` to every browser origin that will call the API (for example `https://m.pouchcare.com`, `https://office.pouchcare.com`, local dev URLs). The hosting compose file **does not** override this list, so your full CORS configuration is preserved.

4. You **do not** need `DATABASE_URL` or `REDIS_URL` in `.env` for Docker: `docker-compose.hosting.yml` overrides them to use the `postgres` and `redis` service names.

5. **`API_URL`**: local `.env` can stay `http://localhost:7000` for running the API outside Docker. Inside the API container, compose sets **`API_URL=https://api.pouchcare.com`** (override with shell `API_URL=...` before `docker compose` if needed).

6. Optional: set `POSTGRES_PASSWORD` in a root `.env` file (same folder as `docker-compose.hosting.yml`) if you do not want the default password `pouchcare`. If you change it, use the same value everywhere the compose file references `${POSTGRES_PASSWORD}`.

## 2. Build and start (API + HTTPS)

From the **repository root**:

```bash
npm run docker:hosting
```

Or:

```bash
docker compose -f docker-compose.hosting.yml up -d --build
```

This starts Postgres, Redis, the API (port **7000** on the host), and Caddy on **80** and **443**.

- Direct API (LAN / health checks): `http://localhost:7000/health`
- Readiness (DB + Redis): `http://localhost:7000/health/ready`
- Public HTTPS (after DNS and firewall): `https://api.pouchcare.com/health`

First start runs `prisma migrate deploy` inside the API container.

`npm run docker:hosting:edge` is the same command (kept for older docs); Caddy is included in the default stack.

## 3. Point `api.pouchcare.com` at this machine

1. **DNS**  
   Create an **A record**: `api.pouchcare.com` → your **public** IPv4.

2. **Router / firewall**  
   Forward **80** and **443** to this computer’s LAN IP.

3. **Caddy**  
   `deploy/Caddyfile` terminates TLS and reverse-proxies to the `api` service. Caddy obtains Let’s Encrypt certificates when the hostname resolves to this public IP and ports 80/443 reach the container.

**Residential / CGNAT:** if you cannot open ports, use **Cloudflare Tunnel** (`cloudflared`) in front of the API instead of exposing 80/443 directly. To run the tunnel **in Docker** on the same network as the API, see [`deploy/cloudflared/README-docker.md`](cloudflared/README-docker.md) and `npm run docker:hosting:tunnel`.

**Port conflicts:** if something else binds 80/443 on the host, stop that service or adjust the Caddy service’s published ports in `docker-compose.hosting.yml`.

## 4. Management app / frontends

- **Production builds** served from a non-localhost host default the API to `https://api.pouchcare.com` (see `apps/management/src/config/apiOrigin.ts`), unless you set `VITE_API_URL`.
- If the SPA is on another host (for example `https://m.pouchcare.com`) and you need an explicit API or WebSocket URL, set in the management app env before build:

  ```text
  VITE_API_URL=https://api.pouchcare.com
  VITE_WS_URL=wss://api.pouchcare.com/v1/realtime
  ```

  See `apps/management/.env.example`.

- **Local dev** usually leaves `VITE_*` unset and uses the Vite proxy to the local API.

## 5. Logs and updates

```bash
npm run docker:hosting:logs
```

Rebuild after code changes:

```bash
docker compose -f docker-compose.hosting.yml up -d --build
```

### Build metadata (Git SHA / build time)

The API Docker image accepts optional build args so the **Management → Settings → System Config → Server** tab can show deploy identity:

```bash
docker compose -f docker-compose.hosting.yml build \
  --build-arg GIT_SHA="$(git rev-parse --short HEAD)" \
  --build-arg BUILD_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
docker compose -f docker-compose.hosting.yml up -d
```

On Windows PowerShell:

```powershell
docker compose -f docker-compose.hosting.yml build `
  --build-arg GIT_SHA=(git rev-parse --short HEAD) `
  --build-arg BUILD_TIME=(Get-Date -Format o)
docker compose -f docker-compose.hosting.yml up -d
```

If omitted, the Server tab shows `unknown` for Git SHA and build time.

## 6. Migrations & entrypoint

The API image runs `prisma migrate deploy` then starts `node dist/server.js` via an **inline** `ENTRYPOINT` in `deploy/Dockerfile.api` (avoids Windows CRLF issues with shell scripts).

## Troubleshooting: browser shows `ERR_CONNECTION_TIMED_OUT`

That means the TCP connection to **port 443** (HTTPS) never completes. DNS can be correct while the service is still unreachable.

1. **Confirm the public IP matches DNS**  
   On the PC that runs Docker, compare your real public IP (browser: “what is my ip”) with the A record for `api.pouchcare.com`. They must be the same.

2. **Router port forwarding**  
   Forward **TCP 80** and **TCP 443** from the WAN to the **LAN IP** of the machine running Docker Desktop (not another device).

3. **Windows Defender Firewall**  
   Allow inbound **80** and **443** for Docker / “Docker Desktop Backend”, or temporarily test with firewall off to confirm.

4. **Containers listening**  
   On the host: `docker ps` — `pouchcare-caddy` must be **Up** and publishing `0.0.0.0:443->443`.  
   From another device on the **same LAN**: open `https://<that-pc-lan-ip>` — you should at least get a TLS or Caddy response (not a timeout).

5. **CGNAT / no public IP**  
   If your ISP does not give a routable public IPv4, port forwarding will never work from the internet. Use **Cloudflare Tunnel** (`cloudflared`) or similar instead of exposing 80/443.

6. **Quick local checks**  
   - API without TLS: `http://localhost:7000/health` on the Docker host.  
   - After Caddy is up: `https://127.0.0.1/health` may still fail SNI-wise; prefer testing from LAN IP or the public URL once forwarding works.

## VPS: Vite dev frontends (hot reload)

Run the **management** and **landing** apps in dev mode on the same host as the API (typical: bind-mount `/opt/pouchcare`). **Caddy** terminates TLS and proxies:

| Hostname | App | Host port |
| -------- | ----- | --------- |
| `https://dev-m.pouchcare.com` | Management (`m.pouchcare.com` workspace) | 3000 |
| `https://dev-pouchcare.com` and `https://dev.pouchcare.com` | Landing / client UI (`pouchcare.com` workspace) | 3001 |

1. **DNS** — Point **A** (or **AAAA**) records for `dev-m.pouchcare.com`, `dev-pouchcare.com`, and `dev.pouchcare.com` at the same VPS as Caddy.
2. **API CORS** — In **`apps/api/.env.dev`** on the server, ensure **`ALLOWED_ORIGINS`** includes the three HTTPS origins above (see `apps/api/.env.dev.example`).
3. **Start** (from repo root on the VPS):

   ```bash
   npm run docker:frontend:dev
   ```

   Optional env file: copy `deploy/frontend-dev.env.example` → `deploy/frontend-dev.env` and run  
   `docker compose --env-file deploy/frontend-dev.env -f docker-compose.frontend-dev.yml up -d`.

4. **Reload Caddy** after pulling `deploy/Caddyfile` changes:  
   `docker compose -f docker-compose.hosting.yml up -d caddy`

5. **Logs:** `npm run docker:frontend:dev:logs` — **Stop:** `npm run docker:frontend:dev:down`

The container runs `npm ci` once (volume `frontend_dev_root_node_modules`), then two **Vite** processes. Set **`VITE_DEV_API_URL`** / **`VITE_DEV_WS_URL`** if the dev API is not `https://api-dev.pouchcare.com`.

### TLS (Let’s Encrypt) and `ERR_SSL_PROTOCOL_ERROR`

Caddy **obtains certificates automatically** for every hostname in `deploy/Caddyfile`. Nothing extra to “install” beyond:

1. **Deploy the current `deploy/Caddyfile` and `docker-compose.hosting.yml`** (with `extra_hosts: host.docker.internal:host-gateway` on the `caddy` service) to the server, then:  
   `docker compose -f docker-compose.hosting.yml up -d caddy`
2. **Public DNS:** each hostname in the Caddyfile needs an **A** (or **AAAA**) record to this server’s IP. If a name is missing (**NXDOMAIN**), Let’s Encrypt will fail for that host and the browser may show TLS errors until DNS exists and Caddy retries (often within a minute).
3. **First ACME attempt** can occasionally return `No such authorization`; Caddy retries and issuance usually succeeds once HTTP-01 on port **80** works.
4. **Cloudflare “orange cloud” (proxied):** set SSL/TLS mode to **Full** or **Full (strict)** so the browser-to-Cloudflare connection is HTTPS and the origin still gets HTTPS from Caddy when appropriate.
5. **Vite behind HTTPS:** `server.allowedHosts` in each app’s `vite.config.ts` must include `dev-m.pouchcare.com` (and landing dev hosts), or Vite returns **403** even when TLS is valid.

## Cloudflare Pages (production static builds) with Wrangler

**Production** traffic uses **`vite build`** output uploaded to **Cloudflare Pages**, **not** the VPS Vite dev containers above. Static builds deploy with **[Wrangler](https://developers.cloudflare.com/workers/wrangler/)** (`wrangler pages deploy`). Each app has a `wrangler.toml` (`name` = Pages project name, `pages_build_output_dir = "dist"`).

1. **Login once:** `npx wrangler login`
2. **Create Pages projects** (once per app), from the app folder or via npm script:
   - Management: `npm run pages:project:create -w m.pouchcare.com` → project **`pouchcare-management`**
   - Landing: `npm run pages:project:create -w pouchcare.com` → project **`pouchcare`**
3. **Production API URLs** are set in **`apps/management/.env.production`** and **`apps/landing/.env.production`** (loaded automatically by `vite build`). Use **`.env.production.local`** for overrides (gitignored).
4. **Build + deploy** from repository root:

   ```bash
   npm run pages:deploy:management
   npm run pages:deploy:landing
   ```

   Or from each app: `npm run pages:deploy` (runs **`vite build`** then `wrangler pages deploy dist`). The management app uses **`build:vite`** for deploy so production bundles can ship even when `tsc -b` has pending errors; for full typecheck before release, run `npm run build -w m.pouchcare.com` locally.

5. **Custom domains** in Cloudflare Dashboard → Workers & Pages → each project → **Custom domains**:
   - Project **`pouchcare-management`** → **`m.pouchcare.com`**
   - Project **`pouchcare`** → **`pouchcare.com`** and **`www.pouchcare.com`** (add both if you use them)

For **api-dev** preview builds on Pages, set `VITE_API_URL` / `VITE_WS_URL` to `https://api-dev.pouchcare.com` / `wss://api-dev.pouchcare.com/v1/realtime` before `vite build`, or use **Environment variables** on a Preview branch in Pages.

## Data persistence

Volumes: `pouchcare_pg_data`, `pouchcare_redis_data`, `pouchcare_api_uploads`. They survive container restarts until you remove them with `docker volume rm`.
