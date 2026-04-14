# PouchCare — Server & GitLab CI/CD Setup Guide

This guide walks you through setting up your production server so GitLab automatically deploys your code whenever you push to `main`.

## Overview of What Will Happen

1. **On your server** — You generate an SSH key, add it to GitLab as a Deploy Key so the server can `git pull`
2. **On GitLab** — You add the server's SSH details as CI/CD Variables so the GitLab runner can SSH into your server
3. **After setup** — Every push to `main` runs the pipeline: verify → build → (manual click) → deploy to server

---

## Part 1 — Server: Initial Setup (one-time)

SSH into your production server as `root` or a sudo user, then follow these steps.

### 1.1 Create the app user

```bash
# Create dedicated user for running the app (non-root for security)
sudo adduser --disabled-password --gecos "" pouchcare
sudo usermod -aG sudo pouchcare

# Switch to the pouchcare user
sudo su - pouchcare

# Create directories
mkdir -p ~/Developments ~/htdocs ~/logs ~/backups
```

### 1.2 Generate SSH key for the server (to pull from GitLab)

```bash
# Still as pouchcare user
ssh-keygen -t ed25519 -C "pouchcare-server" -f ~/.ssh/id_ed25519 -N ""

# Print the PUBLIC key — copy the entire output
cat ~/.ssh/id_ed25519.pub
```

### 1.3 Add server's public key to GitLab as a Deploy Key

1. Go to: **https://gitlab.com/Pouchcare/OS/-/settings/repository**
2. Expand the **"Deploy keys"** section
3. Click **"Add new key"**
4. Paste the public key from step 1.2
5. Title: `Production Server`
6. **Do NOT check "Grant write permissions"** (read-only is safer)
7. Click **"Add key"**

### 1.4 Clone the repo on the server

```bash
# Still as pouchcare user
cd ~/Developments
ssh -o StrictHostKeyChecking=no -T git@gitlab.com  # accept host key
git clone git@gitlab.com:Pouchcare/OS.git PouchCare
cd PouchCare
```

### 1.5 Run the bootstrap deploy script

```bash
# Switch back to sudo user (deploy.sh needs root to install system packages)
exit  # exit out of pouchcare user
sudo bash /home/pouchcare/Developments/PouchCare/deploy.sh
```

This script installs Node.js 20, PostgreSQL, Nginx, PM2, runs migrations, seeds the database, builds all 3 apps, and starts everything. It takes about 10–15 minutes.

### 1.6 Configure environment variables

```bash
# Edit the API production environment
sudo nano /home/pouchcare/Developments/PouchCare/apps/api/.env
```

Set these critical variables:

```ini
DATABASE_URL=postgresql://pouchcare:pouchcare@localhost:5432/pouchcare
REDIS_URL=redis://localhost:6379
JWT_SECRET=<generate with: openssl rand -hex 64>
JWT_REFRESH_SECRET=<generate with: openssl rand -hex 64>
BCRYPT_ROUNDS=12
RESEND_API_KEY=<your Resend API key>
S3_BUCKET=<your R2 bucket name>
S3_ENDPOINT=<your R2 endpoint URL>
S3_ACCESS_KEY=<your R2 access key>
S3_SECRET_KEY=<your R2 secret key>
ALLOWED_ORIGINS=https://pouchcare.com,https://m.pouchcare.com,https://office.pouchcare.com
FRONTEND_URL=https://pouchcare.com
API_URL=https://api.pouchcare.com
NODE_ENV=production
PORT=7000
```

Restart the API after editing:

```bash
pm2 restart pouchcare-api
pm2 save
```

### 1.7 Verify everything is running

```bash
# Check API health
curl http://localhost:7000/health
# Expected: {"status":"ok",...}

# Check PM2 status
pm2 status

# Check Nginx
sudo nginx -t && sudo systemctl status nginx

# Check PostgreSQL
sudo systemctl status postgresql
```

Visit your domains in a browser:
- https://api.pouchcare.com/health → should return JSON
- https://pouchcare.com → landing page
- https://m.pouchcare.com → management dashboard login

