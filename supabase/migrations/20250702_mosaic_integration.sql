-- Migration to integrate Mosaic React frontend with existing database structure
-- This migration adapts the mosaic-react schema to work with our existing tables

-- First, let's add any missing columns to the existing deals table
ALTER TABLE deals ADD COLUMN IF NOT EXISTS business_age INTEGER;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS date_listed DATE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS is_on_market BOOLEAN DEFAULT true;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS amazon_store_name VARCHAR(255);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS amazon_store_url TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS amazon_category VARCHAR(255);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS amazon_subcategory VARCHAR(255);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS seller_account_health VARCHAR(50);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS fba_percentage DECIMAL(5, 2);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS other_platforms JSONB;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS seller_name VARCHAR(255);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS seller_email VARCHAR(255);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS seller_phone VARCHAR(50);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS first_contact_date DATE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS loi_submitted_date DATE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS due_diligence_start_date DATE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS expected_close_date DATE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS actual_close_date DATE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS monthly_revenue DECIMAL(12, 2);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS monthly_profit DECIMAL(12, 2);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS valuation_multiple DECIMAL(5, 2);

-- Create ASINs table if it doesn't exist
CREATE TABLE IF NOT EXISTS asins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  asin VARCHAR(20) UNIQUE NOT NULL,
  product_name TEXT,
  category VARCHAR(255),
  subcategory VARCHAR(255),
  brand VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Deal ASINs junction table
CREATE TABLE IF NOT EXISTS deal_asins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  asin_id UUID REFERENCES asins(id) ON DELETE CASCADE,
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(deal_id, asin_id)
);

-- Create files table to complement deal_documents
CREATE TABLE IF NOT EXISTS files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(50),
  category VARCHAR(50),
  description TEXT,
  uploaded_by VARCHAR(255),
  is_confidential BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create AI analyses table
CREATE TABLE IF NOT EXISTS ai_analyses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_type VARCHAR(50) NOT NULL,
  request_prompt TEXT,
  result_data JSONB NOT NULL,
  confidence_score DECIMAL(3, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
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

-- Create deal metrics history table
CREATE TABLE IF NOT EXISTS deal_metrics_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  revenue DECIMAL(12, 2),
  profit DECIMAL(12, 2),
  units_sold INTEGER,
  conversion_rate DECIMAL(5, 2),
  acos DECIMAL(5, 2),
  inventory_value DECIMAL(12, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for new tables
ALTER TABLE asins ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_asins ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_data_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_metrics_history ENABLE ROW LEVEL SECURITY;

-- ASINs policies
CREATE POLICY "Users can view all ASINs" ON asins
  FOR SELECT USING (true);

CREATE POLICY "Users can insert ASINs" ON asins
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Deal ASINs policies
CREATE POLICY "Users can view their deal ASINs" ON deal_asins
  FOR SELECT USING (
    deal_id IN (SELECT id FROM deals WHERE created_by = auth.uid() OR assigned_to = auth.uid())
  );

CREATE POLICY "Users can manage their deal ASINs" ON deal_asins
  FOR ALL USING (
    deal_id IN (SELECT id FROM deals WHERE created_by = auth.uid() OR assigned_to = auth.uid())
  );

-- Files policies
CREATE POLICY "Users can view their files" ON files
  FOR SELECT USING (user_id = auth.uid() OR deal_id IN (
    SELECT id FROM deals WHERE created_by = auth.uid() OR assigned_to = auth.uid()
  ));

CREATE POLICY "Users can upload files" ON files
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their files" ON files
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their files" ON files
  FOR DELETE USING (user_id = auth.uid());

-- AI analyses policies
CREATE POLICY "Users can view their AI analyses" ON ai_analyses
  FOR SELECT USING (user_id = auth.uid() OR deal_id IN (
    SELECT id FROM deals WHERE created_by = auth.uid() OR assigned_to = auth.uid()
  ));

CREATE POLICY "Users can create AI analyses" ON ai_analyses
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Market data cache policies (public read)
CREATE POLICY "Everyone can view market data" ON market_data_cache
  FOR SELECT USING (true);

CREATE POLICY "System can manage market data" ON market_data_cache
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Deal metrics history policies
CREATE POLICY "Users can view their deal metrics" ON deal_metrics_history
  FOR SELECT USING (
    deal_id IN (SELECT id FROM deals WHERE created_by = auth.uid() OR assigned_to = auth.uid())
  );

CREATE POLICY "Users can manage their deal metrics" ON deal_metrics_history
  FOR ALL USING (
    deal_id IN (SELECT id FROM deals WHERE created_by = auth.uid() OR assigned_to = auth.uid())
  );

-- Create a view to simplify deal data access for the frontend
CREATE OR REPLACE VIEW deal_summary AS
SELECT 
  d.*,
  COUNT(DISTINCT da.asin_id) as asin_count,
  COUNT(DISTINCT dc.id) as communication_count,
  COUNT(DISTINCT dd.id) as document_count,
  COUNT(DISTINCT dn.id) as note_count
FROM deals d
LEFT JOIN deal_asins da ON d.id = da.deal_id
LEFT JOIN deal_communications dc ON d.id = dc.deal_id
LEFT JOIN deal_documents dd ON d.id = dd.deal_id
LEFT JOIN deal_notes dn ON d.id = dn.deal_id
GROUP BY d.id;

-- Grant access to the view
GRANT SELECT ON deal_summary TO authenticated;