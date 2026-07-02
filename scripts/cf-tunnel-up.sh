#!/usr/bin/env bash
# PouchCare — install cloudflared (if needed) and run the tunnel on Linux/macOS.
#
# Reads TUNNEL_TOKEN from the repo-root .env (written by scripts/cf-tunnel-setup.mjs).
# Runs the remote-managed tunnel so the DNS hostnames route to your local apps.
#
# Usage (repo root):
#   bash scripts/cf-tunnel-up.sh
#   npm run tunnel:up
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/.env"

# ── Load TUNNEL_TOKEN ─────────────────────────────────────────────────────────
if [[ -z "${TUNNEL_TOKEN:-}" ]]; then
  if [[ -f "$ENV_FILE" ]]; then
    TUNNEL_TOKEN="$(grep -E '^TUNNEL_TOKEN=' "$ENV_FILE" | tail -n1 | cut -d= -f2-)"
  fi
fi
if [[ -z "${TUNNEL_TOKEN:-}" ]]; then
  echo "TUNNEL_TOKEN not found. Run 'npm run tunnel:setup' first." >&2
  exit 1
fi

# ── Install cloudflared if missing ────────────────────────────────────────────
if ! command -v cloudflared >/dev/null 2>&1; then
  echo "cloudflared not found — installing..."
  OS="$(uname -s)"
  ARCH="$(uname -m)"
  if [[ "$OS" == "Darwin" ]]; then
    if command -v brew >/dev/null 2>&1; then
      brew install cloudflared
    else
      echo "Install Homebrew or cloudflared manually: https://developers.cloudflare.com/cloudflared/install" >&2
      exit 1
    fi
  else
    case "$ARCH" in
      x86_64|amd64) CF_ARCH="amd64" ;;
      aarch64|arm64) CF_ARCH="arm64" ;;
      armv7l) CF_ARCH="arm" ;;
      *) echo "Unsupported arch: $ARCH" >&2; exit 1 ;;
    esac
    URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${CF_ARCH}"
    TMP="$(mktemp)"
    echo "Downloading $URL"
    curl -fsSL "$URL" -o "$TMP"
    chmod +x "$TMP"
    # Prefer /usr/local/bin; fall back to ~/.local/bin without sudo
    if [[ -w /usr/local/bin ]] || sudo -n true 2>/dev/null; then
      sudo mv "$TMP" /usr/local/bin/cloudflared
    else
      mkdir -p "$HOME/.local/bin"
      mv "$TMP" "$HOME/.local/bin/cloudflared"
      export PATH="$HOME/.local/bin:$PATH"
      echo "Installed to ~/.local/bin (ensure it is on your PATH)."
    fi
  fi
  echo "cloudflared installed: $(cloudflared --version)"
fi

# ── Derive a credentials file + local ingress config ──────────────────────────
# The tunnel-scoped "cfut_" API token cannot set the tunnel's Public Hostnames
# via the dashboard API, so we run with a LOCAL config that defines ingress.
# The run token embeds the tunnel secret; we convert it to a credentials file.
CONFIG_FILE="$ROOT/deploy/cloudflared/config.native.yml"
CRED_DIR="$HOME/.cloudflared"
mkdir -p "$CRED_DIR"

TUNNEL_ID="$(node -e 'const j=JSON.parse(Buffer.from(process.argv[1],"base64").toString());const fs=require("fs"),os=require("os"),path=require("path");const p=path.join(os.homedir(),".cloudflared",j.t+".json");fs.writeFileSync(p,JSON.stringify({AccountTag:j.a,TunnelID:j.t,TunnelSecret:j.s}));fs.chmodSync(p,0o600);process.stdout.write(j.t);' "$TUNNEL_TOKEN")"
echo "Credentials ready for tunnel $TUNNEL_ID"

# ── Run the tunnel ────────────────────────────────────────────────────────────
# Pass  --service  (or set INSTALL_SERVICE=1) to install cloudflared as a
# systemd service that auto-starts on boot instead of running in the foreground.
if [[ "${1:-}" == "--service" || "${INSTALL_SERVICE:-}" == "1" ]]; then
  echo "Installing cloudflared as a systemd service (auto-start on boot)..."
  CF_BIN="$(command -v cloudflared)"
  sudo systemctl stop cloudflared 2>/dev/null || true
  sudo tee /etc/systemd/system/cloudflared.service >/dev/null <<UNIT
[Unit]
Description=PouchCare Cloudflare Tunnel (API)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$USER
ExecStart=$CF_BIN tunnel --no-autoupdate --config $CONFIG_FILE run
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT
  sudo systemctl daemon-reload
  sudo systemctl enable --now cloudflared
  echo
  echo "Service status:"
  systemctl --no-pager --full status cloudflared | head -n 12 || true
  echo
  echo "Logs:   journalctl -u cloudflared -f"
  echo "Stop:   sudo systemctl stop cloudflared"
  exit 0
fi

echo "Starting Cloudflare tunnel (Ctrl+C to stop)..."
echo "Tip: run 'npm run tunnel:up -- --service' to install it as a boot service."
exec cloudflared tunnel --no-autoupdate --config "$CONFIG_FILE" run
