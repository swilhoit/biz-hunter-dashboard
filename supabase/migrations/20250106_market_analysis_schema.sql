-- Create market analysis overview table
CREATE TABLE IF NOT EXISTS market_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    total_market_revenue NUMERIC,
    market_growth_rate NUMERIC,
    tam_total_addressable_market NUMERIC,
    sam_serviceable_market NUMERIC,
    som_obtainable_market NUMERIC,
    market_share NUMERIC,
    market_position INTEGER,
    total_competitors INTEGER,
    competitive_advantage TEXT,
    market_opportunity_score INTEGER CHECK (market_opportunity_score >= 0 AND market_opportunity_score <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(deal_id)
);

-- Create channel performance table
CREATE TABLE IF NOT EXISTS channel_performance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    channel_name TEXT NOT NULL,
    revenue NUMERIC,
    revenue_percentage NUMERIC,
    growth_rate NUMERIC,
    customer_count INTEGER,
    conversion_rate NUMERIC,
    avg_order_value NUMERIC,
    ltv_customer_lifetime_value NUMERIC,
    cac_customer_acquisition_cost NUMERIC,
    roi_percentage NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(deal_id, channel_name)
);

-- Create Amazon channel analysis table
CREATE TABLE IF NOT EXISTS amazon_channel_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    -- Basic metrics
    total_asins INTEGER,
    active_asins INTEGER,
    best_seller_rank_avg INTEGER,
    rating_avg NUMERIC(2,1),
    review_count_total INTEGER,
    
    -- Performance metrics
    buy_box_percentage NUMERIC,
    inventory_turnover_rate NUMERIC,
    return_rate NUMERIC,
    account_health_score INTEGER,
    
    -- Competitive analysis
    market_saturation_score INTEGER CHECK (market_saturation_score >= 0 AND market_saturation_score <= 100),
    competitor_count INTEGER,
    price_competitiveness_score INTEGER CHECK (price_competitiveness_score >= 0 AND price_competitiveness_score <= 100),
    brand_strength_score INTEGER CHECK (brand_strength_score >= 0 AND brand_strength_score <= 100),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(deal_id)
);

-- Create Amazon competitors table
CREATE TABLE IF NOT EXISTS amazon_competitors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    competitor_name TEXT NOT NULL,
    store_url TEXT,
    estimated_revenue NUMERIC,
    product_count INTEGER,
    avg_rating NUMERIC(2,1),
    review_count INTEGER,
    price_range_low NUMERIC,
    price_range_high NUMERIC,
    market_share_percentage NUMERIC,
    strengths TEXT[],
    weaknesses TEXT[],
    threat_level TEXT CHECK (threat_level IN ('low', 'medium', 'high')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create SEO analysis table
CREATE TABLE IF NOT EXISTS seo_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    -- Domain metrics
    domain_authority INTEGER,
    page_authority INTEGER,
    trust_flow INTEGER,
    citation_flow INTEGER,
    
    -- Traffic metrics
    organic_traffic_monthly INTEGER,
    paid_traffic_monthly INTEGER,
    direct_traffic_monthly INTEGER,
    referral_traffic_monthly INTEGER,
    
    -- Keyword metrics
    total_keywords_ranking INTEGER,
    keywords_top_3 INTEGER,
    keywords_top_10 INTEGER,
    keywords_top_100 INTEGER,
    
    -- Backlink metrics
    total_backlinks INTEGER,
    referring_domains INTEGER,
    dofollow_backlinks INTEGER,
    
    -- Technical SEO
    page_speed_score INTEGER,
    mobile_score INTEGER,
    
    -- Competitive analysis
    organic_competitors INTEGER,
    visibility_score INTEGER CHECK (visibility_score >= 0 AND visibility_score <= 100),
    content_quality_score INTEGER CHECK (content_quality_score >= 0 AND content_quality_score <= 100),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(deal_id)
);

