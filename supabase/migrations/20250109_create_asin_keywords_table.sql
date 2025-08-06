-- Create table to store keywords associated with ASINs
CREATE TABLE IF NOT EXISTS asin_keywords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asin_id UUID REFERENCES asins(id) ON DELETE CASCADE,
    
    -- Keyword data
    keyword TEXT NOT NULL,
    search_volume INTEGER DEFAULT 0,
    relevancy_score DECIMAL(5,2) DEFAULT 0,
    monthly_trend DECIMAL(10,2) DEFAULT 0,
    quarterly_trend DECIMAL(10,2) DEFAULT 0,
    
    -- PPC data
    ppc_bid_broad DECIMAL(10,2) DEFAULT 0,
    ppc_bid_exact DECIMAL(10,2) DEFAULT 0,
    
    -- Competition data
    organic_product_count INTEGER DEFAULT 0,
    sponsored_product_count INTEGER DEFAULT 0,
    
    -- Ranking data (if available)
    rank_organic INTEGER,
    rank_sponsored INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate keywords per ASIN
    CONSTRAINT unique_asin_keyword UNIQUE (asin_id, keyword)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_asin_keywords_asin_id ON asin_keywords(asin_id);
CREATE INDEX IF NOT EXISTS idx_asin_keywords_search_volume ON asin_keywords(search_volume DESC);
CREATE INDEX IF NOT EXISTS idx_asin_keywords_keyword ON asin_keywords(keyword);

-- Enable RLS
ALTER TABLE asin_keywords ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view keywords for accessible ASINs" ON asin_keywords;
DROP POLICY IF EXISTS "Users can insert keywords for their ASINs" ON asin_keywords;
DROP POLICY IF EXISTS "Users can update keywords for their ASINs" ON asin_keywords;

-- Users can view keywords for ASINs they have access to
CREATE POLICY "Users can view keywords for accessible ASINs" ON asin_keywords
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM asins
    WHERE asins.id = asin_keywords.asin_id
    AND auth.uid() IS NOT NULL
  )
);

-- Users can insert keywords for ASINs they own through deals
CREATE POLICY "Users can insert keywords for their ASINs" ON asin_keywords
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM deal_asins
    JOIN deals ON deals.id = deal_asins.deal_id
    WHERE deal_asins.asin_id = asin_keywords.asin_id
    AND deals.user_id = auth.uid()
  )
);

-- Users can update keywords for ASINs they own through deals
CREATE POLICY "Users can update keywords for their ASINs" ON asin_keywords
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM deal_asins
    JOIN deals ON deals.id = deal_asins.deal_id
    WHERE deal_asins.asin_id = asin_keywords.asin_id
    AND deals.user_id = auth.uid()
  )
);