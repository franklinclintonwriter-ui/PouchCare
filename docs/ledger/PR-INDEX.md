# PR Index — append-only decision log

> One entry per enterprise PR. Append as part of each PR; never edit prior entries after
> merge. Live status lives in `PROGRESS.md`. This is the compaction-proof memory: decisions
> made, files touched, scope dropped, follow-ups deferred.

---

### PR-0.1 — Ledger scaffold
- **Branch:** `ent/p0-ledger` → `enterprise/main`
- **What:** Added the persistent progress ledger and contribution scaffolding:
  `docs/ROADMAP.md` (static plan), `docs/PROGRESS.md` (living checklist + RESUME block),
  `docs/ledger/PR-INDEX.md` (this file), `.github/pull_request_template.md`,
  `.github/ISSUE_TEMPLATE/enterprise-task.md` (Copilot brief).
- **Decisions:** Branching = `enterprise/main` + stacked `ent/p{phase}-{slug}`. Seed prod
  once after Phase 2 (recommended) so additive Phase-2 schema folds into `0_init`.
- **Deferred / out-of-scope:** CI ledger-presence guard lands in PR-0.3 (alongside the
  green typecheck baseline).
- **Follow-ups:** none.

---

### PR-0.2 — RBAC KEY_LABELS completeness + single source
- **Branch:** `ent/p0-rbac-labels` → `ent/p0-ledger` (stacked)
- **Status:** in review
- **What:** Added `PERMISSION_LABELS: Record<PermissionKey, string>` (all 39 keys) to
  `apps/management/src/constants/permissionKeys.ts` as the single source of truth, and
  pointed both consumers at it: `pages/settings/RolePermissions.tsx` and
  `components/staff/StaffRolePermissionsPanel.tsx` (each previously held a duplicated
  14-key map → `tsc` error against the 39-key `PermissionKey` type).
- **Decisions:** Labels live with the keys so adding a key without a label is a compile
  error forever. Removed the two local `KEY_LABELS` maps.
- **Verify:** `cd apps/management && npx tsc --noEmit` — both files now clean; repo-wide
  non-deprecation errors 42 → 40 (the rest are cleared in PR-0.3).
- **Follow-ups:** none.
