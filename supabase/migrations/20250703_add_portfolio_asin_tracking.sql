-- Add portfolio ASIN tracking functionality
-- This migration adds the ability for users to track their own store ASINs independently of deals

-- Create user_portfolios table to group ASINs by portfolio
CREATE TABLE user_portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_asins table for tracking user's own store ASINs
CREATE TABLE user_asins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    portfolio_id UUID REFERENCES user_portfolios(id) ON DELETE SET NULL,
    asin VARCHAR(20) NOT NULL,
    product_name VARCHAR(500),
    brand VARCHAR(255),
    category VARCHAR(255),
    subcategory VARCHAR(255),
    
    -- Current metrics
    current_price DECIMAL(10,2),
    current_rank INTEGER,
    current_reviews INTEGER,
    current_rating DECIMAL(3,2),
    current_inventory INTEGER,
    
    -- Monthly performance metrics
    monthly_revenue DECIMAL(10,2),
    monthly_profit DECIMAL(10,2),
    monthly_units_sold INTEGER,
    profit_margin DECIMAL(5,2),
    
    -- Tracking info
    is_active BOOLEAN DEFAULT true,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure user can't duplicate ASINs in same portfolio
    UNIQUE(user_id, portfolio_id, asin)
);

-- Create historical metrics table for tracking ASIN performance over time
CREATE TABLE user_asin_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_asin_id UUID NOT NULL REFERENCES user_asins(id) ON DELETE CASCADE,
    
    -- Metrics snapshot
    price DECIMAL(10,2),
    rank INTEGER,
    reviews INTEGER,
    rating DECIMAL(3,2),
    inventory INTEGER,
    revenue DECIMAL(10,2),
    profit DECIMAL(10,2),
    units_sold INTEGER,
    
    -- Snapshot date
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Index for time-series queries
    INDEX idx_user_asin_metrics_recorded_at (recorded_at),
    INDEX idx_user_asin_metrics_user_asin_id (user_asin_id)
);

-- Create portfolio aggregate metrics view
CREATE VIEW portfolio_metrics AS
SELECT 
    p.id as portfolio_id,
    p.user_id,
    p.name as portfolio_name,
    COUNT(ua.id) as total_asins,
    COUNT(CASE WHEN ua.is_active THEN 1 END) as active_asins,
    SUM(CASE WHEN ua.is_active THEN ua.monthly_revenue ELSE 0 END) as total_monthly_revenue,
    SUM(CASE WHEN ua.is_active THEN ua.monthly_profit ELSE 0 END) as total_monthly_profit,
    SUM(CASE WHEN ua.is_active THEN ua.monthly_units_sold ELSE 0 END) as total_monthly_units,
    AVG(CASE WHEN ua.is_active AND ua.monthly_revenue > 0 THEN ua.profit_margin END) as avg_profit_margin,
    AVG(CASE WHEN ua.is_active THEN ua.current_rating END) as avg_rating,
    AVG(CASE WHEN ua.is_active THEN ua.current_rank END) as avg_rank
FROM user_portfolios p
LEFT JOIN user_asins ua ON p.id = ua.portfolio_id
GROUP BY p.id, p.user_id, p.name;

-- Create user-level aggregate metrics view
CREATE VIEW user_portfolio_summary AS
SELECT 
    user_id,
    COUNT(DISTINCT portfolio_id) as total_portfolios,
    COUNT(id) as total_asins,
    COUNT(CASE WHEN is_active THEN 1 END) as active_asins,
    SUM(CASE WHEN is_active THEN monthly_revenue ELSE 0 END) as total_monthly_revenue,
    SUM(CASE WHEN is_active THEN monthly_profit ELSE 0 END) as total_monthly_profit,
    SUM(CASE WHEN is_active THEN monthly_units_sold ELSE 0 END) as total_monthly_units,
    AVG(CASE WHEN is_active AND monthly_revenue > 0 THEN profit_margin END) as avg_profit_margin,
    AVG(CASE WHEN is_active THEN current_rating END) as avg_rating
FROM user_asins
GROUP BY user_id;

-- Add indexes for performance
CREATE INDEX idx_user_portfolios_user_id ON user_portfolios(user_id);
CREATE INDEX idx_user_asins_user_id ON user_asins(user_id);
CREATE INDEX idx_user_asins_portfolio_id ON user_asins(portfolio_id);
CREATE INDEX idx_user_asins_asin ON user_asins(asin);
CREATE INDEX idx_user_asins_is_active ON user_asins(is_active);

-- Enable Row Level Security
ALTER TABLE user_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_asins ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_asin_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_portfolios
CREATE POLICY "Users can view their own portfolios" ON user_portfolios
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own portfolios" ON user_portfolios
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolios" ON user_portfolios
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolios" ON user_portfolios
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_asins
CREATE POLICY "Users can view their own ASINs" ON user_asins
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ASINs" ON user_asins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ASINs" ON user_asins
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ASINs" ON user_asins
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_asin_metrics
CREATE POLICY "Users can view their own ASIN metrics" ON user_asin_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_asins ua 
            WHERE ua.id = user_asin_metrics.user_asin_id 
            AND ua.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own ASIN metrics" ON user_asin_metrics
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_asins ua 
            WHERE ua.id = user_asin_metrics.user_asin_id 
            AND ua.user_id = auth.uid()
        )
    );

-- Create updated_at trigger for user_portfolios
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_portfolios_updated_at 
    BEFORE UPDATE ON user_portfolios 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update last_updated on user_asins
CREATE TRIGGER update_user_asins_last_updated 
    BEFORE UPDATE ON user_asins 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE user_portfolios IS 'User-created portfolios for organizing their own store ASINs';
COMMENT ON TABLE user_asins IS 'User-tracked ASINs from their own Amazon stores, organized by portfolio';
COMMENT ON TABLE user_asin_metrics IS 'Historical performance metrics for user ASINs';
COMMENT ON VIEW portfolio_metrics IS 'Aggregated metrics for each portfolio';
COMMENT ON VIEW user_portfolio_summary IS 'User-level summary of all portfolio performance';