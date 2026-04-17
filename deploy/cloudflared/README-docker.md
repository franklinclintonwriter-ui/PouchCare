# Cloudflare Tunnel inside Docker (hosting stack)

Use this when **`docker-compose.hosting.yml`** is running (Postgres, Redis, API, optionally Caddy). The `cloudflared` service joins the **same Compose network** as the API, so Cloudflare can forward traffic to **`http://api:7000`** without exposing ports 80/443 on your router.

## Automated setup (API + Docker)

If **`CLOUDFLARE_ACCOUNT_ID`** and **`CLOUDFLARE_API_TOKEN`** are set in `.env` or `apps/api/.env` (token needs **Account → Cloudflare Tunnel → Edit** and **Zone → DNS → Edit**), run from the repo root:

```bash
npm run tunnel:docker:setup
```

This creates or reuses tunnel **`pouchcare-docker`**, sets ingress **`api.pouchcare.com` → `http://api:7000`**, creates/updates the **CNAME** in Cloudflare DNS, writes **`TUNNEL_TOKEN`** to the root `.env`, and stops short of starting Docker.

To also build and start the hosting stack with the tunnel:

```bash
npm run tunnel:docker:setup -- -StartDocker
```

Or:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/cloudflare-tunnel-docker-setup.ps1 -StartDocker
```

Optional: set **`CLOUDFLARE_ZONE_ID`** or **`CLOUDFLARE_ZONE_NAME`** (default `pouchcare.com`) if the zone is not `pouchcare.com`.

## 1. Create a tunnel token (manual / dashboard)

1. Cloudflare Dashboard → **Zero Trust** → **Networks** → **Tunnels** → **Create a tunnel**.
2. Choose **Cloudflared** and name the tunnel (for example `pouchcare-docker`).
3. Copy the **token** shown at the end of the wizard.

## 2. Configure public hostnames

Still in the tunnel configuration, under **Public hostnames**:

| Hostname | Service type | URL (internal) |
| -------- | -------------- | -------------- |
| `api.pouchcare.com` | HTTP | **`http://api:7000`** |

The hostname `api` is the Docker Compose service name; it resolves only inside the Compose network, which is what you want.

- If you also run **Vite apps on the host** (`npm run dev`) and want `m.pouchcare.com` / `pouchcare.com` through the same tunnel container, add hostnames pointing to:
  - `http://host.docker.internal:3000` (management)
  - `http://host.docker.internal:3001` (landing)

The `cloudflared` service includes `extra_hosts: host.docker.internal:host-gateway` so that works on Linux and Docker Desktop.

## 3. Token in `.env`

At the **repository root** (next to `docker-compose.hosting.yml`), create or edit `.env`:

```env
TUNNEL_TOKEN=eyJhIjoi...
```

Compose substitutes this into the `cloudflared` container. Do not commit `.env`.

## 4. Start the stack + tunnel

```bash
npm run docker:hosting:tunnel
```

This is equivalent to:

```bash
docker compose -f docker-compose.hosting.yml --profile tunnel up -d --build
```

Logs:

```bash
npm run docker:hosting:tunnel:logs
```

## 5. API URL inside the API container

`docker-compose.hosting.yml` already sets `API_URL` (default `https://api.pouchcare.com`). Ensure that matches the hostname you expose through the tunnel so redirects and signed links stay correct.

## Optional: YAML + credentials file instead of a token

If you use a **named tunnel** with a JSON credentials file (see `README.md` for local dev), you can run `cloudflared` manually with a Docker-mounted config:

1. Copy `config.docker.template.yml` to `config.docker.yml` and set `tunnel:` and mount your `.json` credential as `/etc/cloudflared/credentials.json`.
2. Run:

```bash
docker run --rm -d --name pouchcare-cloudflared \
  --network pouchcare-main_default \
  -v "%CD%\deploy\cloudflared\config.docker.yml:/etc/cloudflared/config.yml:ro" \
  -v "%USERPROFILE%\.cloudflared\YOUR_UUID.json:/etc/cloudflared/credentials.json:ro" \
  cloudflare/cloudflared:latest tunnel --config /etc/cloudflared/config.yml run
```

