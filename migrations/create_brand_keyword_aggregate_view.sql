-- Create a view for brand-level keyword aggregation
CREATE OR REPLACE VIEW brand_keyword_aggregate AS
WITH brand_asins AS (
  -- Get all ASINs for each brand with their details
  SELECT 
    a.id as asin_id,
    a.asin,
    a.brand,
    a.title
  FROM asins a
  WHERE a.brand IS NOT NULL
),
keyword_asin_data AS (
  -- Get all keywords for each ASIN with metrics
  SELECT 
    ba.brand,
    ba.asin_id,
    ba.asin,
    ark.keyword,
    ark.amazon_search_volume,
    ark.google_search_volume,
    ark.relevance_score,
    ark.google_competition,
    ark.google_cpc,
    ark.monthly_trend,
    ark.search_intent,
    GREATEST(
      COALESCE(ark.amazon_search_volume, 0), 
      COALESCE(ark.google_search_volume, 0)
    ) as max_search_volume
  FROM brand_asins ba
  JOIN asin_recommended_keywords ark ON ark.asin_id = ba.asin_id
),
keyword_rankings AS (
  -- Get current rankings for brand keywords
  SELECT 
    bk.brand_name,
    bk.keyword,
    kr.asin,
    kr.position,
    kr.is_brand_result
  FROM brand_keywords bk
  LEFT JOIN LATERAL (
    SELECT DISTINCT ON (kr.brand_keyword_id, kr.asin) 
      kr.asin, 
      kr.position,
      kr.is_brand_result
    FROM keyword_rankings kr
    WHERE kr.brand_keyword_id = bk.id
      AND kr.is_brand_result = true
    ORDER BY kr.brand_keyword_id, kr.asin, kr.check_date DESC
  ) kr ON true
  WHERE bk.is_active = true
)
SELECT 
  kad.brand,
  kad.keyword,
  COUNT(DISTINCT kad.asin_id) as total_asins,
  COUNT(DISTINCT kr.asin) as asins_ranking,
  ARRAY_AGG(DISTINCT kad.asin ORDER BY kad.asin) as all_asins,
  ARRAY_AGG(DISTINCT kr.asin ORDER BY kr.asin) FILTER (WHERE kr.asin IS NOT NULL) as ranking_asins,
  MAX(kad.max_search_volume) as search_volume,
  AVG(kad.relevance_score) as avg_relevance_score,
  AVG(kad.google_competition) as avg_competition,
  AVG(kad.google_cpc) as avg_cpc,
  AVG(kad.monthly_trend) as avg_monthly_trend,
  MIN(kr.position) as best_position,
  AVG(kr.position) as avg_position,
  STRING_AGG(DISTINCT kad.search_intent, ', ' ORDER BY kad.search_intent) as search_intents,
  COUNT(DISTINCT CASE WHEN kr.position <= 10 THEN kr.asin END) as asins_in_top_10,
  COUNT(DISTINCT CASE WHEN kr.position BETWEEN 11 AND 30 THEN kr.asin END) as asins_in_11_30,
  COUNT(DISTINCT CASE WHEN kr.position > 30 THEN kr.asin END) as asins_below_30
FROM keyword_asin_data kad
LEFT JOIN keyword_rankings kr 
  ON kad.brand = kr.brand_name 
  AND LOWER(kad.keyword) = LOWER(kr.keyword)
  AND kad.asin = kr.asin
GROUP BY kad.brand, kad.keyword
ORDER BY kad.brand, MAX(kad.max_search_volume) DESC;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_asin_recommended_keywords_asin_id 
  ON asin_recommended_keywords(asin_id);

CREATE INDEX IF NOT EXISTS idx_asins_brand 
  ON asins(brand) 
  WHERE brand IS NOT NULL;

-- Add helpful comments
COMMENT ON VIEW brand_keyword_aggregate IS 'Aggregated keyword performance data at the brand level, showing how many ASINs rank for each keyword';
COMMENT ON COLUMN brand_keyword_aggregate.total_asins IS 'Total number of ASINs that have this keyword in their recommended keywords';
COMMENT ON COLUMN brand_keyword_aggregate.asins_ranking IS 'Number of ASINs currently ranking for this keyword';
COMMENT ON COLUMN brand_keyword_aggregate.best_position IS 'Best ranking position across all ASINs for this keyword';
COMMENT ON COLUMN brand_keyword_aggregate.avg_position IS 'Average ranking position across all ranking ASINs';