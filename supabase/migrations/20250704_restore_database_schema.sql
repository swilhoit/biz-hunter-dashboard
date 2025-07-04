-- Restore complete database schema after accidental reset
-- This migration creates all missing tables and structures

-- 1. Create base enums and types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_status') THEN
        CREATE TYPE listing_status AS ENUM ('active', 'pending', 'sold', 'withdrawn');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE app_role AS ENUM ('admin', 'user', 'broker');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_status_type') THEN
        CREATE TYPE listing_status_type AS ENUM ('live', 'under_offer', 'sold', 'offline', 'pending');
    END IF;
    
    -- Deal stage enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deal_stage') THEN
        CREATE TYPE deal_stage AS ENUM (
            'prospecting',
            'initial_contact',
            'qualification',
            'needs_analysis',
            'value_proposition',
            'negotiation',
            'due_diligence',
            'closing',
            'closed_won',
            'closed_lost'
        );
    END IF;
    
    -- Priority level enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'priority_level') THEN
        CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');
    END IF;
    
    -- Activity type enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_type') THEN
        CREATE TYPE activity_type AS ENUM (
            'email',
            'call',
            'meeting',
            'note',
            'stage_change',
            'document_upload',
            'task'
        );
    END IF;
END $$;

-- 2. Create missing tables from initial migration
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    company TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role)
);

CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    listing_id UUID REFERENCES public.business_listings(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    UNIQUE(user_id, listing_id)
);

CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES public.business_listings(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add missing columns to business_listings
ALTER TABLE public.business_listings 
ADD COLUMN IF NOT EXISTS status listing_status DEFAULT 'active',
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS normalized_name TEXT,
ADD COLUMN IF NOT EXISTS duplicate_group_id UUID,
ADD COLUMN IF NOT EXISTS is_primary_listing BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS similarity_score NUMERIC(3,2),
ADD COLUMN IF NOT EXISTS duplicate_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';

-- 4. Create scraped_pages table
CREATE TABLE IF NOT EXISTS public.scraped_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL UNIQUE,
    html_content TEXT NOT NULL,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    listings_extracted INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'failed'))
);

-- 5. Create saved_listings table (separate from favorites)
CREATE TABLE IF NOT EXISTS public.saved_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    listing_id UUID REFERENCES public.business_listings(id) ON DELETE CASCADE NOT NULL,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    UNIQUE(user_id, listing_id)
);

-- 6. Create the comprehensive deals table
CREATE TABLE IF NOT EXISTS public.deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES public.business_listings(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Basic Information
    business_name TEXT NOT NULL,
    dba_names TEXT[],
    entity_type TEXT,
    business_description TEXT,
    
    -- Financial Information
    asking_price NUMERIC(12,2),
    list_price NUMERIC(12,2),
    annual_revenue NUMERIC(12,2),
    annual_profit NUMERIC(12,2),
    ebitda NUMERIC(12,2),
    sde NUMERIC(12,2),
    multiple NUMERIC(6,2),
    
    -- Business Details
    business_age INTEGER,
    employee_count INTEGER,
    inventory_value NUMERIC(12,2),
    
    -- Amazon-specific fields
    amazon_store_name TEXT,
    amazon_store_url TEXT,
    amazon_category TEXT,
    amazon_subcategory TEXT,
    seller_account_health TEXT,
    fba_percentage NUMERIC(5,2),
    
    -- Seller Information
    seller_name TEXT,
    seller_email TEXT,
    seller_phone TEXT,
    seller_location TEXT,
    
    -- Important Dates
    date_listed DATE,
    first_contact_date DATE,
    loi_submitted_date DATE,
    due_diligence_start_date DATE,
    expected_close_date DATE,
    actual_close_date DATE,
    
    -- Deal Status
    stage deal_stage DEFAULT 'prospecting',
    priority priority_level DEFAULT 'medium',
    is_on_market BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create deal-related tables
CREATE TABLE IF NOT EXISTS public.deal_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type activity_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    outcome TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.deal_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    priority priority_level DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.deal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    document_type TEXT,
    description TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create ASIN tracking tables
CREATE TABLE IF NOT EXISTS public.asins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asin TEXT NOT NULL UNIQUE,
    title TEXT,
    brand TEXT,
    category TEXT,
    subcategory TEXT,
    current_price NUMERIC(10,2),
    current_bsr INTEGER,
    review_count INTEGER,
    review_rating NUMERIC(3,2),
    main_image_url TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.deal_asins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
    asin_id UUID REFERENCES public.asins(id) ON DELETE CASCADE NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    notes TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(deal_id, asin_id)
);

-- 9. Create AI analysis table
CREATE TABLE IF NOT EXISTS public.ai_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES public.business_listings(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    analysis_type TEXT NOT NULL,
    analysis_data JSONB NOT NULL,
    model_used TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 10. Create market data cache
CREATE TABLE IF NOT EXISTS public.market_data_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_type TEXT NOT NULL,
    data_key TEXT NOT NULL,
    data_value JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(data_type, data_key)
);

-- 11. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraped_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_asins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_data_cache ENABLE ROW LEVEL SECURITY;

-- 12. Create comprehensive RLS policies
-- Business listings policies (public read)
CREATE POLICY "Public can view business listings" ON public.business_listings
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create listings" ON public.business_listings
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update listings" ON public.business_listings
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete listings" ON public.business_listings
    FOR DELETE TO authenticated USING (true);

