-- Phase 1 follow-up: ClientSegment
-- Saved filter presets for the Admin Panel Clients list (see docs/adrs/0001).
-- Apply with `npx prisma migrate deploy` (prod) or `npx prisma migrate dev` (dev).

CREATE TABLE "client_segments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "params" JSONB NOT NULL,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_segments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "client_segments_name_key" ON "client_segments" ("name");
CREATE INDEX "client_segments_name_idx" ON "client_segments" ("name");
