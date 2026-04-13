#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# PouchCare OS — Production Deployment Script
# ═══════════════════════════════════════════════════════════════════════════
#
# Server layout:
#   Repo:    /home/pouchcare/Developments/PouchCare/   ← git clone here
#   Builds:  /home/pouchcare/htdocs/pouchcare.com/     ← served by Nginx
#            /home/pouchcare/htdocs/m.pouchcare.com/
#            /home/pouchcare/htdocs/office.pouchcare.com/
#            (Client portal routes live on pouchcare.com — see apps/landing/docs/CLIENT_PORTAL_PAGES_PLAN.md)
#   API:     http://127.0.0.1:7000  (PM2 → Nginx reverse proxy)
#   DB:      PostgreSQL  name=pouchcare  user=pouchcare  pass=pouchcare
#
# IMPORTANT — private repo (GitLab: gitlab.com/Pouchcare/OS):
#   Option A (recommended): Add server SSH public key as a GitLab deploy key:
#     ssh-keygen -t ed25519 -C "pouchcare-server" -f ~/.ssh/id_ed25519 -N ""
#     cat ~/.ssh/id_ed25519.pub   → Project → Settings → Repository → Deploy keys
#   Option B: Personal Access Token (read_repository):
#     export GITLAB_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxx
#     sudo -E bash deploy.sh
#
# Usage:
#   sudo bash deploy.sh          (if SSH key is already configured)
#   sudo -E bash deploy.sh       (to pass GITLAB_TOKEN env var)
# ═══════════════════════════════════════════════════════════════════════════
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✅]${NC} $1"; }
warn() { echo -e "${YELLOW}[⚠️ ]${NC} $1"; }
info() { echo -e "${BLUE}[→]${NC}  $1"; }
fail() { echo -e "${RED}[❌]${NC} $1"; exit 1; }
step() {
  echo ""
  echo -e "${CYAN}${BOLD}══════════════════════════════════════════════════${NC}"
  echo -e "${CYAN}${BOLD}  $1${NC}"
  echo -e "${CYAN}${BOLD}══════════════════════════════════════════════════${NC}"
}

# ── Config ──────────────────────────────────────────────────────────────────
APP_USER="pouchcare"
DEV_DIR="/home/${APP_USER}/Developments"
REPO_DIR="${DEV_DIR}/PouchCare"
HTDOCS="/home/${APP_USER}/htdocs"
# GitLab project (SSH path uses : between group and project)
REPO_SSH="git@gitlab.com:Pouchcare/OS.git"
REPO_HTTPS="https://gitlab.com/Pouchcare/OS.git"

# Build repo URL: SSH if key exists, HTTPS+token if token set, HTTPS as fallback
SSH_KEY="/home/${APP_USER}/.ssh/id_ed25519"
if [ -f "${SSH_KEY}" ] || [ -f "/home/${APP_USER}/.ssh/id_rsa" ]; then
  REPO_URL="${REPO_SSH}"
  AUTH_METHOD="SSH"
elif [ -n "${GITLAB_TOKEN}" ]; then
  REPO_URL="https://oauth2:${GITLAB_TOKEN}@gitlab.com/Pouchcare/OS.git"
  AUTH_METHOD="token"
else
  REPO_URL="${REPO_HTTPS}"
  AUTH_METHOD="public/unauthenticated"
fi
API_DIR="${REPO_DIR}/apps/api"
API_PORT="7000"
DB_NAME="pouchcare"
DB_USER="pouchcare"
DB_PASS="pouchcare"
DB_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"

WEB_LANDING="${HTDOCS}/pouchcare.com"
WEB_MGMT="${HTDOCS}/m.pouchcare.com"
WEB_OFFICE="${HTDOCS}/office.pouchcare.com"

NGINX_CONF="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

echo -e "${CYAN}${BOLD}"
echo "  ╔══════════════════════════════════════════════════╗"
echo "  ║        PouchCare OS — Full Deploy                ║"
echo "  ╚══════════════════════════════════════════════════╝"
echo -e "${NC}"
echo "  Repo:    ${REPO_DIR}"
echo "  Builds:  ${HTDOCS}/{domain}"
echo "  API:     http://127.0.0.1:${API_PORT}"
echo "  DB:      ${DB_NAME} / ${DB_USER}"
echo "  Git:     ${AUTH_METHOD}"
echo ""

