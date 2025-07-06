-- Fix Off-Market Functionality Migration
-- This migration ensures all required tables, functions, and views exist for off-market deals

-- 1. Ensure asins table exists
CREATE TABLE IF NOT EXISTS asins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    asin VARCHAR(20) NOT NULL UNIQUE,
    category VARCHAR(255),
    price DECIMAL(10,2),
    bsr INTEGER,
    crawl_dt TIMESTAMPTZ DEFAULT NOW(),
    next_bsr_refresh TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
    est_units INTEGER,
    est_rev DECIMAL(12,2),
    is_top_20_percent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ensure sellers table exists
CREATE TABLE IF NOT EXISTS sellers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_name VARCHAR(255),
    seller_url TEXT NOT NULL UNIQUE,
    listings_count INTEGER DEFAULT 0,
    total_est_revenue DECIMAL(12,2) DEFAULT 0,
    avg_rating DECIMAL(3,2),
    storefront_parsed BOOLEAN DEFAULT FALSE,
    is_whale BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ensure asin_sellers junction table exists
CREATE TABLE IF NOT EXISTS asin_sellers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    asin_id UUID NOT NULL REFERENCES asins(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    is_primary_seller BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(asin_id, seller_id)
);

-- 4. Ensure seller_contacts table exists
CREATE TABLE IF NOT EXISTS seller_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    contact_type VARCHAR(50) NOT NULL, -- email, phone, domain, social
    contact_value TEXT NOT NULL,
    source VARCHAR(50), -- storefront, whois, rocketreach, hunter, clearbit
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(seller_id, contact_type, contact_value)
);

-- 5. Ensure crawl_jobs table exists
CREATE TABLE IF NOT EXISTS crawl_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_type VARCHAR(50) NOT NULL, -- product_search, seller_lookup, storefront_parse, domain_enrich
    status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed
    keyword TEXT,
    target_url TEXT,
    target_domain TEXT,
    asin VARCHAR(20),
    seller_id UUID REFERENCES sellers(id),
    response_data JSONB,
    cost_credits DECIMAL(10,6),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- 6. Create crawl_job_summary view
CREATE OR REPLACE VIEW crawl_job_summary AS
SELECT 
    job_type,
    status,
    COUNT(*) as job_count,
    SUM(cost_credits) as total_cost,
    AVG(cost_credits) as avg_cost,
    MIN(created_at) as first_job,
    MAX(completed_at) as last_completed
FROM crawl_jobs
GROUP BY job_type, status;

-- 7. Create seller_metrics view
CREATE OR REPLACE VIEW seller_metrics AS
SELECT 
    s.id,
    s.seller_name,
    s.seller_url,
    s.listings_count,
    s.total_est_revenue,
    s.avg_rating,
    s.is_whale,
    COUNT(DISTINCT sc.id) as total_contacts,
    COUNT(DISTINCT CASE WHEN sc.contact_type = 'email' THEN sc.id END) as email_contacts,
    COUNT(DISTINCT CASE WHEN sc.contact_type = 'phone' THEN sc.id END) as phone_contacts,
    COUNT(DISTINCT CASE WHEN sc.contact_type = 'domain' THEN sc.id END) as domain_contacts,
    s.storefront_parsed,
    s.created_at,
    s.updated_at
FROM sellers s
LEFT JOIN seller_contacts sc ON s.id = sc.seller_id
GROUP BY s.id, s.seller_name, s.seller_url, s.listings_count, s.total_est_revenue, 
         s.avg_rating, s.is_whale, s.storefront_parsed, s.created_at, s.updated_at;

