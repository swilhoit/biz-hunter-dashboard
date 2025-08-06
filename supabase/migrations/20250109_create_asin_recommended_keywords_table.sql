-- Create table for storing AI-recommended keywords at the ASIN level
CREATE TABLE IF NOT EXISTS asin_recommended_keywords (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    asin_id UUID NOT NULL REFERENCES asins(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    search_intent TEXT CHECK (search_intent IN ('informational', 'commercial', 'navigational', 'transactional')),
    estimated_competition TEXT CHECK (estimated_competition IN ('low', 'medium', 'high')),
    relevance_reason TEXT,
    relevance_score INTEGER DEFAULT 0 CHECK (relevance_score >= 0 AND relevance_score <= 100),
    -- JungleScout metrics
    search_volume INTEGER DEFAULT 0,
    monthly_trend DECIMAL(5,2) DEFAULT 0,
    quarterly_trend DECIMAL(5,2) DEFAULT 0,
    ppc_bid_broad DECIMAL(10,2) DEFAULT 0,
    ppc_bid_exact DECIMAL(10,2) DEFAULT 0,
    organic_product_count INTEGER DEFAULT 0,
    sponsored_product_count INTEGER DEFAULT 0,
    junglescout_updated_at TIMESTAMP WITH TIME ZONE,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_asin_recommended_keywords_asin_id ON asin_recommended_keywords(asin_id);
CREATE INDEX idx_asin_recommended_keywords_keyword ON asin_recommended_keywords(keyword);
CREATE INDEX idx_asin_recommended_keywords_generated_at ON asin_recommended_keywords(generated_at DESC);

-- Create a unique constraint to prevent duplicate keywords for the same ASIN
CREATE UNIQUE INDEX idx_asin_recommended_keywords_unique ON asin_recommended_keywords(asin_id, keyword);

-- Enable RLS
ALTER TABLE asin_recommended_keywords ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow authenticated users to read all recommended keywords
CREATE POLICY "Users can view recommended keywords" ON asin_recommended_keywords
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to insert recommended keywords
CREATE POLICY "Users can insert recommended keywords" ON asin_recommended_keywords
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update their own recommended keywords
CREATE POLICY "Users can update recommended keywords" ON asin_recommended_keywords
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete recommended keywords
CREATE POLICY "Users can delete recommended keywords" ON asin_recommended_keywords
    FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_asin_recommended_keywords_updated_at
    BEFORE UPDATE ON asin_recommended_keywords
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment on table
COMMENT ON TABLE asin_recommended_keywords IS 'Stores AI-generated keyword recommendations for individual ASINs';