# PouchCare OS

> Full-stack agency management platform — CEO: Abdullah Al Mamun | Co-MD: Oliullah Mithu | Ops: Habib Sourov

[![CI](https://github.com/franklinclintonwriter-ui/PouchCare/actions/workflows/ci.yml/badge.svg)](https://github.com/franklinclintonwriter-ui/PouchCare/actions)

## Architecture

```
Internet → Nginx :80/:443
  ├── pouchcare.com          → /home/pouchcare/htdocs/pouchcare.com/      (Landing, static)
  ├── m.pouchcare.com        → /home/pouchcare/htdocs/m.pouchcare.com/    (Management, React)
  ├── office.pouchcare.com   → /home/pouchcare/htdocs/office.pouchcare.com/ (Office, React)
  ├── my.pouchcare.com       → /home/pouchcare/htdocs/my.pouchcare.com/   (Client Portal, React)
  └── api.pouchcare.com      → http://127.0.0.1:7000  (PM2: pouchcare-api)
                                    └── PostgreSQL:5432 + Redis:6379
```

## Tech Stack

- **API:** Node.js 20 · Express 5 · TypeScript · Prisma · PostgreSQL · Redis · WebSocket
- **Frontend:** React 18 · Vite 5 · TypeScript · Tailwind CSS · TanStack Query v5 · Zustand v4
- **Auth:** JWT HS256 (15min access / 7d refresh) · 2FA TOTP for CEO/Co-MD
- **Deploy:** Hetzner VPS · Nginx · PM2 · Cloudflare · Resend (email)

## Build Status

| Phase | Description | Status |
|---|---|---|
| 0 | Infra, monorepo, CI/CD | ✅ 100% |
| 1 | API — 33 routes, 32 tables, 100+ endpoints | ✅ 100% — TypeScript clean |
| 2 | Landing site (pouchcare.com) | ✅ 95% |
| 3 | Staff Office (office.pouchcare.com) | ✅ 100% |
| 4 | Management Portal (m.pouchcare.com) | ✅ 100% |
| 5 | Client Portal (my.pouchcare.com) | ✅ 100% |
| 6 | Polish & Launch | ⏳ Next |

## Quick Start

**One-shot local restart (stop old dev ports → Docker DB if present → `prisma db push` + seed → API + 3 UIs):**

```bash
npm run dev:full
```

**Database (PostgreSQL + Redis):** from repo root, `docker compose up -d` (see `docker-compose.yml`). Ensure `apps/api/.env` has `DATABASE_URL` matching the Postgres user/password (default in `.env.example`: `pouchcare` / `pouchcare` on port `5432`). Then apply schema and seed:

```bash
# From repo root (Windows: npm run db:setup:win)
npm run db:setup
```

```bash
# API (port 7000)
cd apps/api && cp .env.example .env
# Edit .env: set JWT_SECRET + JWT_REFRESH_SECRET (both 32+ chars)
npm install && npx prisma generate && npx prisma db push
npm run db:seed && npm run dev

# Management Portal (port 3000 in dev — see apps/management/vite.config.ts)
cd apps/management && npm install && npm run dev

# Staff Office (port 5175)
cd apps/office && npm install && npm run dev

# Client Portal (port 5176)
cd apps/client-portal && npm install && npm run dev
```

## Seed Credentials (all: `Password123!`)

| Role | Email | App |
|---|---|---|
| CEO | ceo@pouchcare.com | m.pouchcare.com |
| Co-MD | comd@pouchcare.com | m.pouchcare.com |
| Ops Manager | ops@pouchcare.com | m.pouchcare.com |
| Staff | staff1@pouchcare.com | office.pouchcare.com |
| Client | john@example.com | my.pouchcare.com |

## Deploy

```bash
# First deploy (fresh server)
ssh pouchcare@72.60.204.92
sudo bash -c "$(curl -fsSL https://raw.githubusercontent.com/franklinclintonwriter-ui/PouchCare/main/deploy.sh)"

# Update after code push
sudo bash /home/pouchcare/htdocs/PouchCare/deploy/update.sh

# Server commands
pm2 logs pouchcare-api       # Live logs
pm2 restart pouchcare-api    # Restart
nginx -t && nginx -s reload  # Reload Nginx
```

## Project Structure

```
PouchCare/
├── apps/
│   ├── api/              Express API (TypeScript, 0 TS errors)
│   ├── landing/          Static landing site
│   ├── management/       Management Portal (CEO/Co-MD/Ops)
│   ├── office/           Staff Office (Managers/Staff)
│   └── client-portal/    Client Portal (registered clients)
├── packages/types/       Shared TypeScript types
├── packages/utils/       Shared utilities
├── deploy/nginx/         5 Nginx config files (one per domain)
├── deploy/update.sh      Re-deploy script
├── deploy.sh             Full first-deploy script
├── ecosystem.config.js   PM2 config (PORT=7000)
└── .cursorrules          Cursor IDE AI context
```

## API Routes Summary

**Base:** `https://api.pouchcare.com/v1` | **Auth:** `Bearer <token>`

| Module | Key Endpoints |
|---|---|
| Staff Auth | `/auth/login` `/auth/2fa/*` `/auth/refresh` |
| Staff | `/staff/members` CRUD · leaderboard · rate |
| Tasks | `/tasks` — submit→approve→escalate→verify→rate + comments |
| Projects | `/projects` CRUD |
| Attendance | `/attendance` check-in/out · CSV export |
| Leave | `/leave` apply · approve/reject |
| Reports | `/reports/daily` submit · review |
| Finance | `/finance/invoices` · `/expenses` · `/revenue` · `/forecast` |
| CRM | `/crm/leads` · `/crm/pipeline` · `/crm/orders` |
| Assets | `/assets/domains` · `/servers` · `/websites` |
| HR | `/hr/positions` · `/hr/applications` |
| Services | `/services` · `/backlink-packages` |
| Analytics | `/analytics/health` · `/revenue` · `/leaderboard` · `/forecast` |
| Broadcast | `/broadcast` (WebSocket + DB) |
| Support | `/support/tickets` + replies |
| Portal Auth | `/portal/register` · `/portal/login` · `/portal/verify-email` |
| Portal Wallet | `/portal/wallet` · deposit · approve |
| Portal Orders | `/portal/orders` — place (auto wallet deduct, 20% commission) |
| Portal Referrals | `/portal/referrals` · stats · leaderboard · fraud |
| Portal Commissions | `/portal/commissions` · payout request |
| Admin Portal | `/admin/portal/members` · orders · commissions · payouts |

## Roles

| Role | Enum | Group |
|---|---|---|
| CEO | `CEO` | `isCEO` |
| Co-MD | `CO_MD` | `isCEO` |
| Ops Manager | `OP_MANAGER` | `isOps` |
| HR Manager | `HR_MANAGER` | `isHR` |
| Branch Manager | `BRANCH_MANAGER` | `isManager` |
| Staff | `STAFF` | own data |
| Intern | `INTERN` | own data |

## Design System

```css
--midnight: #0B1120        /* page bg */
--midnight-card: #111827   /* card bg */
--sky-500: #0EA5E9         /* primary */
--green-500: #22C55E       /* success */
--yellow-500: #EAB308      /* warning */
--red-500: #EF4444         /* error */

Fonts: Sora (headings) · Inter (body) · JetBrains Mono (amounts/IDs)
```

## Notion Workspace

- Root: https://www.notion.so/32b510b39ec9814b85bfc16add3d957e
- Build Tracker: https://www.notion.so/27db768f81204caba2837294afb3a858
