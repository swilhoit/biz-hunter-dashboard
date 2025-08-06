-- Add amazon_category column to business_listings table
ALTER TABLE business_listings 
ADD COLUMN IF NOT EXISTS amazon_category TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_business_listings_amazon_category 
ON business_listings(amazon_category);

-- Add comment explaining the field
COMMENT ON COLUMN business_listings.amazon_category IS 'Amazon product category (e.g., Home & Kitchen, Pet Supplies) - different from industry which stores business type';