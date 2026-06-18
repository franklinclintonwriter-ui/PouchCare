# PouchCare Enterprise Overhaul — Progress

<!-- Any agent/session: READ THIS BLOCK FIRST to resume work. Keep it accurate in every PR. -->
## CURRENT STATE / RESUME HERE
- **Integration branch:** `enterprise/main` (off `main` @ 953cd99)
- **Active branch:** `ent/p0-typehealth` (stacked on `ent/p0-rbac-labels`)
- **Last merged enterprise PR:** _(none yet — PR-0.1 #4, PR-0.2 #5 in review)_
- **Next action:** finish PR-0.3 (this PR — green baseline), then start Phase 1 / PR-1.1 (R2 sole storage).
- **Known-broken / notes:** `apps/management` now type-checks clean (`cd apps/management && npx tsc --noEmit` exits 0). PR #3 (service picker, on `claude/brave-newton-vqbm3u`) is a separate, unrelated PR.
- **Protocol reminder:** every PR must (1) flip its line below, (2) update this block, (3) append to `ledger/PR-INDEX.md`. Enforced on merge requests by the `quality:ledger` CI job (`scripts/check-ledger.mjs`).

Status values: `TODO` · `WIP` · `IN_REVIEW` · `MERGED`. Each line carries its roadmap effort tag — `[CP]` critical-path (AI) / `[||]` parallelizable (Copilot); dependencies live in `ROADMAP.md`.

## Phase 0 — Ledger + type-health
- [ ] PR-0.1 `[CP]` Ledger scaffold — branch:ent/p0-ledger — status:IN_REVIEW — pr:#4 — owner:ai — verify:files render, all PRs listed with tags
- [ ] PR-0.2 `[CP]` RBAC permission labels (all keys) — branch:ent/p0-rbac-labels — status:IN_REVIEW — pr:#5 — owner:ai — verify:RolePermissions.tsx + StaffRolePermissionsPanel.tsx type-clean
- [ ] PR-0.3 `[CP]` Clear management tsc errors + CI ledger guard — branch:ent/p0-typehealth — status:IN_REVIEW — pr:#6 — owner:ai — verify:`cd apps/management && npx tsc --noEmit` exits 0

## Phase 1 — Infra cutover (MySQL fresh + R2 + drop Supabase)
- [ ] PR-1.1 `[CP]` R2 sole storage — branch:ent/p1-storage-r2 — status:TODO — owner:ai — verify:no supabase import in storage.ts; tsc
- [ ] PR-1.2 `[CP]` fileManager → R2 — branch:ent/p1-filemanager-r2 — status:TODO — owner:ai — verify:tsc; configured only when R2 set
- [ ] PR-1.3 `[CP]` Remove Supabase env+deps+route — branch:ent/p1-drop-supabase — status:TODO — owner:ai — verify:`grep -ri supabase apps/*/src` empty; tsc
- [ ] PR-1.4 `[CP]` Prisma → MySQL + 0_init — branch:ent/p1-mysql — status:TODO — owner:ai — verify:`prisma validate && prisma generate`; owner `migrate dev`
- [ ] PR-1.5 `[CP]` Seed on MySQL + runbook — branch:ent/p1-seed-mysql — status:TODO — owner:ai — verify:owner seed on fresh MySQL succeeds
- [ ] PR-1.6 `[CP]` compose + CI → MySQL — branch:ent/p1-infra-mysql — status:TODO — owner:ai — verify:`docker compose config` parses; CI green

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
