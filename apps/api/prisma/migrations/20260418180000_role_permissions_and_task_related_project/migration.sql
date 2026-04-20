-- role_permissions: required for staff login (getEffectivePermissions) — was missing from history when only `db push` was used
CREATE TABLE IF NOT EXISTS "role_permissions" (
  "id" TEXT NOT NULL,
  "role" "SystemRole" NOT NULL,
  "key" TEXT NOT NULL,
  "allowed" BOOLEAN NOT NULL,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "role_permissions_role_key" ON "role_permissions"("role", "key");

-- tasks.related_project_id: FK to projects; referenced by seed and task queries
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "related_project_id" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tasks_related_project_id_fkey'
  ) THEN
    ALTER TABLE "tasks"
      ADD CONSTRAINT "tasks_related_project_id_fkey"
      FOREIGN KEY ("related_project_id") REFERENCES "projects"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
