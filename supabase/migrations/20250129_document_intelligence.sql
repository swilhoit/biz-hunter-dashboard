-- Document Intelligence System
-- Stores AI-extracted content and insights from uploaded documents

-- Enable pgvector extension for embeddings (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- Document extractions table
CREATE TABLE IF NOT EXISTS document_extractions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES deal_documents(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  
  -- Extraction metadata
  extraction_date TIMESTAMP DEFAULT NOW(),
  extraction_version VARCHAR(20) DEFAULT '1.0',
  file_hash VARCHAR(64), -- SHA256 hash to detect changes
  
  -- Extracted content
  raw_text TEXT, -- Full extracted text
  structured_data JSONB DEFAULT '{}', -- Structured extraction (financials, contacts, etc.)
  key_entities JSONB DEFAULT '{}', -- Named entities (companies, people, locations)
  summary TEXT, -- AI-generated summary
  
  -- Classification
  document_type VARCHAR(50) DEFAULT 'other', -- financial_statement, contract, correspondence, etc.
  confidence_score FLOAT DEFAULT 0.5,
  language VARCHAR(10) DEFAULT 'en',
  
  -- Search optimization
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(summary, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(raw_text, '')), 'B')
  ) STORED,
  embedding vector(1536), -- OpenAI embeddings for semantic search
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_document_extractions_deal_id ON document_extractions(deal_id);
CREATE INDEX idx_document_extractions_document_id ON document_extractions(document_id);
CREATE INDEX idx_document_extractions_search ON document_extractions USING GIN(search_vector);
CREATE INDEX idx_document_extractions_document_type ON document_extractions(document_type);

-- Document insights table
CREATE TABLE IF NOT EXISTS document_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  extraction_id UUID NOT NULL REFERENCES document_extractions(id) ON DELETE CASCADE,
  
  -- Categorized insights
  insight_type VARCHAR(50) NOT NULL, -- financial_metric, risk_factor, opportunity, etc.
  insight_category VARCHAR(50) NOT NULL, -- revenue, profit, legal, operational, etc.
  
  -- Content
  title VARCHAR(255) NOT NULL,
  description TEXT,
  value JSONB, -- Flexible storage for different insight types
  confidence FLOAT DEFAULT 0.5,
  
  -- Metadata
  source_page INTEGER,
  source_section VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for insights
CREATE INDEX idx_document_insights_extraction_id ON document_insights(extraction_id);
CREATE INDEX idx_document_insights_type ON document_insights(insight_type);
CREATE INDEX idx_document_insights_category ON document_insights(insight_category);

-- Function to update extraction timestamp
CREATE OR REPLACE FUNCTION update_extraction_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
CREATE TRIGGER update_document_extractions_timestamp
  BEFORE UPDATE ON document_extractions
  FOR EACH ROW
  EXECUTE FUNCTION update_extraction_timestamp();

-- Row Level Security
ALTER TABLE document_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_extractions
CREATE POLICY "Users can view extractions for their deals"
  ON document_extractions
  FOR SELECT
  USING (
    deal_id IN (
      SELECT id FROM deals WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create extractions for their deals"
  ON document_extractions
  FOR INSERT
  WITH CHECK (
    deal_id IN (
      SELECT id FROM deals WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update extractions for their deals"
  ON document_extractions
  FOR UPDATE
  USING (
    deal_id IN (
      SELECT id FROM deals WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete extractions for their deals"
  ON document_extractions
  FOR DELETE
  USING (
    deal_id IN (
      SELECT id FROM deals WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for document_insights
CREATE POLICY "Users can view insights for their deals"
  ON document_insights
  FOR SELECT
  USING (
    extraction_id IN (
      SELECT id FROM document_extractions WHERE deal_id IN (
        SELECT id FROM deals WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create insights for their deals"
  ON document_insights
  FOR INSERT
  WITH CHECK (
    extraction_id IN (
      SELECT id FROM document_extractions WHERE deal_id IN (
        SELECT id FROM deals WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update insights for their deals"
  ON document_insights
  FOR UPDATE
  USING (
    extraction_id IN (
      SELECT id FROM document_extractions WHERE deal_id IN (
        SELECT id FROM deals WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete insights for their deals"
  ON document_insights
  FOR DELETE
  USING (
    extraction_id IN (
      SELECT id FROM document_extractions WHERE deal_id IN (
        SELECT id FROM deals WHERE user_id = auth.uid()
      )
    )
  );

-- View for easy querying of insights with document context
CREATE VIEW document_insights_expanded AS
SELECT 
  di.*,
  de.document_id,
  de.deal_id,
  de.document_type,
  de.summary as document_summary,
  dd.document_name,
  dd.file_type
FROM document_insights di
JOIN document_extractions de ON di.extraction_id = de.id
JOIN deal_documents dd ON de.document_id = dd.id;

-- Grant permissions
GRANT SELECT ON document_insights_expanded TO authenticated;