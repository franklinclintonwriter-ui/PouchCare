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

---

### PR-1.2 — fileManager → R2
- **Branch:** `ent/p1-filemanager-r2` → `ent/p1-storage-r2` (stacked)
- **What:** Rewrote all 7 `apps/api/src/routes/fileManager.ts` handlers off Supabase Storage onto
  Cloudflare R2 via `@aws-sdk/client-s3`, reusing the now-exported `s3Client`/`s3Bucket` from
  `lib/storage.ts`. S3 has no folders, so folders are key prefixes: list uses `ListObjectsV2`
  with `Delimiter: '/'` (CommonPrefixes = folders, filtering the `.keep` placeholder); create-folder
  writes an empty `.keep`; download returns a presigned `GetObject` URL; delete is recursive via
  `ListObjectsV2` + batched `DeleteObjects`; move is `CopyObject` (URL-encoded CopySource) + delete;
  usage now reports real `usedBytes`/`fileCount`.
- **Decisions:** Reuse the configured R2 bucket (`env.S3_BUCKET`) under the existing `users/<id>/`
  prefix instead of the old separate `staff-files` bucket. Private bucket → upload returns `url: null`;
  access is via the signed `/files/download` endpoint.
- **Verify:** `grep -c supabase apps/api/src/routes/fileManager.ts` → 0; `cd apps/api && npx tsc --noEmit` → 0 errors. Live R2 smoke test pending owner secrets.
- **Follow-ups:** PR-1.3 removes the analytics mirrors + NL→SQL route; PR-1.3b finishes the rest.

---

### PR-1.3 — Remove Supabase analytics mirrors + NL→SQL route
- **Branch:** `ent/p1-drop-supabase` → `ent/p1-filemanager-r2` (stacked)
- **What:** Removed the fire-and-forget `mirrorToSupabase(...)` analytics calls from
  `lib/tools/logToolRun.ts`, `routes/ai/index.ts`, `routes/staff/index.ts`,
  `routes/staff/documents.ts`; deleted the CEO-only NL→SQL "DB agent" route
  `routes/ai/supabase.ts` and unmounted it in `server.ts`.
- **Decision (owner):** Supabase removal is **split**. The NL→SQL DB-agent + realtime presence
  are dropped outright (Supabase-only — no backend once Supabase is gone). The **workspace
  binary-file storage** (`routes/ai/workspace.ts`, `workspace-files` bucket) will be **ported to
  R2** in PR-1.3b. So `lib/supabase.ts`, `SUPABASE_*` env, the `@supabase/*` dep, and the
  management `WorkspaceEditor` Supabase UI remain until **PR-1.3b**.
- **Verify:** the 5 edited files are supabase-free; `cd apps/api && npx tsc --noEmit` → 0 errors.
- **Follow-ups:** **PR-1.3b** — port `workspace.ts` uploads to R2, then delete `lib/supabase.ts`
  + `SUPABASE_*` env + `@supabase/supabase-js` (both apps) + remove the `useSupabase*` hooks and
  the DB-query/presence panel in `WorkspaceEditor.tsx`. The management `useSupabase*` hooks now
  call the removed `/ai/supabase/*` endpoints (runtime 404 until PR-1.3b cleans them).

---

### PR-1.3b — Finish Supabase removal (workspace → R2)
- **Branch:** `ent/p1-drop-supabase-2` → `enterprise/main`
- **What:** Ported `routes/ai/workspace.ts` binary/large-file uploads from Supabase Storage
  (`workspace-files` bucket) to R2: `PutObjectCommand` keyed `workspace/<wsId>/<path>`, storing
  the **object key** in `WorkspaceFile.storageKey`. The single read site (`GET /:id/files/:fileId/download`)
  now issues a short-lived presigned `GetObject` URL (mirrors `fileManager`); inline-text fallback
  unchanged. Deleted `lib/supabase.ts`, removed the `SUPABASE_*` env block, removed `@supabase/supabase-js`
  from **both** package.json. Frontend: removed the 5 `useSupabase*` hooks (`api/workspace.ts`) and the
  `WorkspaceEditor` "Database Agent" panel + its activity-bar button + state + the unused `Database` icon.
- **Decisions:** Workspace binary storage preserved (ported to R2, per owner). The DB-agent + presence
  are gone (Supabase-only). `storageKey` holds an object key, not a URL (private bucket).
