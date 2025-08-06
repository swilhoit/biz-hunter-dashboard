-- Add DELETE policy for asin_keywords table
-- This allows users to delete keywords for ASINs they own through their deals

CREATE POLICY "Users can delete keywords for their ASINs" 
ON asin_keywords 
FOR DELETE 
TO public 
USING (
  EXISTS (
    SELECT 1 
    FROM deal_asins 
    JOIN deals ON deals.id = deal_asins.deal_id 
    WHERE deal_asins.asin_id = asin_keywords.asin_id 
    AND deals.user_id = auth.uid()
  )
);