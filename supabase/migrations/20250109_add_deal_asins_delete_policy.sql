-- Add delete policy for deal_asins table
-- Allow users to delete ASINs from their own deals

DROP POLICY IF EXISTS "Users can delete ASINs from their deals" ON deal_asins;

CREATE POLICY "Users can delete ASINs from their deals" ON deal_asins
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM deals
    WHERE deals.id = deal_asins.deal_id
    AND deals.user_id = auth.uid()
  )
);