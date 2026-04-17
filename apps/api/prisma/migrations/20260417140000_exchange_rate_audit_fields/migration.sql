-- Exchange rate audit: branch scope, who recorded / last updated, updated_at

ALTER TABLE "exchange_rates" ADD COLUMN "updated_at" TIMESTAMP(3);
UPDATE "exchange_rates" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;
ALTER TABLE "exchange_rates" ALTER COLUMN "updated_at" SET NOT NULL;
ALTER TABLE "exchange_rates" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "exchange_rates" ADD COLUMN "branch_id" TEXT;
ALTER TABLE "exchange_rates" ADD COLUMN "created_by_id" TEXT;
ALTER TABLE "exchange_rates" ADD COLUMN "updated_by_id" TEXT;

ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
