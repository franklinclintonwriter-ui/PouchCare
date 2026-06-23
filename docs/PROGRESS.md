# PouchCare Enterprise Overhaul — Progress

<!-- Any agent/session: READ THIS BLOCK FIRST to resume work. Keep it accurate in every PR. -->
## CURRENT STATE / RESUME HERE
- **Integration branch:** `enterprise/main` (off `main` @ 953cd99)
- **Active branch:** `ent/p1-infra-mysql` (PR-1.6 #13, stacked on `ent/p1-seed-mysql` #12)
- **Last merged enterprise PR:** #4–#9 in `enterprise/main` @ 27fe7d6. **Phase-1 cutover PRs #10, #11, #12, #13 in review.**
- **Next action:** **Phase 1 is code-complete.** Owner: (1) generate `0_init` on a live MySQL + set `DATABASE_URL`(mysql)/R2 secrets (see `MIGRATION_NOTES.md` / `docs/DEPLOY-MYSQL.md`); (2) merge the Phase-1 stack #10→#11→#12→#13. Then **Phase 2 / PR-2.1** (SystemAuditLog schema/contract reconcile).
- **Known-broken / notes:** `apps/api` + `apps/management` tsc 0; all 3 compose files parse as `mysql:8`; no postgres refs in compose/env. **Follow-up:** Windows dev scripts (`scripts/*.ps1`) + `deploy/server-init.sh` still mention postgres — non-deploy-critical (DB runs in the `mysql` container). PR #3 (service picker) is separate.
- **Protocol reminder:** every PR must (1) flip its line below, (2) update this block, (3) append to `ledger/PR-INDEX.md`. Enforced on merge requests by the `quality:ledger` CI job (`scripts/check-ledger.mjs`).

Status values: `TODO` · `WIP` · `IN_REVIEW` · `MERGED`. Each line carries its roadmap effort tag — `[CP]` critical-path (AI) / `[||]` parallelizable (Copilot); dependencies live in `ROADMAP.md`.

## Phase 0 — Ledger + type-health
- [x] PR-0.1 `[CP]` Ledger scaffold — branch:ent/p0-ledger — status:MERGED — pr:#4 — owner:ai
- [x] PR-0.2 `[CP]` RBAC permission labels (all keys) — branch:ent/p0-rbac-labels — status:MERGED — pr:#5 — owner:ai
- [x] PR-0.3 `[CP]` Clear management tsc errors + CI ledger guard — branch:ent/p0-typehealth — status:MERGED — pr:#6 — owner:ai

## Phase 1 — Infra cutover (MySQL fresh + R2 + drop Supabase)
- [x] PR-1.1 `[CP]` R2 sole storage — branch:ent/p1-storage-r2 — status:MERGED — pr:#7 — owner:ai
- [x] PR-1.2 `[CP]` fileManager → R2 — branch:ent/p1-filemanager-r2 — status:MERGED — pr:#8 — owner:ai
- [x] PR-1.3 `[CP]` Remove Supabase analytics mirrors + NL→SQL route — branch:ent/p1-drop-supabase — status:MERGED — pr:#9 — owner:ai
- [ ] PR-1.3b `[CP]` Port workspace storage→R2; delete Supabase lib/deps/env + WorkspaceEditor UI — branch:ent/p1-drop-supabase-2 — status:IN_REVIEW — pr:#10 — owner:ai — verify:`grep -ri supabase apps/*/src` empty; tsc both apps
- [ ] PR-1.4 `[CP]` Prisma → MySQL + 0_init — branch:ent/p1-mysql — status:IN_REVIEW — pr:#11 — owner:ai — verify:`prisma validate && generate` ✓; apps/api tsc 0; owner runs `migrate dev`
- [ ] PR-1.5 `[CP]` Seed on MySQL + runbook — branch:ent/p1-seed-mysql — status:IN_REVIEW — pr:#12 — owner:ai — verify:seed audited MySQL-compatible; docs/DEPLOY-MYSQL.md added
- [ ] PR-1.6 `[CP]` compose + env → MySQL — branch:ent/p1-infra-mysql — status:IN_REVIEW — pr:#13 — owner:ai — verify:all 3 `docker compose config` parse as mysql:8; no postgres refs

## Phase 2 — Enterprise foundations
- [ ] PR-2.1 `[CP]` Audit schema/contract align — branch:ent/p2-audit-schema — status:TODO — owner:ai — verify:prisma validate; tsc no `as any`
- [ ] PR-2.2 `[||]` Audit coverage ~100% — branch:ent/p2-audit-coverage — status:TODO — owner:copilot — verify:`npm run audit:coverage` ~100%
- [ ] PR-2.3 `[CP]` Branch FK isolation — branch:ent/p2-branch-fk — status:TODO — owner:ai — verify:prisma validate; 0 orphan rows
- [ ] PR-2.4 `[CP]` BRANCH_MANAGER query scope — branch:ent/p2-branch-scope — status:TODO — owner:ai — verify:rbac.spec blocks cross-branch
- [ ] PR-2.5 `[CP]` Auth hardening — branch:ent/p2-auth — status:TODO — owner:ai — verify:logout invalidates refresh; revoked token → 401
- [ ] PR-2.6 `[||]` Test harness + CI — branch:ent/p2-tests — status:TODO — owner:copilot — verify:`npm test` green; CI runs vitest+e2e

## Phase 3+ — Feature waves
- [ ] PR-3.1 `[CP]`/`[||]` Leave quotas/balances/accrual — owner:ai(model)/copilot(UI) — status:TODO
- [ ] PR-3.2 `[CP]` Approval workflow engine — owner:ai — status:TODO
- [ ] PR-3.3 `[||]` Payslip PDF + recurring payroll — owner:copilot — status:TODO
- [ ] PR-3.4 `[||]` Bulk ops + CSV import/export — owner:copilot — status:TODO
- [ ] PR-3.5 `[CP]` Task dependencies/subtasks — owner:ai — status:TODO
- [ ] PR-3.6 `[||]` Recurring tasks — owner:copilot — status:TODO
- [ ] PR-3.7 `[||]` Task/project exports — owner:copilot — status:TODO
- [ ] PR-3.8 `[||]` Real-time notifications — owner:copilot — status:TODO
- [ ] PR-3.9 `[||]` Analytics branch/role drill-down — owner:copilot — status:TODO
- [ ] PR-3.10 `[||]` Monitor/CCTV alert rules — owner:copilot — status:TODO
- [ ] PR-3.11 `[||]` Geolocation attendance — owner:copilot — status:TODO
