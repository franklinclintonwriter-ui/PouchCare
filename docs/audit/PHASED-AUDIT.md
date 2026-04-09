# Management app — phased audit & completion plan

**Scope:** `apps/management` (all routes, pages, API clients) aligned with `apps/api` (`/v1/*`).  
**Companion checklists:** [TASKS.md](./TASKS.md) (row IDs P01–P75, API mounts, clients), [incomplete-gap-inventory.md](./incomplete-gap-inventory.md) (known gaps).

---

## Executive summary

| Area | Status | Notes |
|------|--------|--------|
| Route ↔ page coverage | **Complete** | Every staff/portal route in `routes/index.tsx` has a page component. |
| API clients (`src/api/*.ts`) | **Complete** | 24 modules; each maps to a `/v1` prefix (see [management-api-clients.md](./management-api-clients.md)). |
| CRUD vs backend | **Mostly complete** | Gaps are **product/UX** (preferences persist locally), **duplicate HR performance routes** (API), or **analytics page scope** (was revenue-only; enhanced in Phase 1). |
| RBAC | **Mostly complete** | Feature flags via `usePermission` + `PermissionGuard`; legacy **role lists** removed incrementally (e.g. Performance → `hr.recruitment`). |

---

## Phase 0 — Inventory (documentation only)

**Goal:** Single source of truth for “what exists.”

| Deliverable | Location |
|-------------|----------|
| Page × route × client | [management-pages.md](./management-pages.md), [TASKS.md](./TASKS.md) Part A |
| API mounts | [api-route-modules.md](./api-route-modules.md), `apps/api/src/server.ts` |
| Client ↔ prefix | [management-api-clients.md](./management-api-clients.md) |
| Machine file lists | [00-inventory.md](./00-inventory.md) (regenerate via `scripts/generate-audit-inventory.mjs` if present) |

**Exit criteria:** All P-rows reviewed at least once; gaps copied into Phase 1–4.

---

## Phase 1 — Consistency, RBAC, analytics parity ✅ (code complete for P1.1–P1.2)

| ID | Item | Status |
|----|------|--------|
| P1.1 | **Performance.tsx** “Add review” gate | **Done:** `usePermission().can('hr.recruitment')` replaces hardcoded `MANAGER_ROLES`. |
| P1.2 | **Analytics.tsx** | **Done:** `useHealthScore`, `useStaffStats`, `useClientStats` from `@/api/analytics` plus existing finance `useRevenue` charts and KPI row. |
| P1.3 | **Duplicate performance API** | **Doc only:** prefer `GET/POST /v1/performance`; `/v1/hr/performance` mirrors same model—consolidate in a future API release. |

**Exit criteria:** No critical page uses raw role arrays where a `permissionKeys` entry exists; Analytics shows both operational KPIs and revenue.

---

## Phase 2 — UX & product debt

| ID | Item | Notes |
|----|------|--------|
| P2.1 | Payroll month/year | **Done:** `filterMonth` / `filterYear` state, period toolbar, “This month” reset, `useEffect` resets page on period change; API already accepted `month` + `year` query params. |
| P2.2 | Dashboard error banner | **Done:** Alert when any of health/revenue/staff/clients/leaderboard/forecast queries error, with first error message. |
| P2.3 | Settings preferences | Today: `localStorage` only—backend persistence is a product decision. |
| P2.4 | Security / 2FA | **Done:** `GET /staff/me` returns `twoFactorEnabled` + `twoFactorPending` (derived from `totpSecret`); Security page shows badges + pending hint; `useSetup2FA` / `useVerify2FA` invalidate `useStaffMe`. Active sessions still copy-only until revoke API. |

---

## Phase 3 — Data model & API clarity

| ID | Item | Notes |
|----|------|--------|
| P3.1 | Application “star” rating | Currently inferred in mapper—add optional `recruiterRating` in Prisma if product needs real scores. |
| P3.2 | HR `/hr/performance` vs `/performance` | Choose one public contract; update clients and OpenAPI/docs. |

---

## Phase 4 — Cleanup

| ID | Item | Notes |
|----|------|--------|
| P4.1 | `apps/management/src/mocks/**` | Not imported by production pages—delete or move to tests/Storybook. |
| P4.2 | Raw `api` usage outside `src/api` | Grep and migrate to hooks for cache consistency. |

---

## Appendix A — Management page files (76)

All under `apps/management/src/pages/`:

- **auth:** `StaffLogin`, `PortalLogin`, `PortalRegister`, `ForgotPassword`, `ResetPassword`, `VerifyEmail`
- **dashboard:** `Dashboard`
- **staff:** `StaffList`, `StaffDetail`, `Leaderboard`, `BranchManagement`
- **tasks:** `TaskList`, `TaskDetail`, `MyTasks`
- **projects:** `ProjectList`, `ProjectDetail`
- **attendance:** `MyAttendance`, `TeamAttendance`, `CheckinCheckout`
- **leave:** `LeaveList`, `LeaveRequestForm`
- **reports:** `DailyReports`, `ReportSubmit`
- **payroll:** `PayrollList`, `PayrollDetail`
- **hr:** `Performance`, `Positions`, `Applications`, `ApplicationDetail`
- **finance:** `InvoiceList`, `InvoiceDetail`, `ExpenseList`, `ExpenseDetail`, `Revenue`, `Forecast`, `ExchangeRates`
- **crm:** `LeadList`, `LeadDetail`, `Pipeline`, `SalesOrders`, `SalesOrderDetail`, `ClientAccounts`
- **assets:** `Domains`, `DomainDetail`, `Servers`, `ServerDetail`, `Websites`, `WebsiteDetail`, `Devices`
- **services:** `ServiceList`, `BacklinkPackages`
- **support:** `TicketList`, `TicketDetail`
- **broadcast:** `BroadcastList`
- **analytics:** `Analytics`
- **notifications:** `NotificationList`
- **settings:** `Profile`, `Security`, `Preferences`, `RolePermissions`
- **portal (member):** `PortalDashboard`, `PlaceOrder`, `PortalOrders`, `PortalOrderDetail`, `Wallet`, `Referrals`, `ReferralLeaderboard`, `Commissions`, `PortalSupport`, `PortalSettings`
- **portal (admin):** `PortalMembers`, `PortalMemberDetail`, `PortalOrdersAdmin`, `PortalCommissions`, `PortalPayouts`, `PortalDeposits`

---

## Appendix B — API client modules (`src/api`)

`admin-portal`, `admin-resources`, `analytics`, `assets`, `attendance`, `auth`, `broadcast`, `client`, `crm`, `finance`, `hr`, `leave`, `notifications`, `payroll`, `performance`, `portal`, `projects`, `reports`, `role-permissions`, `search`, `services`, `staff`, `support`, `tasks`

---

## Appendix C — Missing CRUD summary

Most list/detail flows implement **C/R/U/D** where the backend exposes routes. Intentional limitations:

| Feature | Missing in UI | Reason |
|---------|---------------|--------|
| Broadcast | Update | API is create/list/delete only. |
| Some finance fields | Varies | Match `finance` router capabilities. |
| Preferences | Server CRUD | No API by design (Phase 2). |

---

**Last updated:** 2026-04-04 — Phase 1 + Phase 2 (payroll period, dashboard errors, 2FA hydration). Preferences API still optional; HR performance route duplication = Phase 3.
