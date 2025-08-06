#!/bin/bash

# Script to apply all migrations to restore the database
# Run this with: bash apply_all_migrations.sh

echo "Starting database restoration..."

# Create a combined migration file
cat > combined_migrations.sql << 'EOF'
-- Combined migration file to restore database schema
-- Generated from all migration files in supabase/migrations/

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
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('live', 'removed', 'pending'));

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

-- 6. Create the deals table (comprehensive CRM)
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
    stage TEXT DEFAULT 'prospecting',
    priority TEXT DEFAULT 'medium',
    is_on_market BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraped_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- 8. Create basic RLS policies
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

-- Business listings policies (allow public read)
CREATE POLICY "Public can view business listings" ON public.business_listings
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create listings" ON public.business_listings
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update listings" ON public.business_listings
    FOR UPDATE TO authenticated USING (true);

-- 9. Create helper functions
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

-- 10. Create triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_listings_source ON business_listings(source);
CREATE INDEX IF NOT EXISTS idx_business_listings_status ON business_listings(status);
CREATE INDEX IF NOT EXISTS idx_business_listings_created_at ON business_listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deals_user_id ON deals(user_id);
CREATE INDEX IF NOT EXISTS idx_deals_listing_id ON deals(listing_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);

-- 12. Add unique constraint on business_listings
ALTER TABLE business_listings 
ADD CONSTRAINT unique_listing_source_url UNIQUE (name, original_url, source);

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

EOF

echo "Migration SQL file created. Now applying to database..."

# Apply the migration using psql
if [ -z "$DATABASE_URL" ]; then
    echo "Please set DATABASE_URL environment variable"
    echo "You can find it in your Supabase dashboard under Settings > Database"
    echo "Example: export DATABASE_URL='postgresql://postgres:[password]@[host]:[port]/postgres'"
    exit 1
fi

psql "$DATABASE_URL" < combined_migrations.sql

echo "Database restoration complete!"