-- Create CRM Pipeline Schema for Business Acquisition Deal Management
-- This migration transforms the saved listings feature into a comprehensive CRM system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for better data integrity
CREATE TYPE deal_stage AS ENUM (
  'prospecting',
  'qualified_leads', 
  'first_contact',
  'due_diligence',
  'loi',
  'under_contract',
  'closed_won',
  'closed_lost'
);

CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE market_status AS ENUM ('on', 'off', 'pocket');
CREATE TYPE activity_type AS ENUM ('email', 'call', 'meeting', 'note', 'stage_change', 'document_upload', 'task');
CREATE TYPE communication_channel AS ENUM ('email', 'phone', 'sms', 'meeting', 'portal');
CREATE TYPE communication_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE dd_status AS ENUM ('pending', 'in_progress', 'completed', 'na', 'issue');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');

-- Main deals table (evolution of business_listings)
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic Information
  business_name TEXT NOT NULL,
  dba_names TEXT[], -- Doing Business As names
  entity_type TEXT, -- LLC, Corp, etc.
  
  -- Financial Information
  asking_price DECIMAL(15,2),
  list_price DECIMAL(15,2),
  annual_revenue DECIMAL(15,2),
  annual_profit DECIMAL(15,2),
  ebitda DECIMAL(15,2),
  sde DECIMAL(15,2), -- Seller's Discretionary Earnings
  multiple DECIMAL(5,2),
  
  -- Business Details
  business_age INTEGER, -- in years
  employee_count INTEGER,
  inventory_value DECIMAL(15,2),
  
  -- Dates
  date_listed DATE,
  date_established DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Market Information
  on_or_off_market market_status DEFAULT 'on',
  listing_url TEXT,
  website_url TEXT,
  
  -- Amazon/E-commerce Specific
  amazon_category TEXT,
  amazon_store_link TEXT,
  monthly_sessions INTEGER,
  conversion_rate DECIMAL(5,2),
  asin_list JSONB, -- Array of {asin, revenue, units_sold, rank}
  brand_names TEXT[],
  
  -- Location
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'USA',
  
  -- Industry
  industry TEXT,
  sub_industry TEXT,
  niche_keywords TEXT[],
  
  -- Source Information
  source TEXT, -- BizBuySell, Flippa, etc.
  broker_name TEXT,
  broker_email TEXT,
  broker_phone TEXT,
  listing_id_on_source TEXT,
  
  -- Pipeline Management
  stage deal_stage DEFAULT 'prospecting',
  stage_updated_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_to UUID REFERENCES auth.users(id),
  priority priority_level DEFAULT 'medium',
  score INTEGER CHECK (score >= 0 AND score <= 100), -- 0-100 automated scoring
  
  -- Status
  status TEXT DEFAULT 'active',
  substatus TEXT, -- More detailed status within stage
  next_action TEXT,
  next_action_date DATE,
  
  -- User/Team
  created_by UUID REFERENCES auth.users(id),
  team_id UUID,
  
  -- Legacy reference
  original_listing_id UUID, -- Reference to original business_listings record if migrated
  
  -- Additional Metadata
  tags TEXT[],
  custom_fields JSONB
);

-- Deal timeline/activity tracking
CREATE TABLE deal_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  activity_type activity_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  outcome TEXT,
  next_steps TEXT,
  activity_date TIMESTAMPTZ DEFAULT NOW(),
  duration_minutes INTEGER,
  attendees TEXT[],
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document repository
CREATE TABLE deal_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- financials, legal, operations, marketing, correspondence
  subcategory TEXT, -- P&L, tax_returns, contracts, etc.
  document_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Supabase storage path
  file_size INTEGER,
  file_type TEXT,
  year INTEGER, -- For financial docs
  month INTEGER, -- For monthly reports
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  tags TEXT[],
  is_confidential BOOLEAN DEFAULT true,
  expiry_date DATE, -- For NDAs, etc.
  metadata JSONB,
  
  -- Ensure unique file paths
  UNIQUE(file_path)
);

-- Communications tracking
CREATE TABLE deal_communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  direction communication_direction NOT NULL,
  channel communication_channel NOT NULL,
  subject TEXT,
  body TEXT,
  from_email TEXT,
  to_emails TEXT[],
  cc_emails TEXT[],
  phone_number TEXT,
  recording_url TEXT,
  scheduled_at TIMESTAMPTZ,
  occurred_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  user_id UUID REFERENCES auth.users(id),
  contact_id UUID,
  thread_id TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Due diligence checklist
CREATE TABLE dd_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  item TEXT NOT NULL,
  status dd_status DEFAULT 'pending',
  assigned_to UUID REFERENCES auth.users(id),
  due_date DATE,
  completed_date DATE,
  notes TEXT,
  severity risk_level DEFAULT 'low',
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Financial analysis
CREATE TABLE deal_financials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER,
  revenue DECIMAL(15,2),
  cogs DECIMAL(15,2),
  gross_profit DECIMAL(15,2),
  operating_expenses DECIMAL(15,2),
  ebitda DECIMAL(15,2),
  net_income DECIMAL(15,2),
  
  -- E-commerce metrics
  units_sold INTEGER,
  average_order_value DECIMAL(10,2),
  customer_count INTEGER,
  return_rate DECIMAL(5,2),
  
  -- Additional metrics
  metrics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique year/month per deal
  UNIQUE(deal_id, year, month)
);

