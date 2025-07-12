-- Create tables for brand keyword tracking and ranking

-- Table to store recommended keywords for brands
CREATE TABLE IF NOT EXISTS brand_keywords (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    brand_name VARCHAR(255) NOT NULL,
    keyword VARCHAR(500) NOT NULL,
    search_volume INTEGER DEFAULT 0,
    cpc DECIMAL(8,2) DEFAULT 0,
    competition DECIMAL(3,2) DEFAULT 0,
    difficulty INTEGER DEFAULT 0,
    relevance_score INTEGER DEFAULT 0, -- 1-10 relevance to brand
    keyword_type VARCHAR(50) DEFAULT 'general', -- 'brand', 'product', 'category', 'competitor'
    source VARCHAR(100) DEFAULT 'manual', -- 'manual', 'ai_recommendation', 'competitor_analysis'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(brand_name, keyword)
);

-- Table to track keyword rankings over time
CREATE TABLE IF NOT EXISTS keyword_rankings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    brand_keyword_id UUID NOT NULL REFERENCES brand_keywords(id) ON DELETE CASCADE,
    asin VARCHAR(20), -- ASIN that's ranking for this keyword
    position INTEGER NOT NULL, -- 1-100+ ranking position
    page INTEGER DEFAULT 1, -- Which page of results (1-10)
    url TEXT, -- Full Amazon product URL
    title TEXT, -- Product title as it appears in search
    domain VARCHAR(100) DEFAULT 'amazon.com',
    location_code INTEGER DEFAULT 2840, -- US by default
    language_code VARCHAR(10) DEFAULT 'en',
    check_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table to store SERP features for keywords (ads, shopping results, etc.)
CREATE TABLE IF NOT EXISTS keyword_serp_features (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    brand_keyword_id UUID NOT NULL REFERENCES brand_keywords(id) ON DELETE CASCADE,
    feature_type VARCHAR(100) NOT NULL, -- 'paid_search', 'shopping_results', 'featured_snippet', etc.
    position INTEGER,
    title TEXT,
    url TEXT,
    description TEXT,
    additional_data JSONB DEFAULT '{}',
    check_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table to track brand ranking summary
CREATE TABLE IF NOT EXISTS brand_ranking_summary (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    brand_name VARCHAR(255) NOT NULL,
    total_keywords INTEGER DEFAULT 0,
    ranking_keywords INTEGER DEFAULT 0, -- Keywords with positions 1-100
    top_10_keywords INTEGER DEFAULT 0,
    top_3_keywords INTEGER DEFAULT 0,
    avg_position DECIMAL(5,2) DEFAULT 0,
    visibility_score DECIMAL(8,2) DEFAULT 0, -- Calculated visibility metric
    total_search_volume INTEGER DEFAULT 0,
    estimated_traffic INTEGER DEFAULT 0,
    check_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    check_date_only DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(brand_name, check_date_only)
);

-- Create indexes for performance
CREATE INDEX idx_brand_keywords_brand ON brand_keywords(brand_name);
CREATE INDEX idx_brand_keywords_active ON brand_keywords(is_active);
CREATE INDEX idx_keyword_rankings_brand_keyword ON keyword_rankings(brand_keyword_id);
CREATE INDEX idx_keyword_rankings_position ON keyword_rankings(position);
CREATE INDEX idx_keyword_rankings_date ON keyword_rankings(check_date);
CREATE INDEX idx_keyword_serp_features_brand_keyword ON keyword_serp_features(brand_keyword_id);
CREATE INDEX idx_brand_ranking_summary_brand ON brand_ranking_summary(brand_name);
CREATE INDEX idx_brand_ranking_summary_date ON brand_ranking_summary(check_date);
-- Unique constraint is now handled by the table definition with check_date_only column

-- Add RLS policies
ALTER TABLE brand_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_serp_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_ranking_summary ENABLE ROW LEVEL SECURITY;

-- Brand keywords policies
CREATE POLICY "Users can view brand keywords" ON brand_keywords
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create brand keywords" ON brand_keywords
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update brand keywords" ON brand_keywords
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete brand keywords" ON brand_keywords
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Keyword rankings policies
CREATE POLICY "Users can view keyword rankings" ON keyword_rankings
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create keyword rankings" ON keyword_rankings
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- SERP features policies
CREATE POLICY "Users can view keyword serp features" ON keyword_serp_features
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create keyword serp features" ON keyword_serp_features
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Brand ranking summary policies
CREATE POLICY "Users can view brand ranking summary" ON brand_ranking_summary
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create brand ranking summary" ON brand_ranking_summary
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update brand ranking summary" ON brand_ranking_summary
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create triggers for updated_at
CREATE TRIGGER update_brand_keywords_updated_at BEFORE UPDATE ON brand_keywords
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_brand_ranking_summary_updated_at BEFORE UPDATE ON brand_ranking_summary
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create a view for brand performance overview
CREATE OR REPLACE VIEW brand_keyword_performance AS
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
    CASE 
        WHEN kr.position <= 3 THEN 'Top 3'
        WHEN kr.position <= 10 THEN 'Top 10'
        WHEN kr.position <= 50 THEN 'Top 50'
        WHEN kr.position <= 100 THEN 'Top 100'
        ELSE 'Not Ranking'
    END as ranking_tier,
    -- Calculate estimated traffic based on position and search volume
    CASE 
        WHEN kr.position = 1 THEN bk.search_volume * 0.31
        WHEN kr.position = 2 THEN bk.search_volume * 0.24
        WHEN kr.position = 3 THEN bk.search_volume * 0.18
        WHEN kr.position <= 10 THEN bk.search_volume * (0.15 - (kr.position - 4) * 0.02)
        WHEN kr.position <= 20 THEN bk.search_volume * 0.02
        ELSE 0
    END as estimated_traffic
FROM brand_keywords bk
LEFT JOIN (
    SELECT DISTINCT ON (brand_keyword_id) 
        brand_keyword_id, position, asin, title, check_date
    FROM keyword_rankings 
    ORDER BY brand_keyword_id, check_date DESC
) kr ON bk.id = kr.brand_keyword_id
WHERE bk.is_active = true;