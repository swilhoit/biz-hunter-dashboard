-- Create ASIN history table to track product metrics over time
CREATE TABLE IF NOT EXISTS asin_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asin_id UUID REFERENCES asins(id) ON DELETE CASCADE,
    
    -- Price and rank data
    price DECIMAL(10,2),
    current_bsr INTEGER,
    
    -- Sales estimates
    monthly_revenue DECIMAL(12,2),
    monthly_units INTEGER,
    
    -- Additional metrics
    review_count INTEGER,
    review_rating DECIMAL(3,2),
    
    -- Timestamp
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_asin_history_asin_id ON asin_history(asin_id);
CREATE INDEX idx_asin_history_recorded_at ON asin_history(recorded_at);

-- Enable RLS
ALTER TABLE asin_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - users can view history for ASINs they have access to
CREATE POLICY "Users can view ASIN history" ON asin_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM asins
    WHERE asins.id = asin_history.asin_id
    -- ASINs are viewable by all authenticated users for now
    AND auth.uid() IS NOT NULL
  )
);

-- Create a function to record ASIN history
CREATE OR REPLACE FUNCTION record_asin_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Only record if values have changed significantly
  IF (OLD.current_price IS DISTINCT FROM NEW.current_price) OR
     (OLD.current_bsr IS DISTINCT FROM NEW.current_bsr) OR
     (OLD.monthly_revenue IS DISTINCT FROM NEW.monthly_revenue) OR
     (OLD.monthly_units IS DISTINCT FROM NEW.monthly_units) OR
     (OLD.review_count IS DISTINCT FROM NEW.review_count) OR
     (OLD.review_rating IS DISTINCT FROM NEW.review_rating) THEN
    
    -- Check if we already have a record for today
    INSERT INTO asin_history (
      asin_id,
      price,
      current_bsr,
      monthly_revenue,
      monthly_units,
      review_count,
      review_rating
    ) 
    SELECT
      NEW.id,
      NEW.current_price,
      NEW.current_bsr,
      NEW.monthly_revenue,
      NEW.monthly_units,
      NEW.review_count,
      NEW.review_rating
    WHERE NOT EXISTS (
      SELECT 1 FROM asin_history 
      WHERE asin_id = NEW.id 
      AND DATE(recorded_at) = CURRENT_DATE
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically record history on ASIN updates
CREATE TRIGGER record_asin_history_trigger
AFTER UPDATE ON asins
FOR EACH ROW
EXECUTE FUNCTION record_asin_history();