-- Create SEO competitors table
CREATE TABLE IF NOT EXISTS seo_competitors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    competitor_domain TEXT NOT NULL,
    domain_authority INTEGER,
    organic_traffic INTEGER,
    keyword_overlap_count INTEGER,
    keyword_overlap_percentage NUMERIC,
    competing_pages INTEGER,
    visibility_score INTEGER,
    content_gap_opportunities INTEGER,
    backlink_gap_opportunities INTEGER,
    strengths TEXT[],
    weaknesses TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create SEO keywords table
CREATE TABLE IF NOT EXISTS seo_keywords (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    search_volume INTEGER,
    keyword_difficulty INTEGER,
    current_position INTEGER,
    previous_position INTEGER,
    trend TEXT CHECK (trend IN ('up', 'down', 'stable')),
    url TEXT,
    is_branded BOOLEAN DEFAULT FALSE,
    competitor_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create social media analysis table
CREATE TABLE IF NOT EXISTS social_media_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    -- Platform metrics (stored as JSONB for flexibility)
    platform_metrics JSONB DEFAULT '{}',
    
    -- Aggregate metrics
    total_followers INTEGER,
    total_engagement_rate NUMERIC,
    avg_post_reach INTEGER,
    avg_post_engagement INTEGER,
    
    -- Content metrics
    post_frequency_weekly NUMERIC,
    content_types JSONB DEFAULT '[]',
    top_performing_content_type TEXT,
    
    -- Audience metrics
    audience_growth_rate NUMERIC,
    audience_demographics JSONB DEFAULT '{}',
    audience_interests TEXT[],
    
    -- Competitive analysis
    social_share_of_voice NUMERIC,
    sentiment_score INTEGER CHECK (sentiment_score >= -100 AND sentiment_score <= 100),
    brand_mentions_monthly INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(deal_id)
);

-- Create social media competitors table
CREATE TABLE IF NOT EXISTS social_competitors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    competitor_name TEXT NOT NULL,
    platform_presence JSONB DEFAULT '{}', -- {instagram: {followers: 1000, engagement: 5.2}, facebook: {...}}
    total_reach INTEGER,
    engagement_rate_avg NUMERIC,
    post_frequency_weekly NUMERIC,
    content_strategy TEXT,
    strengths TEXT[],
    weaknesses TEXT[],
    audience_overlap_percentage NUMERIC,
    share_of_voice NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create market insights table
CREATE TABLE IF NOT EXISTS market_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    insight_type TEXT CHECK (insight_type IN ('strength', 'weakness', 'opportunity', 'threat')),
    channel TEXT CHECK (channel IN ('overall', 'amazon', 'seo', 'social', 'other')),
    title TEXT NOT NULL,
    description TEXT,
    impact_score INTEGER CHECK (impact_score >= 1 AND impact_score <= 10),
    effort_score INTEGER CHECK (effort_score >= 1 AND effort_score <= 10),
    priority INTEGER CHECK (priority >= 1 AND priority <= 5),
    potential_revenue_impact NUMERIC,
    implementation_timeframe TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create competitive advantages table
