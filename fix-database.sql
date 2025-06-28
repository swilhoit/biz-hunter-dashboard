-- Fix database issues
-- Create missing scraped_pages table
CREATE TABLE IF NOT EXISTS scraped_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    url TEXT NOT NULL UNIQUE,
    html_content TEXT NOT NULL,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    listings_extracted INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scraped_pages_url ON scraped_pages(url);
CREATE INDEX IF NOT EXISTS idx_scraped_pages_scraped_at ON scraped_pages(scraped_at);

-- Enable RLS (Row Level Security)
ALTER TABLE scraped_pages ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for now
DROP POLICY IF EXISTS "Allow all operations on scraped_pages" ON scraped_pages;
CREATE POLICY "Allow all operations on scraped_pages" ON scraped_pages
    FOR ALL USING (true) WITH CHECK (true);

-- Clear fake/mock listings (optional - you can run this manually)
-- DELETE FROM business_listings WHERE source IN ('Empire Flippers', 'Flippa', 'Website Closers', 'FE International') AND created_at < NOW() - INTERVAL '1 hour';