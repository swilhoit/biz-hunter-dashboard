-- Add source field to track which scraper/directory each listing came from
ALTER TABLE business_listings ADD COLUMN IF NOT EXISTS source TEXT;

-- Add image_url field for business listing images
ALTER TABLE business_listings ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create index on source field for filtering
CREATE INDEX IF NOT EXISTS idx_business_listings_source ON business_listings(source);

-- Update the unique constraint to include source for better duplicate prevention
ALTER TABLE business_listings DROP CONSTRAINT IF EXISTS unique_business_listing;
ALTER TABLE business_listings ADD CONSTRAINT unique_business_listing_with_source 
    UNIQUE (name, original_url, source);

-- Update existing records to have a default source if needed
UPDATE business_listings SET source = 'BizBuySell' WHERE source IS NULL;

-- Make source field NOT NULL after setting defaults
ALTER TABLE business_listings ALTER COLUMN source SET NOT NULL;

SELECT 'Source field added to business_listings table successfully' as status;