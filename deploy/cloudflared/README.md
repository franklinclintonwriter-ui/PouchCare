# Cloudflare Tunnel (local dev on your real domain)

**You must run `cloudflared tunnel login` once on your PC** (browser — the agent cannot do this for you). After that, from the repo root:

```powershell
npm run tunnel:bootstrap
```

That creates/wires tunnel `pouchcare-dev`, writes `deploy/cloudflared/config.yml`, validates ingress, and runs `tunnel route dns` for the hostnames below.

---

This repo’s apps expect:

| Hostname | Local service | Port |
| -------- | ------------- | ---- |
| `pouchcare.com`, `www.pouchcare.com` | Landing (Vite) | **3001** |
| `m.pouchcare.com` | Management (Vite) | **3000** |
| `api.pouchcare.com` | API (Express) | **7000** |

With `npm run dev` running, the frontends call `https://api.pouchcare.com` when the site is **not** opened on `localhost` (see `apps/*/src/config/apiOrigin.ts`). A tunnel that maps the three hostnames to those ports matches production-style behaviour.

## Prerequisites

1. **Cloudflare** manages DNS for `pouchcare.com` (nameservers on Cloudflare).
2. **`cloudflared` installed** (Windows: `winget install Cloudflare.cloudflared`).
3. **Local stack running**: `npm run dev` from the repo root (API + both Vites).

## One-time setup

1. Log in (opens the browser once):

   ```powershell
   cloudflared tunnel login
   ```

2. Create a tunnel and note the **UUID** and **credentials path**:

   ```powershell
   cloudflared tunnel create pouchcare-dev
   ```

3. Copy the template and fill in values:

   ```powershell
   cd <repo-root>
   copy deploy\cloudflared\config.template.yml deploy\cloudflared\config.yml
   ```

   Edit `deploy/cloudflared/config.yml`: set `tunnel:` to your UUID and `credentials-file:` to the `.json` path (usually `%USERPROFILE%\.cloudflared\<UUID>.json`). Use forward slashes in YAML on Windows, e.g. `C:/Users/You/.cloudflared/....json`.

4. **Route DNS** so each hostname points at this tunnel (creates/updates CNAMEs in Cloudflare):

   ```powershell
   cloudflared tunnel route dns pouchcare-dev api.pouchcare.com
   cloudflared tunnel route dns pouchcare-dev m.pouchcare.com
   cloudflared tunnel route dns pouchcare-dev pouchcare.com
   cloudflared tunnel route dns pouchcare-dev www.pouchcare.com
   ```

   Or use **Cloudflare Dashboard** → **Zero Trust** → **Networks** → **Tunnels** → your tunnel → **Public hostnames** and map each hostname to `http://localhost:<port>` (same ports as above).

5. Ensure **`apps/api/.env`** `ALLOWED_ORIGINS` includes your HTTPS origins (the example already lists `https://pouchcare.com`, `https://www.pouchcare.com`, `https://m.pouchcare.com`, `https://api.pouchcare.com`).

## Run the tunnel (every dev session)

Terminal 1 — app servers:

```powershell
npm run dev
```

Terminal 2 — tunnel:

```powershell
npm run tunnel:dev
```

Then open `https://pouchcare.com` / `https://m.pouchcare.com` in the browser.

## Production when you are done

Tunnel DNS is only for **dev while your PC runs** `cloudflared`. For production:

1. **Stop** `cloudflared` and remove or disable the tunnel’s hostnames in Cloudflare (or delete the dev tunnel) so DNS is no longer pointed at your laptop.
2. Point `pouchcare.com`, `www`, `m`, `api` to your real origin (e.g. VPS + Nginx as in `deploy/nginx/`, or Cloudflare Pages + API on a server) using **A/AAAA** or **CNAME** records as in your deploy docs.
3. Keep **SSL/TLS** mode **Full (strict)** in Cloudflare when the origin has a valid certificate.

**Important:** While DNS for the main domain points at the tunnel, traffic hits **your machine**, not your production server. Use a **separate dev subdomain** (e.g. `dev.pouchcare.com`) if you must not interrupt production.

## Quick test without DNS (random URL)

To verify `cloudflared` without touching `pouchcare.com`:

```powershell
cloudflared tunnel --url http://127.0.0.1:3001
```

Cloudflare prints a `trycloudflare.com` URL for the landing app only.

## Docker hosting stack (API in Compose)

If the API runs in **`docker-compose.hosting.yml`**, run `cloudflared` in Docker on the same network — see **[README-docker.md](./README-docker.md)** (`npm run docker:hosting:tunnel`).
