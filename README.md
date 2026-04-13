# PouchCare OS

Full-stack agency platform: **API** (Express, Prisma, PostgreSQL), **Management** and **Landing** (Vite, React).

| | |
|---|---|
| **GitLab** | [gitlab.com/Pouchcare/OS](https://gitlab.com/Pouchcare/OS) |
| **Clone (SSH)** | `git@gitlab.com:Pouchcare/OS.git` |
| **CI/CD** | [`.gitlab-ci.yml`](.gitlab-ci.yml) · [Pipelines](https://gitlab.com/Pouchcare/OS/-/pipelines) |

**SSH:** create a key (`ssh-keygen -t ed25519`), add the public key under GitLab → *Preferences* → *SSH Keys*, then run `ssh -T git@gitlab.com`.

## Local setup

```bash
npm install
docker compose up -d
cp apps/api/.env.example apps/api/.env   # set JWT_SECRET, JWT_REFRESH_SECRET, DATABASE_URL
npm run db:setup
npm run dev:stack    # API + Management; see package.json for more scripts
```

## Deploy

First install on a server: run [`deploy.sh`](deploy.sh) (see script header for GitLab deploy key / token). Updates: [`deploy/update.sh`](deploy/update.sh). Nginx samples: `deploy/nginx/`.

## Seed logins

Default password `Password123!` — `ceo@`, `comd@`, `ops@`, `branch@pouchcare.com` (see `apps/api/prisma/seed.ts`).
