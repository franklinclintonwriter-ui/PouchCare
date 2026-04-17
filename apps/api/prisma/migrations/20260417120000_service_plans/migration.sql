-- Phase 3: ServicePlan
-- Tiered pricing for Service rows (Starter / Pro / Enterprise per service).
-- Apply with `npx prisma migrate deploy` (prod) or `npx prisma migrate dev` (dev).

CREATE TABLE "service_plans" (
    "id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price_usd" DOUBLE PRECISION NOT NULL,
    "price_bdt" DOUBLE PRECISION,
    "delivery_days" INTEGER,
    "features" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "is_popular" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_plans_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "service_plans_service_id_display_order_idx"
    ON "service_plans" ("service_id", "display_order");

ALTER TABLE "service_plans"
    ADD CONSTRAINT "service_plans_service_id_fkey"
    FOREIGN KEY ("service_id") REFERENCES "services" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
