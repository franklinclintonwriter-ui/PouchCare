# PouchCare — Management UI + API audit (master task list)

**Single file** for completing the full audit: every Management page, every mounted API router, and every `src/api` client.

**Completed:** Part **A (P01–P75)** — deep code review (2026-04-04): routes, hooks, loading/error/toast patterns, and known gaps per row in **Notes**. Parts **B/C** — mount + client map verification. **Follow-up:** manual E2E and permission edge cases in staging.

| Area | Rows | Progress |
|------|------|----------|
| A. Pages | 75 | 75 / 75 |
| B. API mounts + health | 30 | 30 / 30 |
| C. API client modules | 23 | 23 / 23 |
| **Total** | **128** | **128 / 128** |

**References:** [routes/index.tsx](../../apps/management/src/routes/index.tsx) · [server.ts](../../apps/api/src/server.ts) · [00-inventory.md](./00-inventory.md) · [page template](./templates/page-audit-template.md) · **[Gap inventory](./incomplete-gap-inventory.md)** (incomplete/partial UI↔API areas)

**Suggested order:** Auth + settings → dashboard/tasks/projects/reports/attendance/leave → HR/payroll/performance → finance/CRM → assets/services/support/broadcast/analytics/notifications → admin portal + member portal → Part B + C in `server.ts` order.

---

## Part A — Management pages (75)

**Legend:** `[x]` = reviewed in code · **Notes** = wiring, UX gaps, follow-ups (no `|` inside cells)

### A.1 Auth (guest routes)

| Done | ID | Route URL | Page file | Primary API client(s) | Status | Notes |
|------|-----|-----------|-----------|------------------------|--------|-------|
| [x] | P01 | `/login` | `pages/auth/StaffLogin.tsx` | `auth` | Done | `GuestGuard`; `useStaffLogin`; 2FA path when required; toast on failure |
| [x] | P02 | `/portal/login` | `pages/auth/PortalLogin.tsx` | `auth` | Done | `GuestGuard`; `usePortalLogin`; same pattern as staff |
| [x] | P03 | `/portal/register` | `pages/auth/PortalRegister.tsx` | `auth` | Done | `usePortalRegister`; success may precede email verify (backend Resend) |
| [x] | P04 | `/forgot-password` | `pages/auth/ForgotPassword.tsx` | `auth` | Done | Staff forgot flow via `auth` hooks |
| [x] | P05 | `/reset-password` | `pages/auth/ResetPassword.tsx` | `auth` | Done | Token from query; `useResetPassword` |
| [x] | P06 | `/verify-email` | `pages/auth/VerifyEmail.tsx` | `auth` | Done | `useVerifyEmail` + resend; handles missing token in UI |

### A.2 Staff shell — overview and work

| Done | ID | Route URL | Page file | Primary API client(s) | Status | Notes |
|------|-----|-----------|-----------|------------------------|--------|-------|
| [x] | P07 | `/` | `pages/dashboard/Dashboard.tsx` | `analytics` | Done | Six parallel hooks (`useHealthScore`, revenue, staff, clients, leaderboard, forecast); loading passed to widgets; no single page-level `isError` banner—verify empty states in child KPI/chart components |
| [x] | P08 | `/staff` | `pages/staff/StaffList.tsx` | `staff` | Done | CRUD + `DataTable`; pagination via API meta |
| [x] | P09 | `/staff/:id` | `pages/staff/StaffDetail.tsx` | `staff`, `attendance`, `tasks` | Done | Aggregates member, attendance slice, tasks; confirm 404 when invalid id |
| [x] | P10 | `/staff/leaderboard` | `pages/staff/Leaderboard.tsx` | `staff` | Done | Leaderboard hook; loading in UI |
| [x] | P11 | `/staff/branches` | `pages/staff/BranchManagement.tsx` | `admin-resources` | Done | `RoleGuard` CEO/Co-MD/Ops; branch CRUD |
| [x] | P12 | `/tasks` | `pages/tasks/TaskList.tsx` | `tasks` | Done | Filters + create; `DataTable` |
| [x] | P13 | `/tasks/mine` | `pages/tasks/MyTasks.tsx` | `tasks` | Done | Scoped list |
| [x] | P14 | `/tasks/:id` | `pages/tasks/TaskDetail.tsx` | `tasks` | Done | Comments + status; loading and mutations |
| [x] | P15 | `/projects` | `pages/projects/ProjectList.tsx` | `projects` | Done | Create + list |
| [x] | P16 | `/projects/:id` | `pages/projects/ProjectDetail.tsx` | `projects`, `tasks` | Done | Project + related tasks |

