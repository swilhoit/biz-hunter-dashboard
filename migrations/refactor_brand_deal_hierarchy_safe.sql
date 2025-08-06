-- Safe migration to properly separate brands from deals
-- This version checks for existing columns and tables

-- 1. First check if brands table exists and add missing columns
DO $$ 
BEGIN
  -- Create brands table if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'brands') THEN
    CREATE TABLE brands (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;

  -- Add columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'logo_url') THEN
    ALTER TABLE brands ADD COLUMN logo_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'website_url') THEN
    ALTER TABLE brands ADD COLUMN website_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'amazon_store_url') THEN
    ALTER TABLE brands ADD COLUMN amazon_store_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'description') THEN
    ALTER TABLE brands ADD COLUMN description TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'category') THEN
    ALTER TABLE brands ADD COLUMN category TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'subcategory') THEN
    ALTER TABLE brands ADD COLUMN subcategory TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'business_type') THEN
    ALTER TABLE brands ADD COLUMN business_type TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'founded_year') THEN
    ALTER TABLE brands ADD COLUMN founded_year INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'headquarters_location') THEN
    ALTER TABLE brands ADD COLUMN headquarters_location TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'employee_count') THEN
    ALTER TABLE brands ADD COLUMN employee_count TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'total_asins') THEN
    ALTER TABLE brands ADD COLUMN total_asins INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'active_asins') THEN
    ALTER TABLE brands ADD COLUMN active_asins INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'total_reviews') THEN
    ALTER TABLE brands ADD COLUMN total_reviews INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'avg_rating') THEN
    ALTER TABLE brands ADD COLUMN avg_rating DECIMAL(3,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'data_source') THEN
    ALTER TABLE brands ADD COLUMN data_source TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'last_sync_at') THEN
    ALTER TABLE brands ADD COLUMN last_sync_at TIMESTAMPTZ;
  END IF;
END $$;

-- 2. Add brand_id to deals table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'brand_id') THEN
    ALTER TABLE deals ADD COLUMN brand_id UUID REFERENCES brands(id);
  END IF;
END $$;

-- 3. Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_deals_brand_id ON deals(brand_id);
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);

-- 4. Migrate existing data - create brands from unique business names in deals
-- Only insert brands that don't already exist
INSERT INTO brands (name, category, subcategory)
SELECT DISTINCT 
  d.business_name as name,
  d.amazon_category as category,
  d.amazon_subcategory as subcategory
FROM deals d
WHERE d.business_name IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM brands b WHERE b.name = d.business_name
  );

-- 5. Update deals to reference the brands
UPDATE deals d
SET brand_id = b.id
FROM brands b
WHERE d.business_name = b.name
  AND d.brand_id IS NULL;

-- 6. Add brand_id to asins table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'asins' AND column_name = 'brand_id') THEN
    ALTER TABLE asins ADD COLUMN brand_id UUID REFERENCES brands(id);
  END IF;
END $$;

-- 7. Migrate brand data in asins
UPDATE asins a
SET brand_id = b.id
FROM brands b
WHERE a.brand = b.name
  AND a.brand_id IS NULL;

-- 8. Create a view for backward compatibility during transition
CREATE OR REPLACE VIEW deals_with_brands AS
SELECT 
  d.*,
  b.name as brand_name,
  b.logo_url as brand_logo_url,
  b.website_url as brand_website_url,
  b.amazon_store_url as brand_amazon_store_url,
  b.total_asins as brand_total_asins,
  b.active_asins as brand_active_asins
FROM deals d
LEFT JOIN brands b ON d.brand_id = b.id;

-- 9. Add brand_id to brand_keywords if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brand_keywords' AND column_name = 'brand_id') THEN
    ALTER TABLE brand_keywords ADD COLUMN brand_id UUID REFERENCES brands(id);
  END IF;
END $$;

-- 10. Update brand_keywords to reference brands table
UPDATE brand_keywords bk
SET brand_id = b.id
FROM brands b
WHERE bk.brand_name = b.name
  AND bk.brand_id IS NULL;

-- 11. Create updated brand_keyword_aggregate view
CREATE OR REPLACE VIEW brand_keyword_aggregate_v2 AS
WITH brand_asins AS (
  SELECT 
    a.id as asin_id,
    a.asin,
    COALESCE(a.brand_id, b.id) as brand_id,
    COALESCE(b.name, a.brand) as brand_name,
    a.title
  FROM asins a
  LEFT JOIN brands b ON (a.brand_id = b.id OR a.brand = b.name)
  WHERE a.brand IS NOT NULL OR a.brand_id IS NOT NULL
),
keyword_asin_data AS (
  SELECT 
    ba.brand_id,
    ba.brand_name,
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
  SELECT 
    COALESCE(bk.brand_id, b.id) as brand_id,
    bk.keyword,
    kr.asin,
    kr.position,
    kr.is_brand_result
  FROM brand_keywords bk
  LEFT JOIN brands b ON bk.brand_name = b.name
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
  kad.brand_id,
  kad.brand_name,
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
  ON kad.brand_id = kr.brand_id 
  AND LOWER(kad.keyword) = LOWER(kr.keyword)
  AND kad.asin = kr.asin
GROUP BY kad.brand_id, kad.brand_name, kad.keyword
ORDER BY kad.brand_name, MAX(kad.max_search_volume) DESC;

-- Add helpful comments
COMMENT ON TABLE brands IS 'Master table for Amazon brands/businesses, independent of acquisition deals';
COMMENT ON COLUMN deals.brand_id IS 'References the brand this acquisition deal is for';
COMMENT ON VIEW deals_with_brands IS 'Transitional view joining deals with brand information';
COMMENT ON VIEW brand_keyword_aggregate_v2 IS 'Updated view using brand_id relationships for keyword aggregation';