-- Migration: Fix public access to business listings
-- This ensures anyone can view listings without logging in

BEGIN;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can view active listings" ON business_listings;
DROP POLICY IF EXISTS "Authenticated users can create listings" ON business_listings;
DROP POLICY IF EXISTS "Users can update their own listings" ON business_listings;

-- Create new policies for public access

-- 1. Allow anyone to view ALL listings (not just active ones)
CREATE POLICY "Public read access" 
ON business_listings 
FOR SELECT 
USING (true);

-- 2. Allow anonymous role to insert (for scraper)
CREATE POLICY "Anonymous insert access" 
ON business_listings 
FOR INSERT 
WITH CHECK (true);

-- 3. Allow anonymous role to delete (for admin functions)
CREATE POLICY "Anonymous delete access" 
ON business_listings 
FOR DELETE 
USING (true);

-- 4. Keep authenticated users able to update their own listings
CREATE POLICY "Authenticated update own listings" 
ON business_listings 
FOR UPDATE 
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

COMMIT;

-- Verify the new policies are in place
SELECT 
    policyname, 
    cmd, 
    roles, 
    CASE 
        WHEN qual = 'true' THEN 'Allow all'
        WHEN qual IS NULL THEN 'No restriction'
        ELSE qual
    END as access_rule
FROM pg_policies 
WHERE tablename = 'business_listings' 
ORDER BY cmd, policyname;