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
- **What:** Added `PERMISSION_LABELS: Record<PermissionKey, string>` (a label for **every**
  key in `PERMISSION_KEYS`) to `apps/management/src/constants/permissionKeys.ts` as the single
  source of truth, and pointed both consumers at it: `pages/settings/RolePermissions.tsx` and
  `components/staff/StaffRolePermissionsPanel.tsx` (each previously held a duplicated,
  incomplete label map → `tsc` error against the full `PermissionKey` union).
- **Decisions:** Labels live with the keys so adding a key without a label is a compile
  error forever. Removed the two local `KEY_LABELS` maps.
- **Verify:** `cd apps/management && npx tsc --noEmit` — both files now clean; repo-wide
  non-deprecation errors 42 → 40 (the rest are cleared in PR-0.3).
- **Follow-ups:** none.

---

### PR-0.3 — Management type-health to zero + CI ledger guard
- **Branch:** `ent/p0-typehealth` → `ent/p0-rbac-labels` (stacked)
- **What:** Cleared all remaining `apps/management` `tsc` errors (40 → 0) across 16 files,
  and wired the ledger guard promised in PR-0.1.
- **Key fixes:** re-added optional `onSearch?` (Enter-triggered) to shared `SearchInput`
  (fixes 4 call sites at the source); corrected `Select` `onChange` to read `e.target.value`
  (native select emits a `ChangeEvent`) in ClientsList/OrdersList/AuditLog; `Leaderboard`
  column `render` → 2-arg `(row, index)`; relaxed `exportCsv` generic to `<T>`; added required
  `lifecycleStatus` to `mockDomains`; destructured `refetch` in `MonitorDashboard`; broadened
  `Positions` `set` to include `HTMLTextAreaElement`; removed genuinely-unused imports/vars
  across AiExecutivePage/WorkspaceSettings/TeamAttendance/FileManager/RecruitmentAnalytics/
  PayrollList/assets.
- **CI guard:** `scripts/check-ledger.mjs` + `quality:ledger` GitLab job (merge-requests only)
  fail a code MR that doesn't update `docs/PROGRESS.md`.
- **Decisions:** component-level `onSearch` fix (one change) over editing N call sites; the
  `Select` fix is also a latent runtime-bug fix (was passing the event object as the filter
  value). Removed the orphaned `usePermission` import in RecruitmentAnalytics (its only
  consumer `perm` was removed).
- **Verify:** `cd apps/management && npx tsc --noEmit` exits 0; `vite build` succeeds.
- **Follow-ups:** the removed `normalizeDomainStatus`/`normalizeWebsiteStatus` were dead code
  (never called); `mapDomain`/`mapWebsite` (`apps/management/src/api/assets.ts`) pass API
  `status` through unchanged. A **pre-existing** status-casing mismatch may exist between API
  values (`Active`/`Live`) and the lowercase `<Select>` options in DomainDetail/WebsiteDetail —
  flag for a Phase-3 polish PR (out of scope for type-health). **End of Phase 0 — green baseline.**

---

### PR-1.1 — R2 sole storage
- **Branch:** `ent/p1-storage-r2` → `ent/p0-typehealth` (stacked)
- **What:** Removed the Supabase branches from `apps/api/src/lib/storage.ts` — both the
  upload path (`uploadFile`) and the `supabase.co` branch in `deleteFile`. Cloudflare R2 is
  now the sole object-storage backend (with the dev-only local-disk fallback unchanged), as
  already mandated in prod by `assertProductionStorageOrExit`.
- **Decisions:** `storage.ts` no longer references Supabase at all. `apps/api/src/lib/supabase.ts`
  and the `@supabase/*` dep remain until PR-1.2 (fileManager refactor) and PR-1.3 (dep/env removal),
  so the lib is not yet orphaned.
- **Verify:** `grep -c supabase apps/api/src/lib/storage.ts` → 0; `cd apps/api && npx tsc --noEmit` → 0 errors.
- **Follow-ups:** PR-1.2 ports `fileManager.ts` off Supabase; PR-1.3 deletes `lib/supabase.ts` + deps + env.
