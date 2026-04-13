# GitLab remote and SSH

**Remote:** `git@gitlab.com:Pouchcare/OS.git` — [project on GitLab](https://gitlab.com/Pouchcare/OS).

## One-time SSH setup (Windows / OpenSSH)

1. **Generate a key** (skip if you already use one for GitLab):

   ```powershell
   ssh-keygen -t ed25519 -C "your.email@example.com" -f $env:USERPROFILE\.ssh\id_ed25519_gitlab
   ```

2. **Start the agent and add the key** (PowerShell):

   ```powershell
   Get-Service ssh-agent | Set-Service -StartupType Manual
   Start-Service ssh-agent
   ssh-add $env:USERPROFILE\.ssh\id_ed25519_gitlab
   ```

3. **Copy the public key** and paste it in GitLab: **User Settings → SSH Keys**.

   ```powershell
   Get-Content $env:USERPROFILE\.ssh\id_ed25519_gitlab.pub | Set-Clipboard
   ```

4. **Optional `~/.ssh/config`** so Git always uses this key for GitLab:

   ```
   Host gitlab.com
     HostName gitlab.com
     User git
     IdentityFile ~/.ssh/id_ed25519_gitlab
     IdentitiesOnly yes
   ```

5. **Test:**

   ```powershell
   ssh -T git@gitlab.com
   ```

   You should see a welcome message with your GitLab username.

## Push the repo

```powershell
cd g:\PouchCare
git remote -v
git push -u origin main
```

If the GitLab project is empty, the first push creates `main`. If GitLab already has commits, you may need to pull with `--allow-unrelated-histories` or use a new branch—follow GitLab’s empty-repo instructions.

## CI/CD

Pipelines are defined in **`.gitlab-ci.yml`** at the repo root:

- **pouchcare:quality** — `npm ci`, then API `prisma generate` + `tsc --noEmit`, ESLint on Management and Landing.
- **pouchcare:build** — `npm run build` (Turbo: API + Vite apps).
- **deploy:production** — manual job on `main` only (placeholder for your deploy script).

Runners: GitLab shared runners (Linux) are sufficient. If `npm ci` fails because `package-lock.json` still lists removed apps (e.g. old workspace paths), run `npm install` locally, commit the updated lockfile, and push.