-- 8. Create the missing get_off_market_sellers function
CREATE OR REPLACE FUNCTION get_off_market_sellers(
    min_revenue DECIMAL DEFAULT 10000,
    min_listings INTEGER DEFAULT 5,
    has_contacts BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
    seller_id UUID,
    seller_name VARCHAR(255),
    seller_url TEXT,
    listings_count INTEGER,
    total_est_revenue DECIMAL(12,2),
    avg_rating DECIMAL(3,2),
    email_contacts BIGINT,
    phone_contacts BIGINT,
    domain_contacts BIGINT,
    storefront_parsed BOOLEAN,
    is_whale BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sm.id,
        sm.seller_name,
        sm.seller_url,
        sm.listings_count,
        sm.total_est_revenue,
        sm.avg_rating,
        sm.email_contacts,
        sm.phone_contacts,
        sm.domain_contacts,
        sm.storefront_parsed,
        sm.is_whale
    FROM seller_metrics sm
    WHERE sm.total_est_revenue >= min_revenue
      AND sm.listings_count >= min_listings
      AND (NOT has_contacts OR sm.total_contacts > 0)
    ORDER BY sm.total_est_revenue DESC;
END;
$$ LANGUAGE plpgsql;

-- 9. Enable RLS on all tables
ALTER TABLE asins ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE asin_sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawl_jobs ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies for authenticated users
CREATE POLICY "Allow all access to asins" ON asins FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all access to sellers" ON sellers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all access to asin_sellers" ON asin_sellers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all access to seller_contacts" ON seller_contacts FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all access to crawl_jobs" ON crawl_jobs FOR ALL TO authenticated USING (true);

-- 11. Grant permissions
GRANT ALL ON asins TO authenticated;
GRANT ALL ON sellers TO authenticated;
GRANT ALL ON asin_sellers TO authenticated;
GRANT ALL ON seller_contacts TO authenticated;
GRANT ALL ON crawl_jobs TO authenticated;
GRANT SELECT ON crawl_job_summary TO authenticated;
GRANT SELECT ON seller_metrics TO authenticated;

-- 12. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_asins_category_est_rev ON asins(category, est_rev DESC);
CREATE INDEX IF NOT EXISTS idx_sellers_url ON sellers(seller_url);
CREATE INDEX IF NOT EXISTS idx_sellers_revenue ON sellers(total_est_revenue DESC);
CREATE INDEX IF NOT EXISTS idx_sellers_whale ON sellers(is_whale) WHERE is_whale = TRUE;
CREATE INDEX IF NOT EXISTS idx_asin_sellers_asin ON asin_sellers(asin_id);
CREATE INDEX IF NOT EXISTS idx_asin_sellers_seller ON asin_sellers(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_contacts_seller ON seller_contacts(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_contacts_type ON seller_contacts(contact_type);
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_status ON crawl_jobs(status);
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_type ON crawl_jobs(job_type);

-- 13. Insert some sample data for testing
INSERT INTO sellers (seller_name, seller_url, listings_count, total_est_revenue, avg_rating, is_whale) VALUES
('Premium Beauty Brands LLC', 'https://amazon.com/stores/premium-beauty', 45, 450000, 4.5, true),
('TechGear Solutions', 'https://amazon.com/stores/techgear', 32, 380000, 4.3, true),
('Home Comfort Innovations', 'https://amazon.com/stores/homecomfort', 58, 520000, 4.6, true),
('FitLife Products Co.', 'https://amazon.com/stores/fitlife', 28, 290000, 4.2, false),
('Petcare Essentials', 'https://amazon.com/stores/petcare', 38, 340000, 4.4, true)
ON CONFLICT (seller_url) DO NOTHING;

-- 14. Insert sample contact data
INSERT INTO seller_contacts (seller_id, contact_type, contact_value, source, verified)
SELECT 
    s.id,
    'email',
    CASE 
        WHEN s.seller_name = 'Premium Beauty Brands LLC' THEN 'info@premiumbeauty.com'
        WHEN s.seller_name = 'TechGear Solutions' THEN 'contact@techgear.com'
        WHEN s.seller_name = 'Home Comfort Innovations' THEN 'sales@homecomfort.com'
        WHEN s.seller_name = 'FitLife Products Co.' THEN 'hello@fitlife.com'
        WHEN s.seller_name = 'Petcare Essentials' THEN 'support@petcare.com'
    END,
    'storefront',
    true
FROM sellers s
WHERE s.seller_name IN ('Premium Beauty Brands LLC', 'TechGear Solutions', 'Home Comfort Innovations', 'FitLife Products Co.', 'Petcare Essentials')
ON CONFLICT (seller_id, contact_type, contact_value) DO NOTHING; 