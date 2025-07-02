-- Add listing_status enum type and column to business_listings
-- This migration adds a new listing_status field to track business listing availability

-- Create enum type for listing status
CREATE TYPE listing_status_type AS ENUM ('live', 'under_offer', 'sold', 'offline', 'pending');

-- Add listing_status column to business_listings table
ALTER TABLE business_listings 
ADD COLUMN listing_status listing_status_type DEFAULT 'live';

-- Create index for better query performance
CREATE INDEX idx_business_listings_listing_status ON business_listings(listing_status);

-- Update existing listings to have 'live' status by default
UPDATE business_listings 
SET listing_status = 'live' 
WHERE listing_status IS NULL;

-- Add comment to the column
COMMENT ON COLUMN business_listings.listing_status IS 'Current availability status of the business listing';