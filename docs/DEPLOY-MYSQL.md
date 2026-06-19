# Deploying PouchCare on MySQL + Cloudflare R2

The platform runs on **MySQL 8** (Prisma) and **Cloudflare R2** (S3-compatible object storage).
Supabase is no longer used. This is the operator runbook for a **fresh** environment.

## Prerequisites
- **MySQL 8.0.13+**, database created with a case-insensitive collation: `utf8mb4` / `utf8mb4_unicode_ci`
  (the `mysql:8` image default). Case-insensitive search relies on this collation (we removed Prisma's
  Postgres-only `mode: 'insensitive'`).
- **Cloudflare R2** bucket + S3 API token (or any S3-compatible store).
- **Redis** (sessions / rate-limit / password-reset tokens) — unchanged.
- Node 20.

## Required env (`apps/api/.env`)
```bash
DATABASE_URL="mysql://USER:PASS@HOST:3306/pouchcare"   # mysql:// — not postgres
REDIS_URL="redis://HOST:6379"
JWT_SECRET="<32+ chars>"
JWT_REFRESH_SECRET="<32+ chars>"
# Cloudflare R2 (sole object storage):
S3_BUCKET="pouchcare"
S3_ENDPOINT="https://<accountid>.r2.cloudflarestorage.com"
S3_ACCESS_KEY_ID="..."
S3_SECRET_ACCESS_KEY="..."
S3_REGION="auto"
RESEND_API_KEY="..."            # email
ALLOWED_ORIGINS="https://m.pouchcare.com,https://pouchcare.com"
# (No SUPABASE_* — removed.)
```

## First-time database setup
The repo intentionally ships **no committed migration** yet (Postgres ones were removed in the
fresh-start switch). Generate the initial migration **once** against a dev MySQL, then commit it:

```bash
cd apps/api
export DATABASE_URL="mysql://USER:PASS@HOST:3306/pouchcare"
npx prisma migrate dev --name 0_init      # creates prisma/migrations/<ts>_0_init/ — COMMIT THIS
```

Then on each environment (staging/prod):
```bash
cd apps/api
npx prisma migrate deploy                 # applies committed migrations
npm run db:seed -w api                    # seeds roles (code), 1 branch, 10 staff, demo data
```
> `seed.ts` is MySQL-compatible as-is (audited: no raw SQL, no scalar-array writes, no Postgres
> functions — only portable Prisma `create()` calls + JS `Date`). Default login: `Password123!`
> (`ceo@`, `comd@`, `ops@`, `branch@pouchcare.com`).

## Local dev (Docker)
```bash
npm run db:up            # starts mysql:8 + redis:7 (docker-compose.yml)
cp apps/api/.env.example apps/api/.env    # set the secrets above
cd apps/api && npx prisma migrate dev     # first run generates 0_init
npm run db:seed -w api
npm run dev:stack        # API + management
```

## Verify
- API boot logs show MySQL connected + R2 storage configured (`assertProductionStorageOrExit` passes in prod).
- `cd apps/api && npx prisma validate` → valid; `npx prisma migrate status` → up to date.
- File upload in the staff File Manager / workspace returns a signed R2 URL on download.

## Notes / rollback
- `@supabase/supabase-js` was removed from both apps — run `npm install` to regenerate `package-lock.json`.
- This is a **fresh start** (no Postgres→MySQL data ETL). If you must preserve old Postgres data, export
  it and write a one-off import against the new MySQL schema — out of scope for this runbook.
- See `apps/api/prisma/MIGRATION_NOTES.md` for the exact schema changes made for MySQL.
