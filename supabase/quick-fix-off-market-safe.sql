-- Off-Market Seller Discovery Feature Migration
-- Safe to run multiple times - checks for existing objects

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ASINs table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'asins') THEN
        CREATE TABLE public.asins (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            asin VARCHAR(10) UNIQUE NOT NULL,
            category VARCHAR(100),
            price DECIMAL(10,2),
            bsr INTEGER, -- Best Seller Rank
            est_units INTEGER, -- Estimated units sold per month
            est_rev DECIMAL(12,2), -- Estimated revenue per month
            is_top_20_percent BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_asins_asin ON public.asins(asin);
        CREATE INDEX IF NOT EXISTS idx_asins_category ON public.asins(category);
        CREATE INDEX IF NOT EXISTS idx_asins_top_20 ON public.asins(is_top_20_percent);
    END IF;
END $$;

-- Create Sellers table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sellers') THEN
        CREATE TABLE public.sellers (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            seller_name VARCHAR(255) NOT NULL,
            seller_url TEXT UNIQUE NOT NULL,
            listings_count INTEGER DEFAULT 0,
            total_est_revenue DECIMAL(15,2) DEFAULT 0,
            avg_rating DECIMAL(3,2),
            is_whale BOOLEAN DEFAULT false, -- High-revenue seller (>$500k/year)
            storefront_parsed BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_sellers_name ON public.sellers(seller_name);
        CREATE INDEX IF NOT EXISTS idx_sellers_url ON public.sellers(seller_url);
        CREATE INDEX IF NOT EXISTS idx_sellers_whale ON public.sellers(is_whale);
        CREATE INDEX IF NOT EXISTS idx_sellers_parsed ON public.sellers(storefront_parsed);
    END IF;
END $$;

-- Create ASIN-Seller relationship table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'asin_sellers') THEN
        CREATE TABLE public.asin_sellers (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            asin_id UUID NOT NULL REFERENCES public.asins(id) ON DELETE CASCADE,
            seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(asin_id, seller_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_asin_sellers_asin ON public.asin_sellers(asin_id);
        CREATE INDEX IF NOT EXISTS idx_asin_sellers_seller ON public.asin_sellers(seller_id);
    END IF;
END $$;

-- Create Seller Contacts table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'seller_contacts') THEN
        CREATE TABLE public.seller_contacts (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
            contact_type VARCHAR(50) NOT NULL, -- 'email', 'phone', 'website', 'social_media'
            contact_value TEXT NOT NULL,
            platform VARCHAR(100), -- For social media: 'facebook', 'instagram', 'linkedin', etc.
            is_verified BOOLEAN DEFAULT false,
            quality_score INTEGER DEFAULT 0 CHECK (quality_score >= 0 AND quality_score <= 100),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(seller_id, contact_type, contact_value)
        );
        
        CREATE INDEX IF NOT EXISTS idx_seller_contacts_seller ON public.seller_contacts(seller_id);
        CREATE INDEX IF NOT EXISTS idx_seller_contacts_type ON public.seller_contacts(contact_type);
        CREATE INDEX IF NOT EXISTS idx_seller_contacts_verified ON public.seller_contacts(is_verified);
    END IF;
END $$;

-- Create a view for crawl job summary if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_views WHERE schemaname = 'public' AND viewname = 'crawl_job_summary') THEN
        CREATE VIEW public.crawl_job_summary AS
        SELECT 
            'asins' as table_name,
            COUNT(*) as total_records,
            COUNT(*) FILTER (WHERE is_top_20_percent = true) as top_performers,
            MAX(created_at) as last_updated
        FROM public.asins
        UNION ALL
        SELECT 
            'sellers' as table_name,
            COUNT(*) as total_records,
            COUNT(*) FILTER (WHERE is_whale = true) as top_performers,
            MAX(created_at) as last_updated
        FROM public.sellers
        UNION ALL
        SELECT 
            'seller_contacts' as table_name,
            COUNT(*) as total_records,
            COUNT(*) FILTER (WHERE is_verified = true) as top_performers,
            MAX(created_at) as last_updated
        FROM public.seller_contacts;
    END IF;
END $$;

-- Create RLS policies if they don't exist
DO $$ 
BEGIN
    -- Enable RLS on all tables
    ALTER TABLE public.asins ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.asin_sellers ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.seller_contacts ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist and recreate them
    DROP POLICY IF EXISTS "Allow all authenticated users to read asins" ON public.asins;
    DROP POLICY IF EXISTS "Allow all authenticated users to insert asins" ON public.asins;
    DROP POLICY IF EXISTS "Allow all authenticated users to update asins" ON public.asins;
    
    DROP POLICY IF EXISTS "Allow all authenticated users to read sellers" ON public.sellers;
    DROP POLICY IF EXISTS "Allow all authenticated users to insert sellers" ON public.sellers;
    DROP POLICY IF EXISTS "Allow all authenticated users to update sellers" ON public.sellers;
    
    DROP POLICY IF EXISTS "Allow all authenticated users to read asin_sellers" ON public.asin_sellers;
    DROP POLICY IF EXISTS "Allow all authenticated users to insert asin_sellers" ON public.asin_sellers;
    
    DROP POLICY IF EXISTS "Allow all authenticated users to read seller_contacts" ON public.seller_contacts;
    DROP POLICY IF EXISTS "Allow all authenticated users to insert seller_contacts" ON public.seller_contacts;
    DROP POLICY IF EXISTS "Allow all authenticated users to update seller_contacts" ON public.seller_contacts;
    
    -- Create policies for ASINs table
    CREATE POLICY "Allow all authenticated users to read asins" ON public.asins
        FOR SELECT USING (auth.role() = 'authenticated');
    
    CREATE POLICY "Allow all authenticated users to insert asins" ON public.asins
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
    CREATE POLICY "Allow all authenticated users to update asins" ON public.asins
        FOR UPDATE USING (auth.role() = 'authenticated');
    
    -- Create policies for Sellers table
    CREATE POLICY "Allow all authenticated users to read sellers" ON public.sellers
        FOR SELECT USING (auth.role() = 'authenticated');
    
    CREATE POLICY "Allow all authenticated users to insert sellers" ON public.sellers
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
    CREATE POLICY "Allow all authenticated users to update sellers" ON public.sellers
        FOR UPDATE USING (auth.role() = 'authenticated');
    
    -- Create policies for ASIN-Sellers relationship table
    CREATE POLICY "Allow all authenticated users to read asin_sellers" ON public.asin_sellers
        FOR SELECT USING (auth.role() = 'authenticated');
    
    CREATE POLICY "Allow all authenticated users to insert asin_sellers" ON public.asin_sellers
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
    -- Create policies for Seller Contacts table
    CREATE POLICY "Allow all authenticated users to read seller_contacts" ON public.seller_contacts
        FOR SELECT USING (auth.role() = 'authenticated');
    
    CREATE POLICY "Allow all authenticated users to insert seller_contacts" ON public.seller_contacts
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
    CREATE POLICY "Allow all authenticated users to update seller_contacts" ON public.seller_contacts
        FOR UPDATE USING (auth.role() = 'authenticated');
END $$;

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.asins TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.sellers TO authenticated;
GRANT SELECT, INSERT ON public.asin_sellers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.seller_contacts TO authenticated;
GRANT SELECT ON public.crawl_job_summary TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Insert sample data for testing (only if tables are empty)
DO $$ 
BEGIN
    -- Insert sample ASINs if table is empty
    IF NOT EXISTS (SELECT 1 FROM public.asins LIMIT 1) THEN
        INSERT INTO public.asins (asin, category, price, bsr, est_units, est_rev, is_top_20_percent) VALUES
        ('B01LP0U5X0', 'Sports & Outdoors', 24.99, 1250, 450, 11245.50, true),
        ('B07H9PZ42P', 'Sports & Outdoors', 19.99, 2890, 320, 6396.80, true),
        ('B01MY5MZSQ', 'Sports & Outdoors', 29.99, 3450, 280, 8397.20, true),
        ('B01IZDFWY2', 'Sports & Outdoors', 15.99, 4200, 250, 3997.50, true),
        ('B0FCSKPPR1', 'Sports & Outdoors', 34.99, 5800, 180, 6298.20, true),
        ('B092XMWXK7', 'Sports & Outdoors', 39.99, 6200, 160, 6398.40, true),
        ('B0FBWBYB5R', 'Sports & Outdoors', 49.99, 7500, 140, 6998.60, true),
        ('B09WF4GPPC', 'Sports & Outdoors', 22.99, 8900, 120, 2758.80, false),
        ('B091FXWSGJ', 'Sports & Outdoors', 27.99, 9200, 110, 3078.90, false),
        ('B07H9KV1GG', 'Sports & Outdoors', 32.99, 9800, 100, 3299.00, false),
        ('B07SJW3GL8', 'Sports & Outdoors', 18.99, 10500, 95, 1804.05, false),
        ('B07234M1LY', 'Sports & Outdoors', 25.99, 11200, 85, 2209.15, false),
        ('B0C7SFV8RH', 'Sports & Outdoors', 21.99, 12000, 80, 1759.20, false),
        ('B07JQCVBBZ', 'Sports & Outdoors', 16.99, 13500, 70, 1189.30, false),
        ('B00JW3CTTQ', 'Sports & Outdoors', 23.99, 14200, 65, 1559.35, false);
    END IF;
    
    -- Insert sample sellers if table is empty
    IF NOT EXISTS (SELECT 1 FROM public.sellers LIMIT 1) THEN
        INSERT INTO public.sellers (seller_name, seller_url, listings_count, total_est_revenue, avg_rating, is_whale, storefront_parsed) VALUES
        ('FitLife Pro', 'https://amazon.com/sp?seller=A1B2C3D4E5F6G7', 185, 850000.00, 4.7, true, false),
        ('Wellness Gear Co', 'https://amazon.com/sp?seller=H8I9J0K1L2M3N4', 142, 620000.00, 4.5, true, false),
        ('Active Lifestyle', 'https://amazon.com/sp?seller=O5P6Q7R8S9T0U1', 98, 290000.00, 4.3, false, false),
        ('HealthMax Solutions', 'https://amazon.com/sp?seller=V2W3X4Y5Z6A7B8', 76, 180000.00, 4.2, false, false),
        ('Premium Fitness', 'https://amazon.com/sp?seller=C9D0E1F2G3H4I5', 234, 1200000.00, 4.8, true, false);
    END IF;
    
    -- Insert sample seller contacts if table is empty
    IF NOT EXISTS (SELECT 1 FROM public.seller_contacts LIMIT 1) THEN
        -- Get seller IDs for sample data
        INSERT INTO public.seller_contacts (seller_id, contact_type, contact_value, platform, is_verified, quality_score)
        SELECT s.id, 'email', 'contact@fitlifepro.com', NULL, true, 85
        FROM public.sellers s WHERE s.seller_name = 'FitLife Pro'
        UNION ALL
        SELECT s.id, 'website', 'https://fitlifepro.com', NULL, true, 90
        FROM public.sellers s WHERE s.seller_name = 'FitLife Pro'
        UNION ALL
        SELECT s.id, 'social_media', 'https://instagram.com/fitlifepro', 'instagram', false, 70
        FROM public.sellers s WHERE s.seller_name = 'FitLife Pro'
        UNION ALL
        SELECT s.id, 'email', 'support@wellnessgear.co', NULL, true, 80
        FROM public.sellers s WHERE s.seller_name = 'Wellness Gear Co'
        UNION ALL
        SELECT s.id, 'phone', '+1-555-0123', NULL, false, 60
        FROM public.sellers s WHERE s.seller_name = 'Wellness Gear Co'
        UNION ALL
        SELECT s.id, 'social_media', 'https://facebook.com/wellnessgearco', 'facebook', false, 65
        FROM public.sellers s WHERE s.seller_name = 'Wellness Gear Co'
        UNION ALL
        SELECT s.id, 'email', 'hello@activelifestyle.com', NULL, true, 75
        FROM public.sellers s WHERE s.seller_name = 'Active Lifestyle'
        UNION ALL
        SELECT s.id, 'website', 'https://activelifestyle.com', NULL, true, 85
        FROM public.sellers s WHERE s.seller_name = 'Active Lifestyle'
        UNION ALL
        SELECT s.id, 'email', 'info@healthmaxsolutions.com', NULL, false, 50
        FROM public.sellers s WHERE s.seller_name = 'HealthMax Solutions'
        UNION ALL
        SELECT s.id, 'social_media', 'https://linkedin.com/company/premiumfitness', 'linkedin', true, 95
        FROM public.sellers s WHERE s.seller_name = 'Premium Fitness'
        UNION ALL
        SELECT s.id, 'email', 'business@premiumfitness.com', NULL, true, 95
        FROM public.sellers s WHERE s.seller_name = 'Premium Fitness'
        UNION ALL
        SELECT s.id, 'phone', '+1-800-FITNESS', NULL, true, 90
        FROM public.sellers s WHERE s.seller_name = 'Premium Fitness';
    END IF;
    
    -- Create ASIN-Seller relationships if table is empty
    IF NOT EXISTS (SELECT 1 FROM public.asin_sellers LIMIT 1) THEN
        -- Connect ASINs to sellers (random distribution for sample data)
        INSERT INTO public.asin_sellers (asin_id, seller_id)
        SELECT a.id, s.id
        FROM public.asins a
        CROSS JOIN public.sellers s
        WHERE (a.asin = 'B01LP0U5X0' AND s.seller_name = 'FitLife Pro')
           OR (a.asin = 'B07H9PZ42P' AND s.seller_name = 'FitLife Pro')
           OR (a.asin = 'B01MY5MZSQ' AND s.seller_name = 'Wellness Gear Co')
           OR (a.asin = 'B01IZDFWY2' AND s.seller_name = 'Wellness Gear Co')
           OR (a.asin = 'B0FCSKPPR1' AND s.seller_name = 'Premium Fitness')
           OR (a.asin = 'B092XMWXK7' AND s.seller_name = 'Premium Fitness')
           OR (a.asin = 'B0FBWBYB5R' AND s.seller_name = 'Active Lifestyle')
           OR (a.asin = 'B09WF4GPPC' AND s.seller_name = 'Active Lifestyle')
           OR (a.asin = 'B091FXWSGJ' AND s.seller_name = 'HealthMax Solutions')
           OR (a.asin = 'B07H9KV1GG' AND s.seller_name = 'HealthMax Solutions');
    END IF;
END $$;

-- Add triggers for updated_at timestamps
DO $$ 
BEGIN
    -- Create or replace update timestamp function
    CREATE OR REPLACE FUNCTION public.update_updated_at_column()
    RETURNS TRIGGER AS '
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    ' LANGUAGE plpgsql;
    
    -- Drop existing triggers if they exist
    DROP TRIGGER IF EXISTS update_asins_updated_at ON public.asins;
    DROP TRIGGER IF EXISTS update_sellers_updated_at ON public.sellers;
    DROP TRIGGER IF EXISTS update_seller_contacts_updated_at ON public.seller_contacts;
    
    -- Create triggers
    CREATE TRIGGER update_asins_updated_at 
        BEFORE UPDATE ON public.asins 
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    
    CREATE TRIGGER update_sellers_updated_at 
        BEFORE UPDATE ON public.sellers 
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    
    CREATE TRIGGER update_seller_contacts_updated_at 
        BEFORE UPDATE ON public.seller_contacts 
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END $$;

-- Final verification
DO $$ 
BEGIN
    RAISE NOTICE 'Off-market feature migration completed successfully!';
    RAISE NOTICE 'Tables created: asins, sellers, asin_sellers, seller_contacts';
    RAISE NOTICE 'View created: crawl_job_summary';
    RAISE NOTICE 'Sample data inserted for testing';
    RAISE NOTICE 'RLS policies configured for authenticated users';
END $$;