### A.3 Attendance, leave, reports

| Done | ID | Route URL | Page file | Primary API client(s) | Status | Notes |
|------|-----|-----------|-----------|------------------------|--------|-------|
| [x] | P17 | `/attendance` | `pages/attendance/MyAttendance.tsx` | `attendance` | Done | History + stats from hooks |
| [x] | P18 | `/attendance/team` | `pages/attendance/TeamAttendance.tsx` | `attendance` | Done | Manager-style view |
| [x] | P19 | `/attendance/check` | `pages/attendance/CheckinCheckout.tsx` | `attendance` | Done | Today + check-in/out mutations |
| [x] | P20 | `/leave` | `pages/leave/LeaveList.tsx` | `leave` | Done | Approve/reject/cancel flows |
| [x] | P21 | `/leave/request` | `pages/leave/LeaveRequestForm.tsx` | `leave` | Done | Apply mutation + validation |
| [x] | P22 | `/reports` | `pages/reports/DailyReports.tsx` | `reports` | Done | List + filters |
| [x] | P23 | `/reports/submit` | `pages/reports/ReportSubmit.tsx` | `reports` | Done | Submit daily report |

### A.4 HR, payroll, performance

| Done | ID | Route URL | Page file | Primary API client(s) | Status | Notes |
|------|-----|-----------|-----------|------------------------|--------|-------|
| [x] | P24 | `/payroll` | `pages/payroll/PayrollList.tsx` | `payroll` | Done | `RoleGuard` ops+; list uses current month/year constants (no month picker yet—by design or backlog) |
| [x] | P25 | `/payroll/:id` | `pages/payroll/PayrollDetail.tsx` | `payroll` | Done | Detail + mark paid |
| [x] | P26 | `/performance` | `pages/hr/Performance.tsx` | `performance` | Done | Reviews list + create |
| [x] | P27 | `/hr/positions` | `pages/hr/Positions.tsx` | `hr` | Done | `RoleGuard` HR+exec; CRUD modals |
| [x] | P28 | `/hr/applications` | `pages/hr/Applications.tsx` | `hr` | Done | Table + stage updates |
| [x] | P29 | `/hr/applications/:id` | `pages/hr/ApplicationDetail.tsx` | `hr` | Done | `useApplication(id)`; star rating still inferred from `experienceYears` in mapper—confirm product intent |

### A.5 Finance and CRM

| Done | ID | Route URL | Page file | Primary API client(s) | Status | Notes |
|------|-----|-----------|-----------|------------------------|--------|-------|
| [x] | P30 | `/finance/invoices` | `pages/finance/InvoiceList.tsx` | `finance` | Done | `RoleGuard`; create + list |
| [x] | P31 | `/finance/invoices/:id` | `pages/finance/InvoiceDetail.tsx` | `finance` | Done | Detail + delete |
| [x] | P32 | `/finance/expenses` | `pages/finance/ExpenseList.tsx` | `finance` | Done | Same pattern as invoices |
| [x] | P33 | `/finance/expenses/:id` | `pages/finance/ExpenseDetail.tsx` | `finance` | Done | Detail + delete |
| [x] | P34 | `/finance/revenue` | `pages/finance/Revenue.tsx` | `finance` | Done | Revenue breakdown |
| [x] | P35 | `/finance/forecast` | `pages/finance/Forecast.tsx` | `finance` | Done | Forecast + revenue hooks |
| [x] | P36 | `/finance/exchange-rates` | `pages/finance/ExchangeRates.tsx` | `admin-resources` | Done | Admin rates CRUD |
| [x] | P37 | `/crm/leads` | `pages/crm/LeadList.tsx` | `crm` | Done | Create + list |
| [x] | P38 | `/crm/leads/:id` | `pages/crm/LeadDetail.tsx` | `crm` | Done | Lead detail + updates |
| [x] | P39 | `/crm/pipeline` | `pages/crm/Pipeline.tsx` | `crm` | Done | Stage columns from `useLeadsByStage` |
| [x] | P40 | `/crm/orders` | `pages/crm/SalesOrders.tsx` | `crm` | Done | Orders table + actions |
| [x] | P41 | `/crm/orders/:id` | `pages/crm/SalesOrderDetail.tsx` | `crm` | Done | Staff order detail |
| [x] | P42 | `/crm/clients` | `pages/crm/ClientAccounts.tsx` | `admin-resources` | Done | Client accounts via admin resources API |

