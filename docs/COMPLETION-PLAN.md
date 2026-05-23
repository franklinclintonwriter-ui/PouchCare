# PouchCare platform — completion plan

## Local dev (current defaults)

| Service | Port | Command |
|--------|------|---------|
| Node API (`apps/api`) | **7481** | `npm run dev` |
| Vite (`apps/pouchcare-frontend`) | **9284** | `npm run dev` |
| WordPress (`mvp`, `@wordpress/env`) | **8896** | `cd mvp && npm run wpenv:start` (needs Docker) |

Set `VITE_API_URL`, `VITE_ADMIN_API_BASE`, `VITE_CUSTOMER_API_BASE` to `http://localhost:7481` in `apps/pouchcare-frontend/.env`. For CORS from the Vite dev server, either set `ALLOWED_ORIGINS` / `FRONTEND_URL` on the API or rely on the default list (`5173` and `9284`).

## Workstreams (parallel-friendly)

Use separate branches or `git worktree` per track so multiple agents can work without conflicts.

### Track A — Data & Node API
- [x] Structural validation for `PUT /admin/snapshot` (`validateAdminSnapshotData` — list fields must be arrays when present).
- [x] Public **`GET /catalog/templates`** (JSON alongside API; marketing page can hydrate from live API).
- [x] Formalize Projects / Pages / Media / Leads: Full Zod schemas in `apps/api/src/schemas/snapshotEntities.js`.
  - All entity types: Project, Page, Media, Lead, Company, Template, TeamMember, BillingRecord, etc.
  - `validateAdminSnapshotData(data, { deep: true })` for strict validation.
  - `parseAdminSnapshotData(data)` returns validated/parsed data with defaults.
- [x] PortalSnapshot scope documented: UI workspace state only; first-class DB entities (User, License, Site) in Prisma.

### Track B — Admin portal
- [x] Wire **Dashboard** KPIs to `GET /admin/stats` (top stat cards; CRM table remains snapshot).
- [x] Centralize Node API base via `src/config/apiBase.js` (`getNodeApiBase()` + dev default `http://localhost:7481`).
- [x] Clarify on **Dashboard**: platform metrics vs workspace CRM snapshot (customers list stays on **Customers** route).

### Track C — Customer portal
- [x] `customerPortalRepository` falls back to `getNodeApiBase()` when `VITE_CUSTOMER_API_BASE` is unset (matches admin app dev default).
- [x] Single source of truth: Node vs WordPress embedded; align `customerPortalRepository` + WP `/customer/*` if hybrid.
  - **Architecture decision**: Repository now has `getPortalMode()` returning `'node' | 'wordpress' | 'hybrid'`.
  - All CRUD operations map to Node API routes in `customer.js` + `customerEntities.js`.
  - WP REST routes fully implemented in `class-pouchcare-customer-api.php` (see Track D).
  - Comprehensive data flow documentation added to repository header.

### Track D — WordPress
- [x] WP REST endpoints aligned with Node API — `class-pouchcare-customer-api.php` mirrors all `/customer/*` routes.
- [x] `wp-env` smoke on 8896 — `cd mvp && npm run smoke:wp` (tests home, REST API root, PouchCare namespace, auth endpoints).

### Track E — Marketing
- [x] Blog: fetches **`GET /blog/posts`** when Node API base resolves; falls back to bundled `data/blog.js`.
- [x] Templates page: fetches **`GET /catalog/templates`** when Node API base resolves; falls back to bundled `data/templates.js`.

### Track F — QA
- [x] API smoke: `cd apps/api && npm run smoke` (with API running; override base via `API_SMOKE_URL`).
- [x] E2E: Playwright setup with auth, templates, and admin dashboard tests (`cd apps/pouchcare-frontend && npm run test:e2e`).

## Cursor todo IDs (mirror)

Synced with the IDE todo list: `dev-1` … `qa-1`. Mark `dev-1` done when API + Vite respond on the ports above.