CREATE TABLE IF NOT EXISTS competitive_advantages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    channel TEXT CHECK (channel IN ('overall', 'amazon', 'seo', 'social', 'other')),
    advantage_type TEXT NOT NULL,
    description TEXT,
    sustainability_score INTEGER CHECK (sustainability_score >= 1 AND sustainability_score <= 10),
    moat_strength TEXT CHECK (moat_strength IN ('weak', 'moderate', 'strong')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_market_analysis_deal_id ON market_analysis(deal_id);
CREATE INDEX idx_channel_performance_deal_id ON channel_performance(deal_id);
CREATE INDEX idx_amazon_channel_analysis_deal_id ON amazon_channel_analysis(deal_id);
CREATE INDEX idx_amazon_competitors_deal_id ON amazon_competitors(deal_id);
CREATE INDEX idx_seo_analysis_deal_id ON seo_analysis(deal_id);
CREATE INDEX idx_seo_competitors_deal_id ON seo_competitors(deal_id);
CREATE INDEX idx_seo_keywords_deal_id ON seo_keywords(deal_id);
CREATE INDEX idx_seo_keywords_position ON seo_keywords(current_position);
CREATE INDEX idx_social_media_analysis_deal_id ON social_media_analysis(deal_id);
CREATE INDEX idx_social_competitors_deal_id ON social_competitors(deal_id);
CREATE INDEX idx_market_insights_deal_id ON market_insights(deal_id);
CREATE INDEX idx_competitive_advantages_deal_id ON competitive_advantages(deal_id);

-- Add RLS policies
ALTER TABLE market_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_channel_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitive_advantages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Users can view market analysis for their deals" ON market_analysis
    FOR SELECT USING (deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage market analysis for their deals" ON market_analysis
    FOR ALL USING (deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid()));

-- Repeat similar policies for all tables
CREATE POLICY "Users can view channel performance for their deals" ON channel_performance
    FOR SELECT USING (deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage channel performance for their deals" ON channel_performance
    FOR ALL USING (deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid()));

CREATE POLICY "Users can view amazon analysis for their deals" ON amazon_channel_analysis
    FOR SELECT USING (deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage amazon analysis for their deals" ON amazon_channel_analysis
    FOR ALL USING (deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid()));

CREATE POLICY "Users can view amazon competitors for their deals" ON amazon_competitors
    FOR SELECT USING (deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage amazon competitors for their deals" ON amazon_competitors
    FOR ALL USING (deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid()));

CREATE POLICY "Users can view seo analysis for their deals" ON seo_analysis
    FOR SELECT USING (deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage seo analysis for their deals" ON seo_analysis
    FOR ALL USING (deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid()));

CREATE POLICY "Users can view seo competitors for their deals" ON seo_competitors
    FOR SELECT USING (deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage seo competitors for their deals" ON seo_competitors
    FOR ALL USING (deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid()));

CREATE POLICY "Users can view seo keywords for their deals" ON seo_keywords
    FOR SELECT USING (deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage seo keywords for their deals" ON seo_keywords
    FOR ALL USING (deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid()));

CREATE POLICY "Users can view social analysis for their deals" ON social_media_analysis
    FOR SELECT USING (deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage social analysis for their deals" ON social_media_analysis
    FOR ALL USING (deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid()));

CREATE POLICY "Users can view social competitors for their deals" ON social_competitors
    FOR SELECT USING (deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage social competitors for their deals" ON social_competitors
    FOR ALL USING (deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid()));

CREATE POLICY "Users can view market insights for their deals" ON market_insights
    FOR SELECT USING (deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage market insights for their deals" ON market_insights
    FOR ALL USING (deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid()));

CREATE POLICY "Users can view competitive advantages for their deals" ON competitive_advantages
    FOR SELECT USING (deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage competitive advantages for their deals" ON competitive_advantages
    FOR ALL USING (deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid()));

-- Add update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_market_analysis_updated_at BEFORE UPDATE ON market_analysis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channel_performance_updated_at BEFORE UPDATE ON channel_performance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_amazon_channel_analysis_updated_at BEFORE UPDATE ON amazon_channel_analysis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_amazon_competitors_updated_at BEFORE UPDATE ON amazon_competitors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seo_analysis_updated_at BEFORE UPDATE ON seo_analysis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seo_competitors_updated_at BEFORE UPDATE ON seo_competitors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seo_keywords_updated_at BEFORE UPDATE ON seo_keywords
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_media_analysis_updated_at BEFORE UPDATE ON social_media_analysis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_competitors_updated_at BEFORE UPDATE ON social_competitors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_market_insights_updated_at BEFORE UPDATE ON market_insights
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitive_advantages_updated_at BEFORE UPDATE ON competitive_advantages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();