### A.6 Assets and services

| Done | ID | Route URL | Page file | Primary API client(s) | Status | Notes |
|------|-----|-----------|-----------|------------------------|--------|-------|
| [x] | P43 | `/assets/domains` | `pages/assets/Domains.tsx` | `assets` | Done | CRUD + row navigation to detail |
| [x] | P44 | `/assets/domains/:id` | `pages/assets/DomainDetail.tsx` | `assets` | Done | `useDomain` detail |
| [x] | P45 | `/assets/servers` | `pages/assets/Servers.tsx` | `assets` | Done | Same pattern as domains |
| [x] | P46 | `/assets/servers/:id` | `pages/assets/ServerDetail.tsx` | `assets` | Done | Detail |
| [x] | P47 | `/assets/websites` | `pages/assets/Websites.tsx` | `assets` | Done | List + modals |
| [x] | P48 | `/assets/websites/:id` | `pages/assets/WebsiteDetail.tsx` | `assets` | Done | Detail |
| [x] | P49 | `/assets/devices` | `pages/assets/Devices.tsx` | `admin-resources` | Done | `RoleGuard`; devices via admin API |
| [x] | P50 | `/services` | `pages/services/ServiceList.tsx` | `services` | Done | Service catalog CRUD |
| [x] | P51 | `/services/backlinks` | `pages/services/BacklinkPackages.tsx` | `services` | Done | Backlink packages + archive |

### A.7 Support, broadcast, analytics, notifications, settings

| Done | ID | Route URL | Page file | Primary API client(s) | Status | Notes |
|------|-----|-----------|-----------|------------------------|--------|-------|
| [x] | P52 | `/support` | `pages/support/TicketList.tsx` | `support` | Done | Staff ticket list |
| [x] | P53 | `/support/:id` and `/portal/support/:id` | `pages/support/TicketDetail.tsx` | `support` | Done | Shared component; staff and portal contexts; replies via same API |
| [x] | P54 | `/broadcast` | `pages/broadcast/BroadcastList.tsx` | `broadcast` | Done | `RoleGuard`; list + create (WebSocket elsewhere) |
| [x] | P55 | `/analytics` | `pages/analytics/Analytics.tsx` | `finance` | Done | **Note:** page title "Analytics" but data from `useRevenue` only—no `analytics.ts` KPI endpoints here; charts + table; optional future tie-in to `/v1/analytics` |
| [x] | P56 | `/notifications` | `pages/notifications/NotificationList.tsx` | `notifications` | Done | In-app list + store |
| [x] | P57 | `/settings/profile` | `pages/settings/Profile.tsx` | `auth` | Done | `useUpdateStaffProfile` |
| [x] | P58 | `/settings/security` | `pages/settings/Security.tsx` | `auth` | Done | Password + 2FA via hooks; **Active Sessions** card states per-device revoke not available (copy only); 2FA `Toggle` local state not loaded from server—confirm sync if API adds GET |
| [x] | P59 | `/settings/preferences` | `pages/settings/Preferences.tsx` | — | Done | **No API**—`localStorage` only; dense tables + timezone prefs |

### A.8 Admin portal (staff — CEO/Co-MD/Ops)

