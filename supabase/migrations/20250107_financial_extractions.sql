-- Financial Document Extractions System
-- This migration creates tables for storing AI-extracted financial data from documents

-- 1. Create financial_extractions table
CREATE TABLE IF NOT EXISTS financial_extractions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES deal_documents(id) ON DELETE CASCADE,
    extraction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    financial_data JSONB NOT NULL,
    period_covered JSONB NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    confidence_scores JSONB NOT NULL,
    validation_status JSONB NOT NULL DEFAULT '{"isValidated": false}',
    extracted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(document_id)
);

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
CREATE INDEX IF NOT EXISTS idx_financial_extractions_validation ON financial_extractions((validation_status->>'isValidated'));
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
WHERE (fe.validation_status->>'isValidated')::boolean = true
ORDER BY deal_id, fe.extraction_date DESC;

CREATE OR REPLACE VIEW deal_financial_summary AS
SELECT 
    d.id as deal_id,
    d.business_name,
    d.annual_revenue,
    d.annual_profit,
    d.ebitda,
    d.gross_margin,
    d.operating_margin,
    d.net_margin,
    d.financial_last_updated,
    lfe.financial_data,
    lfe.period_covered,
    lfe.confidence_scores,
    COUNT(DISTINCT fh.id) as historical_periods,
    MIN(fh.period_start) as earliest_period,
    MAX(fh.period_end) as latest_period
FROM deals d
LEFT JOIN latest_financial_extractions lfe ON d.id = lfe.deal_id
LEFT JOIN financial_history fh ON d.id = fh.deal_id
GROUP BY d.id, lfe.financial_data, lfe.period_covered, lfe.confidence_scores;

-- 8. Enable RLS
ALTER TABLE financial_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_insights ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies
-- Financial extractions policies
CREATE POLICY "Users can view financial extractions for their deals" ON financial_extractions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM deals 
            WHERE deals.id = financial_extractions.deal_id 
            AND deals.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create financial extractions for their deals" ON financial_extractions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM deals 
            WHERE deals.id = financial_extractions.deal_id 
            AND deals.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their financial extractions" ON financial_extractions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM deals 
            WHERE deals.id = financial_extractions.deal_id 
            AND deals.user_id = auth.uid()
        )
    );

-- Financial history policies
CREATE POLICY "Users can view financial history for their deals" ON financial_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM deals 
            WHERE deals.id = financial_history.deal_id 
            AND deals.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage financial history for their deals" ON financial_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM deals 
            WHERE deals.id = financial_history.deal_id 
            AND deals.user_id = auth.uid()
        )
    );

-- Document extractions policies
CREATE POLICY "Users can view document extractions for their deals" ON document_extractions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM deals 
            WHERE deals.id = document_extractions.deal_id 
            AND deals.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create document extractions for their deals" ON document_extractions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM deals 
            WHERE deals.id = document_extractions.deal_id 
            AND deals.user_id = auth.uid()
        )
    );

-- Document insights policies
CREATE POLICY "Users can view document insights for their deals" ON document_insights
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM document_extractions de
            JOIN deals d ON de.deal_id = d.id
            WHERE de.id = document_insights.extraction_id 
            AND d.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create document insights for their deals" ON document_insights
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM document_extractions de
            JOIN deals d ON de.deal_id = d.id
            WHERE de.id = document_insights.extraction_id 
            AND d.user_id = auth.uid()
        )
    );

-- 10. Create functions for financial metrics calculations
CREATE OR REPLACE FUNCTION calculate_financial_trends(p_deal_id UUID)
RETURNS TABLE (
    metric VARCHAR,
    current_value DECIMAL,
    previous_value DECIMAL,
    change_percent DECIMAL,
    trend VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    WITH latest_periods AS (
        SELECT *,
               ROW_NUMBER() OVER (ORDER BY period_end DESC) as rn
        FROM financial_history
        WHERE deal_id = p_deal_id
        LIMIT 2
    )
    SELECT 
        m.metric,
        m.current_value,
        m.previous_value,
        CASE 
            WHEN m.previous_value = 0 OR m.previous_value IS NULL THEN NULL
            ELSE ((m.current_value - m.previous_value) / m.previous_value) * 100
        END as change_percent,
        CASE 
            WHEN m.current_value > m.previous_value THEN 'up'
            WHEN m.current_value < m.previous_value THEN 'down'
            ELSE 'stable'
        END as trend
    FROM (
        SELECT 
            'revenue' as metric,
            (SELECT revenue FROM latest_periods WHERE rn = 1) as current_value,
            (SELECT revenue FROM latest_periods WHERE rn = 2) as previous_value
        UNION ALL
        SELECT 
            'profit',
            (SELECT net_income FROM latest_periods WHERE rn = 1),
            (SELECT net_income FROM latest_periods WHERE rn = 2)
        UNION ALL
        SELECT 
            'ebitda',
            (SELECT ebitda FROM latest_periods WHERE rn = 1),
            (SELECT ebitda FROM latest_periods WHERE rn = 2)
    ) m;
END;
$$ LANGUAGE plpgsql;

-- 11. Grant permissions
GRANT ALL ON financial_extractions TO authenticated;
GRANT ALL ON financial_history TO authenticated;
GRANT ALL ON document_extractions TO authenticated;
GRANT ALL ON document_insights TO authenticated;
GRANT SELECT ON latest_financial_extractions TO authenticated;
GRANT SELECT ON deal_financial_summary TO authenticated;