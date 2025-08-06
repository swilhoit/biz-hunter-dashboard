-- Add support for CSV import fields
-- This migration adds columns that might be present in CSV imports

-- Add fields that might be in CSV files
ALTER TABLE business_listings 
ADD COLUMN IF NOT EXISTS monthly_revenue DECIMAL,
ADD COLUMN IF NOT EXISTS seller_financing BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS years_in_business INTEGER,
ADD COLUMN IF NOT EXISTS employees INTEGER,
ADD COLUMN IF NOT EXISTS reason_for_selling TEXT,
ADD COLUMN IF NOT EXISTS multiple DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS inventory_value DECIMAL,
ADD COLUMN IF NOT EXISTS real_estate_included BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS image_urls TEXT[],
ADD COLUMN IF NOT EXISTS established_date DATE;

-- Create indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_business_listings_monthly_revenue ON business_listings(monthly_revenue);
CREATE INDEX IF NOT EXISTS idx_business_listings_multiple ON business_listings(multiple);
CREATE INDEX IF NOT EXISTS idx_business_listings_employees ON business_listings(employees);

-- Add comments for documentation
COMMENT ON COLUMN business_listings.monthly_revenue IS 'Monthly revenue in USD';
COMMENT ON COLUMN business_listings.seller_financing IS 'Whether seller financing is available';
COMMENT ON COLUMN business_listings.years_in_business IS 'Years the business has been operating';
COMMENT ON COLUMN business_listings.employees IS 'Number of employees';
COMMENT ON COLUMN business_listings.reason_for_selling IS 'Reason the business is for sale';
COMMENT ON COLUMN business_listings.multiple IS 'Business valuation multiple';
COMMENT ON COLUMN business_listings.inventory_value IS 'Value of inventory included';
COMMENT ON COLUMN business_listings.real_estate_included IS 'Whether real estate is included in the sale';
COMMENT ON COLUMN business_listings.image_urls IS 'Array of image URLs for the listing';
COMMENT ON COLUMN business_listings.established_date IS 'Date the business was established';

-- Success message
SELECT 'CSV import support columns added successfully' as status;