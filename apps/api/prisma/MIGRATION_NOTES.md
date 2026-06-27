# MySQL migration notes (Phase 1 / PR-1.4)

This project moved from **PostgreSQL → MySQL 8**, **fresh start** (no data preserved).

## Schema/code changes
- `datasource db.provider` → `mysql`; `migrations/migration_lock.toml` → `mysql`.
- Deleted the 14 old PostgreSQL migrations; a single `0_init` is (re)generated against MySQL — see Owner steps.
- **`ServicePlan.features`**: was `String[]` (Postgres scalar list — unsupported on MySQL) → now `Json @default("[]")`. The API writes/returns it as a JSON array; clients keep treating it as `string[]` (no client change). _Note: JSON column defaults require MySQL 8.0.13+ (we target `mysql:8`)._
- **Removed `mode: 'insensitive'`** from every Prisma `where` filter (70 sites across 14 route files; the `/search` route also dropped its `const mode`). `mode` is a Postgres-only option. On MySQL, case-insensitive matching comes from the **collation** — the DB must use a `*_ci` collation (e.g. `utf8mb4_unicode_ci`, the `mysql:8` default), which preserves the prior case-insensitive search behavior.

## Audited MySQL-compatible (no change needed)
- 18 enums, 4 `Json` fields, `@db.Date` ×2, `@db.VarChar(2000)` on `ToolRun.queryLabel` (non-indexed → fine).
- Every `@unique`/indexed `String` maps to `VARCHAR(191)` by default (utf8mb4 index-safe).
- No other scalar lists; all `Model[]` fields are relations (fine).

## Owner steps (need a live MySQL — not runnable in CI/sandbox)
1. Create an empty MySQL 8 DB (utf8mb4 / `*_ci` collation); set `DATABASE_URL="mysql://user:pass@host:3306/pouchcare"`.
2. Generate the committed initial migration against a dev MySQL:
   `cd apps/api && npx prisma migrate dev --name 0_init` → commit the new `prisma/migrations/<timestamp>_0_init/`.
3. Deploy + seed (staging/prod): `npx prisma migrate deploy && npm run db:seed -w api`.

Sandbox-verified **without a DB**: `npx prisma validate` ✓ · `npx prisma generate` ✓ · `cd apps/api && npx tsc --noEmit` → 0 errors.