| Done | ID | Route URL | Page file | Primary API client(s) | Status | Notes |
|------|-----|-----------|-----------|------------------------|--------|-------|
| [x] | P60 | `/admin/portal/members` | `pages/portal/admin/PortalMembers.tsx` | `admin-portal` | Done | `RoleGuard`; member list + status |
| [x] | P61 | `/admin/portal/members/:id` | `pages/portal/admin/PortalMemberDetail.tsx` | `admin-portal` | Done | Member detail |
| [x] | P62 | `/admin/portal/orders` | `pages/portal/admin/PortalOrdersAdmin.tsx` | `admin-portal` | Done | Admin order management |
| [x] | P63 | `/admin/portal/commissions` | `pages/portal/admin/PortalCommissions.tsx` | `admin-portal` | Done | Commissions table |
| [x] | P64 | `/admin/portal/payouts` | `pages/portal/admin/PortalPayouts.tsx` | `admin-portal` | Done | Payout processing |
| [x] | P65 | `/admin/portal/deposits` | `pages/portal/admin/PortalDeposits.tsx` | `admin-portal` | Done | Deposit approve/reject |

### A.9 Member portal shell (`/portal/*`)

| Done | ID | Route URL | Page file | Primary API client(s) | Status | Notes |
|------|-----|-----------|-----------|------------------------|--------|-------|
| [x] | P66 | `/portal` | `pages/portal/PortalDashboard.tsx` | `portal` | Done | Portal home; orders summary |
| [x] | P67 | `/portal/orders` | `pages/portal/PortalOrders.tsx` | `portal` | Done | Member orders list |
| [x] | P68 | `/portal/orders/:id` | `pages/portal/PortalOrderDetail.tsx` | `portal` | Done | Order + messages |
| [x] | P69 | `/portal/order` | `pages/portal/PlaceOrder.tsx` | `portal`, `services` | Done | Catalog + place order |
| [x] | P70 | `/portal/wallet` | `pages/portal/Wallet.tsx` | `portal` | Done | Balance + txs + deposit |
| [x] | P71 | `/portal/referrals` | `pages/portal/Referrals.tsx` | `portal` | Done | Referral stats |
| [x] | P72 | `/portal/referrals/leaderboard` | `pages/portal/ReferralLeaderboard.tsx` | `portal` | Done | Leaderboard table |
| [x] | P73 | `/portal/commissions` | `pages/portal/Commissions.tsx` | `portal` | Done | Commissions list |
| [x] | P74 | `/portal/support` | `pages/portal/PortalSupport.tsx` | `support` | Done | Create ticket + list |
| [x] | P75 | `/portal/settings` | `pages/portal/PortalSettings.tsx` | `portal`, `auth` | Done | Profile + portal password change |

---

## Part B — API route modules (30)

Express: [apps/api/src/server.ts](../../apps/api/src/server.ts). **Legend:** `[x]` = mount + route file verified

### B.1 Infrastructure

| Done | ID | Mount | Source | Status | Notes |
|------|-----|-------|--------|--------|-------|
| [x] | H01 | `GET /health` | `server.ts` | Done | Liveness |
| [x] | H02 | `GET /health/ready` | `server.ts` | Done | DB readiness |

### B.2 `/v1` — staff and shared

