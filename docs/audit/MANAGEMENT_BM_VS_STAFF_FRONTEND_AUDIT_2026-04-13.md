# Management frontend audit — Branch Manager vs Staff

**See also:** [Role-by-role phased access audit](./ROLE_BY_ROLE_ACCESS_AUDIT.md) (all roles, CEO full-access notes, deep-read batches).

**Date:** 2026-04-13  
**App:** `apps/management` (React, `react-router-dom`)  
**Scope:** Route guards, sidebar, dashboard, command palette, and alignment with API permission defaults in `apps/api/src/lib/managementPermissions.ts`.

**Important:** The monorepo does **not** contain `apps/office` (Staff Office). README still refers to `office.pouchcare.com` for staff; in this codebase **both Branch Manager and Staff authenticate via the same Management login** (`/login`) and SPA. Any “staff-only office” behavior is **not** represented here.

---

## 1. Effective permission matrix (defaults, before DB overrides)

Derived from `defaultForRole()` in `managementPermissions.ts`. `BRANCH_MANAGER` and `STAFF` receive the **same** boolean defaults for every key except none—both are non-ops, non-HR-recruitment, non-CEO for settings.

| Key | CEO / Co-MD | Ops | HR Mgr | Branch Mgr | Staff | Intern |
|-----|-------------|-----|--------|------------|-------|--------|
| `staff.branches` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `staff.manage_profiles` | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| `payroll.access` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `finance.access` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `finance.exchange_rates` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `crm.client_accounts` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `hr.recruitment` | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| `hr.performance` | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| `assets.devices` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `monitor.view` | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| `broadcast.access` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `analytics.access` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `admin_portal.access` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `settings.role_permissions` | ✓ (CEO/Co-MD only) | ✗ | ✗ | ✗ | ✗ | ✗ |

**Frontend `isManager`:** `BRANCH_MANAGER` is **true**; `STAFF` / `INTERN` are **false** (`utils/permissions.ts`).

---

## 2. Critical mismatch: home dashboard vs API

| Item | Detail |
|------|--------|
| **UI** | `pages/dashboard/Dashboard.tsx` always calls `useDashboardSummary()` and `useForecast()` → `GET /analytics/summary` and `GET /analytics/forecast`. |
| **API** | `routes/analytics/index.ts` applies `router.use(authenticate, requirePermission("analytics.access"))` to **all** analytics routes. |
| **Defaults** | `analytics.access` is **ops-only** → **false** for both `BRANCH_MANAGER` and `STAFF`. |

**Result:** For Branch Manager and Staff, the **main dashboard shows the error banner** (“Failed to load dashboard data”) and KPIs/charts do not load, even though these users are expected to use the app daily. This is the largest UX/product mismatch.

**Recommendations (pick one strategy):**

1. Grant `analytics.access` to `BRANCH_MANAGER` (and optionally `STAFF`) in `defaultForRole`, **or**
2. Split analytics: e.g. `analytics.summary` for ops vs `analytics.summary_limited` for others, **or**
3. Change the dashboard to **not** call `/analytics/*` when `!perm.can('analytics.access')` and show a role-appropriate home (tasks, attendance, branch KPIs) instead.

---

## 3. Route coverage vs navigation (Management SPA)

Legend: **Nav** = visible in `Sidebar.tsx` for that role (after permission filters). **Route** = `routes/index.tsx`.

### 3.1 Branch Manager

