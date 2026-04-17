-- CreateEnum
CREATE TYPE "ToolRunType" AS ENUM ('SERP_TOP_100', 'DOMAIN_METRICS', 'BACKLINKS', 'KEYWORDS', 'FAVICON_ZIP');

-- CreateTable
CREATE TABLE "tool_runs" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "tool_type" "ToolRunType" NOT NULL,
    "query_label" VARCHAR(2000) NOT NULL,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tool_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tool_runs_staff_id_created_at_idx" ON "tool_runs"("staff_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "tool_runs" ADD CONSTRAINT "tool_runs_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
