# API — route module audit

**Mirror of [TASKS.md](./TASKS.md) Part B (H01–H02, V01–V28), synced 2026-04-04.** All rows marked **Done** (mount + route file verified).

Express mounts are defined in [apps/api/src/server.ts](../../apps/api/src/server.ts).

**Legend:** `[x]` = mount + route file verified

---

## B.1 Infrastructure

| Done | ID | Mount | Source | Status | Notes |
|------|-----|-------|--------|--------|-------|
| [x] | H01 | `GET /health` | `server.ts` | Done | Liveness |
| [x] | H02 | `GET /health/ready` | `server.ts` | Done | DB readiness |

---

## B.2 `/v1` — staff and shared

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

---

## B.3 `/v1` — portal (member)

| Done | ID | Mount prefix | Route file | Status | Notes |
|------|-----|--------------|------------|--------|-------|
| [x] | V21 | `/v1/portal` | [routes/portal/auth.ts](../../apps/api/src/routes/portal/auth.ts) | Done | Register, login, verify |
| [x] | V22 | `/v1/portal/me` | [routes/portal/me.ts](../../apps/api/src/routes/portal/me.ts) | Done | Technical pass: route + API wiring OK |
| [x] | V23 | `/v1/portal/wallet` | [routes/portal/wallet.ts](../../apps/api/src/routes/portal/wallet.ts) | Done | Technical pass: route + API wiring OK |
| [x] | V24 | `/v1/portal/orders` | [routes/portal/orders.ts](../../apps/api/src/routes/portal/orders.ts) | Done | Technical pass: route + API wiring OK |
| [x] | V25 | `/v1/portal/referrals` | [routes/portal/referrals.ts](../../apps/api/src/routes/portal/referrals.ts) | Done | Technical pass: route + API wiring OK |
| [x] | V26 | `/v1/portal/commissions` | [routes/portal/commissions.ts](../../apps/api/src/routes/portal/commissions.ts) | Done | Technical pass: route + API wiring OK |

---

## B.4 `/v1` — admin

| Done | ID | Mount prefix | Route file | Status | Notes |
|------|-----|--------------|------------|--------|-------|
| [x] | V27 | `/v1/admin/portal` | [routes/admin/portal.ts](../../apps/api/src/routes/admin/portal.ts) | Done | Technical pass: route + API wiring OK |
| [x] | V28 | `/v1/admin` | [routes/admin/resources.ts](../../apps/api/src/routes/admin/resources.ts) | Done | Technical pass: route + API wiring OK |

---

## Inventory cross-check

- **28** `app.use` mounts for `/v1/*` in [server.ts](../../apps/api/src/server.ts) plus **2** health endpoints = **30** auditable rows in the tables above.
- **28** route module files under `apps/api/src/routes/**/*.ts` — see [00-inventory.md](./00-inventory.md) §2.
