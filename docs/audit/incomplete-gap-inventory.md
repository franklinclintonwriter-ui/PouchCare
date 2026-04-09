# Management UI ↔ API — gap inventory (2026-04-04)

This document lists **incomplete**, **partial**, or **misaligned** areas between the **management** app (`apps/management`) and the **API** (`apps/api`). Use it with [TASKS.md](./TASKS.md) (coverage checklist) and [00-inventory.md](./00-inventory.md).

---

## Recently fixed (code)

| Item | Before | After |
|------|--------|--------|
| Monitor (`/monitor`) | Mock-only UI; `camera_devices` missing from initial migrate SQL. | Prisma FK to `branches`, migration `20260409120000_camera_devices_branch_fk`, `/assets/cameras/summary` + Zod on CRUD, UI uses API; permission `monitor.view`. See [docs/tasks/monitor-cctv-api-db.md](../tasks/monitor-cctv-api-db.md). |
| Performance review create | Frontend sent `staffMemberId` / omitted `reviewPeriod`; API expects `memberId` + `reviewPeriod` (see `/v1/performance` POST). | `useCreatePerformanceReview` maps to the API shape (`memberId`, `reviewPeriod`, quarter/year). |
| Application detail fetch | Raw `api.get` in the page. | Centralized `useApplication(id)` in `@/api/hr` + invalidation on `useUpdateApplication`. |

---

## Pages — functional gaps (by area)

### Still partial or product-debt

| Route / page | Primary clients | Gap |
|--------------|-----------------|-----|
| `/analytics` | `finance` (`useRevenue`) | **Narrow scope:** charts/tables use **monthly revenue** only. **`/v1/analytics`** (health, staff, clients, leaderboard, forecast) is **not** used here; those live on the **Dashboard** (`/`). Consider renaming the nav item or wiring the same analytics hooks as the dashboard for parity. |
| `/` Dashboard | `analytics.ts` | **Resolved:** page-level alert when any dashboard query fails (see PHASED-AUDIT Phase 2). |
| `/payroll` | `payroll.ts` | **Resolved:** month/year filters + “This month” (see PHASED-AUDIT Phase 2). |
| `/settings/preferences` | — | **No backend**—preferences in `localStorage` only. |
| `/settings/security` | `auth.ts` | **2FA status:** hydrated from `GET /staff/me` (`twoFactorEnabled`, `twoFactorPending`). **Active sessions** still informational (no per-device revoke API). |
| `/hr/performance` (UI: `pages/hr/Performance.tsx`) | `performance.ts` → `/v1/performance` | **UI permission** for “Add review” still uses **hardcoded** `MANAGER_ROLES`; consider aligning with `usePermission()` / RBAC matrix for “who can create reviews”. |
| `/broadcast` | `broadcast.ts` | Real-time channel may be separate (WebSocket); list/create via REST. |

### HR — duplicate API surface

| Endpoint | Notes |
|----------|--------|
| `GET/POST /v1/performance` | Primary **staff performance ratings** (used by `Performance.tsx` + `api/performance.ts`). |
| `GET/POST …/v1/hr/performance` | **Same underlying `PerformanceRating` model** exposed again under HR router. Risk: two ways to list/create reviews; prefer **one** public contract long-term. |

### Recruitment detail

| Topic | Notes |
|-------|--------|
| Star **rating** on applications | Still **inferred** from `experienceYears` in `mapApplication` (heuristic), not a stored recruiter score. |

---

## API clients vs raw `api` usage

| Pattern | Where | Recommendation |
|---------|--------|----------------|
| Prefer hooks in `@/api/*` | Most pages | Continue; keeps cache keys consistent. |
| Raw `api` | ~~`ApplicationDetail`~~ | **Resolved:** `useApplication`. Grep for remaining `api.get`/`post` outside `src/api` if you want zero raw usage. |

---

## Dead / unused frontend assets

| Path | Notes |
|------|--------|
| `apps/management/src/mocks/**` | **Not imported** by production pages (grep shows no imports). Safe to delete or keep only for Storybook/fixtures. |

---

## Backend routes — verify against UI

All major staff areas have matching routers under `/v1` (see [TASKS.md](./TASKS.md) Part B). **Role-based permission** overrides are stored in `role_permissions` and enforced via `requirePermission` + `GET /staff/me` `permissions` (see `managementPermissions.ts`).

---

## Suggested next passes

See **[PHASED-AUDIT.md](./PHASED-AUDIT.md)** for phased priorities. Short list:

1. **Analytics page:** wired to `/v1/analytics` (health, staff, clients) **plus** finance revenue charts (Phase 1).  
2. **HR duplicate `/hr/performance`:** deprecate one path or document which clients should use (Phase 1 / 3).  
3. **Performance.tsx:** use `usePermission().can('hr.recruitment')` for “Add review” (Phase 1 — done in code).  
4. **Application rating:** add optional `recruiterRating` in Prisma + API if product needs real scores.  
5. **Remove or wire mocks** under `src/mocks` to avoid confusion.

---

## References

- [TASKS.md](./TASKS.md) — P01–P75 page notes  
- [api-route-modules.md](./api-route-modules.md) — mounted routers  
- [management-api-clients.md](./management-api-clients.md) — client modules  
