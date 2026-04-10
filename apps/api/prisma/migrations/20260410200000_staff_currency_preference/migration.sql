-- Add preferred currency to staff members (USD or BDT)
ALTER TABLE "staff_members" ADD COLUMN "preferred_currency" TEXT NOT NULL DEFAULT 'USD';
