-- Fix financial_extractions table by adding missing columns

-- Add missing columns to financial_extractions if they don't exist
ALTER TABLE financial_extractions 
ADD COLUMN IF NOT EXISTS extraction_date TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE financial_extractions 
ADD COLUMN IF NOT EXISTS financial_data JSONB NOT NULL DEFAULT '{}';

ALTER TABLE financial_extractions 
ADD COLUMN IF NOT EXISTS confidence_scores JSONB NOT NULL DEFAULT '{}';

ALTER TABLE financial_extractions 
ADD COLUMN IF NOT EXISTS validation_status JSONB NOT NULL DEFAULT '{"isValidated": false}';

ALTER TABLE financial_extractions 
ADD COLUMN IF NOT EXISTS period_covered JSONB NOT NULL DEFAULT '{}';

ALTER TABLE financial_extractions 
ADD COLUMN IF NOT EXISTS document_type VARCHAR(50);

ALTER TABLE financial_extractions 
ADD COLUMN IF NOT EXISTS extracted_by UUID REFERENCES auth.users(id);

-- Now create the index that was failing
CREATE INDEX IF NOT EXISTS idx_financial_extractions_validation 
ON financial_extractions((validation_status->>'isValidated'));

-- Create the remaining tables from the original migration

-- 2. Create financial_history table for tracking financial metrics over time
CREATE TABLE IF NOT EXISTS financial_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL, -- annual, quarterly, monthly, ytd
    revenue DECIMAL(15,2),
    cogs DECIMAL(15,2),
    gross_profit DECIMAL(15,2),
    operating_expenses DECIMAL(15,2),
    ebitda DECIMAL(15,2),
    net_income DECIMAL(15,2),
    gross_margin DECIMAL(5,4),
    operating_margin DECIMAL(5,4),
    net_margin DECIMAL(5,4),
    extraction_id UUID REFERENCES financial_extractions(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(deal_id, period_start, period_end, period_type)
);

-- 3. Create document_extractions table (for general document intelligence)
CREATE TABLE IF NOT EXISTS document_extractions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES deal_documents(id) ON DELETE CASCADE,
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    extraction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    extraction_version VARCHAR(10) NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    raw_text TEXT,
    structured_data JSONB,
    key_entities JSONB,
    summary TEXT,
    document_type VARCHAR(50),
    confidence_score DECIMAL(3,2),
    language VARCHAR(10) DEFAULT 'en',
    embedding vector(1536), -- For semantic search
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(document_id)
);

-- 4. Create document_insights table
CREATE TABLE IF NOT EXISTS document_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    extraction_id UUID NOT NULL REFERENCES document_extractions(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL,
    insight_category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    value JSONB,
    confidence DECIMAL(3,2),
    source_page INTEGER,
    source_section VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Add financial tracking columns to deals table
ALTER TABLE deals ADD COLUMN IF NOT EXISTS financial_last_updated TIMESTAMPTZ;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS gross_margin DECIMAL(5,4);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS operating_margin DECIMAL(5,4);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS net_margin DECIMAL(5,4);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_financial_extractions_deal_id ON financial_extractions(deal_id);
CREATE INDEX IF NOT EXISTS idx_financial_extractions_document_id ON financial_extractions(document_id);
CREATE INDEX IF NOT EXISTS idx_financial_history_deal_id ON financial_history(deal_id);
CREATE INDEX IF NOT EXISTS idx_financial_history_period ON financial_history(deal_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_document_extractions_deal_id ON document_extractions(deal_id);
CREATE INDEX IF NOT EXISTS idx_document_extractions_document_id ON document_extractions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_insights_extraction_id ON document_insights(extraction_id);
CREATE INDEX IF NOT EXISTS idx_document_insights_type_category ON document_insights(insight_type, insight_category);

-- 7. Create views for easy access to latest financials
CREATE OR REPLACE VIEW latest_financial_extractions AS
SELECT DISTINCT ON (deal_id) 
    fe.*,
    dd.file_name,
    dd.uploaded_at as document_uploaded_at
FROM financial_extractions fe
JOIN deal_documents dd ON fe.document_id = dd.id
ORDER BY deal_id, fe.extraction_date DESC;

-- 8. Enable RLS
ALTER TABLE financial_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_insights ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies
-- Financial extractions policies
CREATE POLICY "Users can view financial extractions for their deals" ON financial_extractions
    FOR SELECT USING (
        deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can create financial extractions for their deals" ON financial_extractions
    FOR INSERT WITH CHECK (
        deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update financial extractions for their deals" ON financial_extractions
    FOR UPDATE USING (
        deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete financial extractions for their deals" ON financial_extractions
    FOR DELETE USING (
        deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid())
    );

-- Financial history policies
CREATE POLICY "Users can view financial history for their deals" ON financial_history
    FOR SELECT USING (
        deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can manage financial history for their deals" ON financial_history
    FOR ALL USING (
        deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid())
    );

-- Document extractions policies
CREATE POLICY "Users can view document extractions for their deals" ON document_extractions
    FOR SELECT USING (
        deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can manage document extractions for their deals" ON document_extractions
    FOR ALL USING (
        deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid())
    );

-- Document insights policies
CREATE POLICY "Users can view document insights for their deals" ON document_insights
    FOR SELECT USING (
        extraction_id IN (
            SELECT id FROM document_extractions 
            WHERE deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can manage document insights for their deals" ON document_insights
    FOR ALL USING (
        extraction_id IN (
            SELECT id FROM document_extractions 
            WHERE deal_id IN (SELECT id FROM deals WHERE user_id = auth.uid())
        )
    );