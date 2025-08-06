-- Add deleted_listings table to track manually deleted listings
-- This prevents the scraper from re-adding listings that users have explicitly deleted

CREATE TABLE IF NOT EXISTS deleted_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_name TEXT NOT NULL,
  original_url TEXT,
  source TEXT NOT NULL,
  deleted_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT DEFAULT 'user_deleted',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for fast lookup during scraping
CREATE INDEX IF NOT EXISTS idx_deleted_listings_name_source ON deleted_listings(listing_name, source);
CREATE INDEX IF NOT EXISTS idx_deleted_listings_url ON deleted_listings(original_url);
CREATE INDEX IF NOT EXISTS idx_deleted_listings_deleted_at ON deleted_listings(deleted_at);

-- Add RLS policies
ALTER TABLE deleted_listings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view deleted listings
CREATE POLICY "Allow authenticated users to view deleted listings" ON deleted_listings
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to add to deleted listings
CREATE POLICY "Allow authenticated users to add deleted listings" ON deleted_listings
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow users to delete their own entries (in case they want to un-blacklist)
CREATE POLICY "Allow users to delete their own deleted listings" ON deleted_listings
  FOR DELETE TO authenticated USING (deleted_by = auth.uid());

-- Allow anonymous access for scraper to check blacklist
CREATE POLICY "Allow anonymous to check deleted listings" ON deleted_listings
  FOR SELECT TO anon USING (true); 