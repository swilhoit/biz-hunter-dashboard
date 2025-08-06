-- Add indexes for better performance on asin_keywords table
CREATE INDEX IF NOT EXISTS idx_asin_keywords_rank_organic ON asin_keywords(rank_organic) WHERE rank_organic IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_asin_keywords_rank_sponsored ON asin_keywords(rank_sponsored) WHERE rank_sponsored IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_asin_keywords_search_volume ON asin_keywords(search_volume DESC);
CREATE INDEX IF NOT EXISTS idx_asin_keywords_relevancy ON asin_keywords(relevancy_score DESC);