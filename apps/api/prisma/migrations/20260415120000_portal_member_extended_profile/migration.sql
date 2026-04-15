-- AlterTable: add extended profile fields to portal_members
ALTER TABLE "portal_members"
  ADD COLUMN IF NOT EXISTS "company_name"      TEXT,
  ADD COLUMN IF NOT EXISTS "vat_id"            TEXT,
  ADD COLUMN IF NOT EXISTS "company_website"   TEXT,
  ADD COLUMN IF NOT EXISTS "industry"          TEXT,
  ADD COLUMN IF NOT EXISTS "address_line_1"    TEXT,
  ADD COLUMN IF NOT EXISTS "address_line_2"    TEXT,
  ADD COLUMN IF NOT EXISTS "city"              TEXT,
  ADD COLUMN IF NOT EXISTS "state"             TEXT,
  ADD COLUMN IF NOT EXISTS "zip"               TEXT,
  ADD COLUMN IF NOT EXISTS "address_country"   TEXT,
  ADD COLUMN IF NOT EXISTS "telegram"          TEXT,
  ADD COLUMN IF NOT EXISTS "skype"             TEXT,
  ADD COLUMN IF NOT EXISTS "preferred_contact" TEXT,
  ADD COLUMN IF NOT EXISTS "preferences"       JSONB DEFAULT '{}';
