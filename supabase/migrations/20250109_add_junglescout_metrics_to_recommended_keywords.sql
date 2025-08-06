-- Add JungleScout metrics columns to existing asin_recommended_keywords table
-- This migration adds the missing columns that were in the original migration but not applied

-- Add JungleScout metrics columns
ALTER TABLE asin_recommended_keywords 
ADD COLUMN IF NOT EXISTS search_volume INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_trend DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS quarterly_trend DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS ppc_bid_broad DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS ppc_bid_exact DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS organic_product_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sponsored_product_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS junglescout_updated_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_asin_recommended_keywords_search_volume ON asin_recommended_keywords(search_volume DESC);
CREATE INDEX IF NOT EXISTS idx_asin_recommended_keywords_monthly_trend ON asin_recommended_keywords(monthly_trend DESC);
CREATE INDEX IF NOT EXISTS idx_asin_recommended_keywords_ppc_bid_exact ON asin_recommended_keywords(ppc_bid_exact);

-- Add comment
COMMENT ON COLUMN asin_recommended_keywords.search_volume IS 'Monthly search volume from JungleScout';
COMMENT ON COLUMN asin_recommended_keywords.monthly_trend IS 'Monthly trend percentage from JungleScout';
COMMENT ON COLUMN asin_recommended_keywords.ppc_bid_exact IS 'PPC exact match bid cost from JungleScout';
COMMENT ON COLUMN asin_recommended_keywords.organic_product_count IS 'Number of organic products competing for this keyword';
COMMENT ON COLUMN asin_recommended_keywords.sponsored_product_count IS 'Number of sponsored products competing for this keyword';