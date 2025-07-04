-- Add missing fields needed for listing filters
-- This migration adds fields that are referenced in the ListingsFilters component

-- Add amazon_category if it doesn't exist
ALTER TABLE business_listings 
ADD COLUMN IF NOT EXISTS amazon_category TEXT;

-- Add marketplace if it doesn't exist (might be same as source/provider)
ALTER TABLE business_listings 
ADD COLUMN IF NOT EXISTS marketplace TEXT;

-- Add valuation_multiple if it doesn't exist (might be same as profit_multiple)
ALTER TABLE business_listings 
ADD COLUMN IF NOT EXISTS valuation_multiple DECIMAL(5,2);

-- Add fba_percentage if it doesn't exist
ALTER TABLE business_listings 
ADD COLUMN IF NOT EXISTS fba_percentage DECIMAL(5,2);

-- Add business_age_months if it doesn't exist
ALTER TABLE business_listings 
ADD COLUMN IF NOT EXISTS business_age_months INTEGER;

-- Add is_new flag if it doesn't exist (might be same as new_listing)
ALTER TABLE business_listings 
ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT FALSE;

-- Update marketplace from source/provider if empty
UPDATE business_listings 
SET marketplace = COALESCE(marketplace, provider, source)
WHERE marketplace IS NULL;

-- Update valuation_multiple from profit_multiple if empty
UPDATE business_listings 
SET valuation_multiple = COALESCE(valuation_multiple, profit_multiple)
WHERE valuation_multiple IS NULL;

-- Update is_new from new_listing if needed
UPDATE business_listings 
SET is_new = COALESCE(is_new, new_listing, FALSE)
WHERE is_new IS NULL;

-- Calculate business_age_months from established_year if available
UPDATE business_listings 
SET business_age_months = CASE 
    WHEN established_year IS NOT NULL THEN (EXTRACT(YEAR FROM CURRENT_DATE) - established_year) * 12
    ELSE NULL
END
WHERE business_age_months IS NULL AND established_year IS NOT NULL;

-- Create indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_business_listings_amazon_category ON business_listings(amazon_category);
CREATE INDEX IF NOT EXISTS idx_business_listings_marketplace ON business_listings(marketplace);
CREATE INDEX IF NOT EXISTS idx_business_listings_valuation_multiple ON business_listings(valuation_multiple);
CREATE INDEX IF NOT EXISTS idx_business_listings_fba_percentage ON business_listings(fba_percentage);
CREATE INDEX IF NOT EXISTS idx_business_listings_business_age_months ON business_listings(business_age_months);
CREATE INDEX IF NOT EXISTS idx_business_listings_is_new ON business_listings(is_new);

-- Add comments for documentation
COMMENT ON COLUMN business_listings.amazon_category IS 'Amazon product category (e.g., Pet Supplies, Home & Kitchen)';
COMMENT ON COLUMN business_listings.marketplace IS 'Listing marketplace/broker (e.g., Empire Flippers, Flippa)';
COMMENT ON COLUMN business_listings.valuation_multiple IS 'Price to profit/revenue multiple';
COMMENT ON COLUMN business_listings.fba_percentage IS 'Percentage of revenue from Amazon FBA';
COMMENT ON COLUMN business_listings.business_age_months IS 'Age of the business in months';
COMMENT ON COLUMN business_listings.is_new IS 'Whether this is a new listing (recently added)';