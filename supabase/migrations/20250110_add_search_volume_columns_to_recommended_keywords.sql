-- Add Amazon and Google search volume columns to asin_recommended_keywords table
ALTER TABLE asin_recommended_keywords 
ADD COLUMN IF NOT EXISTS amazon_search_volume INTEGER,
ADD COLUMN IF NOT EXISTS google_search_volume INTEGER,
ADD COLUMN IF NOT EXISTS google_cpc DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS google_competition DECIMAL(5,2);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_asin_recommended_keywords_amazon_volume 
ON asin_recommended_keywords(amazon_search_volume DESC) 
WHERE amazon_search_volume IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_asin_recommended_keywords_google_volume 
ON asin_recommended_keywords(google_search_volume DESC) 
WHERE google_search_volume IS NOT NULL;