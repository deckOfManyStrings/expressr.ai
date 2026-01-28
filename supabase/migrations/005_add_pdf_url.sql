ALTER TABLE jobs ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Refresh schema cache check (comment only)
-- Notify User to run this migration
