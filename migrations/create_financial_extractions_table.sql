-- Create financial_extractions table if it doesn't exist
CREATE TABLE IF NOT EXISTS financial_extractions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  document_id UUID REFERENCES deal_documents(id) ON DELETE SET NULL,
  extraction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  financial_data JSONB NOT NULL,
  validation_status JSONB DEFAULT '{"isValidated": false}'::jsonb,
  confidence_score FLOAT DEFAULT 0,
  extraction_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_financial_extractions_deal_id ON financial_extractions(deal_id);
CREATE INDEX IF NOT EXISTS idx_financial_extractions_document_id ON financial_extractions(document_id);
CREATE INDEX IF NOT EXISTS idx_financial_extractions_extraction_date ON financial_extractions(extraction_date DESC);

-- Enable RLS
ALTER TABLE financial_extractions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own financial extractions" ON financial_extractions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM deals 
      WHERE deals.id = financial_extractions.deal_id 
      AND deals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create financial extractions for their deals" ON financial_extractions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM deals 
      WHERE deals.id = financial_extractions.deal_id 
      AND deals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own financial extractions" ON financial_extractions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM deals 
      WHERE deals.id = financial_extractions.deal_id 
      AND deals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own financial extractions" ON financial_extractions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM deals 
      WHERE deals.id = financial_extractions.deal_id 
      AND deals.user_id = auth.uid()
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_financial_extractions_updated_at
  BEFORE UPDATE ON financial_extractions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();