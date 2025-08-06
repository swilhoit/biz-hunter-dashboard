-- Add Google search volume columns to keyword tables
-- This allows storing both Amazon and Google search metrics

-- Add to asin_recommended_keywords table
ALTER TABLE asin_recommended_keywords 
ADD COLUMN IF NOT EXISTS google_search_volume INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS amazon_search_volume INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS google_cpc DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS google_competition DECIMAL(3,2) DEFAULT 0;

-- Update existing search_volume column comment to clarify it's Amazon
COMMENT ON COLUMN asin_recommended_keywords.search_volume IS 'Amazon monthly search volume (legacy field, use amazon_search_volume)';
COMMENT ON COLUMN asin_recommended_keywords.amazon_search_volume IS 'Amazon monthly search volume from DataForSEO';
COMMENT ON COLUMN asin_recommended_keywords.google_search_volume IS 'Google monthly search volume from DataForSEO';
COMMENT ON COLUMN asin_recommended_keywords.google_cpc IS 'Google Ads CPC from DataForSEO';
COMMENT ON COLUMN asin_recommended_keywords.google_competition IS 'Google Ads competition (0-1) from DataForSEO';

-- Add to asin_keywords table as well
ALTER TABLE asin_keywords 
ADD COLUMN IF NOT EXISTS google_search_volume INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS amazon_search_volume INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS google_cpc DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS google_competition DECIMAL(3,2) DEFAULT 0;

-- Update existing search_volume column comment
COMMENT ON COLUMN asin_keywords.search_volume IS 'Amazon monthly search volume (legacy field, use amazon_search_volume)';
COMMENT ON COLUMN asin_keywords.amazon_search_volume IS 'Amazon monthly search volume from DataForSEO';
COMMENT ON COLUMN asin_keywords.google_search_volume IS 'Google monthly search volume from DataForSEO';
COMMENT ON COLUMN asin_keywords.google_cpc IS 'Google Ads CPC from DataForSEO';
COMMENT ON COLUMN asin_keywords.google_competition IS 'Google Ads competition (0-1) from DataForSEO';

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_asin_recommended_keywords_google_volume ON asin_recommended_keywords(google_search_volume DESC);
CREATE INDEX IF NOT EXISTS idx_asin_recommended_keywords_amazon_volume ON asin_recommended_keywords(amazon_search_volume DESC);
CREATE INDEX IF NOT EXISTS idx_asin_keywords_google_volume ON asin_keywords(google_search_volume DESC);
CREATE INDEX IF NOT EXISTS idx_asin_keywords_amazon_volume ON asin_keywords(amazon_search_volume DESC);