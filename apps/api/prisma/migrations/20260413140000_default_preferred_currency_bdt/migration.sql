-- Default display currency for new staff: Bangladeshi Taka (system default FX: 1 USD = 124 BDT via env / exchange_rates seed).
ALTER TABLE "staff_members" ALTER COLUMN "preferred_currency" SET DEFAULT 'BDT';
