-- Add custom_fields column to deals table
ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- Add an index for better performance on JSONB queries
CREATE INDEX IF NOT EXISTS idx_deals_custom_fields ON deals USING gin(custom_fields);