-- Notes (enhanced)
CREATE TABLE deal_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  category TEXT, -- general, financial, legal, operational, negotiation
  title TEXT,
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team collaboration
CREATE TABLE deal_team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  role TEXT NOT NULL, -- lead, analyst, attorney, accountant, advisor
  permissions JSONB DEFAULT '{"read": true, "write": false, "delete": false}'::jsonb,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID REFERENCES auth.users(id),
  
  -- Ensure unique user per deal
  UNIQUE(deal_id, user_id)
);

-- Valuation models
CREATE TABLE deal_valuations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  valuation_method TEXT NOT NULL, -- DCF, multiples, asset-based
  valuation_amount DECIMAL(15,2),
  assumptions JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competitor analysis
CREATE TABLE deal_competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  competitor_name TEXT NOT NULL,
  website TEXT,
  estimated_revenue DECIMAL(15,2),
  market_share DECIMAL(5,2),
  strengths TEXT[],
  weaknesses TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk assessment
CREATE TABLE deal_risks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  risk_category TEXT NOT NULL,
  risk_description TEXT NOT NULL,
  likelihood risk_level DEFAULT 'low',
  impact risk_level DEFAULT 'low',
  mitigation_strategy TEXT,
  owner UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_deals_assigned_to ON deals(assigned_to);
CREATE INDEX idx_deals_created_by ON deals(created_by);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_priority ON deals(priority);
CREATE INDEX idx_deals_stage_updated ON deals(stage_updated_at);
CREATE INDEX idx_deals_next_action_date ON deals(next_action_date);
CREATE INDEX idx_deals_business_name ON deals(business_name);
CREATE INDEX idx_deals_industry ON deals(industry);

CREATE INDEX idx_activities_deal_id ON deal_activities(deal_id);
CREATE INDEX idx_activities_user_id ON deal_activities(user_id);
CREATE INDEX idx_activities_date ON deal_activities(activity_date);

CREATE INDEX idx_documents_deal_id ON deal_documents(deal_id);
CREATE INDEX idx_documents_category ON deal_documents(category);
CREATE INDEX idx_documents_uploaded_at ON deal_documents(uploaded_at);

CREATE INDEX idx_communications_deal_id ON deal_communications(deal_id);
CREATE INDEX idx_communications_occurred_at ON deal_communications(occurred_at);

CREATE INDEX idx_dd_deal_id ON dd_checklists(deal_id);
CREATE INDEX idx_dd_status ON dd_checklists(status);

CREATE INDEX idx_financials_deal_id ON deal_financials(deal_id);
CREATE INDEX idx_notes_deal_id ON deal_notes(deal_id);
CREATE INDEX idx_team_deal_id ON deal_team_members(deal_id);
CREATE INDEX idx_team_user_id ON deal_team_members(user_id);

-- Create storage buckets for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('deal-documents', 'deal-documents', false);

-- Row Level Security Policies
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE dd_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_risks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deals table
CREATE POLICY "Users can view deals they created or are assigned to" ON deals
  FOR SELECT USING (
    auth.uid() = created_by OR 
    auth.uid() = assigned_to OR
    EXISTS (
      SELECT 1 FROM deal_team_members 
      WHERE deal_team_members.deal_id = deals.id 
      AND deal_team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create deals" ON deals
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update deals they have access to" ON deals
  FOR UPDATE USING (
    auth.uid() = created_by OR 
    auth.uid() = assigned_to OR
    EXISTS (
      SELECT 1 FROM deal_team_members 
      WHERE deal_team_members.deal_id = deals.id 
      AND deal_team_members.user_id = auth.uid()
      AND (deal_team_members.permissions->>'write')::boolean = true
    )
  );

CREATE POLICY "Users can delete deals they created" ON deals
  FOR DELETE USING (auth.uid() = created_by);

-- Similar RLS policies for other tables
CREATE POLICY "Users can view activities for deals they have access to" ON deal_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM deals 
      WHERE deals.id = deal_activities.deal_id 
      AND (
        deals.created_by = auth.uid() OR 
        deals.assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM deal_team_members 
          WHERE deal_team_members.deal_id = deals.id 
          AND deal_team_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create activities for deals they have access to" ON deal_activities
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM deals 
      WHERE deals.id = deal_activities.deal_id 
      AND (
        deals.created_by = auth.uid() OR 
        deals.assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM deal_team_members 
          WHERE deal_team_members.deal_id = deals.id 
          AND deal_team_members.user_id = auth.uid()
        )
      )
    )
  );

