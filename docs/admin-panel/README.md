# PouchCare Admin Panel

Single place to manage every client, order and service at PouchCare, hosted inside `m.pouchcare.com` under `/admin/*`. Built across Phases 0–5 per the Notion roadmap. This README is the index: what exists, where it lives, and how to run each check.

## 🚀 Quick-start

```bash
# One-time (after pulling new migrations)
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma

# Dev loop
npm run dev:stack

# CI gates (all green-on-main)
npm run audit:coverage
npm run bundle:budget

# E2E (requires seeded DB + running stack)
npm run test:e2e -- e2e/admin-*.spec.ts

# Pre-launch baseline + perf
ADMIN_API_TOKEN=<ceo-jwt> npm run metrics:baseline
ADMIN_API_TOKEN=<ceo-jwt> npm run perf:admin

# Rollout
npm run flag:status
npm run flag:set -- --env=production --stage=owner-only
```

## 📂 Where everything lives

### Backend (`apps/api/src/routes/admin/`)

| Route | Purpose |
| --- | --- |
| `overview.ts` | `/v1/admin/overview` — KPI dashboard aggregates |
| `clients.ts` | `/v1/admin/clients` — unified PortalMember + ClientAccount; merge; adjust-wallet; activity; segments; CSV export |
| `orders.ts` | `/v1/admin/orders` — unified across PortalOrder/SalesOrder/ApkJob; advance; rollback; refund; bulk; CSV export |
| `services.ts` | `/v1/admin/services` — admin catalog + ServicePlan CRUD + per-service performance |
| `assets.ts` | `/v1/admin/assets/client/:id` — websites/domains scoped by client |
| `audit.ts` | `/v1/admin/audit` — read-only SystemAuditLog view + CSV |
| `lib/auditLog.ts` | `audit()` helper every admin write calls |

### Frontend (`apps/management/src/pages/admin/`)

| Page | Path |
| --- | --- |
| Overview | `/admin` |
| Clients list / detail | `/admin/clients` / `/admin/clients/:id` |
| Orders list / detail / new | `/admin/orders` / `/admin/orders/:id` / `/admin/orders/new` |
| Service catalog / detail | `/admin/services` / `/admin/services/:id` |
| Billing | `/admin/billing/{invoices,deposits,payouts,commissions}` |
| Support | `/admin/support` |
| Broadcast | `/admin/broadcast` |
| Audit log | `/admin/settings/audit` |

### Shared types

- `packages/types/src/admin/index.ts` — `UnifiedClient`, `AdminOrder`, `AdminOrderStatus`, `ORDER_STATUS_DAG`, mutation payload shapes.

### Data model additions (Prisma migrations)

| Migration | Adds |
| --- | --- |
| `20260417120000_service_plans` | `ServicePlan` model — tiered pricing per Service |
| `20260417130000_client_segments` | `ClientSegment` model — saved filter presets for Clients list |

### Scripts (`scripts/`)

| Command | Purpose |
| --- | --- |
| `npm run audit:coverage` | Fail CI if any new admin mutation lacks `audit()` |
| `npm run bundle:budget` | Fail CI if admin chunks > 150 KB gz |
| `npm run perf:admin` | p50/p95/p99 per endpoint vs budget |
| `npm run metrics:baseline` | Pre-launch JSON snapshot under `docs/admin-panel/metrics/` |
| `npm run flag:status` | Inspect the VITE_ADMIN_ENABLED flag across envs |
| `npm run flag:set -- --env=ENV --stage=STAGE` | Flip the flag for a rollout stage |

### E2E specs (`e2e/`)

| Spec | Covers |
| --- | --- |
| `admin-panel.spec.ts` | 8 golden flows (happy paths) |
| `admin-rbac.spec.ts` | Role × endpoint expected allow/deny matrix (UI + server) |
| `admin-api.spec.ts` | Direct API shape + idempotency + DAG validation |
| `admin-a11y.spec.ts` | axe-core WCAG 2.1 AA on every page |

## 📘 Documents

- [**Staff Handbook**](Staff_Handbook.docx) — how to use the panel (audience: managers, ops, finance, support)
- [**Internal Runbook**](Internal_Runbook.docx) — refund / merge / wallet-adjust / advance-rollback semantics (CEO / Co-MD / Finance only)
- [**ADR 0001**](../adrs/0001-unified-clients-and-orders.md) — unified clients + orders decision
- [**ADR 0002**](../adrs/0002-service-plan-model.md) — ServicePlan model decision

## 🛡️ Security model

Every sidebar entry and every write button is gated by a permission key. Keys are defined in `apps/api/src/lib/managementPermissions.ts` and kept in sync with `apps/management/src/constants/permissionKeys.ts`.

| Default role | Can |
| --- | --- |
| Manager+ | Read all admin sections |
| Ops | Write clients, orders, services; assign orders |
| CEO / Co-MD | Refund orders, merge clients, adjust wallets, change service pricing, approve deposits/payouts |

Every state-mutating endpoint writes a `SystemAuditLog` row via the `audit()` helper. `scripts/audit-coverage.mjs` verifies this at CI time — the check is gated by GitLab job `admin:audit-coverage`.

## 📊 Phase ledger

| Phase | Status |
| --- | --- |
| 0 — Foundation | ✅ 12/12 |
| 1 — Clients | ✅ 16/16 |
| 2 — Orders | ✅ 13/13 |
| 3 — Services | ✅ 11/11 |
| 4 — Supporting | ✅ 17/17 |
| 5 — Hardening | ✅ 14/15 (only manual manager walkthrough remains) |

Source of truth: the Notion **Workflows & Todos** database (`b666159356944c21a685c781f5b84e6b`) and the **Implementation Roadmap** page (`344510b39ec9816d9758d2c168108060`).

## 🎯 Post-launch monitoring

1. Error rate per `/admin/*` endpoint (log aggregator).
2. p95 + p99 latency per endpoint (Grafana dashboard).
3. Audit-log write-failure alert.
4. Refund endpoint idempotency-collision rate.
5. Admin panel 5xx rate vs management app baseline.
6. Weekly review of open `admin.*` permission denials (catches miswired gates).

## 🤝 Getting help

- Questions / bugs → `#admin-panel` in Slack.
- Permission requests → CEO or Co-MD (Settings → Role Permissions).
- Reversible incidents → see Internal Runbook chapter for the affected action.
