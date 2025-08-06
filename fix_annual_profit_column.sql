-- Add missing annual_profit column to business_listings table
ALTER TABLE business_listings ADD COLUMN IF NOT EXISTS annual_profit BIGINT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_business_listings_annual_profit ON business_listings(annual_profit);

-- Update existing records to have a default value
UPDATE business_listings 
SET annual_profit = 0 
WHERE annual_profit IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN business_listings.annual_profit IS 'Annual profit in USD';

-- Verify the column was added successfully
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'business_listings' AND column_name = 'annual_profit'; 