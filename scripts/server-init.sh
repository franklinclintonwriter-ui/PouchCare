#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# PouchCare OS — Initial Server Setup
# Run this ONCE on a fresh server after cloning the repo via SSH.
#
# Usage:
#   bash /home/pouchcare-api/Developments/PouchCare/scripts/server-init.sh
#
# Pre-requisites on the server:
#   - PostgreSQL installed with DB: pouchcare / user: pouchcare / pass: pouchcare
#   - Git, curl, sudo access
#   - SSH key added to authorized_keys
# ═══════════════════════════════════════════════════════════════════════════
set -e

GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; BOLD='\033[1m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✅]${NC} $1"; }
info() { echo -e "${CYAN}[→]${NC}  $1"; }
warn() { echo -e "${YELLOW}[⚠️]${NC}  $1"; }

APP_USER="pouchcare-api"
HOME_DIR="/home/${APP_USER}"
REPO_DIR="${HOME_DIR}/Developments/PouchCare"
API_DIR="${REPO_DIR}/apps/api"
HTDOCS="${HOME_DIR}/htdocs"
DB_URL="postgresql://pouchcare:pouchcare@localhost:5432/pouchcare"

echo -e "\n${CYAN}${BOLD}══════════════════════════════════════════════════${NC}"
echo -e "${CYAN}${BOLD}  PouchCare OS — Server Init at $(date '+%Y-%m-%d %H:%M')${NC}"
echo -e "${CYAN}${BOLD}══════════════════════════════════════════════════${NC}\n"

# ── 1. Install Node.js 20 ─────────────────────────────────────────────────
if ! command -v node &>/dev/null || [[ "$(node --version)" != v20* ]]; then
  info "Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  log "Node.js $(node --version) installed"
else
  log "Node.js $(node --version) already present"
fi

# ── 2. Install PM2 ────────────────────────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  info "Installing PM2..."
  sudo npm install -g pm2
  log "PM2 installed"
fi

# ── 3. Install Redis (for BullMQ jobs) ───────────────────────────────────
if ! command -v redis-server &>/dev/null; then
  info "Installing Redis..."
  sudo apt-get install -y redis-server
  sudo systemctl enable redis-server
  sudo systemctl start redis-server
  log "Redis installed and started"
else
  log "Redis already present"
fi

# ── 4. Clone repo ─────────────────────────────────────────────────────────
mkdir -p "${HOME_DIR}/Developments"
if [ ! -d "${REPO_DIR}/.git" ]; then
  info "Cloning PouchCare repo..."
  cd "${HOME_DIR}/Developments"
  git clone git@gitlab.com:franklinclinton.writer/PouchCare.git PouchCare
  log "Repo cloned"
else
  info "Repo already cloned — pulling latest main..."
  cd "${REPO_DIR}"
  git fetch origin
  git checkout main
  git reset --hard origin/main
  log "Code: $(git log --oneline -1)"
fi

# ── 5. Create .env ────────────────────────────────────────────────────────
ENV_FILE="${API_DIR}/.env"
if [ ! -f "${ENV_FILE}" ]; then
  info "Creating .env..."
  JWT_SECRET=$(openssl rand -hex 32)
  JWT_REFRESH=$(openssl rand -hex 32)

  cat > "${ENV_FILE}" <<EOF
NODE_ENV=production
PORT=7000
DATABASE_URL=${DB_URL}
REDIS_URL=redis://localhost:6379

JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH}

# ── Fill these in ─────────────────────────────────────────────
RESEND_API_KEY=re_CHANGEME
API_URL=https://api.pouchcare.com
ALLOWED_ORIGINS=https://pouchcare.com,https://m.pouchcare.com,https://office.pouchcare.com
PORTAL_URL=https://pouchcare.com

# Cloudflare R2 storage
S3_BUCKET=CHANGEME
S3_ENDPOINT=https://CHANGEME.r2.cloudflarestorage.com
S3_ACCESS_KEY=CHANGEME
S3_SECRET_KEY=CHANGEME

# Name.com domain API
NAMECOM_USERNAME=CHANGEME
NAMECOM_TOKEN=CHANGEME
NAMECOM_API_URL=https://api.name.com
EOF
  log ".env created at ${ENV_FILE} — EDIT the CHANGEME values!"
else
  log ".env already exists — skipping"
fi

# ── 6. Install deps + Prisma ──────────────────────────────────────────────
info "Installing root npm dependencies..."
cd "${REPO_DIR}"
npm install --legacy-peer-deps --silent

info "Generating Prisma client + running migrations..."
cd "${API_DIR}"
DATABASE_URL="${DB_URL}" npx prisma generate
DATABASE_URL="${DB_URL}" npx prisma migrate deploy
log "Database migrated"

# ── 7. Start API with PM2 ─────────────────────────────────────────────────
info "Starting API with PM2..."
cd "${REPO_DIR}"
pm2 delete pouchcare-api 2>/dev/null || true
pm2 start "${REPO_DIR}/ecosystem.config.js" --update-env
sleep 4

# health check
for i in 1 2 3 4 5; do
  if curl -sf http://localhost:7000/health > /dev/null 2>&1; then
    log "API healthy on http://localhost:7000"
    break
  fi
  echo "   Waiting for API... ($i/5)"
  sleep 3
done

pm2 save
pm2 startup 2>/dev/null | tail -1 | bash 2>/dev/null || warn "Run 'pm2 startup' manually if API doesn't survive reboots"

# ── 8. Create htdocs dirs ─────────────────────────────────────────────────
info "Creating htdocs directories..."
mkdir -p "${HTDOCS}/m.pouchcare.com"
mkdir -p "${HTDOCS}/office.pouchcare.com"
mkdir -p "${HTDOCS}/pouchcare.com"
log "htdocs ready"

# ── 9. Install Nginx configs ──────────────────────────────────────────────
info "Installing Nginx vhost configs..."
sudo cp "${REPO_DIR}/deploy/nginx/"*.conf /etc/nginx/sites-available/ 2>/dev/null || \
  sudo cp "${REPO_DIR}/deploy/nginx/"*.conf /etc/nginx/conf.d/ 2>/dev/null || \
  warn "Could not auto-copy nginx configs — copy deploy/nginx/*.conf manually"

# Create symlinks if sites-enabled exists
if [ -d /etc/nginx/sites-enabled ]; then
  for f in "${REPO_DIR}/deploy/nginx/"*.conf; do
    name=$(basename "$f")
    sudo ln -sf "/etc/nginx/sites-available/${name}" "/etc/nginx/sites-enabled/${name}" 2>/dev/null || true
  done
fi

sudo nginx -t && sudo nginx -s reload 2>/dev/null || sudo systemctl reload nginx 2>/dev/null || warn "Reload nginx manually after DNS update"
log "Nginx configured"

echo ""
echo -e "${GREEN}${BOLD}══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  Init Complete ✅  $(date '+%Y-%m-%d %H:%M')${NC}"
echo -e "${GREEN}${BOLD}══════════════════════════════════════════════════${NC}"
echo ""
echo "  Next steps:"
echo "  1. Edit ${ENV_FILE} and fill in CHANGEME values (Resend, R2, Name.com)"
echo "  2. Run 'pm2 restart pouchcare-api' after updating .env"
echo "  3. Point DNS: api.pouchcare.com → 161.97.133.179"
echo "  4. Point DNS: m.pouchcare.com   → 161.97.133.179"
echo "  5. Point DNS: office.pouchcare.com → 161.97.133.179"
echo "  6. Check API: https://api.pouchcare.com/health"
echo ""