---

## Part 2 — GitLab CI/CD: Deploy Key Setup (one-time)

This lets GitLab's CI runner SSH into your server to trigger a deploy.

### 2.1 Generate a deploy SSH key pair (on your local machine or server)

```bash
# On your server, as pouchcare user
ssh-keygen -t ed25519 -C "gitlab-ci-deploy" -f ~/gitlab-ci-deploy -N ""

# Show both keys
echo "=== PUBLIC KEY (add to server's authorized_keys) ==="
cat ~/gitlab-ci-deploy.pub
echo ""
echo "=== PRIVATE KEY (add to GitLab CI/CD variables) ==="
cat ~/gitlab-ci-deploy
```

### 2.2 Add the PUBLIC key to server's authorized_keys

```bash
# As pouchcare user on the server
cat ~/gitlab-ci-deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Also configure sudo for pouchcare to run deploy/update.sh without password
echo "pouchcare ALL=(ALL) NOPASSWD: /bin/bash /home/pouchcare/Developments/PouchCare/deploy/update.sh" | sudo tee /etc/sudoers.d/pouchcare-deploy
sudo chmod 440 /etc/sudoers.d/pouchcare-deploy
```

### 2.3 Add the PRIVATE key to GitLab CI/CD Variables

1. Go to: **https://gitlab.com/Pouchcare/OS/-/settings/ci_cd**
2. Expand **"Variables"**
3. Click **"Add variable"** and add these three, one at a time:

| Key | Value | Type | Protect | Mask |
|-----|-------|------|---------|------|
| `SSH_PRIVATE_KEY` | (paste the PRIVATE key from 2.1 — include BEGIN/END lines) | File | ✅ | ❌ |
| `DEPLOY_HOST` | Your server's IP or hostname (e.g. `203.0.113.45` or `server.pouchcare.com`) | Variable | ✅ | ❌ |
| `DEPLOY_USER` | `pouchcare` | Variable | ✅ | ❌ |

Optional:
| Key | Value |
|-----|-------|
| `DEPLOY_PORT` | `22` (only add if your SSH port is non-standard) |

**Important:** Do NOT mask `SSH_PRIVATE_KEY` — masking requires single-line values and private keys are multi-line.

### 2.4 Clean up the generated key files

```bash
# On the server, remove the local copies after adding them
rm ~/gitlab-ci-deploy ~/gitlab-ci-deploy.pub
```

---

## Part 3 — Test the CI/CD Pipeline

### 3.1 Trigger the pipeline

Make a small change on your local machine:

```bash
# On your local Windows machine
cd G:\PouchCare
git pull origin main    # pull the latest from GitLab
# Make a trivial change, e.g., edit README.md
git add README.md
git commit -m "test: trigger CI/CD pipeline"
git push origin main
```

### 3.2 Watch the pipeline run

1. Go to: **https://gitlab.com/Pouchcare/OS/-/pipelines**
2. Click the latest pipeline
3. Watch stages: `verify` → `build`
4. After `build` succeeds, click **▶ Play** on the `deploy:production` job
5. The deploy job SSHes into your server and runs `deploy/update.sh`
6. Watch the logs — you'll see the server pull latest code, rebuild, restart PM2

### 3.3 Future deploys

For every future change:

```bash
git add <files>
git commit -m "feat: your message"
git push origin main
```

Then go to GitLab → Pipelines → click Play on `deploy:production` when you're ready to ship.

---

## Part 4 — Quick Reference

### Daily Commands

| Action | Command |
|--------|---------|
| Push code to GitLab | `git push origin main` (on local) |
| Trigger deploy | Click Play button on GitLab pipeline |
| Manual redeploy on server | `sudo bash deploy/update.sh` |
| View API logs | `pm2 logs pouchcare-api` |
| Restart API only | `pm2 restart pouchcare-api` |
| DB backup | `sudo -u postgres pg_dump pouchcare > backup.sql` |
| Test API health | `curl https://api.pouchcare.com/health` |