| Done | ID | Mount prefix | Route file | Status | Notes |
|------|-----|--------------|------------|--------|-------|
| [x] | V01 | `/v1/auth` | [routes/auth/index.ts](../../apps/api/src/routes/auth/index.ts) | Done | Technical pass: route + API wiring OK |
| [x] | V02 | `/v1/staff` | [routes/staff/index.ts](../../apps/api/src/routes/staff/index.ts) | Done | Technical pass: route + API wiring OK |
| [x] | V03 | `/v1/tasks` | [routes/tasks/index.ts](../../apps/api/src/routes/tasks/index.ts) | Done | Technical pass: route + API wiring OK |
| [x] | V04 | `/v1/projects` | [routes/projects/index.ts](../../apps/api/src/routes/projects/index.ts) | Done | Technical pass: route + API wiring OK |
| [x] | V05 | `/v1/attendance` | [routes/attendance/index.ts](../../apps/api/src/routes/attendance/index.ts) | Done | Technical pass: route + API wiring OK |
| [x] | V06 | `/v1/leave` | [routes/leave/index.ts](../../apps/api/src/routes/leave/index.ts) | Done | Technical pass: route + API wiring OK |
| [x] | V07 | `/v1/reports` | [routes/reports/index.ts](../../apps/api/src/routes/reports/index.ts) | Done | Technical pass: route + API wiring OK |
| [x] | V08 | `/v1/performance` | [routes/performance/index.ts](../../apps/api/src/routes/performance/index.ts) | Done | Technical pass: route + API wiring OK |
| [x] | V09 | `/v1/payroll` | [routes/payroll/index.ts](../../apps/api/src/routes/payroll/index.ts) | Done | Technical pass: route + API wiring OK |
| [x] | V10 | `/v1/finance` | [routes/finance/index.ts](../../apps/api/src/routes/finance/index.ts) | Done | Technical pass: route + API wiring OK |
| [x] | V11 | `/v1/crm` | [routes/crm/index.ts](../../apps/api/src/routes/crm/index.ts) | Done | Technical pass: route + API wiring OK |
| [x] | V12 | `/v1/assets` | [routes/assets/index.ts](../../apps/api/src/routes/assets/index.ts) | Done | Technical pass: route + API wiring OK |
| [x] | V13 | `/v1/hr` | [routes/hr/index.ts](../../apps/api/src/routes/hr/index.ts) | Done | Technical pass: route + API wiring OK |
| [x] | V14 | `/v1/services` | [routes/services/index.ts](../../apps/api/src/routes/services/index.ts) | Done | Technical pass: route + API wiring OK |
| [x] | V15 | `/v1/backlink-packages` | [routes/services/backlinks.ts](../../apps/api/src/routes/services/backlinks.ts) | Done | Technical pass: route + API wiring OK |
| [x] | V16 | `/v1/broadcast` | [routes/broadcast/index.ts](../../apps/api/src/routes/broadcast/index.ts) | Done | Technical pass: route + API wiring OK |
| [x] | V17 | `/v1/support` | [routes/support/index.ts](../../apps/api/src/routes/support/index.ts) | Done | Technical pass: route + API wiring OK |
| [x] | V18 | `/v1/notifications` | [routes/notifications/index.ts](../../apps/api/src/routes/notifications/index.ts) | Done | Technical pass: route + API wiring OK |
| [x] | V19 | `/v1/search` | [routes/search/index.ts](../../apps/api/src/routes/search/index.ts) | Done | Technical pass: route + API wiring OK |
| [x] | V20 | `/v1/analytics` | [routes/analytics/index.ts](../../apps/api/src/routes/analytics/index.ts) | Done | Technical pass: route + API wiring OK |

### B.3 `/v1` — portal (member)

| Done | ID | Mount prefix | Route file | Status | Notes |
|------|-----|--------------|------------|--------|-------|
| [x] | V21 | `/v1/portal` | [routes/portal/auth.ts](../../apps/api/src/routes/portal/auth.ts) | Done | Register, login, verify |
| [x] | V22 | `/v1/portal/me` | [routes/portal/me.ts](../../apps/api/src/routes/portal/me.ts) | Done | Technical pass: route + API wiring OK |
| [x] | V23 | `/v1/portal/wallet` | [routes/portal/wallet.ts](../../apps/api/src/routes/portal/wallet.ts) | Done | Technical pass: route + API wiring OK |
| [x] | V24 | `/v1/portal/orders` | [routes/portal/orders.ts](../../apps/api/src/routes/portal/orders.ts) | Done | Technical pass: route + API wiring OK |
| [x] | V25 | `/v1/portal/referrals` | [routes/portal/referrals.ts](../../apps/api/src/routes/portal/referrals.ts) | Done | Technical pass: route + API wiring OK |
| [x] | V26 | `/v1/portal/commissions` | [routes/portal/commissions.ts](../../apps/api/src/routes/portal/commissions.ts) | Done | Technical pass: route + API wiring OK |

### B.4 `/v1` — admin

| Done | ID | Mount prefix | Route file | Status | Notes |
|------|-----|--------------|------------|--------|-------|
| [x] | V27 | `/v1/admin/portal` | [routes/admin/portal.ts](../../apps/api/src/routes/admin/portal.ts) | Done | Technical pass: route + API wiring OK |
| [x] | V28 | `/v1/admin` | [routes/admin/resources.ts](../../apps/api/src/routes/admin/resources.ts) | Done | Technical pass: route + API wiring OK |

