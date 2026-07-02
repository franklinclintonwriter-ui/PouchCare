# PouchCare — Linux hosting: boot-persistent API + Cloudflare Tunnel + auto-deploy

Runs the API live from this machine, exposed via Cloudflare Tunnel at
`https://api.pouchcare.com.bd`, and auto-deploys on every push to `main`.
Frontends are served by Cloudflare Pages, so the tunnel exposes only the API.

## Components

| Piece | Location (installed) | Repo template |
| ----- | -------------------- | ------------- |
| Tunnel run config | `~/.cloudflared/pouchcare.yml` | `deploy/cloudflared/config.native.yml` |
| Deploy poller script | `~/.pouchcare/deploy.sh` | `deploy/systemd/deploy.sh` |
| API service | `~/.config/systemd/user/pouchcare-api.service` | `deploy/systemd/pouchcare-api.service` |
| Tunnel service | `~/.config/systemd/user/pouchcare-tunnel.service` | `deploy/systemd/pouchcare-tunnel.service` |
| Deploy service | `~/.config/systemd/user/pouchcare-deploy.service` | `deploy/systemd/pouchcare-deploy.service` |
| Deploy timer (60s) | `~/.config/systemd/user/pouchcare-deploy.timer` | `deploy/systemd/pouchcare-deploy.timer` |

The live checkout lives in `~/.pouchcare/live` (a clean clone of `main`), kept
separate from any dev workspace.

## One-time install

```bash
# 1. cloudflared + tunnel (writes ~/.cloudflared credentials from TUNNEL_TOKEN)
npm run tunnel:up            # installs cloudflared, runs once to verify

# 2. copy templates into place
mkdir -p ~/.pouchcare ~/.config/systemd/user
cp deploy/systemd/deploy.sh ~/.pouchcare/deploy.sh && chmod +x ~/.pouchcare/deploy.sh
cp deploy/systemd/pouchcare-*.{service,timer} ~/.config/systemd/user/
cp deploy/cloudflared/config.native.yml ~/.cloudflared/pouchcare.yml

# 3. first deploy (clone main + install deps)
~/.pouchcare/deploy.sh

# 4. enable services + boot persistence
systemctl --user daemon-reload
systemctl --user enable --now pouchcare-api pouchcare-tunnel pouchcare-deploy.timer
sudo loginctl enable-linger "$USER"   # start at boot without an active login
```

## Operating

```bash
journalctl --user -u pouchcare-api -f        # API logs
journalctl --user -u pouchcare-deploy -f     # deploy logs
systemctl --user start pouchcare-deploy      # force a deploy now
systemctl --user restart pouchcare-api pouchcare-tunnel
```

## Notes

- Only `main` is auto-deployed. Anything on `main` runs here unreviewed
  (including `prisma migrate deploy`). Keep `main` protected.
- Secrets: `apps/api/.env` is gitignored. The deploy seeds the live checkout's
  `.env` once; to change live secrets edit `~/.pouchcare/live/apps/api/.env`
  and `systemctl --user restart pouchcare-api`.
