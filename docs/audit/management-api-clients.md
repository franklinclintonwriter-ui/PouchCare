# Management app — API client map

**Mirror of [TASKS.md](./TASKS.md) Part C (C01–C23), synced 2026-04-04.** All rows marked **Done** (client modules map to `/v1`).

Files in [apps/management/src/api](../../apps/management/src/api). Each module wraps `api` from [client.ts](../../apps/management/src/api/client.ts) (axios instance, `/v1` base URL).

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

## Orphan / unused client check

Confirmed in [TASKS.md](./TASKS.md): each client module has at least one importer (pages, layout, or `CommandPalette` for `search`).
