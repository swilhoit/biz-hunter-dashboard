-- Create RLS policies for deal_asins table
-- This allows users to manage ASINs for their own deals

-- Users can view ASINs for their own deals
CREATE POLICY "Users can view ASINs for their deals" ON deal_asins
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM deals
    WHERE deals.id = deal_asins.deal_id
    AND deals.user_id = auth.uid()
  )
);

-- Users can add ASINs to their own deals
CREATE POLICY "Users can add ASINs to their deals" ON deal_asins
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM deals
    WHERE deals.id = deal_asins.deal_id
    AND deals.user_id = auth.uid()
  )
);

-- Users can update ASINs for their own deals
CREATE POLICY "Users can update ASINs for their deals" ON deal_asins
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM deals
    WHERE deals.id = deal_asins.deal_id
    AND deals.user_id = auth.uid()
  )
);

-- Users can delete ASINs from their own deals
CREATE POLICY "Users can delete ASINs from their deals" ON deal_asins
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM deals
    WHERE deals.id = deal_asins.deal_id
    AND deals.user_id = auth.uid()
  )
);

-- Also need RLS policies for the asins table if not already present
-- Check if policies exist first
DO $$
BEGIN
  -- Check if any policies exist for asins table
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'asins'
  ) THEN
    -- Create policies for asins table
    CREATE POLICY "Users can view all ASINs" ON asins
    FOR SELECT
    USING (true);

    CREATE POLICY "Users can create ASINs" ON asins
    FOR INSERT
    WITH CHECK (true);

    CREATE POLICY "Users can update ASINs" ON asins
    FOR UPDATE
    USING (true);
  END IF;
END $$;