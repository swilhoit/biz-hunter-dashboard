-- Add Amazon and Google search volume columns to share_of_voice_keywords table
ALTER TABLE share_of_voice_keywords 
ADD COLUMN IF NOT EXISTS amazon_search_volume INTEGER,
ADD COLUMN IF NOT EXISTS google_search_volume INTEGER,
ADD COLUMN IF NOT EXISTS sales_share_percentage NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS listing_share_percentage NUMERIC(5,2);