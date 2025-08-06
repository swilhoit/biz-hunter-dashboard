-- Add Empire Flippers specific fields to deals table
-- This migration adds fields commonly found on Empire Flippers listings

ALTER TABLE deals
-- Financial Metrics (Monthly/Annual conversion)
ADD COLUMN IF NOT EXISTS avg_monthly_revenue DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS avg_monthly_profit DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS ttm_revenue DECIMAL(12,2), -- Trailing Twelve Months
ADD COLUMN IF NOT EXISTS ttm_profit DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS profit_margin DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS pricing_period INTEGER DEFAULT 12, -- Months used for multiple calculation

-- Business Age and Dates
ADD COLUMN IF NOT EXISTS business_started_date DATE,
ADD COLUMN IF NOT EXISTS business_age_years INTEGER,
ADD COLUMN IF NOT EXISTS business_age_months INTEGER,

-- Amazon/E-commerce Specific Metrics
ADD COLUMN IF NOT EXISTS sku_count INTEGER,
ADD COLUMN IF NOT EXISTS parent_asin_count INTEGER,
ADD COLUMN IF NOT EXISTS brand_registry BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tacos DECIMAL(5,2), -- Total Advertising Cost of Sale
ADD COLUMN IF NOT EXISTS acos DECIMAL(5,2), -- Advertising Cost of Sale
ADD COLUMN IF NOT EXISTS cogs_percentage DECIMAL(5,2), -- Cost of Goods Sold %
ADD COLUMN IF NOT EXISTS top_seller_retail_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS avg_retail_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS top_skus JSONB DEFAULT '[]'::jsonb, -- Array of {sku, asin, revenue_percentage}

-- Assets Included in Sale
ADD COLUMN IF NOT EXISTS assets_included JSONB DEFAULT '{
  "amazon_seller_account": false,
  "trademark": false,
  "supplier_contracts": false,
  "etsy_account": false,
  "ebay_account": false,
  "social_media_accounts": false,
  "website": false,
  "email_list": false,
  "inventory": false,
  "equipment": false,
  "other": []
}'::jsonb,

-- P&L and Financial History
ADD COLUMN IF NOT EXISTS monthly_financials JSONB DEFAULT '[]'::jsonb, -- Array of {month, revenue, profit, expenses}
ADD COLUMN IF NOT EXISTS last_month_revenue DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS last_month_profit DECIMAL(12,2),

-- Verification Status
ADD COLUMN IF NOT EXISTS verified_revenue BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_profit BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_date DATE,

-- Additional Metrics
ADD COLUMN IF NOT EXISTS hours_per_week INTEGER,
ADD COLUMN IF NOT EXISTS owner_involvement TEXT,
ADD COLUMN IF NOT EXISTS growth_trend TEXT, -- 'increasing', 'stable', 'declining'
ADD COLUMN IF NOT EXISTS revenue_sources JSONB DEFAULT '{}'::jsonb, -- {amazon: 90, etsy: 5, ebay: 5}
ADD COLUMN IF NOT EXISTS traffic_breakdown JSONB DEFAULT '{}'::jsonb,

-- Transfer and Support
ADD COLUMN IF NOT EXISTS transfer_period_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS training_included BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS support_period_days INTEGER DEFAULT 30;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_deals_profit_margin ON deals(profit_margin);
CREATE INDEX IF NOT EXISTS idx_deals_sku_count ON deals(sku_count);
CREATE INDEX IF NOT EXISTS idx_deals_ttm_revenue ON deals(ttm_revenue);
CREATE INDEX IF NOT EXISTS idx_deals_verified ON deals(verified_revenue, verified_profit);

-- Add comments for documentation
COMMENT ON COLUMN deals.avg_monthly_revenue IS 'Average monthly revenue calculated over pricing period';
COMMENT ON COLUMN deals.avg_monthly_profit IS 'Average monthly profit (SDE) calculated over pricing period';
COMMENT ON COLUMN deals.ttm_revenue IS 'Trailing twelve months revenue';
COMMENT ON COLUMN deals.ttm_profit IS 'Trailing twelve months profit';
COMMENT ON COLUMN deals.pricing_period IS 'Number of months used for multiple calculation (default 12)';
COMMENT ON COLUMN deals.tacos IS 'Total Advertising Cost of Sale percentage';
COMMENT ON COLUMN deals.acos IS 'Advertising Cost of Sale percentage';
COMMENT ON COLUMN deals.cogs_percentage IS 'Cost of Goods Sold as percentage of revenue';
COMMENT ON COLUMN deals.top_skus IS 'Array of top performing SKUs with revenue contribution';
COMMENT ON COLUMN deals.assets_included IS 'JSON object listing all assets included in the sale';
COMMENT ON COLUMN deals.monthly_financials IS 'Historical monthly revenue and profit data';
COMMENT ON COLUMN deals.revenue_sources IS 'Breakdown of revenue by platform/source';