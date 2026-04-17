#!/bin/sh
# Used by docker-compose.frontend-dev.yml — run Vite dev for management (:3000) and landing (:3001).
# Same-origin API via Caddy (deploy/Caddyfile): each app gets VITE_* pointing at its public hostname
# so the browser does not need a separate api-dev DNS record.
set -e
cd /workspace
if [ ! -x node_modules/.bin/vite ]; then
  npm ci --legacy-peer-deps
fi
M_API="${VITE_DEV_MANAGEMENT_API_URL:-https://dev-m.pouchcare.com}"
M_WS="${VITE_DEV_MANAGEMENT_WS_URL:-wss://dev-m.pouchcare.com/v1/realtime}"
L_API="${VITE_DEV_LANDING_API_URL:-https://dev-pouchcare.com}"
L_WS="${VITE_DEV_LANDING_WS_URL:-wss://dev-pouchcare.com/v1/realtime}"
(cd apps/management && export VITE_API_URL="$M_API" VITE_WS_URL="$M_WS" && npx vite --host 0.0.0.0 --port 3000) &
(cd apps/landing && export VITE_API_URL="$L_API" VITE_WS_URL="$L_WS" && npx vite --host 0.0.0.0 --port 3001) &
wait
