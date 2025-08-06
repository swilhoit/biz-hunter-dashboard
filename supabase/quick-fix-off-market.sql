-- Quick Fix for Off-Market Functionality
-- Run this in your Supabase SQL Editor to fix the missing tables and functions

-- 1. Create sellers table
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

-- 2. Create seller_contacts table
CREATE TABLE IF NOT EXISTS seller_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    contact_type VARCHAR(50) NOT NULL,
    contact_value TEXT NOT NULL,
    source VARCHAR(50),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(seller_id, contact_type, contact_value)
);

-- 3. Create asins table
CREATE TABLE IF NOT EXISTS asins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    asin VARCHAR(20) NOT NULL UNIQUE,
    category VARCHAR(255),
    price DECIMAL(10,2),
    bsr INTEGER,
    est_units INTEGER,
    est_rev DECIMAL(12,2),
    is_top_20_percent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create asin_sellers junction table
CREATE TABLE IF NOT EXISTS asin_sellers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    asin_id UUID NOT NULL REFERENCES asins(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    is_primary_seller BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(asin_id, seller_id)
);

-- 5. Create crawl_job_summary view
CREATE OR REPLACE VIEW crawl_job_summary AS
SELECT 
    'product_search' as job_type,
    'completed' as status,
    0 as job_count,
    0 as total_cost,
    0 as avg_cost,
    NOW() as first_job,
    NOW() as last_completed;

-- 6. Create seller_metrics view
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

-- 7. Create the get_off_market_sellers function
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

-- 8. Enable RLS and create policies
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE asins ENABLE ROW LEVEL SECURITY;
ALTER TABLE asin_sellers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated access to sellers" ON sellers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access to seller_contacts" ON seller_contacts FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access to asins" ON asins FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access to asin_sellers" ON asin_sellers FOR ALL TO authenticated USING (true);

-- 9. Insert sample data
INSERT INTO sellers (seller_name, seller_url, listings_count, total_est_revenue, avg_rating, is_whale) VALUES
('Premium Beauty Brands LLC', 'https://amazon.com/stores/premium-beauty', 45, 450000, 4.5, true),
('TechGear Solutions', 'https://amazon.com/stores/techgear', 32, 380000, 4.3, true),
('Home Comfort Innovations', 'https://amazon.com/stores/homecomfort', 58, 520000, 4.6, true),
('FitLife Products Co.', 'https://amazon.com/stores/fitlife', 28, 290000, 4.2, false),
('Petcare Essentials', 'https://amazon.com/stores/petcare', 38, 340000, 4.4, true)
ON CONFLICT (seller_url) DO NOTHING;

-- 10. Insert sample contact data
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