# Management UI — page-by-page audit

**Mirror of [TASKS.md](./TASKS.md) Part A (P01–P75), synced 2026-04-04.** All rows marked **Done** after deep code review.

Routes are defined in [apps/management/src/routes/index.tsx](../../apps/management/src/routes/index.tsx).

**Legend:** `[x]` = reviewed in code · **Notes** = wiring, UX gaps, follow-ups (no `|` inside cells)

---

## A.1 Auth (guest routes)

| Done | ID | Route URL | Page file | Primary API client(s) | Status | Notes |
|------|-----|-----------|-----------|------------------------|--------|-------|
| [x] | P01 | `/login` | `pages/auth/StaffLogin.tsx` | `auth` | Done | `GuestGuard`; `useStaffLogin`; 2FA path when required; toast on failure |
| [x] | P02 | `/portal/login` | `pages/auth/PortalLogin.tsx` | `auth` | Done | `GuestGuard`; `usePortalLogin`; same pattern as staff |
| [x] | P03 | `/portal/register` | `pages/auth/PortalRegister.tsx` | `auth` | Done | `usePortalRegister`; success may precede email verify (backend Resend) |
| [x] | P04 | `/forgot-password` | `pages/auth/ForgotPassword.tsx` | `auth` | Done | Staff forgot flow via `auth` hooks |
| [x] | P05 | `/reset-password` | `pages/auth/ResetPassword.tsx` | `auth` | Done | Token from query; `useResetPassword` |
| [x] | P06 | `/verify-email` | `pages/auth/VerifyEmail.tsx` | `auth` | Done | `useVerifyEmail` + resend; handles missing token in UI |

## A.2 Staff shell — overview and work

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

## A.3 Attendance, leave, reports

| Done | ID | Route URL | Page file | Primary API client(s) | Status | Notes |
|------|-----|-----------|-----------|------------------------|--------|-------|
| [x] | P17 | `/attendance` | `pages/attendance/MyAttendance.tsx` | `attendance` | Done | History + stats from hooks |
| [x] | P18 | `/attendance/team` | `pages/attendance/TeamAttendance.tsx` | `attendance` | Done | Manager-style view |
| [x] | P19 | `/attendance/check` | `pages/attendance/CheckinCheckout.tsx` | `attendance` | Done | Today + check-in/out mutations |
| [x] | P20 | `/leave` | `pages/leave/LeaveList.tsx` | `leave` | Done | Approve/reject/cancel flows |
| [x] | P21 | `/leave/request` | `pages/leave/LeaveRequestForm.tsx` | `leave` | Done | Apply mutation + validation |
| [x] | P22 | `/reports` | `pages/reports/DailyReports.tsx` | `reports` | Done | List + filters |
| [x] | P23 | `/reports/submit` | `pages/reports/ReportSubmit.tsx` | `reports` | Done | Submit daily report |

## A.4 HR, payroll, performance

| Done | ID | Route URL | Page file | Primary API client(s) | Status | Notes |
|------|-----|-----------|-----------|------------------------|--------|-------|
| [x] | P24 | `/payroll` | `pages/payroll/PayrollList.tsx` | `payroll` | Done | `RoleGuard` ops+; list uses current month/year constants (no month picker yet—by design or backlog) |
| [x] | P25 | `/payroll/:id` | `pages/payroll/PayrollDetail.tsx` | `payroll` | Done | Detail + mark paid |
| [x] | P26 | `/performance` | `pages/hr/Performance.tsx` | `performance` | Done | Reviews list + create |
| [x] | P27 | `/hr/positions` | `pages/hr/Positions.tsx` | `hr` | Done | `RoleGuard` HR+exec; CRUD modals |
| [x] | P28 | `/hr/applications` | `pages/hr/Applications.tsx` | `hr` | Done | Table + stage updates |
| [x] | P29 | `/hr/applications/:id` | `pages/hr/ApplicationDetail.tsx` | `hr` | Done | `useApplication(id)`; star rating inferred from `experienceYears` in mapper—confirm product intent |

## A.5 Finance and CRM

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

## A.6 Assets and services

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

## A.7 Support, broadcast, analytics, notifications, settings

| Done | ID | Route URL | Page file | Primary API client(s) | Status | Notes |
|------|-----|-----------|-----------|------------------------|--------|-------|
| [x] | P52 | `/support` | `pages/support/TicketList.tsx` | `support` | Done | Staff ticket list |
| [x] | P53 | `/support/:id` and `/portal/support/:id` | `pages/support/TicketDetail.tsx` | `support` | Done | Shared component; staff and portal contexts; replies via same API |
| [x] | P54 | `/broadcast` | `pages/broadcast/BroadcastList.tsx` | `broadcast` | Done | `RoleGuard`; list + create (WebSocket elsewhere) |
| [x] | P55 | `/analytics` | `pages/analytics/Analytics.tsx` | `finance` | Done | **Note:** page title "Analytics" but data from `useRevenue` only—no `analytics.ts` KPI endpoints here; charts + table; optional future tie-in to `/v1/analytics` |
| [x] | P56 | `/notifications` | `pages/notifications/NotificationList.tsx` | `notifications` | Done | In-app list + store |
| [x] | P57 | `/settings/profile` | `pages/settings/Profile.tsx` | `auth` | Done | `useUpdateStaffProfile` |
| [x] | P58 | `/settings/security` | `pages/settings/Security.tsx` | `auth` | Done | Password + 2FA; status from `useStaffMe` (`twoFactorEnabled`, `twoFactorPending`); **Active Sessions** still no per-device revoke API |
| [x] | P59 | `/settings/preferences` | `pages/settings/Preferences.tsx` | — | Done | **No API**—`localStorage` only; dense tables + timezone prefs |

## A.8 Admin portal (staff — CEO/Co-MD/Ops)

| Done | ID | Route URL | Page file | Primary API client(s) | Status | Notes |
|------|-----|-----------|-----------|------------------------|--------|-------|
| [x] | P60 | `/admin/portal/members` | `pages/portal/admin/PortalMembers.tsx` | `admin-portal` | Done | `RoleGuard`; member list + status |
| [x] | P61 | `/admin/portal/members/:id` | `pages/portal/admin/PortalMemberDetail.tsx` | `admin-portal` | Done | Member detail |
| [x] | P62 | `/admin/portal/orders` | `pages/portal/admin/PortalOrdersAdmin.tsx` | `admin-portal` | Done | Admin order management |
| [x] | P63 | `/admin/portal/commissions` | `pages/portal/admin/PortalCommissions.tsx` | `admin-portal` | Done | Commissions table |
| [x] | P64 | `/admin/portal/payouts` | `pages/portal/admin/PortalPayouts.tsx` | `admin-portal` | Done | Payout processing |
| [x] | P65 | `/admin/portal/deposits` | `pages/portal/admin/PortalDeposits.tsx` | `admin-portal` | Done | Deposit approve/reject |

## A.9 Member portal shell (`/portal/*`)

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

## Inventory cross-check

**75** checklist rows = **75** page files under `src/pages` (see [00-inventory.md](./00-inventory.md) §1). `TicketDetail` is one file, two routes (`/support/:id`, `/portal/support/:id`).