### Server File Locations

```
/home/pouchcare/Developments/PouchCare/      ← Git repo
/home/pouchcare/htdocs/pouchcare.com/        ← Landing build (Nginx serves)
/home/pouchcare/htdocs/m.pouchcare.com/      ← Management build
/home/pouchcare/htdocs/office.pouchcare.com/ ← Office build
/home/pouchcare/logs/                        ← PM2 logs
/home/pouchcare/backups/                     ← DB backups (auto-cleaned 30 days)
/etc/nginx/sites-available/                  ← Nginx configs
```

### Nginx Configs

The repo includes production-ready Nginx configs in `deploy/nginx/`:
- `api.pouchcare.com.conf` — API reverse proxy (port 7000)
- `pouchcare.com.conf` — Landing site
- `m.pouchcare.com.conf` — Management dashboard
- `office.pouchcare.com.conf` — Office dashboard

The `deploy.sh` script copies these to `/etc/nginx/sites-enabled/` automatically.

### DNS Records Needed

Point these subdomains at your server's IP:

| Subdomain | Type | Points to |
|-----------|------|-----------|
| `pouchcare.com` | A | Your server IP |
| `www.pouchcare.com` | CNAME | `pouchcare.com` |
| `api.pouchcare.com` | A | Your server IP |
| `m.pouchcare.com` | A | Your server IP |
| `office.pouchcare.com` | A | Your server IP |

### SSL Certificates (free via Let's Encrypt)

After DNS propagates, run on the server:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d pouchcare.com -d www.pouchcare.com
sudo certbot --nginx -d api.pouchcare.com
sudo certbot --nginx -d m.pouchcare.com
sudo certbot --nginx -d office.pouchcare.com
```

Certbot auto-renews every 60 days via a cron job.

---

## Troubleshooting

### "Permission denied (publickey)" when deploying

The CI runner's SSH key isn't set up correctly. Check:
1. `SSH_PRIVATE_KEY` variable in GitLab contains the complete private key (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----` lines)
2. The corresponding public key is in `/home/pouchcare/.ssh/authorized_keys` on the server
3. `chmod 600 ~/.ssh/authorized_keys` on the server
4. `DEPLOY_HOST` variable is the correct IP or hostname

### "pouchcare not in sudoers"

Ensure the sudoers file exists:

```bash
sudo cat /etc/sudoers.d/pouchcare-deploy
# Should show: pouchcare ALL=(ALL) NOPASSWD: /bin/bash /home/pouchcare/Developments/PouchCare/deploy/update.sh
```

### API won't start after deploy

```bash
pm2 logs pouchcare-api --lines 50
# Common causes:
# - Missing .env variables
# - Database not running: sudo systemctl start postgresql
# - Port 7000 already in use: sudo lsof -i:7000
```

### Need to rollback a bad deploy

```bash
cd /home/pouchcare/Developments/PouchCare
sudo -u pouchcare git log --oneline -5    # find previous good commit
sudo -u pouchcare git reset --hard <commit-hash>
sudo bash deploy/update.sh
```

---

## Security Checklist

After setup:

- [ ] Disable password SSH login on server (`/etc/ssh/sshd_config` → `PasswordAuthentication no`)
- [ ] Enable UFW firewall: `sudo ufw allow 22,80,443/tcp && sudo ufw enable`
- [ ] Update all default passwords in `.env` (JWT_SECRET, DB password, etc.)
- [ ] Configure PostgreSQL to listen only on localhost
- [ ] Set up offsite database backups (nightly cron to S3/R2)
- [ ] Enable fail2ban: `sudo apt install fail2ban`
- [ ] Keep server packages updated: `sudo apt update && sudo apt upgrade`
- [ ] Rotate GitLab deploy keys every 90 days

---

**Questions?** Check existing docs in the repo:
- `README.md` — project overview
- `deploy/update.sh` — deploy script details
- `.gitlab-ci.yml` — CI/CD pipeline config
