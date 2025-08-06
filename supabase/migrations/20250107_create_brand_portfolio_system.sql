-- Enhanced Portfolio System with Brands Management
-- This migration creates a complete brand portfolio management system

-- 1. Create brands table to organize ASINs by brand
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

-- 2. Create user_portfolios table (if not exists)
CREATE TABLE IF NOT EXISTS user_portfolios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- 3. Create user_asins table for tracking ASINs
CREATE TABLE IF NOT EXISTS user_asins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    portfolio_id UUID REFERENCES user_portfolios(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
    asin VARCHAR(20) NOT NULL,
    product_name VARCHAR(500),
    brand VARCHAR(255),
    category VARCHAR(255),
    subcategory VARCHAR(255),
    current_price DECIMAL(10,2),
    current_rank INTEGER,
    review_count INTEGER,
    rating DECIMAL(3,2),
    monthly_revenue DECIMAL(12,2),
    monthly_profit DECIMAL(12,2),
    monthly_units_sold INTEGER,
    profit_margin DECIMAL(5,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, asin)
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_brands_user_id ON brands(user_id);
CREATE INDEX IF NOT EXISTS idx_user_asins_brand_id ON user_asins(brand_id);
CREATE INDEX IF NOT EXISTS idx_user_asins_user_id ON user_asins(user_id);
CREATE INDEX IF NOT EXISTS idx_user_asins_portfolio_id ON user_asins(portfolio_id);

-- 5. Create view for brand metrics with ASIN details
CREATE OR REPLACE VIEW brand_metrics AS
SELECT 
    b.id as brand_id,
    b.user_id,
    b.name as brand_name,
    b.logo_url,
    b.description,
    b.website_url,
    b.amazon_store_url,
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
    COALESCE(AVG(ua.rating), 0) as avg_rating,
    b.created_at,
    b.updated_at
FROM brands b
LEFT JOIN user_asins ua ON b.id = ua.brand_id AND ua.is_active = true
GROUP BY b.id, b.user_id, b.name, b.logo_url, b.description, b.website_url, 
         b.amazon_store_url, b.created_at, b.updated_at;

-- 6. Create view for portfolio metrics
CREATE OR REPLACE VIEW portfolio_metrics AS
SELECT 
    p.id as portfolio_id,
    p.user_id,
    p.name as portfolio_name,
    p.description,
    COUNT(DISTINCT ua.id) as total_asins,
    COUNT(DISTINCT ua.brand_id) as total_brands,
    COALESCE(SUM(ua.monthly_revenue), 0) as total_monthly_revenue,
    COALESCE(SUM(ua.monthly_profit), 0) as total_monthly_profit,
    COALESCE(SUM(ua.monthly_units_sold), 0) as total_monthly_units,
    CASE 
        WHEN COALESCE(SUM(ua.monthly_revenue), 0) > 0 
        THEN (COALESCE(SUM(ua.monthly_profit), 0) / SUM(ua.monthly_revenue)) * 100
        ELSE 0
    END as avg_profit_margin,
    p.created_at,
    p.updated_at
FROM user_portfolios p
LEFT JOIN user_asins ua ON p.id = ua.portfolio_id AND ua.is_active = true
GROUP BY p.id, p.user_id, p.name, p.description, p.created_at, p.updated_at;

-- 7. Create view for user portfolio summary
CREATE OR REPLACE VIEW user_portfolio_summary AS
SELECT 
    ua.user_id,
    COUNT(DISTINCT p.id) as total_portfolios,
    COUNT(DISTINCT ua.id) as total_asins,
    COUNT(DISTINCT ua.brand_id) as total_brands,
    COUNT(DISTINCT CASE WHEN ua.is_active THEN ua.id END) as active_asins,
    COALESCE(SUM(ua.monthly_revenue), 0) as total_monthly_revenue,
    COALESCE(SUM(ua.monthly_profit), 0) as total_monthly_profit,
    COALESCE(SUM(ua.monthly_units_sold), 0) as total_monthly_units,
    CASE 
        WHEN COALESCE(SUM(ua.monthly_revenue), 0) > 0 
        THEN (COALESCE(SUM(ua.monthly_profit), 0) / SUM(ua.monthly_revenue)) * 100
        ELSE 0
    END as avg_profit_margin,
    COALESCE(AVG(ua.rating), 0) as avg_rating
FROM user_asins ua
LEFT JOIN user_portfolios p ON ua.portfolio_id = p.id
WHERE ua.user_id IS NOT NULL
GROUP BY ua.user_id;

-- 8. Create table for brand categories/tags
CREATE TABLE IF NOT EXISTS brand_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(brand_id, category)
);

-- 9. Create table for tracking brand performance history
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

-- 10. Create table for ASIN metrics history
CREATE TABLE IF NOT EXISTS user_asin_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_asin_id UUID NOT NULL REFERENCES user_asins(id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    price DECIMAL(10,2),
    rank INTEGER,
    review_count INTEGER,
    rating DECIMAL(3,2),
    revenue DECIMAL(12,2),
    profit DECIMAL(12,2),
    units_sold INTEGER
);

