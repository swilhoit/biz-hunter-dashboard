-- Migration: Add competitor brand tracking during keyword analysis
-- This extends the existing brand keyword tracking system to capture competitor brands
-- that appear in search results during ranking analysis

-- Add fields to keyword_rankings to track competitor brand information
ALTER TABLE keyword_rankings
ADD COLUMN IF NOT EXISTS detected_brand VARCHAR(255),
ADD COLUMN IF NOT EXISTS detected_brand_confidence DECIMAL(3,2) CHECK (detected_brand_confidence >= 0 AND detected_brand_confidence <= 1),
ADD COLUMN IF NOT EXISTS is_competitor BOOLEAN DEFAULT false;

-- Create an index for faster competitor brand lookups
CREATE INDEX IF NOT EXISTS idx_keyword_rankings_detected_brand 
ON keyword_rankings(detected_brand) 
WHERE detected_brand IS NOT NULL;

-- Create a table to track all detected competitor brands
CREATE TABLE IF NOT EXISTS competitor_brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_name VARCHAR(255) NOT NULL,
    first_detected_at TIMESTAMP DEFAULT NOW(),
    last_seen_at TIMESTAMP DEFAULT NOW(),
    detection_count INTEGER DEFAULT 1,
    avg_position DECIMAL(5,2),
    total_keywords INTEGER DEFAULT 0,
    top_10_keywords INTEGER DEFAULT 0,
    estimated_market_share DECIMAL(5,2),
    is_tracked BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(brand_name)
);

-- Create a table to track competitor brand appearances in keyword rankings
CREATE TABLE IF NOT EXISTS competitor_brand_rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competitor_brand_id UUID REFERENCES competitor_brands(id) ON DELETE CASCADE,
    brand_keyword_id UUID REFERENCES brand_keywords(id) ON DELETE CASCADE,
    keyword VARCHAR(255) NOT NULL,
    position INTEGER NOT NULL,
    page INTEGER DEFAULT 1,
    asin VARCHAR(20),
    product_title TEXT,
    check_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(competitor_brand_id, brand_keyword_id, asin, check_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_competitor_brand_rankings_brand 
ON competitor_brand_rankings(competitor_brand_id);

CREATE INDEX IF NOT EXISTS idx_competitor_brand_rankings_keyword 
ON competitor_brand_rankings(brand_keyword_id);

CREATE INDEX IF NOT EXISTS idx_competitor_brand_rankings_date 
ON competitor_brand_rankings(check_date);

-- Create a view for competitor market share analysis
CREATE OR REPLACE VIEW competitor_market_share_analysis AS
WITH keyword_totals AS (
    SELECT 
        bk.keyword,
        bk.search_volume,
        COUNT(DISTINCT kr.asin) as total_products
    FROM brand_keywords bk
    LEFT JOIN keyword_rankings kr ON kr.brand_keyword_id = bk.id
    WHERE kr.position <= 50
    GROUP BY bk.keyword, bk.search_volume
),
brand_keyword_presence AS (
    SELECT 
        kr.detected_brand as brand_name,
        bk.keyword,
        MIN(kr.position) as best_position,
        COUNT(DISTINCT kr.asin) as product_count,
        bk.search_volume
    FROM keyword_rankings kr
    JOIN brand_keywords bk ON kr.brand_keyword_id = bk.id
    WHERE kr.detected_brand IS NOT NULL
    AND kr.position <= 50
    GROUP BY kr.detected_brand, bk.keyword, bk.search_volume
),
brand_metrics AS (
    SELECT 
        brand_name,
        COUNT(DISTINCT keyword) as total_keywords,
        SUM(CASE WHEN best_position <= 10 THEN 1 ELSE 0 END) as top_10_keywords,
        SUM(CASE WHEN best_position <= 3 THEN 1 ELSE 0 END) as top_3_keywords,
        AVG(best_position) as avg_position,
        SUM(search_volume) as total_search_volume,
        SUM(CASE 
            WHEN best_position = 1 THEN search_volume * 0.35
            WHEN best_position = 2 THEN search_volume * 0.20
            WHEN best_position = 3 THEN search_volume * 0.15
            WHEN best_position <= 5 THEN search_volume * 0.08
            WHEN best_position <= 10 THEN search_volume * 0.05
            ELSE search_volume * 0.01
        END) as estimated_traffic
    FROM brand_keyword_presence
    GROUP BY brand_name
)
SELECT 
    bm.*,
    ROUND((bm.estimated_traffic::numeric / NULLIF(SUM(bm.estimated_traffic) OVER(), 0)) * 100, 2) as estimated_market_share
FROM brand_metrics bm
ORDER BY estimated_market_share DESC;

-- Create a function to update competitor brand metrics
CREATE OR REPLACE FUNCTION update_competitor_brand_metrics()
RETURNS void AS $$
BEGIN
    -- Update or insert competitor brands based on detected brands in keyword_rankings
    INSERT INTO competitor_brands (
        brand_name,
        detection_count,
        avg_position,
        total_keywords,
        top_10_keywords,
        last_seen_at
    )
    SELECT 
        detected_brand,
        COUNT(DISTINCT id),
        AVG(position),
        COUNT(DISTINCT brand_keyword_id),
        COUNT(DISTINCT CASE WHEN position <= 10 THEN brand_keyword_id END),
        MAX(check_date)
    FROM keyword_rankings
    WHERE detected_brand IS NOT NULL
    AND is_competitor = true
    GROUP BY detected_brand
    ON CONFLICT (brand_name) DO UPDATE SET
        detection_count = competitor_brands.detection_count + EXCLUDED.detection_count,
        avg_position = EXCLUDED.avg_position,
        total_keywords = EXCLUDED.total_keywords,
        top_10_keywords = EXCLUDED.top_10_keywords,
        last_seen_at = EXCLUDED.last_seen_at,
        updated_at = NOW();
        
    -- Update market share estimates
    UPDATE competitor_brands cb
    SET estimated_market_share = cms.estimated_market_share
    FROM competitor_market_share_analysis cms
    WHERE cb.brand_name = cms.brand_name;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update competitor metrics after keyword ranking updates
CREATE OR REPLACE FUNCTION trigger_update_competitor_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Only run if we have new competitor brand detections
    IF EXISTS (
        SELECT 1 FROM keyword_rankings 
        WHERE detected_brand IS NOT NULL 
        AND is_competitor = true
        AND check_date >= CURRENT_DATE - INTERVAL '1 day'
    ) THEN
        PERFORM update_competitor_brand_metrics();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_competitor_metrics_after_ranking
AFTER INSERT OR UPDATE ON keyword_rankings
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_update_competitor_metrics();

-- Add RLS policies for the new tables
ALTER TABLE competitor_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_brand_rankings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view competitor data
CREATE POLICY "Users can view competitor brands"
ON competitor_brands FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can view competitor rankings"
ON competitor_brand_rankings FOR SELECT
TO authenticated
USING (true);

-- Only allow system to update competitor data (through service role)
CREATE POLICY "System can manage competitor brands"
ON competitor_brands FOR ALL
TO service_role
USING (true);

CREATE POLICY "System can manage competitor rankings"
ON competitor_brand_rankings FOR ALL
TO service_role
USING (true);