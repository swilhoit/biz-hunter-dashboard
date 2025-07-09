-- Add RLS policies for asins table to allow updates

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all ASINs" ON asins;
DROP POLICY IF EXISTS "Users can create ASINs" ON asins;
DROP POLICY IF EXISTS "Users can update ASINs" ON asins;
DROP POLICY IF EXISTS "System can insert history" ON asin_history;

-- Users can view all ASINs
CREATE POLICY "Users can view all ASINs" ON asins
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Users can create ASINs
CREATE POLICY "Users can create ASINs" ON asins
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update ASINs they have access to through deals
CREATE POLICY "Users can update ASINs" ON asins
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM deal_asins
    JOIN deals ON deals.id = deal_asins.deal_id
    WHERE deal_asins.asin_id = asins.id
    AND deals.user_id = auth.uid()
  )
);

-- Allow system to insert history records
CREATE POLICY "System can insert history" ON asin_history
FOR INSERT
WITH CHECK (true);