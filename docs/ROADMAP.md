# PouchCare — Enterprise Overhaul Roadmap

> **Scope:** company/internal side only (staff, branches, HR, payroll, attendance, leave,
> tasks, projects, performance, reports, monitor/CCTV, dashboard/analytics, RBAC, audit,
> notifications). **Excludes** the customer portal / landing / services.
>
> **Stack decisions:** MySQL (fresh start) · Cloudflare R2 (sole storage) · Supabase removed.
> **Delivery:** stacked PRs; AI drives the critical path, Copilot handles parallelizable PRs.

This file is the **static** plan. Live status lives in [`PROGRESS.md`](./PROGRESS.md);
the append-only decision log is [`ledger/PR-INDEX.md`](./ledger/PR-INDEX.md).

## Branching model
- Integration branch **`enterprise/main`** (off `main`). Merges to `main` after Phase 1 + 2.
- Critical-path PRs **stack** (each branches off the previous). Parallelizable PRs branch off
  the lowest merged critical-path commit they depend on, staying independently green.
- Naming: `ent/p{phase}-{slug}` (e.g. `ent/p1-mysql-cutover`).
- Merge gate: CI `quality:typecheck` green from PR-0.3 onward + ledger-update guard.

## Seeding decision (recommended)
Greenfield ⇒ **seed production ONCE, after Phase 2.** This folds all purely-additive Phase-2
schema (audit reconcile, branch FKs, session table) into the single `0_init` MySQL migration —
no extra migrations, no backfill. If prod is seeded after Phase 1 instead, 2.1/2.3/2.5 become
additive migrations + a branch backfill script.

## Phases & PRs

Legend: **[CP]** critical-path (AI-owned) · **[||]** parallelizable (Copilot).

### Phase 0 — Ledger + type-health baseline
| PR | Title | Dep | Owner |
|----|-------|-----|-------|
| 0.1 [CP] | Ledger scaffold (ROADMAP/PROGRESS/PR-INDEX + templates) | — | ai |
| 0.2 [CP] | Complete RBAC `KEY_LABELS` for all 39 permission keys | 0.1 | ai |
| 0.3 [CP] | Clear remaining management `tsc` errors; green baseline + CI ledger guard | 0.2 | ai |

### Phase 1 — Infra cutover (MySQL fresh + R2 + drop Supabase)
| PR | Title | Dep | Owner |
|----|-------|-----|-------|
| 1.1 [CP] | R2 sole storage; drop Supabase fallback in `storage.ts` | 0.3 | ai |
| 1.2 [CP] | Port `fileManager` to R2 via storage lib | 1.1 | ai |
| 1.3 [CP] | Remove Supabase env + deps + AI NL→SQL route | 1.2 | ai |
| 1.4 [CP] | Prisma → MySQL; single fresh `0_init` migration | 1.3 | ai |
| 1.5 [CP] | Verify seed on MySQL; `docs/DEPLOY-MYSQL.md` runbook | 1.4 | ai |
| 1.6 [CP] | docker-compose + CI Postgres→MySQL | 1.5 | ai |

### Phase 2 — Enterprise foundations
| PR | Title | Dep | Owner |
|----|-------|-----|-------|
| 2.1 [CP] | Align `SystemAuditLog` schema with `audit()` contract | 1.6 | ai |
| 2.2 [||] | Instrument all internal write endpoints with `audit()` | 2.1 | copilot |
| 2.3 [CP] | Real `Branch` FK across internal models | 2.1 | ai |
| 2.4 [CP] | Enforce BRANCH_MANAGER branch scope at query layer | 2.3 | ai |
| 2.5 [CP] | Sessions+revocation, logout, password policy, 2FA enforce | 2.1 | ai |
| 2.6 [||] | vitest harness (auth/rbac/audit) + Playwright in CI | 2.5 | copilot |

### Phase 3+ — Feature waves
**Wave A · People-Ops:** 3.1 Leave quotas/balances/accrual (model **[CP]**, UI **[||]**) → 3.2 Multi-stage approval engine **[CP]** → 3.3 Payslip PDF + recurring payroll **[||]** → 3.4 Bulk ops + CSV import/export **[||]**.
**Wave B · Delivery:** 3.5 Task dependencies/subtasks (model **[CP]**) → 3.6 Recurring tasks **[||]** → 3.7 Task/project exports **[||]**.
**Wave C · Ops visibility:** 3.8 Real-time notifications on approvals/assignments **[||]** → 3.9 Analytics branch/role drill-down **[||]** → 3.10 Monitor/CCTV alert rules **[||]** → 3.11 Geolocation attendance **[||]**.

## Copilot delegation
Delegated: 2.2, 2.6, 3.3, 3.4, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11. Each issue brief must carry:
base+target branch · scope fence (don't touch schema/migrations/auth/env) · pattern reference ·
verify command (+ `tsc` & `audit:coverage` clean) · ledger duty · out-of-scope list.
(Use the [enterprise-task issue template](../.github/ISSUE_TEMPLATE/enterprise-task.md).)

## Owner actions (cannot run in the build sandbox)
- Provide secrets: `DATABASE_URL` (mysql), R2 `S3_*`, `JWT_*`, `RESEND_API_KEY`.
- Run once per env: `prisma migrate dev --name init` (generates `0_init`), then `migrate deploy` + seed.
- Confirm seed-after-Phase-2 sequencing (recommended).
