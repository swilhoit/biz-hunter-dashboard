-- Create ASINs table with image support
CREATE TABLE IF NOT EXISTS asins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  asin VARCHAR(20) UNIQUE NOT NULL,
  product_name TEXT,
  category VARCHAR(255),
  subcategory VARCHAR(255),
  brand VARCHAR(255),
  image_url TEXT,
  price DECIMAL(10, 2),
  rating DECIMAL(3, 2),
  reviews_count INTEGER,
  in_stock BOOLEAN DEFAULT true,
  features JSONB,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Deal ASINs junction table with enhanced tracking
CREATE TABLE IF NOT EXISTS deal_asins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  asin VARCHAR(20) NOT NULL,
  units_sold_monthly INTEGER,
  revenue_monthly DECIMAL(10, 2),
  profit_monthly DECIMAL(10, 2),
  inventory_value DECIMAL(10, 2),
  rank_current INTEGER,
  rank_average INTEGER,
  review_count INTEGER,
  review_rating DECIMAL(3, 2),
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  price_history JSONB DEFAULT '[]'::jsonb,
  rank_history JSONB DEFAULT '[]'::jsonb,
  revenue_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(deal_id, asin)
);

-- Create market data cache table
CREATE TABLE IF NOT EXISTS market_data_cache (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  asin VARCHAR(20),
  category VARCHAR(255),
  data_type VARCHAR(50),
  data_value JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(asin, data_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_asins_asin ON asins(asin);
CREATE INDEX IF NOT EXISTS idx_deal_asins_asin ON deal_asins(asin);
CREATE INDEX IF NOT EXISTS idx_deal_asins_deal_id ON deal_asins(deal_id);
CREATE INDEX IF NOT EXISTS idx_market_data_cache_asin ON market_data_cache(asin);

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_asins_updated_at BEFORE UPDATE ON asins
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_deal_asins_updated_at BEFORE UPDATE ON deal_asins
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable RLS
ALTER TABLE asins ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_asins ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_data_cache ENABLE ROW LEVEL SECURITY;

-- ASINs policies
CREATE POLICY "Users can view all ASINs" ON asins
  FOR SELECT USING (true);

CREATE POLICY "Users can insert ASINs" ON asins
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update ASINs" ON asins
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Deal ASINs policies
CREATE POLICY "Users can view deal ASINs" ON deal_asins
  FOR SELECT USING (true);

CREATE POLICY "Users can manage deal ASINs" ON deal_asins
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Market data cache policies
CREATE POLICY "Everyone can view market data" ON market_data_cache
  FOR SELECT USING (true);

CREATE POLICY "System can manage market data" ON market_data_cache
  FOR ALL USING (auth.uid() IS NOT NULL);