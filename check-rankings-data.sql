-- Check if brand_keywords table has keywords for Mister Candle
SELECT COUNT(*) as keyword_count, 
       COUNT(DISTINCT id) as unique_ids,
       MIN(created_at) as oldest,
       MAX(created_at) as newest
FROM brand_keywords 
WHERE brand_name = 'Mister Candle';

-- Check if any rankings exist in keyword_rankings table
SELECT COUNT(*) as total_rankings
FROM keyword_rankings;

-- Check if any rankings exist for Mister Candle keywords
SELECT 
    bk.keyword,
    bk.id as brand_keyword_id,
    COUNT(kr.id) as ranking_count
FROM brand_keywords bk
LEFT JOIN keyword_rankings kr ON kr.brand_keyword_id = bk.id
WHERE bk.brand_name = 'Mister Candle'
GROUP BY bk.keyword, bk.id
ORDER BY ranking_count DESC
LIMIT 10;

-- Check the structure of a sample ranking record
SELECT * FROM keyword_rankings 
LIMIT 1;

-- Check if there are any brand results
SELECT COUNT(*) as brand_result_count
FROM keyword_rankings
WHERE is_brand_result = true;