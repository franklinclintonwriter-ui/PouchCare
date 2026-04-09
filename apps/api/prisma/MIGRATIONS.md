# Prisma migrations

## Commands

- **Apply migrations (production / CI):** `npx prisma migrate deploy`
- **Create a new migration after schema changes:** `npx prisma migrate dev --name describe_change`  
  (requires a PostgreSQL user that can create a [shadow database](https://www.prisma.io/docs/concepts/components/prisma-migrate/shadow-database); if that fails locally, use `prisma migrate diff` to author SQL manually.)

## Initial migration (`20260404120000_init`)

Generated with:

`prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script`

**New environments:** run `migrate deploy` on an empty database.

**Existing databases** that were created with `prisma db push` only: either continue using `db push` for local dev, or [baseline](https://www.prisma.io/docs/guides/migrate/developing-with-prisma-migrate/add-prisma-migrate-to-a-project) the migration history so `migrate deploy` becomes a no-op:

```bash
npx prisma migrate resolve --applied 20260404120000_init
```

Only do this if the live schema already matches the migration.

## `20260409120000_camera_devices_branch_fk`

Creates `camera_devices` with a foreign key to `branches(id)` (`ON DELETE RESTRICT`) and an index on `branch_id`. Matches the `CameraDevice` model in `schema.prisma`.

If your database already had `camera_devices` from `db push`, resolve drift (drop the table or baseline) before applying this migration.

## Pagination / response helpers

API routes should import pagination from `@/lib/pagination` (re-exported from `@/utils/pagination`) and responses from `@/lib/response` (re-exported from `@/utils/response` including `serviceUnavailable`).
