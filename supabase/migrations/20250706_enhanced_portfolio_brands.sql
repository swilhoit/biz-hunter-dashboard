-- Enhanced Portfolio System with Brands Management
-- This migration adds brand management capabilities to the portfolio system

-- Create brands table to organize ASINs by brand
CREATE TABLE IF NOT EXISTS brands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    description TEXT,
    website_url TEXT,
    amazon_store_url TEXT,
    total_asins INTEGER DEFAULT 0,
    total_monthly_revenue DECIMAL(12,2) DEFAULT 0,
    total_monthly_profit DECIMAL(12,2) DEFAULT 0,
    total_monthly_units INTEGER DEFAULT 0,
    avg_profit_margin DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- Add brand_id to user_asins table to link ASINs to brands
ALTER TABLE user_asins 
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_asins_brand_id ON user_asins(brand_id);
CREATE INDEX IF NOT EXISTS idx_brands_user_id ON brands(user_id);

-- Create a view for brand metrics with ASIN details
CREATE OR REPLACE VIEW brand_metrics AS
SELECT 
    b.id as brand_id,
    b.user_id,
    b.name as brand_name,
    b.logo_url,
    b.description,
    COUNT(DISTINCT ua.id) as total_asins,
    COALESCE(SUM(ua.monthly_revenue), 0) as total_monthly_revenue,
    COALESCE(SUM(ua.monthly_profit), 0) as total_monthly_profit,
    COALESCE(SUM(ua.monthly_units_sold), 0) as total_monthly_units,
    CASE 
        WHEN COALESCE(SUM(ua.monthly_revenue), 0) > 0 
        THEN (COALESCE(SUM(ua.monthly_profit), 0) / SUM(ua.monthly_revenue)) * 100
        ELSE 0
    END as avg_profit_margin,
    COALESCE(AVG(ua.current_rank), 0) as avg_rank,
    COALESCE(AVG(ua.review_count), 0) as avg_reviews,
    COALESCE(AVG(ua.rating), 0) as avg_rating
FROM brands b
LEFT JOIN user_asins ua ON b.id = ua.brand_id
GROUP BY b.id, b.user_id, b.name, b.logo_url, b.description;

-- Create a table for brand categories/tags
CREATE TABLE IF NOT EXISTS brand_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(brand_id, category)
);

-- Create a table for tracking brand performance over time
CREATE TABLE IF NOT EXISTS brand_performance_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_revenue DECIMAL(12,2),
    total_profit DECIMAL(12,2),
    total_units_sold INTEGER,
    avg_rank DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(brand_id, date)
);

-- Function to update brand metrics
CREATE OR REPLACE FUNCTION update_brand_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update brand metrics when ASINs are added/updated/deleted
    UPDATE brands b
    SET 
        total_asins = (
            SELECT COUNT(*) 
            FROM user_asins 
            WHERE brand_id = COALESCE(NEW.brand_id, OLD.brand_id)
        ),
        total_monthly_revenue = (
            SELECT COALESCE(SUM(monthly_revenue), 0) 
            FROM user_asins 
            WHERE brand_id = COALESCE(NEW.brand_id, OLD.brand_id)
        ),
        total_monthly_profit = (
            SELECT COALESCE(SUM(monthly_profit), 0) 
            FROM user_asins 
            WHERE brand_id = COALESCE(NEW.brand_id, OLD.brand_id)
        ),
        total_monthly_units = (
            SELECT COALESCE(SUM(monthly_units_sold), 0) 
            FROM user_asins 
            WHERE brand_id = COALESCE(NEW.brand_id, OLD.brand_id)
        ),
        avg_profit_margin = (
            SELECT 
                CASE 
                    WHEN COALESCE(SUM(monthly_revenue), 0) > 0 
                    THEN (COALESCE(SUM(monthly_profit), 0) / SUM(monthly_revenue)) * 100
                    ELSE 0
                END
            FROM user_asins 
            WHERE brand_id = COALESCE(NEW.brand_id, OLD.brand_id)
        ),
        updated_at = NOW()
    WHERE b.id = COALESCE(NEW.brand_id, OLD.brand_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating brand metrics
CREATE TRIGGER update_brand_metrics_on_asin_change
AFTER INSERT OR UPDATE OR DELETE ON user_asins
FOR EACH ROW
EXECUTE FUNCTION update_brand_metrics();

-- Create RLS policies for brands
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own brands" ON brands
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own brands" ON brands
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brands" ON brands
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own brands" ON brands
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for brand_categories
ALTER TABLE brand_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their brand categories" ON brand_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM brands 
            WHERE brands.id = brand_categories.brand_id 
            AND brands.user_id = auth.uid()
        )
    );

-- Create RLS policies for brand_performance_history
ALTER TABLE brand_performance_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their brand performance history" ON brand_performance_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM brands 
            WHERE brands.id = brand_performance_history.brand_id 
            AND brands.user_id = auth.uid()
        )
    );

-- Grant permissions
GRANT ALL ON brands TO authenticated;
GRANT ALL ON brand_categories TO authenticated;
GRANT ALL ON brand_performance_history TO authenticated;
GRANT SELECT ON brand_metrics TO authenticated;