| Area | Nav | Route guard | Notes |
|------|-----|-------------|--------|
| Dashboard `/` | ✓ | None | **Broken data** (see §2). |
| Tasks / Projects / Reports / Leave / Attendance | ✓ | None | OK. |
| Team attendance `/attendance/team` | ✓ | None | **Data mismatch:** `GET /v1/attendance` scopes **non-managers** to `staffMemberId = req.user.id` only (`attendance/index.ts`). The “team” UI loads for Staff but shows **only their own rows**, not the branch team. Consider hiding `/attendance/team` for `!isManager` or relabeling. |
| Staff list `/staff` | ✓ | None | OK. “Branches” sub-nav hidden (no `staff.branches`). |
| CRM (Leads, Pipeline, Orders) | ✓ (`isManager`) | `ManagerGuard` | OK. **Client** routes use `crm.client_accounts` — nav child hidden; direct URL → Access Denied. |
| Finance / Payroll / HR recruitment / Performance | Hidden | `PermissionGuard` | Aligned. |
| Assets Domains/Servers/Websites | ✓ | None | Read APIs: `requireStaff`. Mutations: `SENIOR_ROLES` (CEO, Co-MD, Ops only) — BM cannot create/update/delete via API. |
| Devices | Hidden | `assets.devices` | Aligned. |
| Monitor | ✓ | `monitor.view` | Defaults **true** for BM. |
| Broadcast / Analytics | Hidden | `broadcast.access` / `analytics.access` | Aligned with defaults. |
| Admin Portal | Hidden | `admin_portal.access` | Aligned. |
| Tools `/tools` (+ sub-routes) | ✓ | **None** | Full UI access; API `tools` is `requireStaff` — any staff can invoke tools (cost/risk). |
| Plugins | ✓ | **None** | List/detail are `authenticate` only on API; write paths are CEO-only. |
| Settings (profile/security/prefs) | ✓ | Mixed | Sensitive routes wrapped with `settings.role_permissions`. |

### 3.2 Staff (non-manager)

| Area | Nav | Route guard | Notes |
|------|-----|-------------|--------|
| Dashboard `/` | ✓ | None | **Same analytics failure** as BM (§2). |
| CRM | **Hidden** (`isManager`) | `ManagerGuard` on `/crm/leads`, `/crm/pipeline`, `/crm/orders` | UI blocked. **API gap:** CRM router still uses broad `requireStaff` on many endpoints — bypass possible with token (see §5). |
| Team attendance | ✓ (no manager check) | None | **Mismatch:** API does **not** 403 — it returns **self-only** attendance for Staff. Sidebar still says “team.” |
| Monitor | ✓ | `monitor.view` | Default **true** for Staff. |
| Tools / Plugins / Assets | ✓ | Mostly none | Same as BM for read-only asset lists. |

---

## 4. Components checked

| Component | Branch Manager | Staff | Issue |
|-----------|----------------|-------|--------|
| **Sidebar** | CRM shown; Finance hidden unless granted | CRM hidden | “Team” under Attendance visible to all; for Staff the backend only returns **self** rows (see §3.2). |
| **QuickActions** | Filters by `managerOnly` + `permission` | Tasks + Monitor typical | OK; dashboard still broken upstream. |
| **CommandPalette** | CRM commands when `isManager`; finance/analytics gated | No CRM/finance/analytics commands without perms | OK for static commands; live search still returns **leads** in API responses (UI filters manager-only navigation to lead URLs — data may still leak in network payload). |

---

## 5. API vs UI gaps (security / consistency)

These are **backend** concerns but surface as “mismatch” when testing as BM/Staff:

1. **CRM:** UI uses `ManagerGuard`; **API** often only `requireStaff` — non-managers could call CRM endpoints with a valid staff JWT unless tightened.  
2. **Search** (`GET /search`): Returns leads, clients, etc., for any authenticated staff; Command Palette filters **display** for managers, but the HTTP response is still full.  
3. **Analytics:** UI always requests analytics on home; **API** correctly forbids — causes **broken home** rather than “secure silence.”

---

## 6. Page inventory (staff-authenticated tree)

All paths below live under `AuthGuard userType="staff"` + `AppLayout`.

**No `PermissionGuard` / `ManagerGuard`:**  
`/`, `/staff`, `/staff/leaderboard`, `/staff/:id`, document viewer, `/tasks`, `/tasks/mine`, `/tasks/:id`, `/projects`, `/projects/:id`, `/attendance`, `/attendance/team`, `/attendance/check`, `/leave`, `/leave/request`, `/leave/:id`, `/reports`, `/reports/submit`, `/assets/domains`, `/assets/servers`, `/assets/websites` (+ details), `/services`, `/support`, `/support/:id`, `/tools` and tool subpages, `/notifications`, `/settings/profile`, `/settings/security`, `/settings/preferences`, `/plugins`, `/plugins/:id`.

