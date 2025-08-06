# Business Acquisition CRM Pipeline Design

## Pipeline Stages

### 1. **Prospecting** (Lead Generation)
- Newly discovered businesses from scrapers
- Quick evaluation stage
- Bulk import from multiple sources
- Initial scoring/ranking

### 2. **Qualified Leads**
- Passed initial criteria (revenue, multiple, industry fit)
- Ready for deeper analysis
- Broker contact initiated

### 3. **Analysis**
- Initial deal analysis and evaluation
- Financial metrics review
- Market analysis and competitive research
- Investment thesis development
- Go/No-go decision making

### 4. **Initial Contact**
- Initial communication with broker/seller
- NDA status tracking
- Information packet received
- Initial questions sent

### 5. **Due Diligence**
- Financials review (P&L, tax returns, bank statements)
- Legal review (contracts, leases, licenses)
- Operations review (processes, employees, systems)
- Market analysis
- Multiple sub-stages: Initial DD, Deep DD, Final DD

### 6. **LOI (Letter of Intent)**
- LOI drafted and sent
- Negotiation phase
- Terms being discussed
- Financing arrangements

### 7. **Under Contract**
- Purchase agreement signed
- Final due diligence
- Financing secured
- Closing preparations

### 8. **Closed Won**
- Deal completed
- Transition planning
- Post-acquisition tracking

### 9. **Closed Lost**
- Deal didn't proceed
- Reason tracking
- Learning repository

## Enhanced Database Schema

```sql
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
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Market Information
  on_or_off_market TEXT CHECK (on_or_off_market IN ('on', 'off', 'pocket')),
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
  stage TEXT DEFAULT 'prospecting',
  stage_updated_at TIMESTAMP DEFAULT NOW(),
  assigned_to UUID REFERENCES auth.users(id),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  score INTEGER, -- 0-100 automated scoring
  
  -- Status
  status TEXT DEFAULT 'active',
  substatus TEXT, -- More detailed status within stage
  next_action TEXT,
  next_action_date DATE,
  
  -- User/Team
  created_by UUID REFERENCES auth.users(id),
  team_id UUID,
  
  -- Additional Metadata
  tags TEXT[],
  custom_fields JSONB
);

-- Deal timeline/activity tracking
CREATE TABLE deal_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  activity_type TEXT NOT NULL, -- email, call, meeting, note, stage_change, document_upload
  title TEXT NOT NULL,
  description TEXT,
  outcome TEXT,
  next_steps TEXT,
  activity_date TIMESTAMP DEFAULT NOW(),
  duration_minutes INTEGER,
  attendees TEXT[],
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
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
  uploaded_at TIMESTAMP DEFAULT NOW(),
  tags TEXT[],
  is_confidential BOOLEAN DEFAULT true,
  expiry_date DATE, -- For NDAs, etc.
  metadata JSONB
);

-- Communications tracking
CREATE TABLE deal_communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  channel TEXT CHECK (channel IN ('email', 'phone', 'sms', 'meeting', 'portal')),
  subject TEXT,
  body TEXT,
  from_email TEXT,
  to_emails TEXT[],
  cc_emails TEXT[],
  phone_number TEXT,
  recording_url TEXT,
  scheduled_at TIMESTAMP,
  occurred_at TIMESTAMP,
  duration_minutes INTEGER,
  user_id UUID REFERENCES auth.users(id),
  contact_id UUID,
  thread_id TEXT,
  status TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Due diligence checklist
CREATE TABLE dd_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  item TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'na', 'issue')),
  assigned_to UUID REFERENCES auth.users(id),
  due_date DATE,
  completed_date DATE,
  notes TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
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
  created_at TIMESTAMP DEFAULT NOW()
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
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Team collaboration
CREATE TABLE deal_team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  role TEXT NOT NULL, -- lead, analyst, attorney, accountant, advisor
  permissions JSONB,
  added_at TIMESTAMP DEFAULT NOW(),
  added_by UUID REFERENCES auth.users(id)
);

-- Valuation models
CREATE TABLE deal_valuations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  valuation_method TEXT NOT NULL, -- DCF, multiples, asset-based
  valuation_amount DECIMAL(15,2),
  assumptions JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
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
  created_at TIMESTAMP DEFAULT NOW()
);

-- Risk assessment
CREATE TABLE deal_risks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  risk_category TEXT NOT NULL,
  risk_description TEXT NOT NULL,
  likelihood TEXT CHECK (likelihood IN ('low', 'medium', 'high')),
  impact TEXT CHECK (impact IN ('low', 'medium', 'high')),
  mitigation_strategy TEXT,
  owner UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Key Features

### 1. **Smart Deal Scoring**
- Automated scoring based on financial metrics
- Industry benchmarking
- Risk assessment scoring
- Custom scoring models

### 2. **Document Intelligence**
- OCR for uploaded documents
- Automatic categorization
- Key information extraction
- Version control

### 3. **Communication Hub**
- Email integration (Gmail/Outlook)
- Call logging and recording
- SMS tracking
- Unified inbox per deal

### 4. **Advanced Analytics**
- Pipeline velocity metrics
- Conversion rates by stage
- Average deal size trends
- Time-in-stage analysis
- Win/loss analysis

### 5. **Collaboration Tools**
- Team assignments
- Task management
- Internal discussions
- Deal rooms for external parties

### 6. **Financial Modeling**
- Built-in valuation calculators
- Scenario planning
- ROI projections
- Financing structuring

### 7. **Due Diligence Management**
- Customizable DD checklists
- Red flag tracking
- Q&A management
- Virtual data room

### 8. **Integration Capabilities**
- QuickBooks sync
- Banking connections
- Legal document management
- E-signature integration

### 9. **Mobile Features**
- Pipeline management on mobile
- Document scanning
- Quick deal updates
- Push notifications

### 10. **AI-Powered Insights**
- Deal recommendation engine
- Risk prediction
- Automated market analysis
- Smart notifications
- Negotiation suggestions

## Innovative Features

### 1. **Deal DNA™**
- Visual fingerprint of each deal showing strengths/weaknesses
- Pattern matching with successful past deals
- Predictive success scoring

### 2. **Market Pulse**
- Real-time industry trends
- Competitor monitoring
- Valuation benchmarking
- Regulatory change alerts

### 3. **Buyer's Playbook**
- Templated workflows for different deal types
- Best practices library
- Negotiation tactics database
- Post-acquisition integration plans

### 4. **Virtual Deal Room**
- Secure document sharing with sellers
- Watermarked document viewing
- Access analytics
- Q&A management

### 5. **Deal Autopilot**
- Automated follow-ups
- Smart task creation
- Document request management
- Status update reminders

### 6. **Financial X-Ray**
- Automated financial statement analysis
- Anomaly detection
- Trend visualization
- Quality of earnings indicators