# ── Step 1: System Packages ─────────────────────────────────────────────────
step "1/9  System Packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq \
  curl git build-essential nginx \
  certbot python3-certbot-nginx \
  postgresql redis-server ufw acl

# Node.js 20
if ! command -v node &>/dev/null; then
  info "Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
elif node -e "process.exit(parseInt(process.version.slice(1)) < 20 ? 1 : 0)" 2>/dev/null; then
  log "Node.js $(node -v) already installed"
else
  info "Upgrading to Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

npm install -g pm2 2>/dev/null
log "Node $(node -v)  npm $(npm -v)  pm2 $(pm2 -v)"

# ── Step 2: PostgreSQL ──────────────────────────────────────────────────────
step "2/9  PostgreSQL"
systemctl enable postgresql && systemctl start postgresql
sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';" 2>/dev/null || warn "User already exists"
sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" 2>/dev/null || warn "DB already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};" 2>/dev/null
sudo -u postgres psql -c "ALTER USER ${DB_USER} CREATEDB;" 2>/dev/null
log "PostgreSQL ready — ${DB_NAME}"

# ── Step 3: Redis ───────────────────────────────────────────────────────────
step "3/9  Redis"
systemctl enable redis-server && systemctl start redis-server
redis-cli ping | grep -q PONG && log "Redis running" || fail "Redis failed to start"

# ── Step 4: Directories ─────────────────────────────────────────────────────
step "4/9  Directories"
id ${APP_USER} &>/dev/null || useradd -m -s /bin/bash ${APP_USER}
mkdir -p "${HTDOCS}"
mkdir -p "${WEB_LANDING}" "${WEB_MGMT}" "${WEB_OFFICE}"
mkdir -p "${DEV_DIR}" "/home/${APP_USER}/logs"
chown -R ${APP_USER}:${APP_USER} "/home/${APP_USER}"
log "Directories ready under ${HTDOCS}"

# ── Step 5: SSH key setup (if not present) ──────────────────────────────────
step "5/9  Repository"

if [ "${AUTH_METHOD}" = "public/unauthenticated" ]; then
  warn "No SSH key and no GITLAB_TOKEN found."
  warn "Attempting clone as public — this will fail if repo is private."
  warn "To fix: run   ssh-keygen -t ed25519 -C 'pouchcare' -f /home/${APP_USER}/.ssh/id_ed25519 -N ''"
  warn "        then  cat /home/${APP_USER}/.ssh/id_ed25519.pub   → GitLab Project → Deploy keys"
  warn "        then  re-run this script"
  echo ""
elif [ "${AUTH_METHOD}" = "SSH" ]; then
  # Make sure SSH knows gitlab.com
  sudo -u ${APP_USER} bash -c "
    mkdir -p ~/.ssh
    chmod 700 ~/.ssh
    ssh-keyscan -t ed25519 gitlab.com >> ~/.ssh/known_hosts 2>/dev/null
    sort -u ~/.ssh/known_hosts -o ~/.ssh/known_hosts
  "
  log "SSH key ready (${AUTH_METHOD})"
fi

# Clone or pull
info "Using: ${REPO_URL}"
if [ -d "${REPO_DIR}/.git" ]; then
  info "Repo exists — pulling latest main..."
  sudo -u ${APP_USER} bash -c "
    cd ${REPO_DIR}
    git remote set-url origin '${REPO_URL}'
    git fetch origin
    git checkout main
    git reset --hard origin/main
  "
else
  info "Cloning repository..."
  sudo -u ${APP_USER} git clone --branch main "${REPO_URL}" "${REPO_DIR}"
fi
log "Repo ready: $(cd ${REPO_DIR} && git log --oneline -1)"

# ── Step 6: API ─────────────────────────────────────────────────────────────
step "6/9  API"

cd "${API_DIR}"

# Write .env (generates fresh JWT secrets every deploy)
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH=$(openssl rand -hex 32)

