-- Fix saved listings functionality by adding missing fields to business_listings table

-- Add verification fields to business_listings table
ALTER TABLE business_listings 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'live' 
CHECK (verification_status IN ('live', 'removed', 'pending'));

-- Update existing listings with verification status
UPDATE business_listings 
SET 
  is_active = true,
  last_verified_at = NOW(),
  verification_status = 'live'
WHERE verification_status IS NULL;

-- Check the results
SELECT 
  COUNT(*) as total_listings,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_listings,
  COUNT(CASE WHEN verification_status = 'live' THEN 1 END) as live_listings
FROM business_listings;