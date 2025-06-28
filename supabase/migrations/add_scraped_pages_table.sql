-- Create table for permanent storage of scraped page content
CREATE TABLE scraped_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    url TEXT NOT NULL UNIQUE,
    html_content TEXT NOT NULL,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    listings_extracted INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'failed')),
    
    -- Indexes for performance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast URL lookups
CREATE INDEX idx_scraped_pages_url ON scraped_pages(url);

-- Index for cleanup queries
CREATE INDEX idx_scraped_pages_scraped_at ON scraped_pages(scraped_at);

-- Enable RLS (Row Level Security)
ALTER TABLE scraped_pages ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for now (can be restricted later)
CREATE POLICY "Allow all operations on scraped_pages" ON scraped_pages
    FOR ALL USING (true) WITH CHECK (true);