cat > .env << ENVEOF
NODE_ENV=production
PORT=${API_PORT}
DATABASE_URL=${DB_URL}
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH}
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
RESEND_API_KEY=
EMAIL_FROM=hello@pouchcare.com
FRONTEND_URL=https://m.pouchcare.com
IP_WHITELIST_ENABLED=false
COMMISSION_RATE=0.20
COMMISSION_HOLD_DAYS=14
MIN_PAYOUT_USD=50
PORTAL_URL=https://pouchcare.com
ENVEOF
chown ${APP_USER}:${APP_USER} .env
chmod 600 .env
log "API .env written (fresh JWT secrets)"

# Install, generate, migrate
sudo -u ${APP_USER} npm install --legacy-peer-deps
sudo -u ${APP_USER} DATABASE_URL="${DB_URL}" npx prisma generate
sudo -u ${APP_USER} DATABASE_URL="${DB_URL}" npx prisma migrate deploy

# Seed if empty
STAFF_COUNT=$(sudo -u postgres psql -d ${DB_NAME} -t -c "SELECT COUNT(*) FROM staff_members;" 2>/dev/null | tr -d ' \n' || echo "0")
if [ "${STAFF_COUNT}" = "0" ] || [ -z "${STAFF_COUNT}" ]; then
  info "Seeding database..."
  sudo -u ${APP_USER} DATABASE_URL="${DB_URL}" npx tsx prisma/seed.ts
  log "Database seeded — ceo@pouchcare.com / Password123!"
else
  info "DB has ${STAFF_COUNT} staff members — skipping seed"
fi

# Compile TypeScript
sudo -u ${APP_USER} npx tsc
log "API compiled to dist/"

# ── Step 7: Frontends ────────────────────────────────────────────────────────
step "7/9  Frontend Builds"

build_app() {
  local NAME=$1 SRC=$2 OUT=$3
  info "Building ${NAME}..."
  cd "${REPO_DIR}/${SRC}"
  echo "VITE_API_URL=https://api.pouchcare.com/v1" > .env.local
  chown ${APP_USER}:${APP_USER} .env.local
  sudo -u ${APP_USER} npm install --legacy-peer-deps
  sudo -u ${APP_USER} npm run build
  rm -rf "${OUT}"
  cp -r dist/. "${OUT}/"
  chown -R ${APP_USER}:${APP_USER} "${OUT}"
  log "${NAME} → ${OUT}"
}

build_app "Landing (marketing + client portal routes)" "apps/landing" "${WEB_LANDING}"
build_app "Management Portal" "apps/management"   "${WEB_MGMT}"
build_app "Staff Office"      "apps/office"        "${WEB_OFFICE}"

# ── Step 8: PM2 ─────────────────────────────────────────────────────────────
step "8/9  PM2 + Nginx"

# Write PM2 ecosystem with correct paths
cat > "${REPO_DIR}/ecosystem.config.js" << PM2EOF
module.exports = {
  apps: [{
    name:        'pouchcare-api',
    script:      'src/server.ts',
    cwd:         '/home/pouchcare/Developments/PouchCare/apps/api',
    interpreter: 'node',
    interpreter_args: '--import tsx',
    exec_mode:   'fork',
    instances:   1,
    autorestart: true,
    watch:       false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: '7000',
    },
    out_file:   '/home/pouchcare/logs/api-out.log',
    error_file: '/home/pouchcare/logs/api-err.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }]
}
PM2EOF
chown ${APP_USER}:${APP_USER} "${REPO_DIR}/ecosystem.config.js"

pm2 delete pouchcare-api 2>/dev/null || true
pm2 start "${REPO_DIR}/ecosystem.config.js"
pm2 save
pm2 startup systemd -u ${APP_USER} --hp "/home/${APP_USER}" 2>/dev/null | tail -1 | bash 2>/dev/null || true

sleep 4
if curl -sf http://127.0.0.1:${API_PORT}/health > /dev/null; then
  log "API live at http://127.0.0.1:${API_PORT}"
else
  warn "API not responding yet — check: pm2 logs pouchcare-api"
fi

# ── Nginx ────────────────────────────────────────────────────────────────────
write_spa_conf() {
  local DOMAIN=$1 ROOT=$2
  cat > "${NGINX_CONF}/${DOMAIN}" << NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};
    root ${ROOT};
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
}
NGINX
  ln -sf "${NGINX_CONF}/${DOMAIN}" "${NGINX_ENABLED}/${DOMAIN}"
  log "Nginx: ${DOMAIN} → ${ROOT}"
}

