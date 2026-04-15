#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# PouchCare OS — Re-deploy after git push
# Usage: bash /home/pouchcare-api/Developments/PouchCare/deploy/update.sh
# ═══════════════════════════════════════════════════════════════════════════
set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✅]${NC} $1"; }
info() { echo -e "${CYAN}[→]${NC}  $1"; }
warn() { echo -e "${YELLOW}[⚠️]${NC}  $1"; }
fail() { echo -e "\033[0;31m[❌]${NC} $1"; exit 1; }

APP_USER="ubuntu"
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
git fetch origin
git checkout main
git reset --hard origin/main
log "Code: $(git log --oneline -1)"

# 2. Database backup
info "Backing up database before migration..."
BACKUP_DIR="/home/ubuntu/backups"
mkdir -p "$BACKUP_DIR"
pg_dump -U pouchcare -h localhost pouchcare > "$BACKUP_DIR/pre-deploy-$(date +%Y%m%d%H%M%S).sql" 2>/dev/null || warn "pg_dump skipped (check pg_hba.conf)"
log "Backup to $BACKUP_DIR"
# Clean up backups older than 30 days
find "$BACKUP_DIR" -name "pre-deploy-*.sql" -mtime +30 -delete 2>/dev/null || true

# 3. API update
info "Updating API..."
cd "${API_DIR}"
npm install --legacy-peer-deps --silent
DATABASE_URL="${DB_URL}" npx prisma generate
DATABASE_URL="${DB_URL}" npx prisma migrate deploy
log "API compiled"

# 4. Restart API
pm2 restart pouchcare-api || pm2 start ecosystem.config.js --only pouchcare-api
pm2 save
sleep 3

# Verify API health with retry loop
echo "🏥 Verifying API health..."
for i in 1 2 3 4 5; do
  if curl -sf http://localhost:7000/health > /dev/null 2>&1; then
    log "API is healthy"
    break
  fi
  echo "   Waiting for API to start... (attempt $i/5)"
  sleep 3
done

# 5. Rebuild frontends
rebuild() {
  local NAME=$1 SRC=$2 OUT=$3
  info "Building ${NAME}..."
  cd "${REPO_DIR}/${SRC}"
  echo "VITE_API_URL=https://api.pouchcare.com/v1" > .env.local
  npm install --legacy-peer-deps --silent
  npm run build
  rm -rf "${OUT}"
  mkdir -p "${OUT}"
  cp -r dist/. "${OUT}/"
  log "${NAME} → ${OUT}"
}

rebuild "Management Portal" "apps/management"   "${HTDOCS}/m.pouchcare.com"
rebuild "Staff Office"      "apps/office"        "${HTDOCS}/office.pouchcare.com"
# Landing (marketing + future client portal routes — Vite SPA)
rebuild "Landing" "apps/landing" "${HTDOCS}/pouchcare.com"

# 6. Reload Nginx
nginx -t && nginx -s reload 2>/dev/null || systemctl reload nginx 2>/dev/null || warn "nginx reload skipped"
log "Nginx reloaded"

echo ""
echo -e "${GREEN}${BOLD}══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  Update Complete ✅  $(date '+%Y-%m-%d %H:%M')${NC}"
echo -e "${GREEN}${BOLD}══════════════════════════════════════════════════${NC}"
echo ""
echo "  API:     https://api.pouchcare.com/health"
echo "  Mgmt:    https://m.pouchcare.com"
echo "  Office:  https://office.pouchcare.com"
echo "  Clients: https://pouchcare.com (/my-accounts, /dashboard)"
echo ""