**ManagerGuard:** `/crm/leads`, `/crm/leads/:id`, `/crm/pipeline`, `/crm/orders`, `/crm/orders/:id`.

**PermissionGuard (key as listed):** payroll, performance, finance*, HR*, assets/devices*, broadcast*, analytics*, settings role/system/api-keys, monitor*, admin portal*.

---

## 7. Summary table — mismatch severity

| # | Topic | Severity | Roles affected |
|---|--------|----------|----------------|
| 1 | Home dashboard calls `/analytics/*` without `analytics.access` | **High** | BM, Staff, HR Mgr, Intern (anyone without ops analytics) |
| 2 | README / product copy implies Staff uses Office app; repo has no `apps/office` | **Medium** | Staff |
| 3 | “Team attendance” nav + page for Staff — API returns **self-only**, not team | **Medium** | Staff |
| 4 | CRM API vs `ManagerGuard` on UI | **Medium** | Staff (bypass) |
| 5 | Tools/Plugins UI open to all staff; tools API `requireStaff` | **Low–Medium** | BM, Staff (policy-dependent) |
| 6 | Search API returns broad entity types | **Low** | Staff |

---

## 8. Suggested verification checklist (manual QA)

1. Log in as `branch@pouchcare.com` / `Password123!` — confirm dashboard error vs expected KPIs.  
2. Log in as `staff1@pouchcare.com` — same dashboard check.  
3. As Staff, open `/crm/leads` — expect Access Denied screen.  
4. As Staff, open `/attendance/team` — expect **only own** attendance rows (API scopes non-managers), not a full team board.  
5. As BM, open `/crm/leads` — OK; `/crm/clients` — Access Denied without override.  
6. Re-login after changing `RolePermission` rows in DB — confirm `permissions` on `/staff/me` updates sidebar.

---

## 9. References (code)

- Routes: `apps/management/src/routes/index.tsx`  
- Guards: `apps/management/src/routes/guards.tsx`  
- Sidebar: `apps/management/src/components/layout/Sidebar.tsx`  
- Permission defaults: `apps/api/src/lib/managementPermissions.ts`  
- Analytics API: `apps/api/src/routes/analytics/index.ts`  
- Dashboard data hooks: `apps/management/src/api/analytics.ts`, `pages/dashboard/Dashboard.tsx`

---

## 10. Remediation (2026-04-13)

- **Dashboard:** `useDashboardSummary` / `useForecast` run only when `analytics.access`; otherwise a **Quick links** home + `QuickActions` is shown (no failed analytics requests).
- **Team attendance:** Route `/attendance/team` wrapped in `ManagerGuard`; README / `.cursorrules` updated — staff use Management app in-repo.
- **CRM API:** Leads, pipeline, and sales-order routes require `MANAGER_ROLES` (aligned with UI).
- **Search API:** CRM leads only for managers; portal member hits only with `admin_portal.access`.

---

## 11. Branch-scoped monitor / cameras (2026-04-13)

- **API** `lib/monitorBranchScope.ts`: CEO, Co-MD, Ops Manager, HR Manager see **all** branches. **Branch Manager**, **Staff**, and **Intern** are limited to the branch whose **name** matches `StaffMember.branch` (same string as `Branch.name`).
- **Endpoints:** `GET /assets/cameras/summary`, `GET/EXPORT /assets/cameras`, `GET/PATCH /assets/cameras/:id`, stream URLs, export-window, `GET /assets/vigi/branches/:branchId` (read-only metadata), and **`GET /admin/branches/:id`** (when user lacks `staff.branches` but may read **own** branch for the monitor UI).
- Unassigned or unknown branch name → empty camera lists / summary (no cross-branch leakage).
