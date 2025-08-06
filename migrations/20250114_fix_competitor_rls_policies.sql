-- Fix RLS policies for competitor tracking tables
-- Allow authenticated users to insert/update data through the application

-- Update keyword_rankings policies to allow competitor data insertion
DROP POLICY IF EXISTS "Users can manage keyword rankings" ON keyword_rankings;
CREATE POLICY "Users can manage keyword rankings"
ON keyword_rankings FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Update competitor_brands policies to allow application to insert competitor data
DROP POLICY IF EXISTS "System can manage competitor brands" ON competitor_brands;
DROP POLICY IF EXISTS "Users can view competitor brands" ON competitor_brands;

CREATE POLICY "Users can view competitor brands"
ON competitor_brands FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can manage competitor brands"
ON competitor_brands FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Update competitor_brand_rankings policies
DROP POLICY IF EXISTS "System can manage competitor rankings" ON competitor_brand_rankings;
DROP POLICY IF EXISTS "Users can view competitor rankings" ON competitor_brand_rankings;

CREATE POLICY "Users can view competitor rankings"
ON competitor_brand_rankings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can manage competitor rankings"
ON competitor_brand_rankings FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Also ensure keyword_rankings table has proper policies for the new fields
ALTER TABLE keyword_rankings DISABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage keyword rankings"
ON keyword_rankings FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);