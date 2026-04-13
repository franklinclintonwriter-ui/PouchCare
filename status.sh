#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# PouchCare OS — Service Status & Health Check
# Run from anywhere: bash /home/pouchcare/Developments/PouchCare/status.sh
# ═══════════════════════════════════════════════════════════════

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           PouchCare OS — Service Status                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# PostgreSQL
echo "🗄️  PostgreSQL:"
if sudo systemctl is-active --quiet postgresql; then
  echo "   ✅ Running"
  COUNT=$(sudo -u postgres psql pouchcare -t -c "SELECT COUNT(*) FROM staff_members;" 2>/dev/null | tr -d ' ' || echo "?")
  echo "   📊 Staff members: $COUNT"
else
  echo "   ❌ Not running — sudo systemctl start postgresql"
fi
echo ""

# Redis
echo "🔴 Redis:"
if redis-cli ping 2>/dev/null | grep -q PONG; then
  echo "   ✅ Running"
else
  echo "   ❌ Not running — sudo systemctl start redis-server"
fi
echo ""

# API (PM2)
echo "🔧 API (port 7000):"
if pm2 list 2>/dev/null | grep -q "pouchcare-api"; then
  STATUS=$(pm2 list 2>/dev/null | grep "pouchcare-api" | awk '{print $NF}')
  echo "   ✅ PM2 process: $STATUS"
  if curl -sf http://127.0.0.1:7000/health > /dev/null 2>&1; then
    HEALTH=$(curl -sf http://127.0.0.1:7000/health | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['status'])" 2>/dev/null)
    echo "   ✅ Health: $HEALTH"
  else
    echo "   ⚠️  Not responding — pm2 logs pouchcare-api"
  fi
else
  echo "   ❌ Not running — pm2 start /home/pouchcare/Developments/PouchCare/ecosystem.config.js"
fi
echo ""

# Nginx
echo "🌐 Nginx:"
if sudo systemctl is-active --quiet nginx; then
  echo "   ✅ Running"
  echo "   📍 Serving:"
  echo "      pouchcare.com              → /home/pouchcare/htdocs/pouchcare.com/"
  echo "      m.pouchcare.com            → /home/pouchcare/htdocs/m.pouchcare.com/"
  echo "      office.pouchcare.com       → /home/pouchcare/htdocs/office.pouchcare.com/"
  echo "      api.pouchcare.com          → http://127.0.0.1:7000"
else
  echo "   ❌ Not running — sudo systemctl start nginx"
fi
echo ""

# Build sizes
echo "📦 Build sizes:"
for DIR in pouchcare.com m.pouchcare.com office.pouchcare.com; do
  PATH="/home/pouchcare/htdocs/$DIR"
  if [ -d "$PATH" ]; then
    SIZE=$(du -sh "$PATH" 2>/dev/null | cut -f1)
    echo "   $DIR: $SIZE"
  else
    echo "   $DIR: ⚠️  Not built yet"
  fi
done
echo ""

# Git status
echo "📁 Repo (/home/pouchcare/Developments/PouchCare):"
if [ -d "/home/pouchcare/Developments/PouchCare/.git" ]; then
  cd /home/pouchcare/Developments/PouchCare
  BRANCH=$(git branch --show-current)
  COMMIT=$(git log --oneline -1)
  echo "   Branch: $BRANCH"
  echo "   Latest: $COMMIT"
else
  echo "   ⚠️  Repo not found — run deploy.sh first"
fi
echo ""

echo "══════════════════════════════════════════════════════════════"
echo "  Quick commands:"
echo "  pm2 logs pouchcare-api           — live API logs"
echo "  pm2 restart pouchcare-api        — restart API"
echo "  sudo nginx -t && nginx -s reload — reload Nginx"
echo "  sudo bash /home/pouchcare/Developments/PouchCare/deploy/update.sh  — update"
echo "══════════════════════════════════════════════════════════════"
echo ""
