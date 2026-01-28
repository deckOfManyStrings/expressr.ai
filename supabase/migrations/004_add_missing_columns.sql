-- Add expressions_urls column (alias for images)
-- The code uses expressions_urls but the schema has images
-- Let's add both for compatibility

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS expressions_urls JSONB DEFAULT '[]'::jsonb;

-- Also add error column as alias for error_message
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS error TEXT;