-- Scraped pages policies
CREATE POLICY "Public read for scraped pages" ON public.scraped_pages
    FOR SELECT USING (true);

CREATE POLICY "Authenticated can manage scraped pages" ON public.scraped_pages
    FOR ALL TO authenticated USING (true);

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Deals policies
CREATE POLICY "Users can view their own deals" ON public.deals
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create deals" ON public.deals
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deals" ON public.deals
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own deals" ON public.deals
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Deal activities policies
CREATE POLICY "Users can view activities for their deals" ON public.deal_activities
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.deals WHERE deals.id = deal_activities.deal_id AND deals.user_id = auth.uid())
    );

CREATE POLICY "Users can create activities for their deals" ON public.deal_activities
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM public.deals WHERE deals.id = deal_activities.deal_id AND deals.user_id = auth.uid())
    );

-- Deal tasks policies  
CREATE POLICY "Users can view tasks for their deals" ON public.deal_tasks
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.deals WHERE deals.id = deal_tasks.deal_id AND deals.user_id = auth.uid())
        OR assigned_to = auth.uid()
    );

CREATE POLICY "Users can manage tasks for their deals" ON public.deal_tasks
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.deals WHERE deals.id = deal_tasks.deal_id AND deals.user_id = auth.uid())
    );

-- Favorites/saved listings policies
CREATE POLICY "Users can manage their own favorites" ON public.favorites
    FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own saved listings" ON public.saved_listings
    FOR ALL TO authenticated USING (auth.uid() = user_id);

-- AI analyses policies
CREATE POLICY "Users can view analyses for their content" ON public.ai_analyses
    FOR SELECT TO authenticated USING (
        (listing_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.business_listings WHERE id = listing_id))
        OR (deal_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.deals WHERE deals.id = deal_id AND deals.user_id = auth.uid()))
    );

CREATE POLICY "Authenticated users can create analyses" ON public.ai_analyses
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- Market data cache policies (public read)
CREATE POLICY "Public can read market data cache" ON public.market_data_cache
    FOR SELECT USING (true);

CREATE POLICY "Authenticated can manage market data cache" ON public.market_data_cache
    FOR ALL TO authenticated USING (true);

-- 13. Create helper functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name, email)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data ->> 'first_name',
        NEW.raw_user_meta_data ->> 'last_name',
        NEW.email
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Assign default user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- Updated timestamp function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Normalize business name function
CREATE OR REPLACE FUNCTION public.normalize_business_name(name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN LOWER(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                REGEXP_REPLACE(name, '[^a-zA-Z0-9\s]', '', 'g'),
                '\s+', ' ', 'g'
            ),
            '^\s+|\s+$', '', 'g'
        )
    );
END;
$$;

-- 14. Create triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_business_listings_updated_at BEFORE UPDATE ON public.business_listings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_deal_tasks_updated_at BEFORE UPDATE ON public.deal_tasks
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 15. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_listings_source ON business_listings(source);
CREATE INDEX IF NOT EXISTS idx_business_listings_status ON business_listings(status);
CREATE INDEX IF NOT EXISTS idx_business_listings_created_at ON business_listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_listings_normalized_name ON business_listings(normalized_name);
CREATE INDEX IF NOT EXISTS idx_business_listings_duplicate_group ON business_listings(duplicate_group_id);

CREATE INDEX IF NOT EXISTS idx_deals_user_id ON deals(user_id);
CREATE INDEX IF NOT EXISTS idx_deals_listing_id ON deals(listing_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON deals(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_deal_activities_deal_id ON deal_activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_activities_created_at ON deal_activities(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_deal_tasks_deal_id ON deal_tasks(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_tasks_assigned_to ON deal_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_deal_tasks_due_date ON deal_tasks(due_date);

CREATE INDEX IF NOT EXISTS idx_asins_asin ON asins(asin);
CREATE INDEX IF NOT EXISTS idx_deal_asins_deal_id ON deal_asins(deal_id);

CREATE INDEX IF NOT EXISTS idx_scraped_pages_url ON scraped_pages(url);
CREATE INDEX IF NOT EXISTS idx_scraped_pages_scraped_at ON scraped_pages(scraped_at DESC);

-- 16. Create views
CREATE OR REPLACE VIEW public.business_listing_duplicates AS
SELECT 
    bg.duplicate_group_id,
    COUNT(*) as duplicate_count,
    MAX(bg.created_at) as latest_created,
    MIN(bg.created_at) as earliest_created,
    ARRAY_AGG(DISTINCT bg.source) as sources,
    ARRAY_AGG(bg.id ORDER BY bg.created_at) as listing_ids,
    ARRAY_AGG(bg.name ORDER BY bg.created_at) as listing_names
FROM business_listings bg
WHERE bg.duplicate_group_id IS NOT NULL
GROUP BY bg.duplicate_group_id
HAVING COUNT(*) > 1;

-- 17. Add constraints
-- Add unique constraint on business_listings (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_listing_source_url') THEN
        ALTER TABLE business_listings 
        ADD CONSTRAINT unique_listing_source_url UNIQUE (name, original_url, source);
    END IF;
END $$;

-- 18. Grant permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role, authenticated, anon;

-- Success message
SELECT 'Database restoration completed successfully!' as status;