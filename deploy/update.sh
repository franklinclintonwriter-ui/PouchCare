#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# PouchCare OS — Re-deploy after git push
# Usage: sudo bash /home/pouchcare/Developments/PouchCare/deploy/update.sh
# ═══════════════════════════════════════════════════════════════════════════
set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✅]${NC} $1"; }
info() { echo -e "${CYAN}[→]${NC}  $1"; }
warn() { echo -e "${YELLOW}[⚠️]${NC}  $1"; }
fail() { echo -e "\033[0;31m[❌]${NC} $1"; exit 1; }

APP_USER="pouchcare"
REPO_DIR="/home/${APP_USER}/Developments/PouchCare"
API_DIR="${REPO_DIR}/apps/api"
HTDOCS="/home/${APP_USER}/htdocs"
DB_URL="postgresql://pouchcare:pouchcare@localhost:5432/pouchcare"

echo -e "\n${CYAN}${BOLD}══════════════════════════════════════════════════${NC}"
echo -e "${CYAN}${BOLD}  PouchCare OS — Redeploying at $(date '+%Y-%m-%d %H:%M')${NC}"
echo -e "${CYAN}${BOLD}══════════════════════════════════════════════════${NC}\n"

[ -d "${REPO_DIR}/.git" ] || fail "Repo not found at ${REPO_DIR} — run deploy.sh first"

# 1. Pull latest code
info "Pulling latest main from origin..."
cd "${REPO_DIR}"
sudo -u ${APP_USER} git fetch origin
sudo -u ${APP_USER} git checkout main
sudo -u ${APP_USER} git reset --hard origin/main
log "Code: $(git log --oneline -1)"

# 2. API update
info "Updating API..."
cd "${API_DIR}"
sudo -u ${APP_USER} npm install --legacy-peer-deps --silent
sudo -u ${APP_USER} DATABASE_URL="${DB_URL}" npx prisma generate
sudo -u ${APP_USER} DATABASE_URL="${DB_URL}" npx prisma migrate deploy
sudo -u ${APP_USER} npx tsc 2>&1 | tail -2
log "API compiled"

# 3. Restart API
pm2 restart pouchcare-api
sleep 3
if curl -sf http://127.0.0.1:7000/health > /dev/null; then
  log "API restarted and healthy"
else
  warn "API not responding — check: pm2 logs pouchcare-api"
fi

# 4. Rebuild frontends
rebuild() {
  local NAME=$1 SRC=$2 OUT=$3
  info "Building ${NAME}..."
  cd "${REPO_DIR}/${SRC}"
  echo "VITE_API_URL=https://api.pouchcare.com/v1" > .env.local
  chown ${APP_USER}:${APP_USER} .env.local
  sudo -u ${APP_USER} npm install --legacy-peer-deps --silent
  sudo -u ${APP_USER} npm run build
  rm -rf "${OUT}"
  cp -r dist/. "${OUT}/"
  chown -R ${APP_USER}:${APP_USER} "${OUT}"
  log "${NAME} → ${OUT}"
}

rebuild "Management Portal" "apps/management"   "${HTDOCS}/m.pouchcare.com"
rebuild "Staff Office"      "apps/office"        "${HTDOCS}/office.pouchcare.com"
rebuild "Client Portal"     "apps/client-portal" "${HTDOCS}/my.pouchcare.com"

# Landing (static)
if [ -f "${REPO_DIR}/apps/landing/index.html" ]; then
  cp -r "${REPO_DIR}/apps/landing/." "${HTDOCS}/pouchcare.com/"
  chown -R ${APP_USER}:${APP_USER} "${HTDOCS}/pouchcare.com"
  log "Landing updated"
fi

# 5. Reload Nginx
nginx -t && nginx -s reload
log "Nginx reloaded"

echo ""
echo -e "${GREEN}${BOLD}══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  Update Complete ✅  $(date '+%Y-%m-%d %H:%M')${NC}"
echo -e "${GREEN}${BOLD}══════════════════════════════════════════════════${NC}"
echo ""
echo "  API:     https://api.pouchcare.com/health"
echo "  Portal:  https://m.pouchcare.com"
echo "  Office:  https://office.pouchcare.com"
echo "  Client:  https://my.pouchcare.com"
echo ""
