-- Add Year-over-Year trend percentage column to deals table
ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS yoy_trend_percent DECIMAL(5,2);

-- Add comment for documentation
COMMENT ON COLUMN deals.yoy_trend_percent IS 'Year-over-Year revenue growth trend as a percentage (e.g., 15.5 for 15.5% growth)';

-- Create index for better performance when filtering/sorting by YoY trend
CREATE INDEX IF NOT EXISTS idx_deals_yoy_trend ON deals(yoy_trend_percent);

-- Also add YoY trend to business_listings table for consistency
ALTER TABLE business_listings 
ADD COLUMN IF NOT EXISTS yoy_trend_percent DECIMAL(5,2);

-- Add comment for documentation
COMMENT ON COLUMN business_listings.yoy_trend_percent IS 'Year-over-Year revenue growth trend as a percentage (e.g., 15.5 for 15.5% growth)';

-- Create index for better performance when filtering/sorting by YoY trend
CREATE INDEX IF NOT EXISTS idx_business_listings_yoy_trend ON business_listings(yoy_trend_percent);

-- Success message
SELECT 'YoY trend columns added successfully to deals and business_listings tables' as status;