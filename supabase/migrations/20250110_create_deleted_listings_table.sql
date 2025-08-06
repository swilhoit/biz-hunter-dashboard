-- Create deleted_listings table to track removed listings
CREATE TABLE IF NOT EXISTS deleted_listings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    listing_name TEXT NOT NULL,
    original_url TEXT,
    source TEXT,
    deleted_by UUID REFERENCES auth.users(id),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_deleted_listings_url ON deleted_listings(original_url);
CREATE INDEX idx_deleted_listings_source ON deleted_listings(source);
CREATE INDEX idx_deleted_listings_deleted_by ON deleted_listings(deleted_by);

-- Enable RLS
ALTER TABLE deleted_listings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all deleted listings"
ON deleted_listings FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can add to deleted listings"
ON deleted_listings FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add comment
COMMENT ON TABLE deleted_listings IS 'Tracks deleted business listings to prevent re-scraping';