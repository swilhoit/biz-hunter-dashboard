-- Add brand detection fields to keyword_rankings table
ALTER TABLE keyword_rankings 
ADD COLUMN is_brand_result BOOLEAN DEFAULT FALSE,
ADD COLUMN brand_match_score DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN brand_match_reason TEXT;

-- Create index for brand result filtering
CREATE INDEX idx_keyword_rankings_brand_result ON keyword_rankings(is_brand_result);

-- Add comments for new fields
COMMENT ON COLUMN keyword_rankings.is_brand_result IS 'Whether this ranking result belongs to the tracked brand';
COMMENT ON COLUMN keyword_rankings.brand_match_score IS 'Confidence score (0.0-1.0) for brand match detection';
COMMENT ON COLUMN keyword_rankings.brand_match_reason IS 'Explanation of how brand was detected (title_match, seller_match, etc.)';

-- Drop and recreate the brand_keyword_performance view to include brand detection
DROP VIEW IF EXISTS brand_keyword_performance;
CREATE VIEW brand_keyword_performance AS
SELECT 
    bk.brand_name,
    bk.keyword,
    bk.search_volume,
    bk.keyword_type,
    bk.relevance_score,
    kr.position,
    kr.asin,
    kr.title,
    kr.check_date,
    kr.is_brand_result,
    kr.brand_match_score,
    kr.brand_match_reason,
    CASE 
        WHEN kr.position <= 3 THEN 'Top 3'
        WHEN kr.position <= 10 THEN 'Top 10'
        WHEN kr.position <= 50 THEN 'Top 50'
        WHEN kr.position <= 100 THEN 'Top 100'
        ELSE 'Not Ranking'
    END as ranking_tier
FROM brand_keywords bk
LEFT JOIN (
    SELECT DISTINCT ON (brand_keyword_id) 
        brand_keyword_id, position, asin, title, check_date, 
        is_brand_result, brand_match_score, brand_match_reason
    FROM keyword_rankings 
    ORDER BY brand_keyword_id, check_date DESC
) kr ON bk.id = kr.brand_keyword_id
WHERE bk.is_active = true;