cat > "${NGINX_CONF}/api.pouchcare.com" << NGINX
server {
    listen 80;
    listen [::]:80;
    server_name api.pouchcare.com;

    client_max_body_size 10m;

    location / {
        proxy_pass         http://127.0.0.1:${API_PORT};
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60;
        proxy_connect_timeout 10;
    }
}
NGINX
ln -sf "${NGINX_CONF}/api.pouchcare.com" "${NGINX_ENABLED}/api.pouchcare.com"
log "Nginx: api.pouchcare.com → http://127.0.0.1:${API_PORT}"

write_spa_conf "pouchcare.com"         "${WEB_LANDING}"
write_spa_conf "m.pouchcare.com"       "${WEB_MGMT}"
write_spa_conf "office.pouchcare.com"  "${WEB_OFFICE}"

rm -f "${NGINX_ENABLED}/default"
nginx -t && systemctl reload nginx
log "Nginx configured and reloaded"

# ── Step 9: SSL ─────────────────────────────────────────────────────────────
step "9/9  SSL Certificates"

SERVER_IP=$(curl -s --max-time 5 ifconfig.me 2>/dev/null || echo "unknown")
info "Server IP: ${SERVER_IP}"
info "DNS must point all production domains → ${SERVER_IP} before SSL will work"

certbot --nginx \
  -d pouchcare.com -d www.pouchcare.com \
  -d m.pouchcare.com \
  -d office.pouchcare.com \
  -d api.pouchcare.com \
  --non-interactive --agree-tos \
  --email ssl@pouchcare.com \
  --redirect 2>/dev/null \
  && log "SSL certificates installed" \
  || warn "SSL skipped — run after DNS is pointed to ${SERVER_IP}:
    certbot --nginx -d pouchcare.com -d www.pouchcare.com -d m.pouchcare.com -d office.pouchcare.com -d api.pouchcare.com --non-interactive --agree-tos --email ssl@pouchcare.com --redirect"

systemctl enable certbot.timer 2>/dev/null || true

# ── Summary ─────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}"
echo "  ╔══════════════════════════════════════════════════════════╗"
echo "  ║          PouchCare OS — Deploy Complete! 🎉              ║"
echo "  ╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"
API_STATUS=$(curl -sf http://127.0.0.1:${API_PORT}/health 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])" 2>/dev/null || echo "check pm2 logs")
echo -e "  ${CYAN}API health:${NC}   ${API_STATUS}"
echo -e "  ${CYAN}Repo:${NC}         ${REPO_DIR}"
echo ""
echo -e "  ${CYAN}Sites:${NC}"
echo "    https://pouchcare.com              (Landing + client portal — see apps/landing/docs/CLIENT_PORTAL_PAGES_PLAN.md)"
echo "    https://m.pouchcare.com            (Management — CEO/Co-MD/Ops)"
echo "    https://office.pouchcare.com       (Staff Office)"
echo "    https://api.pouchcare.com/health   (API)"
echo ""
echo -e "  ${CYAN}Seed credentials  (password: Password123!)${NC}"
echo "    ceo@pouchcare.com      →  m.pouchcare.com"
echo "    staff1@pouchcare.com   →  office.pouchcare.com"
echo "    client@example.com     →  pouchcare.com (portal routes under /my-accounts, /dashboard)"
echo ""
echo -e "  ${CYAN}Server commands:${NC}"
echo "    pm2 status                      — API process"
echo "    pm2 logs pouchcare-api          — live logs"
echo "    bash ${REPO_DIR}/status.sh      — full health check"
echo "    sudo bash ${REPO_DIR}/deploy/update.sh  — redeploy"
echo ""