-- RLS policies for documents
CREATE POLICY "Users can view documents for deals they have access to" ON deal_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM deals 
      WHERE deals.id = deal_documents.deal_id 
      AND (
        deals.created_by = auth.uid() OR 
        deals.assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM deal_team_members 
          WHERE deal_team_members.deal_id = deals.id 
          AND deal_team_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can upload documents for deals they have access to" ON deal_documents
  FOR INSERT WITH CHECK (
    auth.uid() = uploaded_by AND
    EXISTS (
      SELECT 1 FROM deals 
      WHERE deals.id = deal_documents.deal_id 
      AND (
        deals.created_by = auth.uid() OR 
        deals.assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM deal_team_members 
          WHERE deal_team_members.deal_id = deals.id 
          AND deal_team_members.user_id = auth.uid()
        )
      )
    )
  );

-- RLS policies for communications
CREATE POLICY "Users can view communications for deals they have access to" ON deal_communications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM deals 
      WHERE deals.id = deal_communications.deal_id 
      AND (
        deals.created_by = auth.uid() OR 
        deals.assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM deal_team_members 
          WHERE deal_team_members.deal_id = deals.id 
          AND deal_team_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can add communications for deals they have access to" ON deal_communications
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM deals 
      WHERE deals.id = deal_communications.deal_id 
      AND (
        deals.created_by = auth.uid() OR 
        deals.assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM deal_team_members 
          WHERE deal_team_members.deal_id = deals.id 
          AND deal_team_members.user_id = auth.uid()
        )
      )
    )
  );

-- RLS policies for notes
CREATE POLICY "Users can view notes for deals they have access to" ON deal_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM deals 
      WHERE deals.id = deal_notes.deal_id 
      AND (
        deals.created_by = auth.uid() OR 
        deals.assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM deal_team_members 
          WHERE deal_team_members.deal_id = deals.id 
          AND deal_team_members.user_id = auth.uid()
        )
      )
    ) AND (
      is_private = false OR user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create notes for deals they have access to" ON deal_notes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM deals 
      WHERE deals.id = deal_notes.deal_id 
      AND (
        deals.created_by = auth.uid() OR 
        deals.assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM deal_team_members 
          WHERE deal_team_members.deal_id = deals.id 
          AND deal_team_members.user_id = auth.uid()
        )
      )
    )
  );

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dd_checklists_updated_at BEFORE UPDATE ON dd_checklists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deal_notes_updated_at BEFORE UPDATE ON deal_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deal_risks_updated_at BEFORE UPDATE ON deal_risks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for updating stage timestamp
CREATE OR REPLACE FUNCTION update_stage_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.stage IS DISTINCT FROM NEW.stage THEN
        NEW.stage_updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_deals_stage_timestamp BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_stage_timestamp();

-- Create function to migrate existing favorites to deals
CREATE OR REPLACE FUNCTION migrate_favorites_to_deals()
RETURNS void AS $$
BEGIN
  INSERT INTO deals (
    business_name,
    asking_price,
    annual_revenue,
    industry,
    city,
    state,
    source,
    listing_url,
    created_by,
    original_listing_id,
    stage,
    created_at
  )
  SELECT 
    bl.name as business_name,
    bl.asking_price,
    bl.annual_revenue,
    bl.industry,
    bl.location as city,
    '' as state,
    bl.source,
    bl.original_url as listing_url,
    f.user_id as created_by,
    bl.id as original_listing_id,
    'prospecting'::deal_stage as stage,
    f.created_at
  FROM favorites f
  JOIN business_listings bl ON f.listing_id = bl.id
  WHERE NOT EXISTS (
    SELECT 1 FROM deals d 
    WHERE d.original_listing_id = bl.id 
    AND d.created_by = f.user_id
  );
END;
$$ LANGUAGE plpgsql;

-- Storage policies for deal documents
CREATE POLICY "Users can upload documents to deals they have access to"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'deal-documents' AND
  EXISTS (
    SELECT 1 FROM deals
    WHERE deals.id::text = (storage.foldername(name))[1]
    AND (
      deals.created_by = auth.uid() OR
      deals.assigned_to = auth.uid() OR
      EXISTS (
        SELECT 1 FROM deal_team_members
        WHERE deal_team_members.deal_id = deals.id
        AND deal_team_members.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can view documents for deals they have access to"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'deal-documents' AND
  EXISTS (
    SELECT 1 FROM deals
    WHERE deals.id::text = (storage.foldername(name))[1]
    AND (
      deals.created_by = auth.uid() OR
      deals.assigned_to = auth.uid() OR
      EXISTS (
        SELECT 1 FROM deal_team_members
        WHERE deal_team_members.deal_id = deals.id
        AND deal_team_members.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can delete documents they uploaded"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'deal-documents' AND
  EXISTS (
    SELECT 1 FROM deal_documents
    WHERE deal_documents.file_path = name
    AND deal_documents.uploaded_by = auth.uid()
  )
);