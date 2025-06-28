-- Add original_url column to business_listings table
ALTER TABLE business_listings ADD COLUMN IF NOT EXISTS original_url TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_business_listings_original_url ON business_listings(original_url);

-- Verify the column was added
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'business_listings' AND column_name = 'original_url';