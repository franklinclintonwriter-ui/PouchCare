#!/usr/bin/env bash
# PouchCare — auto-deploy the live API from GitHub (branch: main).
#
# Polled every ~60s by the pouchcare-deploy.timer systemd user unit.
# Keeps a clean checkout of origin/main in ~/.pouchcare/live and restarts
# the pouchcare-api user service whenever main changes.
#
# The dev workspace (~/Desktop/PouchCare/PouchCare) is never touched.
set -euo pipefail

REPO_URL="https://github.com/franklinclintonwriter-ui/PouchCare.git"
BRANCH="main"
LIVE="$HOME/.pouchcare/live"
# Source for the gitignored API .env (copied into the live checkout once).
ENV_SRC="/home/franklin/Desktop/PouchCare/PouchCare/apps/api/.env"

log() { echo "[deploy $(date -Is)] $*"; }

mkdir -p "$HOME/.pouchcare"

CHANGED=0
if [ ! -d "$LIVE/.git" ]; then
  log "cloning $BRANCH into $LIVE"
  git clone --branch "$BRANCH" --single-branch "$REPO_URL" "$LIVE"
  CHANGED=1
else
  git -C "$LIVE" fetch --quiet origin "$BRANCH"
  LOCAL="$(git -C "$LIVE" rev-parse HEAD)"
  REMOTE="$(git -C "$LIVE" rev-parse "origin/$BRANCH")"
  if [ "$LOCAL" != "$REMOTE" ]; then
    log "update ${LOCAL:0:7} -> ${REMOTE:0:7}"
    git -C "$LIVE" reset --hard "origin/$BRANCH"
    CHANGED=1
  fi
fi

# Ensure the live checkout has the API env (gitignored, so pulls never touch it).
if [ ! -f "$LIVE/apps/api/.env" ] && [ -f "$ENV_SRC" ]; then
  cp "$ENV_SRC" "$LIVE/apps/api/.env"
  log "seeded apps/api/.env from dev workspace"
fi

if [ "$CHANGED" = "0" ]; then
  log "no changes"
  exit 0
fi

cd "$LIVE"

# Reinstall deps only when the lockfile changed (fast path otherwise).
LOCK_HASH_FILE="$HOME/.pouchcare/.lockhash"
NEW_HASH="$( (sha256sum package-lock.json 2>/dev/null || echo none) | awk '{print $1}')"
OLD_HASH="$(cat "$LOCK_HASH_FILE" 2>/dev/null || echo '')"
if [ "$NEW_HASH" != "$OLD_HASH" ]; then
  log "npm install (lockfile changed)"
  npm install --no-audit --no-fund --legacy-peer-deps
  echo "$NEW_HASH" > "$LOCK_HASH_FILE"
else
  log "deps unchanged, skipping npm install"
fi

# Prisma: regenerate client and apply any new migrations.
( cd apps/api && npx prisma generate >/dev/null 2>&1 && npx prisma migrate deploy ) \
  || log "WARN prisma generate/migrate reported an issue"

# Restart the live API (same user bus — no sudo needed).
if systemctl --user list-unit-files 2>/dev/null | grep -q '^pouchcare-api.service'; then
  log "restarting pouchcare-api"
  systemctl --user restart pouchcare-api
fi

log "deploy complete at ${REMOTE:0:7}"
