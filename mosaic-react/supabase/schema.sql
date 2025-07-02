-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (handled by Supabase Auth)

-- Enum types
CREATE TYPE deal_status AS ENUM (
  'prospecting',
  'initial_contact',
  'loi_submitted',
  'due_diligence',
  'negotiation',
  'under_contract',
  'closing',
  'closed_won',
  'closed_lost',
  'on_hold'
);

CREATE TYPE deal_source AS ENUM (
  'marketplace',
  'broker',
  'direct_outreach',
  'referral',
  'other'
);

CREATE TYPE communication_type AS ENUM (
  'email',
  'phone',
  'meeting',
  'text',
  'other'
);

CREATE TYPE file_category AS ENUM (
  'financial_statements',
  'tax_returns',
  'bank_statements',
  'product_info',
  'supplier_info',
  'legal_documents',
  'due_diligence',
  'contracts',
  'correspondence',
  'analytics',
  'other'
);

-- Deals table
CREATE TABLE deals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic information
  business_name VARCHAR(255) NOT NULL,
  status deal_status DEFAULT 'prospecting',
  source deal_source,
  priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  
  -- Financial information
  asking_price DECIMAL(12, 2),
  valuation_multiple DECIMAL(5, 2),
  annual_revenue DECIMAL(12, 2),
  annual_profit DECIMAL(12, 2),
  monthly_revenue DECIMAL(12, 2),
  monthly_profit DECIMAL(12, 2),
  
  -- Business details
  business_age INTEGER, -- in months
  date_listed DATE,
  is_on_market BOOLEAN DEFAULT true,
  listing_url TEXT,
  
  -- Amazon specific
  amazon_store_name VARCHAR(255),
  amazon_store_url TEXT,
  amazon_category VARCHAR(255),
  amazon_subcategory VARCHAR(255),
  seller_account_health VARCHAR(50),
  fba_percentage DECIMAL(5, 2), -- percentage of sales through FBA
  
  -- Other platforms
  website_url TEXT,
  other_platforms JSONB, -- {platform: url} pairs
  
  -- Contact information
  seller_name VARCHAR(255),
  seller_email VARCHAR(255),
  seller_phone VARCHAR(50),
  broker_name VARCHAR(255),
  broker_email VARCHAR(255),
  broker_phone VARCHAR(50),
  broker_company VARCHAR(255),
  
  -- Important dates
  first_contact_date DATE,
  loi_submitted_date DATE,
  due_diligence_start_date DATE,
  expected_close_date DATE,
  actual_close_date DATE,
  
  -- Additional info
  notes TEXT,
  tags TEXT[],
  custom_fields JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ASINs table (many-to-many with deals)
CREATE TABLE asins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  asin VARCHAR(20) UNIQUE NOT NULL,
  product_name TEXT,
  category VARCHAR(255),
  subcategory VARCHAR(255),
  brand VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deal ASINs junction table
CREATE TABLE deal_asins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  asin_id UUID REFERENCES asins(id) ON DELETE CASCADE,
  
  -- ASIN specific metrics for this deal
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

-- Files table
CREATE TABLE files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL, -- Supabase storage path
  file_size INTEGER,
  file_type VARCHAR(50),
  category file_category,
  
  description TEXT,
  uploaded_by VARCHAR(255),
  is_confidential BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Communications log
CREATE TABLE communications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  type communication_type NOT NULL,
  direction VARCHAR(10) CHECK (direction IN ('inbound', 'outbound')),
  contact_name VARCHAR(255),
  subject VARCHAR(255),
  summary TEXT,
  full_content TEXT,
  
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  attachments JSONB, -- array of file references
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id),
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE,
  priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Analysis Results table
CREATE TABLE ai_analyses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  analysis_type VARCHAR(50) NOT NULL, -- 'market', 'financial', 'competition', 'due_diligence'
  request_prompt TEXT,
  result_data JSONB NOT NULL,
  confidence_score DECIMAL(3, 2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Market Data Cache table (for storing Amazon market data)
CREATE TABLE market_data_cache (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  asin VARCHAR(20),
  category VARCHAR(255),
  data_type VARCHAR(50), -- 'sales_rank', 'pricing', 'competition'
  data_value JSONB NOT NULL,
  
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  UNIQUE(asin, data_type)
);

-- Notes table (for detailed notes with rich text)
CREATE TABLE notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  title VARCHAR(255),
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deal metrics history (for tracking changes over time)
CREATE TABLE deal_metrics_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  
  metric_date DATE NOT NULL,
  revenue DECIMAL(10, 2),
  profit DECIMAL(10, 2),
  units_sold INTEGER,
  conversion_rate DECIMAL(5, 2),
  acos DECIMAL(5, 2), -- Advertising Cost of Sale
  inventory_value DECIMAL(10, 2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(deal_id, metric_date)
);

-- Create indexes for better performance
CREATE INDEX idx_deals_user_id ON deals(user_id);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_created_at ON deals(created_at);
CREATE INDEX idx_deal_asins_deal_id ON deal_asins(deal_id);
CREATE INDEX idx_files_deal_id ON files(deal_id);
CREATE INDEX idx_communications_deal_id ON communications(deal_id);
CREATE INDEX idx_tasks_deal_id ON tasks(deal_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_ai_analyses_deal_id ON ai_analyses(deal_id);

-- Row Level Security (RLS) policies
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE asins ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_asins ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_metrics_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own deals
CREATE POLICY "Users can view own deals" ON deals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deals" ON deals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deals" ON deals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own deals" ON deals
  FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for other tables
CREATE POLICY "Users can view own files" ON files
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own files" ON files
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own communications" ON communications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own communications" ON communications
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = assigned_to);

CREATE POLICY "Users can manage own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own analyses" ON ai_analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own analyses" ON ai_analyses
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notes" ON notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notes" ON notes
  FOR ALL USING (auth.uid() = user_id);

-- Everyone can view ASINs (public data)
CREATE POLICY "Anyone can view asins" ON asins
  FOR SELECT USING (true);

-- Only authenticated users can insert ASINs
CREATE POLICY "Authenticated users can insert asins" ON asins
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Deal ASINs follow deal permissions
CREATE POLICY "Users can view own deal asins" ON deal_asins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM deals 
      WHERE deals.id = deal_asins.deal_id 
      AND deals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own deal asins" ON deal_asins
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM deals 
      WHERE deals.id = deal_asins.deal_id 
      AND deals.user_id = auth.uid()
    )
  );

-- Deal metrics history follows deal permissions
CREATE POLICY "Users can view own deal metrics" ON deal_metrics_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM deals 
      WHERE deals.id = deal_metrics_history.deal_id 
      AND deals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own deal metrics" ON deal_metrics_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM deals 
      WHERE deals.id = deal_metrics_history.deal_id 
      AND deals.user_id = auth.uid()
    )
  );

-- Functions
-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();