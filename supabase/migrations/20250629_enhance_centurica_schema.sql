-- Clear existing data and enhance schema for Centurica aggregator data
-- This migration adds rich fields available from Centurica's business listing aggregation

-- First, clear existing data
DELETE FROM business_listings;

-- Add new columns to support Centurica's rich data format
ALTER TABLE business_listings 
ADD COLUMN IF NOT EXISTS business_model TEXT,
ADD COLUMN IF NOT EXISTS niche TEXT,
ADD COLUMN IF NOT EXISTS gross_revenue BIGINT,
ADD COLUMN IF NOT EXISTS net_revenue BIGINT,
ADD COLUMN IF NOT EXISTS inventory_value BIGINT,
ADD COLUMN IF NOT EXISTS profit_multiple DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS r_index INTEGER,
ADD COLUMN IF NOT EXISTS provider TEXT,
ADD COLUMN IF NOT EXISTS sba_qualified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS boopos_qualified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS listing_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS price_reduced BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS under_offer BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS new_listing BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS monthly_revenue BIGINT,
ADD COLUMN IF NOT EXISTS annual_profit BIGINT,
ADD COLUMN IF NOT EXISTS employees INTEGER,
ADD COLUMN IF NOT EXISTS established_year INTEGER,
ADD COLUMN IF NOT EXISTS growth_rate DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS traffic_sources TEXT[],
ADD COLUMN IF NOT EXISTS technology_stack TEXT[],
ADD COLUMN IF NOT EXISTS monetization_model TEXT;

-- Add comments for documentation
COMMENT ON COLUMN business_listings.business_model IS 'Business model type (e.g., SaaS, E-commerce, Content)';
COMMENT ON COLUMN business_listings.niche IS 'Specific niche or market segment';
COMMENT ON COLUMN business_listings.gross_revenue IS 'Gross revenue in USD';
COMMENT ON COLUMN business_listings.net_revenue IS 'Net revenue in USD';
COMMENT ON COLUMN business_listings.inventory_value IS 'Value of inventory in USD';
COMMENT ON COLUMN business_listings.profit_multiple IS 'Price to profit multiple';
COMMENT ON COLUMN business_listings.r_index IS 'Centurica risk index score';
COMMENT ON COLUMN business_listings.provider IS 'Original broker/provider (e.g., Empire Flippers, FE International)';
COMMENT ON COLUMN business_listings.sba_qualified IS 'Qualifies for SBA financing';
COMMENT ON COLUMN business_listings.boopos_qualified IS 'Qualifies for Boopos financing';
COMMENT ON COLUMN business_listings.listing_date IS 'Date when listing was first posted';
COMMENT ON COLUMN business_listings.price_reduced IS 'Has the price been reduced';
COMMENT ON COLUMN business_listings.under_offer IS 'Currently under offer';
COMMENT ON COLUMN business_listings.new_listing IS 'Recently listed (within 30 days)';
COMMENT ON COLUMN business_listings.monthly_revenue IS 'Monthly revenue in USD';
COMMENT ON COLUMN business_listings.annual_profit IS 'Annual profit in USD';
COMMENT ON COLUMN business_listings.employees IS 'Number of employees';
COMMENT ON COLUMN business_listings.established_year IS 'Year business was established';
COMMENT ON COLUMN business_listings.growth_rate IS 'Year-over-year growth rate percentage';
COMMENT ON COLUMN business_listings.traffic_sources IS 'Primary traffic sources (organic, paid, social, etc.)';
COMMENT ON COLUMN business_listings.technology_stack IS 'Technology stack used';
COMMENT ON COLUMN business_listings.monetization_model IS 'How the business makes money';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_business_listings_business_model ON business_listings(business_model);
CREATE INDEX IF NOT EXISTS idx_business_listings_niche ON business_listings(niche);
CREATE INDEX IF NOT EXISTS idx_business_listings_provider ON business_listings(provider);
CREATE INDEX IF NOT EXISTS idx_business_listings_profit_multiple ON business_listings(profit_multiple);
CREATE INDEX IF NOT EXISTS idx_business_listings_r_index ON business_listings(r_index);
CREATE INDEX IF NOT EXISTS idx_business_listings_sba_qualified ON business_listings(sba_qualified);
CREATE INDEX IF NOT EXISTS idx_business_listings_boopos_qualified ON business_listings(boopos_qualified);
CREATE INDEX IF NOT EXISTS idx_business_listings_listing_date ON business_listings(listing_date);
CREATE INDEX IF NOT EXISTS idx_business_listings_price_reduced ON business_listings(price_reduced);
CREATE INDEX IF NOT EXISTS idx_business_listings_under_offer ON business_listings(under_offer);
CREATE INDEX IF NOT EXISTS idx_business_listings_new_listing ON business_listings(new_listing);
CREATE INDEX IF NOT EXISTS idx_business_listings_gross_revenue ON business_listings(gross_revenue);
CREATE INDEX IF NOT EXISTS idx_business_listings_net_revenue ON business_listings(net_revenue);
CREATE INDEX IF NOT EXISTS idx_business_listings_annual_profit ON business_listings(annual_profit);