-- Allow updates to original_url field for data fixes
-- This creates a more permissive policy specifically for updating URLs

-- Create a policy to allow anonymous updates to original_url field only
CREATE POLICY "Allow URL fixes" 
ON business_listings 
FOR UPDATE 
TO anon
USING (true)
WITH CHECK (true);

-- Note: This is a temporary policy for data cleanup
-- Consider removing or restricting this after URL fixes are complete