Replace **`pouchcare-main_default`** with your project’s Compose network name (`docker network ls` after `npm run docker:hosting`).

## Caddy vs tunnel

- **Tunnel only:** you do not need Caddy or open 80/443; you can stop the `pouchcare-caddy` container if you want to free those ports.
- **Both:** possible (tunnel to `api`, Caddy for local/LAN); avoid duplicate DNS for the same hostname pointing to two different edges.

## Remote VPS (dev or prod API — no Docker on your laptop)

Use this when the backend runs on a **server** (`docker-compose.hosting.yml` is already deployed there) and you want Cloudflare Tunnel to reach **`http://api:7000`** on that host’s Compose network. Your dev machine only needs **Node + Vite** (or a browser); **do not** run the full hosting stack locally unless you want to.

### 1. Create or reuse a tunnel (Cloudflare Dashboard)

Zero Trust → **Networks** → **Tunnels** → create a tunnel (e.g. `pouchcare-vps`) → copy the **token**.

### 2. Put the token on the server

On the VPS, in the same directory as `docker-compose.hosting.yml` (e.g. `/opt/pouchcare`), edit **root** `.env`:

```env
TUNNEL_TOKEN=eyJhIjoi...
```

Ensure line endings are **LF** (not Windows CRLF), or Docker Compose will fail to parse `.env`.

### 3. Public hostname in the tunnel UI

| Hostname | Service | URL |
| -------- | ------- | --- |
| `api.pouchcare.com` | HTTP | **`http://api:7000`** (production API on the Compose network) |
| `api-dev.pouchcare.com` | HTTP | **`http://host.docker.internal:7001`** (dev API from `docker-compose.hosting.dev.yml`; requires `extra_hosts` on `cloudflared`, same as in `docker-compose.hosting.yml`) |

- **`api.pouchcare.com`:** use Compose service name **`api`** (same Docker network as `cloudflared`).
- **`api-dev.pouchcare.com`:** use **`http://host.docker.internal:7001`** so traffic reaches the **dev** stack (`docker-compose.hosting.dev.yml` must be running on the same host). `cloudflared` already has `extra_hosts: host.docker.internal:host-gateway` in `docker-compose.hosting.yml`.

### 4. Start the stack **including** the tunnel

On the **VPS** (SSH), from the repo root:

```bash
docker compose -f docker-compose.hosting.yml --profile tunnel up -d --build
```

Same as `npm run docker:hosting:tunnel` if you have Node on the server.

### 5. DNS: pick **one** path per hostname

- **Tunnel:** In Cloudflare DNS, the tunnel wizard usually creates a **CNAME** to `*.cfargotunnel.com` (orange cloud). Traffic never hits your server’s public 443 directly for that name.
- **Direct to origin (Caddy + Let’s Encrypt):** An **A** record to the VPS IP.

Do **not** point the same hostname at both a tunnel CNAME and a direct A record in a conflicting way. For tunnel-only API access, you can **stop the `caddy` container** on the VPS to free ports 80/443:

```bash
docker stop pouchcare-caddy
# optional: docker rm pouchcare-caddy  # or scale caddy to 0 via compose override
```

### 6. Local dev machines (no backend Docker)

Point frontends at the API you use:

**Production API**

```env
VITE_API_URL=https://api.pouchcare.com
VITE_WS_URL=wss://api.pouchcare.com/v1/realtime
```

**Development API** (isolated DB — see `docker-compose.hosting.dev.yml`)

```env
VITE_API_URL=https://api-dev.pouchcare.com
VITE_WS_URL=wss://api-dev.pouchcare.com/v1/realtime
```

Add dev origins (e.g. `http://localhost:5173`, Cloudflare Pages URLs) to **`ALLOWED_ORIGINS`** in **`apps/api/.env`** or **`apps/api/.env.dev`** on the server, matching which stack you changed. Recreate that API:

```bash
cd /opt/pouchcare && docker compose -f docker-compose.hosting.yml up -d --build api
# dev:
docker compose -p pouchcare-dev -f docker-compose.hosting.dev.yml up -d --build api_dev
```
