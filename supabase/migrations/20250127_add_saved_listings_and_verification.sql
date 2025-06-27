-- Add verification fields to existing listings table
ALTER TABLE business_listings 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'live' CHECK (verification_status IN ('live', 'removed', 'pending'));

-- Create saved_listings table for user favorites
CREATE TABLE IF NOT EXISTS saved_listings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES business_listings(id) ON DELETE CASCADE,
    saved_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    UNIQUE(user_id, listing_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_listings_user_id ON saved_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_listings_listing_id ON saved_listings(listing_id);
CREATE INDEX IF NOT EXISTS idx_business_listings_verification ON business_listings(is_active, last_verified_at);

-- Enable RLS on saved_listings
ALTER TABLE saved_listings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for saved_listings
CREATE POLICY "Users can view their own saved listings" ON saved_listings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save listings" ON saved_listings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their saved listings" ON saved_listings
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can update their saved listings" ON saved_listings
    FOR UPDATE USING (auth.uid() = user_id);

-- Create function to get listings with saved status for a user
CREATE OR REPLACE FUNCTION get_listings_with_saved_status(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    price DECIMAL,
    location TEXT,
    industry TEXT,
    cash_flow DECIMAL,
    revenue DECIMAL,
    ebitda DECIMAL,
    image_url TEXT,
    listing_url TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    is_active BOOLEAN,
    last_verified_at TIMESTAMPTZ,
    verification_status TEXT,
    is_saved BOOLEAN,
    saved_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bl.id,
        bl.title,
        bl.description,
        bl.price,
        bl.location,
        bl.industry,
        bl.cash_flow,
        bl.revenue,
        bl.ebitda,
        bl.image_url,
        bl.listing_url,
        bl.created_at,
        bl.updated_at,
        bl.is_active,
        bl.last_verified_at,
        bl.verification_status,
        CASE WHEN sl.id IS NOT NULL THEN true ELSE false END as is_saved,
        sl.saved_at
    FROM business_listings bl
    LEFT JOIN saved_listings sl ON bl.id = sl.listing_id AND sl.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;