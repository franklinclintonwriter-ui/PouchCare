# PouchCare OS

Full-stack agency platform: **API** (Express, Prisma, PostgreSQL), **Management** (Vite, React), and **Landing / Client Portal** (Vite, React, Tailwind CSS).

| | |
|---|---|
| **GitLab** | [gitlab.com/Pouchcare/OS](https://gitlab.com/Pouchcare/OS) |
| **Clone (SSH)** | `git@gitlab.com:Pouchcare/OS.git` |
| **CI/CD** | [`.gitlab-ci.yml`](.gitlab-ci.yml) · [Pipelines](https://gitlab.com/Pouchcare/OS/-/pipelines) |

**SSH:** create a key (`ssh-keygen -t ed25519`), add the public key under GitLab → *Preferences* → *SSH Keys*, then run `ssh -T git@gitlab.com`.

---

## Monorepo structure

```
pouchcare-os/
├── apps/
│   ├── api/           Express + Prisma + PostgreSQL (backend)
│   ├── landing/       Client portal + marketing site (Vite + React)
│   └── management/    Internal staff dashboard (Vite + React)
├── packages/
│   ├── auth/          Shared auth utilities
│   ├── types/         Shared TypeScript types
│   ├── ui/            Shared UI components
│   └── utils/         Shared helpers
└── deploy/            Server deploy scripts + Nginx configs
```

---

## Current build status

### apps/landing (Client portal + marketing)

**Build:** clean pass (0 TS errors, 2154 modules)

#### Marketing pages (public)
| Route | Page | Status |
|-------|------|--------|
| `/` | Home | Complete |
| `/services` | SEO services catalog | Complete |
| `/services/hosting` | Domains & hosting | Complete |
| `/services/web-to-apk` | Web → Android APK | Complete |
| `/backlinks` | Backlink packages | Complete |
| `/pricing` | Plan comparison | Complete |
| `/about` | Company info | Complete |
| `/blog`, `/blog/:slug` | Blog index + article | Complete |
| `/contact` | Contact form | Complete |
| `/terms`, `/privacy` | Legal pages | Complete |

#### Client portal (authenticated `/dashboard/*`)
| Route | Page | Status |
|-------|------|--------|
| `/dashboard` | Overview (6 stats, quick actions, recent orders) | Complete |
| `/dashboard/orders` | Orders list (filter tabs, search, invoice links) | Complete |
| `/dashboard/orders/:id` | Order detail + messages | Complete |
| `/dashboard/cart` | Cart (sticky summary, qty stepper) | Complete |
| `/dashboard/services` | Service catalog + add to cart | Complete |
| `/dashboard/wallet` | Wallet balance + deposit + transactions | Complete |
| `/dashboard/billing` | Commissions + payout requests | Complete |
| `/dashboard/invoices` | Invoices list (filter, search, status tabs) | Complete |
| `/dashboard/invoices/:id` | Invoice detail + print + PDF download (mock) | Complete |
| `/dashboard/hosting` | My domains overview | Complete |
| `/dashboard/hosting/register` | Domain search + plan picker | Complete |
| `/dashboard/hosting/:domainId` | Domain detail (DNS CRUD, nameservers, SSL) | Complete |
| `/dashboard/websites` | My Websites (health, SEO, uptime, analytics) | Complete |
| `/dashboard/websites/:id` | Site detail (performance, tech stack, SSL) | Complete |
| `/dashboard/web-to-apk` | Web → APK converter (form + my conversions) | Complete |
| `/dashboard/referrals` | Referral stats + share link | Complete |
| `/dashboard/profile` | 6-section profile (identity, contact, company, address, account, linked services) | Complete |
| `/dashboard/settings` | Security: password, 2FA, sessions, login history, notifications, appearance | Complete |
| `/dashboard/support` | Support tickets + create | Complete |
| `/dashboard/support/:id` | Ticket thread + reply | Complete |

#### Auth portal (`/my-accounts/*`)
| Route | Status |
|-------|--------|
| `/my-accounts/login` | Complete |
| `/my-accounts/register` | Complete |
| `/my-accounts/verify-email` | Complete |
| `/my-accounts/forgot-password` | Complete |
| `/my-accounts/reset-password` | Complete |

#### UI components & features
- Cart flyout popover in dashboard header (mobile: fixed + backdrop, desktop: dropdown)
- Responsive sidebar (collapsible desktop, drawer mobile) with 6 nav groups
- Bottom mobile nav bar with quick access
- Print stylesheet for invoices (A4, hides sidebar/header)
- `DashboardPanel`, `StatCard`, `NarrowWide`, `Badge` (semantic variants), `HostingPlanCard`, `UsageMeterBar`

#### Mock data (sessionStorage, replace with API later)
| File | Purpose |
|------|---------|
| `mockHosting.ts` / `mockHostingStore.ts` | Domain portfolio + DNS CRUD |
| `mockProfile.ts` | Company, address, extra contacts |
| `mockSecurity.ts` | Sessions, login history, notification prefs, appearance |
| `mockWebToApk.ts` | APK plans, features, FAQ, mock conversion jobs |
| `mockInvoices.ts` | 5 seed invoices with line items |
| `mockWebsites.ts` | 4 seed sites with analytics, uptime, tech stack |
| `marketingHosting.ts` | Public hosting catalog |

### apps/api (Backend)
Express + Prisma + PostgreSQL. See `apps/api/.env.example` for config.

### apps/management (Internal dashboard)
Staff-facing admin panel. See `apps/management/` for details.

---

## Local setup

```bash
npm install
docker compose up -d
cp apps/api/.env.example apps/api/.env   # set JWT_SECRET, JWT_REFRESH_SECRET, DATABASE_URL
npm run db:setup
npm run dev:stack    # API + Management; see package.json for more scripts
```

Landing app dev server:
```bash
npm run dev:landing
```

## Deploy

First install on a server: run [`deploy.sh`](deploy.sh) (see script header for GitLab deploy key / token). Updates: [`deploy/update.sh`](deploy/update.sh). Nginx samples: `deploy/nginx/`.

## Seed logins

Default password `Password123!` — `ceo@`, `comd@`, `ops@`, `branch@pouchcare.com` (see `apps/api/prisma/seed.ts`).

## Documentation index (landing app)

- [`apps/landing/docs/UI_MASTER_INDEX.md`](apps/landing/docs/UI_MASTER_INDEX.md) — start here
- [`apps/landing/docs/TASKS_MOCK_CRUD_MATRIX.md`](apps/landing/docs/TASKS_MOCK_CRUD_MATRIX.md) — mock data CRUD coverage
- [`apps/landing/docs/TASKS_PROFILE_SECURITY.md`](apps/landing/docs/TASKS_PROFILE_SECURITY.md) — profile & security pages
- [`apps/landing/docs/TASKS_WEB_TO_APK.md`](apps/landing/docs/TASKS_WEB_TO_APK.md) — Web→APK service
- [`apps/landing/docs/TASKS_RESPONSIVE_AUDIT.md`](apps/landing/docs/TASKS_RESPONSIVE_AUDIT.md) — responsive checklist