- **Verify:** `grep -rniE supabase apps/*/src` → none; `grep -rn @supabase apps` → none; `apps/api` + `apps/management` `tsc --noEmit` → 0 errors each.
- **Note:** `@supabase` dropped from both manifests — owner/CI regenerates `package-lock.json` via `npm install`. The deleted frontend hooks targeted `/ai/supabase/*` routes already removed in PR-1.3 (dead client code).
- **Follow-ups:** **Supabase is now fully removed.** Next: PR-1.4 (Prisma → MySQL).

---

### PR-1.4 — Prisma datasource → MySQL (fresh start)
- **Branch:** `ent/p1-mysql` → `ent/p1-drop-supabase-2` (stacked on #10)
- **What:** `schema.prisma` `provider` postgresql→**mysql**; `migration_lock.toml`→mysql; deleted the 14
  Postgres migrations (fresh `0_init` regenerated by the owner against MySQL). MySQL-compat fixes:
  - `ServicePlan.features` `String[]` → `Json @default("[]")` (MySQL has no scalar list type; API/clients
    keep treating it as a string array).
  - Stripped Postgres-only `mode: 'insensitive'` from **70** Prisma `where` filters across 14 route files
    (+ removed the `/search` route's `const mode`). Case-insensitivity now comes from the MySQL `*_ci`
    collation (preserved). Full notes: `apps/api/prisma/MIGRATION_NOTES.md`.
- **Audit:** 18 enums, 4 Json, `@db.Date`×2, `@db.VarChar(2000)` (non-indexed) all MySQL-fine; every
  `@unique`/indexed `String` → `VARCHAR(191)` (utf8mb4 index-safe); no other scalar lists.
- **Verify (sandbox, no DB):** `DATABASE_URL=mysql://… npx prisma validate` → valid 🚀; `prisma generate` ✓;
  `cd apps/api && npx tsc --noEmit` → 0 errors.
- **Owner (needs live MySQL):** `npx prisma migrate dev --name 0_init` to generate + commit the migration,
  then `migrate deploy` + seed. See MIGRATION_NOTES.md.
- **Follow-ups:** PR-1.5 (seed audit + DEPLOY-MYSQL runbook); PR-1.6 (docker-compose + CI → MySQL).

---

### PR-1.5 — Seed MySQL-compat audit + deploy runbook
- **Branch:** `ent/p1-seed-mysql` → `ent/p1-mysql` (stacked on #11)
- **What:** Audited `apps/api/prisma/seed.ts` for MySQL compatibility — **no code change needed**:
  no `$queryRaw`/`$executeRaw`, no Postgres functions/casts (the `::`/`now()` grep hits were JS
  `Date.now()`), and seed never writes `ServicePlan.features` (so the `String[]`→`Json` change is moot).
  Only portable Prisma `create()` calls + JS `Date`. Added `docs/DEPLOY-MYSQL.md` — full operator
  runbook (MySQL 8 + R2 env, first-time `migrate dev --name 0_init`, `migrate deploy` + seed, local
  Docker, verification, rollback).
- **Verify:** audit documented; runbook added; no code touched (ledger-only + docs).
- **Follow-ups:** PR-1.6 (docker-compose `postgres:16`→`mysql:8` + `.env.example` + CI).

---

### PR-1.6 — docker-compose + env → MySQL
- **Branch:** `ent/p1-infra-mysql` → `ent/p1-seed-mysql` (stacked on #12)
- **What:** Swapped `postgres:16` → **`mysql:8`** in all three compose files (`docker-compose.yml`,
  `docker-compose.hosting.yml`, `docker-compose.hosting.dev.yml`): MySQL env vars, port 3306,
  `mysql_data` volume, `mysqladmin ping` healthcheck, `--collation-server=utf8mb4_unicode_ci`
  (case-insensitive, needed since `mode:'insensitive'` was removed), `DATABASE_URL: mysql://…@mysql:3306`,
  `depends_on: mysql`. Updated `DATABASE_URL` in `.env.example` (root) + `apps/api/.env.example` to `mysql://…:3306`.
- **CI:** `.gitlab-ci.yml` has no DB service (verify=typecheck, deploy runs provider-agnostic `prisma migrate deploy`) — no change needed.
- **Verify:** `docker compose config` parses for all three (rendered `image: mysql:8`, `DATABASE_URL: mysql://…@mysql:3306`); no `postgres`/`5432` refs in compose/env. (hosting.yml needs the operator's gitignored `apps/api/.env` to fully render — pre-existing.)
- **Follow-up:** Windows dev helpers (`scripts/*.ps1`) + `deploy/server-init.sh` still reference postgres — non-deploy-critical (DB is the `mysql` container); update in a later housekeeping PR.
- **Phase 1 is now code-complete.** Remaining is the owner's live `migrate dev` (generate `0_init`) + secrets, then merge the Phase-1 stack.

---

### Phase 1 — MERGED into `enterprise/main`
- The Phase-1 stack was flattened into `enterprise/main` in dependency order (merge commits, not squash, to preserve stacked-branch ancestry): **#10 → #11 → #12 → #13**. Integration branch is now @ `b5efdc3`.
- `enterprise/main` now runs on **MySQL 8 (fresh start) + Cloudflare R2**, with **zero Supabase** code/deps/env.
- **Bugbot triage (PR #10):** flagged "legacy Supabase `storageKey` URLs break downloads" (High). **Non-actionable / false positive for this scenario** — fresh-start MySQL means a greenfield DB with no legacy `WorkspaceFile` rows; the new code only ever writes R2 object keys to `storageKey` (the Supabase upload path that wrote HTTP URLs is deleted), so the download presign is correct for every row the new code creates. No legacy-URL fallback added (would be dead code). Recorded here for memory.
- **PR #3** (admin "New Order" service picker) merged to `main` separately (not part of the enterprise stack).

---

### PR-2.1 — Align `SystemAuditLog` with the `audit()` contract
- **Branch:** `ent/p2-audit-schema` → `enterprise/main` (first Phase-2 PR)
- **Problem:** the model (`module/actorName/ipAddress/details`, required `actorId/actorRole`) had drifted from what the `audit()` helper writes (`resourceKind/resourceId/ip/userAgent/metadata`, nullable actor). The helper masked this with `as any`, so **every `audit()` call was throwing and being swallowed** — audit logging via the helper (clients/orders/services) plus the main audit page were effectively no-ops.
- **Schema (`SystemAuditLog`):** reshaped to the modern contract — `actorId? / actorRole?` (nullable), `action`, `resourceKind`, `resourceId`, **`clientId?`** (promoted to a first-class column for client-scoped feeds), `ip?`, `userAgent?`, `metadata Json?`, `createdAt`. Added indexes: `[resourceKind, resourceId]`, `[clientId]`, `[actorId]`, `[action]`, `[createdAt]`. Dropped `module/actorName/details/ipAddress`.
- **`lib/auditLog.ts`:** typed `prisma.systemAuditLog.create` (no `as any`); persists `clientId`; `metadata` built via a helper that returns `Prisma.DbNull` when there's nothing structured.
- **`routes/admin/clients.ts`:** merge-idempotency now matches on indexed columns `(action='client.merge', resourceId=source, clientId=target)` instead of `details contains fingerprint`; client `/activity` feed filters `OR: [{clientId:id},{resourceId:id}]` instead of `details contains id`. No more JSON-substring scans.
- **`routes/admin/system-config.ts`:** the only other direct writer — both `tx.systemAuditLog.create` calls rewritten to modern fields; `actorName` preserved inside `metadata`.
- **`prisma/seed.ts`:** `seedSystemAuditLogs` fixtures rewritten to the modern shape (typed; `as any` dropped; `module`→`resourceKind`, added `resourceId`, `actorName`→`metadata`, `details` object→`metadata`).
- **Frontend:** `api/system-config.ts` `SystemAuditLog` type → modern fields; `SystemConfig.tsx` audit tab renders `metadata.actorName / actorRole / resourceKind:resourceId / ip` and pretty-prints `metadata` (no more `JSON.parse(details)`). `admin/audit.ts` + `api/admin-audit.ts` already used the modern shape (no change).
- **Verify (sandbox):** `prisma validate` → valid 🚀; `prisma generate` ✓; `apps/api` tsc **0**; `apps/management` tsc **0**; no `as any` on audit writes anywhere.
- **Migration:** purely additive/replacement on a not-yet-generated `0_init` → folds into the single owner-run migration (seed-once-after-Phase-2). No standalone migration needed.
- **Follow-ups:** PR-2.2 (instrument all internal write endpoints → ~100% audit coverage; Copilot); PR-2.3 (Branch FK) + PR-2.5 (auth/session table) before `0_init` generation.

---

### PR-2.3 — Real Branch FK across internal models
- **Branch:** `ent/p2-branch-fk` → `ent/p2-audit-schema` (stacked on #14)
- **Problem:** branch was an advisory `String?` (`StaffMember.branch`, `Task/Project.assignedBranch`, `Attendance/LeaveRequest/DailyReport/PerformanceRating/Payroll.branch`) with no referential integrity and no way to scope queries by branch. A real `Branch` model already existed (cameras/NVR/exchange-rates FK to it).
- **Scope:** added `branchId String? @map("branch_id")` + `branchRef Branch? @relation(fields:[branchId], references:[id])` + `@@index([branchId])` to **8 internal models**: StaffMember, Task, Project, Attendance, LeaveRequest, DailyReport, PerformanceRating, Payroll. (Plan listed 6; included Project + PerformanceRating since they carry the same advisory field and PR-2.4 scoping needs them.) Added 8 back-relation arrays to `Branch`.
- **Design:** relation named **`branchRef`** (not `branch`) to avoid colliding with the kept advisory `branch`/`assignedBranch` scalars — those stay for back-compat (routes still read/write them); a later cleanup can drop them once all reads move to `branchId`. FK is **optional** → default `onDelete: SetNull` (a branch closure unassigns records rather than blocking/cascading), matching the existing optional `ExchangeRate.branch` pattern.
- **Seed (`linkBranchFks()`):** backfills `branchId`. Staff link by advisory branch name = canonical `BRANCH_NAME` ("PouchCare - Digital Marketing"); per-staff records (attendance/leave/report/performance/payroll), tasks (via assigned member/manager), and **projects (via `assignedTo` staff id)** link **through their branch-staff member** (authoritative — `seedProjects` never sets `assignedBranch`, and task fixtures' advisory strings like "Bangladesh HQ"/"Dhaka" are stale: those branches are explicitly deleted in `seedBranches`). Company-wide ("Company — Global") staff + records intentionally stay `branchId = null`. *(Bugbot caught the original `assignedBranch`-keyed project backfill matching 0 rows.)*
- **Verify (sandbox):** `prisma validate` → valid 🚀; `prisma generate` ✓ (8 relations); `apps/api` src tsc **0** (additive — no existing route broke); seed.ts type-clean for the changes (the 2 remaining seed tsc warnings at L256/257 are pre-existing CameraDevice status comparisons, unrelated).
- **Migration:** additive on the not-yet-generated `0_init` → folds into the single owner-run migration. No standalone migration. (If the owner ever seeds before generating, `linkBranchFks()` doubles as the backfill.)
- **Next:** PR-2.4 (BRANCH_MANAGER query scoping via a `branchScope(req)` Prisma-where helper over these `branchId` columns).

---

### PR-2.2 — Instrument internal write endpoints with `audit()` + gate coverage
- **Branch:** `ent/p2-audit-coverage` → `enterprise/main` (parallelizable; based on PR-2.1 audit contract)
- **What:** Added a single `await audit(req, …)` call after successful writes across internal/company route groups and legacy admin backfill routes:
  - `apps/api/src/routes/staff/index.ts`
  - `apps/api/src/routes/staff/documents.ts`
  - `apps/api/src/routes/attendance/index.ts`
  - `apps/api/src/routes/leave/index.ts`
  - `apps/api/src/routes/payroll/index.ts`
  - `apps/api/src/routes/tasks/index.ts`
  - `apps/api/src/routes/projects/index.ts`
  - `apps/api/src/routes/performance/index.ts`
  - `apps/api/src/routes/hr/index.ts`
  - `apps/api/src/routes/admin/portal.ts`
  - `apps/api/src/routes/admin/resources.ts`
  - plus coverage gate expansion in `scripts/audit-coverage.mjs`.
- **Coverage gate:** `scripts/audit-coverage.mjs` now scans all `apps/api/src/routes/**` files but gates only an explicit in-scope internal set (new admin panel routes + internal people-ops + legacy `admin/portal.ts` and `admin/resources.ts`).
- **Coverage %:** in-scope coverage moved from **12/86 (~14%)** before instrumentation to **86/86 (100%)** after.
- **Intentional skips:** `apps/api/src/routes/admin/role-permissions.ts` and `apps/api/src/routes/admin/system-config.ts` remain informational-only in the script (legacy carry-over, not part of this PR-2.2 backfill scope).
- **Verify:** `npm run audit:coverage` ✓ (`86/86`); `cd apps/api && npx tsc --noEmit` ✓.
