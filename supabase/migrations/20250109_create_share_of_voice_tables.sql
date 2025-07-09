-- Create share of voice analysis tables
CREATE TABLE IF NOT EXISTS share_of_voice_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    brand_name TEXT NOT NULL,
    category TEXT,
    analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Market overview
    total_market_revenue DECIMAL(12,2),
    total_brands INTEGER,
    total_products INTEGER,
    avg_products_per_brand DECIMAL(8,2),
    concentration_index DECIMAL(5,4), -- Herfindahl index
    
    -- Brand specific metrics
    brand_market_share DECIMAL(5,2),
    brand_revenue DECIMAL(12,2),
    brand_units_sold INTEGER,
    brand_product_count INTEGER,
    brand_avg_rating DECIMAL(3,2),
    brand_avg_reviews INTEGER,
    brand_keyword_share DECIMAL(5,2),
    brand_rank INTEGER,
    
    -- Raw data storage
    top_brands JSONB, -- Array of top brand data
    keyword_analysis JSONB, -- Keyword performance data
    category_distribution JSONB, -- Category breakdown
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create competitor analysis table
CREATE TABLE IF NOT EXISTS share_of_voice_competitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES share_of_voice_reports(id) ON DELETE CASCADE,
    brand_name TEXT NOT NULL,
    market_share DECIMAL(5,2),
    revenue DECIMAL(12,2),
    units_sold INTEGER,
    product_count INTEGER,
    avg_rating DECIMAL(3,2),
    avg_reviews INTEGER,
    keyword_share DECIMAL(5,2),
    rank INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create keyword analysis table
CREATE TABLE IF NOT EXISTS share_of_voice_keywords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES share_of_voice_reports(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    search_volume INTEGER,
    brand_product_count INTEGER,
    total_product_count INTEGER,
    share_percentage DECIMAL(5,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_sov_reports_deal_id ON share_of_voice_reports(deal_id);
CREATE INDEX idx_sov_reports_brand_name ON share_of_voice_reports(brand_name);
CREATE INDEX idx_sov_reports_analysis_date ON share_of_voice_reports(analysis_date);
CREATE INDEX idx_sov_competitors_report_id ON share_of_voice_competitors(report_id);
CREATE INDEX idx_sov_keywords_report_id ON share_of_voice_keywords(report_id);

-- Add RLS policies
ALTER TABLE share_of_voice_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_of_voice_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_of_voice_keywords ENABLE ROW LEVEL SECURITY;

-- RLS policies for share_of_voice_reports
CREATE POLICY "Users can view share of voice reports for their deals" ON share_of_voice_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM deals 
            WHERE deals.id = share_of_voice_reports.deal_id 
            AND deals.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create share of voice reports for their deals" ON share_of_voice_reports
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM deals 
            WHERE deals.id = share_of_voice_reports.deal_id 
            AND deals.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their share of voice reports" ON share_of_voice_reports
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM deals 
            WHERE deals.id = share_of_voice_reports.deal_id 
            AND deals.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their share of voice reports" ON share_of_voice_reports
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM deals 
            WHERE deals.id = share_of_voice_reports.deal_id 
            AND deals.user_id = auth.uid()
        )
    );

-- RLS policies for share_of_voice_competitors
CREATE POLICY "Users can view competitors data" ON share_of_voice_competitors
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM share_of_voice_reports r
            JOIN deals d ON d.id = r.deal_id
            WHERE r.id = share_of_voice_competitors.report_id 
            AND d.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage competitors data" ON share_of_voice_competitors
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM share_of_voice_reports r
            JOIN deals d ON d.id = r.deal_id
            WHERE r.id = share_of_voice_competitors.report_id 
            AND d.user_id = auth.uid()
        )
    );

-- RLS policies for share_of_voice_keywords
CREATE POLICY "Users can view keywords data" ON share_of_voice_keywords
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM share_of_voice_reports r
            JOIN deals d ON d.id = r.deal_id
            WHERE r.id = share_of_voice_keywords.report_id 
            AND d.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage keywords data" ON share_of_voice_keywords
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM share_of_voice_reports r
            JOIN deals d ON d.id = r.deal_id
            WHERE r.id = share_of_voice_keywords.report_id 
            AND d.user_id = auth.uid()
        )
    );