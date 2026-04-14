# PouchCare — One-Command Server Setup

Run **one command** on your server at `72.60.204.92` to configure everything for auto-deployment from GitLab.

## What This Does

1. Creates the `pouchcare` user
2. Adds the GitLab CI deploy key to `authorized_keys`
3. Configures sudo for password-less deploy
4. Generates a server SSH key and prints it (you add it to GitLab Deploy Keys)
5. Clones the repo
6. Optionally runs `deploy.sh` to install everything (Node, PostgreSQL, Nginx, PM2)

## Run This on Your Server

SSH into your server:

```bash
ssh root@72.60.204.92
```

Then paste this entire block (copy everything between the lines and paste as one chunk):

```bash
bash <<'BOOTSTRAP'
set -e

echo "═══════════════════════════════════════════════════════════"
echo "  PouchCare Server Bootstrap"
echo "═══════════════════════════════════════════════════════════"

# 1. Create pouchcare user if missing
if ! id pouchcare &>/dev/null; then
  adduser --disabled-password --gecos "" pouchcare
  usermod -aG sudo pouchcare
  echo "✓ Created user: pouchcare"
else
  echo "✓ User pouchcare already exists"
fi

# 2. Create required directories
sudo -u pouchcare mkdir -p /home/pouchcare/Developments /home/pouchcare/htdocs /home/pouchcare/logs /home/pouchcare/backups /home/pouchcare/.ssh
chmod 700 /home/pouchcare/.ssh

# 3. Add GitLab CI deploy public key to authorized_keys
GITLAB_CI_PUB_KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIAeiGwR4N6yaipechp8xN9Je5r7u8Uip3+4paTDxyjtN gitlab-ci-deploy-72.60.204.92"
if ! grep -qF "$GITLAB_CI_PUB_KEY" /home/pouchcare/.ssh/authorized_keys 2>/dev/null; then
  echo "$GITLAB_CI_PUB_KEY" >> /home/pouchcare/.ssh/authorized_keys
  echo "✓ Added GitLab CI public key"
else
  echo "✓ GitLab CI key already present"
fi
chown -R pouchcare:pouchcare /home/pouchcare/.ssh
chmod 600 /home/pouchcare/.ssh/authorized_keys

# 4. Configure sudo for password-less deploy
cat > /etc/sudoers.d/pouchcare-deploy <<'EOF'
pouchcare ALL=(ALL) NOPASSWD: /bin/bash /home/pouchcare/Developments/PouchCare/deploy/update.sh
pouchcare ALL=(ALL) NOPASSWD: /bin/bash deploy/update.sh
EOF
chmod 440 /etc/sudoers.d/pouchcare-deploy
echo "✓ Configured sudoers for password-less deploy"

# 5. Generate server SSH key for pulling from GitLab (if not exists)
if [ ! -f /home/pouchcare/.ssh/id_ed25519 ]; then
  sudo -u pouchcare ssh-keygen -t ed25519 -C "pouchcare-server-72.60.204.92" \
    -f /home/pouchcare/.ssh/id_ed25519 -N "" -q
  echo "✓ Generated server SSH key"
else
  echo "✓ Server SSH key already exists"
fi

# 6. Pre-add gitlab.com host key
sudo -u pouchcare bash -c 'ssh-keyscan -H gitlab.com >> /home/pouchcare/.ssh/known_hosts 2>/dev/null'
sudo -u pouchcare bash -c 'sort -u /home/pouchcare/.ssh/known_hosts -o /home/pouchcare/.ssh/known_hosts'

# 7. Print the server's SSH public key (for GitLab Deploy Keys)
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  STEP 1 — ADD THIS KEY TO GITLAB DEPLOY KEYS"
echo "═══════════════════════════════════════════════════════════"
echo "URL: https://gitlab.com/Pouchcare/OS/-/settings/repository"
echo "Expand 'Deploy keys' → 'Add new key' → Title: 'Production Server'"
echo "Paste this EXACT line (NO need to check 'write permissions'):"
echo ""
echo "────────────── COPY FROM HERE ──────────────"
cat /home/pouchcare/.ssh/id_ed25519.pub
echo "──────────────── TO HERE ───────────────────"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  NEXT STEPS (after adding the deploy key above to GitLab)"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Run these commands (one at a time):"
echo ""
echo "  # Test GitLab SSH access"
echo "  sudo -u pouchcare ssh -T -o StrictHostKeyChecking=no git@gitlab.com"
echo ""
echo "  # Clone the repo"
echo "  sudo -u pouchcare git clone git@gitlab.com:Pouchcare/OS.git /home/pouchcare/Developments/PouchCare"
echo ""
echo "  # Run the full bootstrap (installs Node, Postgres, Nginx, PM2; builds apps; starts everything)"
echo "  sudo bash /home/pouchcare/Developments/PouchCare/deploy.sh"
echo ""
echo "Bootstrap preparation complete ✅"
BOOTSTRAP
```

