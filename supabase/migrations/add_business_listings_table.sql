-- Create table for business listings from scraped data
CREATE TABLE IF NOT EXISTS business_listings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    asking_price BIGINT,
    annual_revenue BIGINT,
    industry TEXT,
    location TEXT,
    description TEXT,
    highlights TEXT,
    original_url TEXT,
    scraped_at DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicates based on name and URL
    CONSTRAINT unique_business_listing UNIQUE (name, original_url)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_listings_name ON business_listings(name);
CREATE INDEX IF NOT EXISTS idx_business_listings_url ON business_listings(original_url);
CREATE INDEX IF NOT EXISTS idx_business_listings_industry ON business_listings(industry);
CREATE INDEX IF NOT EXISTS idx_business_listings_price ON business_listings(asking_price);
CREATE INDEX IF NOT EXISTS idx_business_listings_scraped_at ON business_listings(scraped_at);

-- Enable RLS (Row Level Security)
ALTER TABLE business_listings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for now (can be restricted later)
CREATE POLICY IF NOT EXISTS "Allow all operations on business_listings" ON business_listings
    FOR ALL USING (true) WITH CHECK (true);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_business_listings_updated_at
    BEFORE UPDATE ON business_listings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Check if table was created successfully
SELECT 'business_listings table created successfully' as status;