---

## Part C — Management API client modules (23)

Base: [apps/management/src/api/client.ts](../../apps/management/src/api/client.ts)

| Done | ID | Client file | Backend prefix(es) | Example consumers | Status | Notes |
|------|-----|-------------|---------------------|-------------------|--------|-------|
| [x] | C01 | `client.ts` | _(axios base, interceptors)_ | All | Done | Base URL `/v1`; auth refresh — technical pass OK |
| [x] | C02 | `auth.ts` | `/v1/auth`, portal password | Login, register, reset, verify, 2FA, profile | Done | Technical pass: route + API wiring OK |
| [x] | C03 | `staff.ts` | `/v1/staff` | Staff list, detail, leaderboard | Done | Technical pass: route + API wiring OK |
| [x] | C04 | `tasks.ts` | `/v1/tasks` | Tasks, project detail | Done | Technical pass: route + API wiring OK |
| [x] | C05 | `projects.ts` | `/v1/projects` | Projects | Done | Technical pass: route + API wiring OK |
| [x] | C06 | `attendance.ts` | `/v1/attendance` | Attendance pages, staff detail | Done | Technical pass: route + API wiring OK |
| [x] | C07 | `leave.ts` | `/v1/leave` | Leave | Done | Technical pass: route + API wiring OK |
| [x] | C08 | `reports.ts` | `/v1/reports` | Reports | Done | Technical pass: route + API wiring OK |
| [x] | C09 | `performance.ts` | `/v1/performance` | HR performance | Done | Technical pass: route + API wiring OK |
| [x] | C10 | `payroll.ts` | `/v1/payroll` | Payroll | Done | Technical pass: route + API wiring OK |
| [x] | C11 | `finance.ts` | `/v1/finance` | Finance pages, analytics revenue | Done | Technical pass: route + API wiring OK |
| [x] | C12 | `crm.ts` | `/v1/crm` | CRM | Done | Technical pass: route + API wiring OK |
| [x] | C13 | `assets.ts` | `/v1/assets` | Assets | Done | Technical pass: route + API wiring OK |
| [x] | C14 | `hr.ts` | `/v1/hr` | HR | Done | Technical pass: route + API wiring OK |
| [x] | C15 | `services.ts` | `/v1/services`, `/v1/backlink-packages` | Services, place order | Done | Technical pass: route + API wiring OK |
| [x] | C16 | `broadcast.ts` | `/v1/broadcast` | Broadcast | Done | Technical pass: route + API wiring OK |
| [x] | C17 | `support.ts` | `/v1/support` | Tickets | Done | Technical pass: route + API wiring OK |
| [x] | C18 | `notifications.ts` | `/v1/notifications` | Notifications | Done | Technical pass: route + API wiring OK |
| [x] | C19 | `search.ts` | `/v1/search` | CommandPalette | Done | Technical pass: route + API wiring OK |
| [x] | C20 | `analytics.ts` | `/v1/analytics` | Dashboard | Done | Technical pass: route + API wiring OK |
| [x] | C21 | `portal.ts` | `/v1/portal/me`, wallet, orders, referrals, commissions | Portal shell | Done | Technical pass: route + API wiring OK |
| [x] | C22 | `admin-portal.ts` | `/v1/admin/portal` | Admin portal pages | Done | Technical pass: route + API wiring OK |
| [x] | C23 | `admin-resources.ts` | `/v1/admin` | Branches, devices, rates, clients | Done | Technical pass: route + API wiring OK |

---

## Completion checklist

- [x] Part A — all **P01–P75** reviewed (deep code review; Notes per row)
- [x] Part B — **H01–H02**, **V01–V28** reviewed (mounts + files present)
- [x] Part C — **C01–C23** reviewed (client modules map to `/v1`)
- [x] Orphan check: each client module has at least one importer (pages, layout, or `CommandPalette` for `search`)

Run `node scripts/generate-audit-inventory.mjs` periodically to keep [00-inventory.md](./00-inventory.md) aligned with the repo.
