# `src/data` — mock data (landing app)

All mock data files use **sessionStorage** for persistence during development. Replace each with API calls when the backend endpoint is ready.

| File | Purpose | Persistence |
|------|---------|-------------|
| [`mockHosting.ts`](mockHosting.ts) | Domain types, `MOCK_HOSTING_DOMAINS` seed, `MOCK_HOSTING_PLANS`, search suggestions | Read-only seed |
| [`mockHostingStore.ts`](mockHostingStore.ts) | In-memory domain portfolio with full CRUD (add/update/delete domain, DNS records) | sessionStorage |
| [`marketingHosting.ts`](marketingHosting.ts) | Public hosting catalog rows merged into `/services` | Static |
| [`mockProfile.ts`](mockProfile.ts) | Company info, billing address, extra contacts (Telegram, Skype) | sessionStorage |
| [`mockSecurity.ts`](mockSecurity.ts) | Sessions, login history, notification preferences, appearance mode | localStorage |
| [`mockWebToApk.ts`](mockWebToApk.ts) | APK plans, features grid, FAQ, mock conversion jobs | Static seed |
| [`mockInvoices.ts`](mockInvoices.ts) | 5 seed invoices with line items, status helpers, print-ready fields | Static seed |
| [`mockWebsites.ts`](mockWebsites.ts) | 4 seed websites with SEO score, uptime, analytics, tech stack | Static seed |

## Task tracking

CRUD gaps, API integration checklists, and component tasks are tracked in repo docs:

- [`docs/UI_MASTER_INDEX.md`](../../docs/UI_MASTER_INDEX.md) — start here
- [`docs/TASKS_INDEX.md`](../../docs/TASKS_INDEX.md) — links to all task lists
- [`docs/TASKS_MOCK_CRUD_MATRIX.md`](../../docs/TASKS_MOCK_CRUD_MATRIX.md) — domain/DNS CRUD coverage
- [`docs/TASKS_PROFILE_SECURITY.md`](../../docs/TASKS_PROFILE_SECURITY.md) — profile & security API gaps
- [`docs/TASKS_WEB_TO_APK.md`](../../docs/TASKS_WEB_TO_APK.md) — APK service integration checklist
- [`docs/TASKS_RESPONSIVE_AUDIT.md`](../../docs/TASKS_RESPONSIVE_AUDIT.md) — per-page responsive checklist
