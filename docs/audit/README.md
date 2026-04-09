# PouchCare — Management UI + API audit pack

Structured checklists to review every Management portal page and every mounted API router **one row at a time**. This folder is documentation only; code changes are tracked separately.

## Phased completion plan (recommended)

**[PHASED-AUDIT.md](./PHASED-AUDIT.md)** — phases 0–4, all management page files, API client list, gap summary, and **Phase 1** execution items (RBAC + analytics parity). Use this when prioritizing work beyond the raw checklist.

## Start here — single master task list

**[TASKS.md](./TASKS.md)** — one file with **128** auditable rows: **75** pages (P01–P75), **30** API mounts + health (H01–H02, V01–V28), **23** API client modules (C01–C23). Work through this file top to bottom; use stable IDs for notes or tickets.

## Other files in this pack

| File | Purpose |
|------|---------|
| [TASKS.md](./TASKS.md) | **Master checklist** (same content as the split files below, plus task IDs). |
| [incomplete-gap-inventory.md](./incomplete-gap-inventory.md) | **Gaps:** partial pages, API misalignment, duplicate routes, dead mocks. |
| [00-inventory.md](./00-inventory.md) | Machine-generated file lists — regenerate via [../../scripts/generate-audit-inventory.mjs](../../scripts/generate-audit-inventory.mjs). |
| [management-pages.md](./management-pages.md) | Pages only (mirror of Part A in TASKS). |
| [api-route-modules.md](./api-route-modules.md) | API mounts only (mirror of Part B in TASKS). |
| [management-api-clients.md](./management-api-clients.md) | API clients only (mirror of Part C in TASKS). |
| [templates/page-audit-template.md](./templates/page-audit-template.md) | Deep-dive template for a single page. |

## Column definitions

### management-pages.md

- **Route URL:** Path as registered in [apps/management/src/routes/index.tsx](../../apps/management/src/routes/index.tsx) (staff routes are relative to `/`; portal routes under `/portal/...`).
- **Page file:** Path under `apps/management/src/pages/`.
- **Primary API client(s):** Main `@/api/*` module(s); `—` if none (e.g. local-only UI).
- **Status:** `Not started` | `In progress` | `Done`.
- **Notes:** Gaps, mocks, `RoleGuard`, missing error states, etc.

### api-route-modules.md

- **Mount / prefix:** `app.use` path (or `GET /health`).
- **Source file:** Under `apps/api/src/routes/`.
- **Status / Notes:** Same idea as above.

### management-api-clients.md

- **Client file:** e.g. `crm.ts`.
- **Backend prefix:** First segment after `/v1` that this client calls.
- **Example pages:** Representative imports (not exhaustive).

## Definition of “Done” for a page row

1. Route exists in `routes/index.tsx` and matches the URL you use in the browser.
2. Data: hooks point at real endpoints; loading and error (and empty, if applicable) states are acceptable for production or explicitly noted.
3. Permissions: `RoleGuard` / `usePermission` align with API authorization.
4. No undocumented critical gap (or gap is recorded in **Notes**).

## Suggested review order

1. Auth + settings (`auth/`, `settings/`)
2. Dashboard, tasks, projects, reports, attendance, leave
3. HR, payroll, performance
4. Finance, CRM
5. Assets, services, support, broadcast, analytics, notifications
6. Admin portal (`portal/admin/`) + member portal shell (`portal/`)

## References

- API mounts: [apps/api/src/server.ts](../../apps/api/src/server.ts)
- Route module index: [apps/api/src/routes/README.md](../../apps/api/src/routes/README.md) (if present)