-- 11. Function to update brand metrics
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
            AND is_active = true
        ),
        total_monthly_revenue = (
            SELECT COALESCE(SUM(monthly_revenue), 0) 
            FROM user_asins 
            WHERE brand_id = COALESCE(NEW.brand_id, OLD.brand_id)
            AND is_active = true
        ),
        total_monthly_profit = (
            SELECT COALESCE(SUM(monthly_profit), 0) 
            FROM user_asins 
            WHERE brand_id = COALESCE(NEW.brand_id, OLD.brand_id)
            AND is_active = true
        ),
        total_monthly_units = (
            SELECT COALESCE(SUM(monthly_units_sold), 0) 
            FROM user_asins 
            WHERE brand_id = COALESCE(NEW.brand_id, OLD.brand_id)
            AND is_active = true
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
            AND is_active = true
        ),
        updated_at = NOW()
    WHERE b.id = COALESCE(NEW.brand_id, OLD.brand_id);
    
    -- If brand was changed, update the old brand too
    IF TG_OP = 'UPDATE' AND OLD.brand_id IS DISTINCT FROM NEW.brand_id AND OLD.brand_id IS NOT NULL THEN
        UPDATE brands b
        SET 
            total_asins = (
                SELECT COUNT(*) 
                FROM user_asins 
                WHERE brand_id = OLD.brand_id 
                AND is_active = true
            ),
            total_monthly_revenue = (
                SELECT COALESCE(SUM(monthly_revenue), 0) 
                FROM user_asins 
                WHERE brand_id = OLD.brand_id
                AND is_active = true
            ),
            total_monthly_profit = (
                SELECT COALESCE(SUM(monthly_profit), 0) 
                FROM user_asins 
                WHERE brand_id = OLD.brand_id
                AND is_active = true
            ),
            total_monthly_units = (
                SELECT COALESCE(SUM(monthly_units_sold), 0) 
                FROM user_asins 
                WHERE brand_id = OLD.brand_id
                AND is_active = true
            ),
            avg_profit_margin = (
                SELECT 
                    CASE 
                        WHEN COALESCE(SUM(monthly_revenue), 0) > 0 
                        THEN (COALESCE(SUM(monthly_profit), 0) / SUM(monthly_revenue)) * 100
                        ELSE 0
                    END
                FROM user_asins 
                WHERE brand_id = OLD.brand_id
                AND is_active = true
            ),
            updated_at = NOW()
        WHERE b.id = OLD.brand_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 12. Create trigger for updating brand metrics
DROP TRIGGER IF EXISTS update_brand_metrics_on_asin_change ON user_asins;
CREATE TRIGGER update_brand_metrics_on_asin_change
AFTER INSERT OR UPDATE OR DELETE ON user_asins
FOR EACH ROW
EXECUTE FUNCTION update_brand_metrics();

-- 13. Enable RLS on all tables
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_asins ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_performance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_asin_metrics ENABLE ROW LEVEL SECURITY;

-- 14. Create RLS policies for brands
CREATE POLICY "Users can view their own brands" ON brands
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own brands" ON brands
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brands" ON brands
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own brands" ON brands
    FOR DELETE USING (auth.uid() = user_id);

-- 15. Create RLS policies for user_portfolios
CREATE POLICY "Users can view their own portfolios" ON user_portfolios
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own portfolios" ON user_portfolios
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolios" ON user_portfolios
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolios" ON user_portfolios
    FOR DELETE USING (auth.uid() = user_id);

-- 16. Create RLS policies for user_asins
CREATE POLICY "Users can view their own asins" ON user_asins
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own asins" ON user_asins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own asins" ON user_asins
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own asins" ON user_asins
    FOR DELETE USING (auth.uid() = user_id);

-- 17. Create RLS policies for brand_categories
CREATE POLICY "Users can manage their brand categories" ON brand_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM brands 
            WHERE brands.id = brand_categories.brand_id 
            AND brands.user_id = auth.uid()
        )
    );

-- 18. Create RLS policies for brand_performance_history
CREATE POLICY "Users can view their brand performance history" ON brand_performance_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM brands 
            WHERE brands.id = brand_performance_history.brand_id 
            AND brands.user_id = auth.uid()
        )
    );

-- 19. Create RLS policies for user_asin_metrics
CREATE POLICY "Users can view their asin metrics" ON user_asin_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_asins 
            WHERE user_asins.id = user_asin_metrics.user_asin_id 
            AND user_asins.user_id = auth.uid()
        )
    );

-- 20. Grant permissions
GRANT ALL ON brands TO authenticated;
GRANT ALL ON user_portfolios TO authenticated;
GRANT ALL ON user_asins TO authenticated;
GRANT ALL ON brand_categories TO authenticated;
GRANT ALL ON brand_performance_history TO authenticated;
GRANT ALL ON user_asin_metrics TO authenticated;
GRANT SELECT ON brand_metrics TO authenticated;
GRANT SELECT ON portfolio_metrics TO authenticated;
GRANT SELECT ON user_portfolio_summary TO authenticated;

-- 21. Create function to record brand performance snapshot
CREATE OR REPLACE FUNCTION record_brand_performance_snapshot()
RETURNS void AS $$
BEGIN
    INSERT INTO brand_performance_history (brand_id, date, total_revenue, total_profit, total_units_sold, avg_rank)
    SELECT 
        b.id,
        CURRENT_DATE,
        SUM(ua.monthly_revenue),
        SUM(ua.monthly_profit),
        SUM(ua.monthly_units_sold),
        AVG(ua.current_rank)
    FROM brands b
    JOIN user_asins ua ON b.id = ua.brand_id
    WHERE ua.is_active = true
    GROUP BY b.id
    ON CONFLICT (brand_id, date) DO UPDATE SET
        total_revenue = EXCLUDED.total_revenue,
        total_profit = EXCLUDED.total_profit,
        total_units_sold = EXCLUDED.total_units_sold,
        avg_rank = EXCLUDED.avg_rank;
END;
$$ LANGUAGE plpgsql;

-- 22. Create indexes for views (helps with performance)
CREATE INDEX IF NOT EXISTS idx_user_asins_composite ON user_asins(user_id, brand_id, is_active);
CREATE INDEX IF NOT EXISTS idx_brand_performance_history_brand_date ON brand_performance_history(brand_id, date DESC);