-- Seller CRM Pipeline for Off-Market Deals
-- This migration creates the complete seller database system for crawling and managing potential acquisition targets

-- 1. Create asins table for product discovery
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

-- 2. Create sellers table for seller information
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

-- 3. Create asin_sellers junction table
CREATE TABLE IF NOT EXISTS asin_sellers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    asin_id UUID NOT NULL REFERENCES asins(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    is_primary_seller BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(asin_id, seller_id)
);

-- 4. Create seller_contacts table for contact information
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

-- 5. Create seller_storefronts table for parsed storefront data
CREATE TABLE IF NOT EXISTS seller_storefronts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    parsed_at TIMESTAMPTZ DEFAULT NOW(),
    external_domains TEXT[],
    social_links TEXT[],
    business_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create domain_enrichment table for external domain data
CREATE TABLE IF NOT EXISTS domain_enrichment (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    domain VARCHAR(255) NOT NULL UNIQUE,
    whois_data JSONB,
    registrant_email TEXT,
    registrant_phone TEXT,
    company_name TEXT,
    enriched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create crawl_jobs table for tracking crawling tasks
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

-- 8. Create materialized view for top 20% ASINs
CREATE MATERIALIZED VIEW IF NOT EXISTS top20_asins AS
SELECT asin_id, asin, category, est_rev, percentile_rank
FROM (
    SELECT 
        id as asin_id,
        asin,
        category,
        est_rev,
        PERCENT_RANK() OVER (PARTITION BY category ORDER BY est_rev DESC) AS percentile_rank
    FROM asins
    WHERE est_rev IS NOT NULL
) ranked_asins
WHERE percentile_rank < 0.20;

-- 9. Create view for seller metrics
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

-- 10. Create view for crawl job summary
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

-- 11. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_asins_category_est_rev ON asins(category, est_rev DESC);
CREATE INDEX IF NOT EXISTS idx_asins_bsr_refresh ON asins(next_bsr_refresh);
CREATE INDEX IF NOT EXISTS idx_asins_top20 ON asins(is_top_20_percent) WHERE is_top_20_percent = TRUE;
CREATE INDEX IF NOT EXISTS idx_sellers_url ON sellers(seller_url);
CREATE INDEX IF NOT EXISTS idx_sellers_revenue ON sellers(total_est_revenue DESC);
CREATE INDEX IF NOT EXISTS idx_sellers_whale ON sellers(is_whale) WHERE is_whale = TRUE;
CREATE INDEX IF NOT EXISTS idx_asin_sellers_asin ON asin_sellers(asin_id);
CREATE INDEX IF NOT EXISTS idx_asin_sellers_seller ON asin_sellers(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_contacts_seller ON seller_contacts(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_contacts_type ON seller_contacts(contact_type);
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_status ON crawl_jobs(status);
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_type ON crawl_jobs(job_type);

-- 12. Function to estimate units sold from BSR
CREATE OR REPLACE FUNCTION estimate_units_from_bsr(bsr_value INTEGER)
RETURNS INTEGER AS $$
BEGIN
    -- Formula: est_units = 64700 * (bsr ** -0.87)
    IF bsr_value IS NULL OR bsr_value <= 0 THEN
        RETURN 0;
    END IF;
    
    RETURN ROUND(64700 * POWER(bsr_value, -0.87));
END;
$$ LANGUAGE plpgsql;

-- 13. Function to calculate estimated revenue
CREATE OR REPLACE FUNCTION calculate_estimated_revenue(price_value DECIMAL, bsr_value INTEGER)
RETURNS DECIMAL AS $$
DECLARE
    est_units INTEGER;
BEGIN
    est_units := estimate_units_from_bsr(bsr_value);
    RETURN COALESCE(price_value, 0) * est_units;
END;
$$ LANGUAGE plpgsql;

-- 14. Function to update ASIN estimates
CREATE OR REPLACE FUNCTION update_asin_estimates()
RETURNS TRIGGER AS $$
BEGIN
    NEW.est_units := estimate_units_from_bsr(NEW.bsr);
    NEW.est_rev := calculate_estimated_revenue(NEW.price, NEW.bsr);
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 15. Create trigger to auto-calculate estimates
DROP TRIGGER IF EXISTS update_asin_estimates_trigger ON asins;
CREATE TRIGGER update_asin_estimates_trigger
    BEFORE INSERT OR UPDATE ON asins
    FOR EACH ROW
    EXECUTE FUNCTION update_asin_estimates();

-- 16. Function to refresh top 20% materialized view
CREATE OR REPLACE FUNCTION refresh_top20_asins()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW top20_asins;
    
    -- Update is_top_20_percent flag in asins table
    UPDATE asins SET is_top_20_percent = FALSE;
    
    UPDATE asins 
    SET is_top_20_percent = TRUE 
    WHERE id IN (SELECT asin_id FROM top20_asins);
END;
$$ LANGUAGE plpgsql;

-- 17. Function to mark sellers as whales based on criteria
CREATE OR REPLACE FUNCTION identify_whale_sellers()
RETURNS void AS $$
BEGIN
    -- Mark sellers as whales if they have high revenue or many listings
    UPDATE sellers 
    SET is_whale = TRUE 
    WHERE total_est_revenue > 100000 -- $100k+ estimated revenue
       OR listings_count > 50;       -- 50+ listings
END;
$$ LANGUAGE plpgsql;

-- 18. Function to update seller metrics
CREATE OR REPLACE FUNCTION update_seller_metrics()
RETURNS TRIGGER AS $$
DECLARE
    seller_record RECORD;
BEGIN
    -- Get seller from asin_sellers relationship
    SELECT s.id INTO seller_record
    FROM sellers s
    JOIN asin_sellers ase ON s.id = ase.seller_id
    WHERE ase.asin_id = COALESCE(NEW.id, OLD.id);
    
    IF seller_record.id IS NOT NULL THEN
        -- Update seller's total estimated revenue and listings count
        UPDATE sellers 
        SET 
            total_est_revenue = (
                SELECT COALESCE(SUM(a.est_rev), 0)
                FROM asins a
                JOIN asin_sellers ase ON a.id = ase.asin_id
                WHERE ase.seller_id = seller_record.id
            ),
            listings_count = (
                SELECT COUNT(*)
                FROM asin_sellers ase
                WHERE ase.seller_id = seller_record.id
            ),
            updated_at = NOW()
        WHERE id = seller_record.id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 19. Create trigger to update seller metrics when ASINs change
DROP TRIGGER IF EXISTS update_seller_metrics_trigger ON asins;
CREATE TRIGGER update_seller_metrics_trigger
    AFTER INSERT OR UPDATE OR DELETE ON asins
    FOR EACH ROW
    EXECUTE FUNCTION update_seller_metrics();

-- 20. Function to check if seller URL is duplicate
CREATE OR REPLACE FUNCTION is_duplicate_seller_url(url TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM sellers WHERE seller_url = url);
END;
$$ LANGUAGE plpgsql;

-- 21. Enable RLS on all tables
ALTER TABLE asins ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE asin_sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_storefronts ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_enrichment ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawl_jobs ENABLE ROW LEVEL SECURITY;

-- 22. Create RLS policies (allow all access for authenticated users - this is for internal tool use)
CREATE POLICY "Allow all access to asins" ON asins FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all access to sellers" ON sellers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all access to asin_sellers" ON asin_sellers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all access to seller_contacts" ON seller_contacts FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all access to seller_storefronts" ON seller_storefronts FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all access to domain_enrichment" ON domain_enrichment FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all access to crawl_jobs" ON crawl_jobs FOR ALL TO authenticated USING (true);

-- 23. Grant permissions
GRANT ALL ON asins TO authenticated;
GRANT ALL ON sellers TO authenticated;
GRANT ALL ON asin_sellers TO authenticated;
GRANT ALL ON seller_contacts TO authenticated;
GRANT ALL ON seller_storefronts TO authenticated;
GRANT ALL ON domain_enrichment TO authenticated;
GRANT ALL ON crawl_jobs TO authenticated;
GRANT SELECT ON top20_asins TO authenticated;
GRANT SELECT ON seller_metrics TO authenticated;
GRANT SELECT ON crawl_job_summary TO authenticated;

-- 24. Create function to get sellers for off-market deals
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

-- 25. Create function to get seller contact information
CREATE OR REPLACE FUNCTION get_seller_contacts(seller_uuid UUID)
RETURNS TABLE(
    contact_type VARCHAR(50),
    contact_value TEXT,
    source VARCHAR(50),
    verified BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.contact_type,
        sc.contact_value,
        sc.source,
        sc.verified
    FROM seller_contacts sc
    WHERE sc.seller_id = seller_uuid
    ORDER BY sc.contact_type, sc.verified DESC;
END;
$$ LANGUAGE plpgsql;