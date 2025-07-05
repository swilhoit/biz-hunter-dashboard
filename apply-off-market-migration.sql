-- Add off-market support to business_listings table
ALTER TABLE business_listings 
ADD COLUMN IF NOT EXISTS is_off_market BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS seller_name TEXT,
ADD COLUMN IF NOT EXISTS owner_name TEXT,
ADD COLUMN IF NOT EXISTS owner_title TEXT,
ADD COLUMN IF NOT EXISTS owner_email TEXT,
ADD COLUMN IF NOT EXISTS owner_phone TEXT,
ADD COLUMN IF NOT EXISTS owner_linkedin TEXT,
ADD COLUMN IF NOT EXISTS company_website TEXT,
ADD COLUMN IF NOT EXISTS monthly_profit DECIMAL,
ADD COLUMN IF NOT EXISTS profit_margin DECIMAL,
ADD COLUMN IF NOT EXISTS business_age_months INTEGER,
ADD COLUMN IF NOT EXISTS established_year INTEGER,
ADD COLUMN IF NOT EXISTS revenue_trend TEXT CHECK (revenue_trend IN ('increasing', 'stable', 'decreasing')),
ADD COLUMN IF NOT EXISTS asin_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS top_asins JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS contact_confidence_score INTEGER;

-- Create index for off-market queries
CREATE INDEX IF NOT EXISTS idx_business_listings_off_market ON business_listings(is_off_market) WHERE is_off_market = true;

-- Create off_market_sellers view for easier querying
CREATE OR REPLACE VIEW off_market_sellers AS
SELECT 
  id,
  seller_name,
  name AS business_name,
  industry AS category,
  monthly_revenue,
  monthly_profit,
  annual_revenue,
  annual_profit,
  profit_margin,
  business_age_months,
  established_year,
  revenue_trend,
  asin_count,
  top_asins,
  owner_name,
  owner_title,
  owner_email,
  owner_phone,
  owner_linkedin,
  company_website,
  contact_confidence_score,
  created_at,
  updated_at
FROM business_listings
WHERE is_off_market = true
  AND status = 'active';

-- Add RLS policies for off-market listings
CREATE POLICY "Users can view off-market listings" ON business_listings
  FOR SELECT USING (
    auth.uid() IS NOT NULL 
    AND is_off_market = true
  );

-- Function to add sample off-market data (for development)
CREATE OR REPLACE FUNCTION add_sample_off_market_sellers()
RETURNS void AS $$
BEGIN
  -- Premium Beauty Brands LLC
  INSERT INTO business_listings (
    name, seller_name, industry, asking_price, annual_revenue, monthly_revenue,
    monthly_profit, annual_profit, profit_margin, business_age_months, established_year,
    revenue_trend, asin_count, top_asins, is_off_market, status, source,
    description, highlights, location
  ) VALUES (
    'Premium Beauty Brands LLC',
    'Premium Beauty Brands LLC',
    'Beauty & Personal Care',
    13500000, -- Asking price based on 10x annual profit
    5400000,  -- Annual revenue
    450000,   -- Monthly revenue
    112500,   -- Monthly profit
    1350000,  -- Annual profit
    25,       -- Profit margin
    48,       -- Business age in months
    2021,     -- Established year
    'increasing',
    23,
    '[{"asin": "B09XYZ123", "name": "Vitamin C Serum", "monthly_revenue": 85000},
      {"asin": "B09XYZ124", "name": "Retinol Cream", "monthly_revenue": 72000},
      {"asin": "B09XYZ125", "name": "Hyaluronic Acid", "monthly_revenue": 68000}]'::jsonb,
    true,
    'active',
    'Off-Market',
    'Premium Beauty Brands is a leading seller of high-quality skincare products on Amazon, specializing in science-backed formulations.',
    '{"Top 1% seller in Beauty category", "Average 4.5+ star ratings across all products", "Strong brand loyalty with 40% repeat purchase rate", "Proprietary formulations with patent pending"}'::text[],
    'Los Angeles, CA'
  );

  -- Add more sample sellers...
  
END;
$$ LANGUAGE plpgsql;

-- Add the sample data
SELECT add_sample_off_market_sellers();