---

## After Running the Bootstrap

### Step 1 — Add the server's SSH key to GitLab Deploy Keys

The script above will print a key line starting with `ssh-ed25519`. Copy it and add it to:

**https://gitlab.com/Pouchcare/OS/-/settings/repository** → "Deploy keys" → "Add new key"

- Title: `Production Server`
- Key: (paste the line)
- Write permissions: **NO** (leave unchecked)

### Step 2 — On the server, test SSH + clone + bootstrap

```bash
# Test that GitLab accepts our key
sudo -u pouchcare ssh -T -o StrictHostKeyChecking=no git@gitlab.com
# Expect: "Welcome to GitLab, @Pouchcare!"

# Clone the repo
sudo -u pouchcare git clone git@gitlab.com:Pouchcare/OS.git /home/pouchcare/Developments/PouchCare

# Run the installer (10-15 minutes — installs everything)
sudo bash /home/pouchcare/Developments/PouchCare/deploy.sh
```

### Step 3 — Configure `.env` file

```bash
sudo nano /home/pouchcare/Developments/PouchCare/apps/api/.env
```

Fill in the required values (JWT secrets, DB, R2 storage, etc.) — see `SERVER_SETUP_GUIDE.md` for the full list.

Then restart:
```bash
pm2 restart pouchcare-api
pm2 save
```

### Step 4 — Add GitLab CI/CD Variables

Go to: **https://gitlab.com/Pouchcare/OS/-/settings/ci_cd** → Variables → Add variable

Add these three:

| Key | Value | Type | Protect | Mask |
|-----|-------|------|---------|------|
| `SSH_PRIVATE_KEY` | *(see below)* | File | ✅ Yes | ❌ No |
| `DEPLOY_HOST` | `72.60.204.92` | Variable | ✅ Yes | ❌ No |
| `DEPLOY_USER` | `pouchcare` | Variable | ✅ Yes | ❌ No |

**Value for `SSH_PRIVATE_KEY` (paste EXACTLY, including the BEGIN/END lines):**

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACAHohsEeDesmoqXnIafMTfSXua+7vFIqd/uKWkw8co7TQAAAKDHNMh1xzTI
dQAAAAtzc2gtZWQyNTUxOQAAACAHohsEeDesmoqXnIafMTfSXua+7vFIqd/uKWkw8co7TQ
AAAEDf5pIbU0Zh6v2nOUq7mEszpKuwyBOpouWgrxZBbZoNgweiGwR4N6yaipechp8xN9Je
5r7u8Uip3+4paTDxyjtNAAAAHWdpdGxhYi1jaS1kZXBsb3ktNzIuNjAuMjA0Ljky
-----END OPENSSH PRIVATE KEY-----
```

### Step 5 — Test auto-deploy

Make a small change locally and push:

```bash
git commit --allow-empty -m "test: trigger auto-deploy"
git push origin main
```

Watch the pipeline run at **https://gitlab.com/Pouchcare/OS/-/pipelines** — when the `deploy:production` stage finishes, your API is updated.

---

## How It Works (Once Set Up)

```
┌─────────────────────┐
│  You push to main   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  GitLab CI Pipeline (auto)              │
│  1. verify  — TypeScript, ESLint        │
│  2. build   — Builds all 3 apps         │
│  3. deploy  — SSH into 72.60.204.92     │
│              → runs deploy/update.sh    │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  Server: 72.60.204.92                   │
│  1. git pull origin main                │
│  2. pg_dump → backup                    │
│  3. prisma migrate deploy               │
│  4. tsc compile API                     │
│  5. pm2 restart pouchcare-api           │
│  6. npm run build (landing + mgmt)      │
│  7. nginx -s reload                     │
└─────────────────────────────────────────┘
```

Total time per deploy: ~3 minutes.

---

## Verify Everything After Setup

```bash
# On your server
curl https://api.pouchcare.com/health
# Expect: {"status":"ok", "ts":"..."}

pm2 status
# Expect: pouchcare-api | online | 2 instances

sudo nginx -t
# Expect: syntax is ok, test is successful

sudo systemctl status postgresql nginx
# Both should be "active (running)"
```

If something fails, check:
- `pm2 logs pouchcare-api --lines 50`
- `sudo tail -50 /var/log/nginx/error.log`
- GitLab pipeline logs at https://gitlab.com/Pouchcare/OS/-/pipelines
