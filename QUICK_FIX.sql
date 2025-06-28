-- QUICK FIX: Enable public access to business listings
-- Run this in Supabase SQL Editor

-- Step 1: Drop ALL existing policies
DROP POLICY IF EXISTS "Anyone can view active listings" ON business_listings;
DROP POLICY IF EXISTS "Authenticated users can create listings" ON business_listings;
DROP POLICY IF EXISTS "Users can update their own listings" ON business_listings;

-- Step 2: Create simple, permissive policies
CREATE POLICY "Allow all reads" ON business_listings FOR SELECT USING (true);
CREATE POLICY "Allow all inserts" ON business_listings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all deletes" ON business_listings FOR DELETE USING (true);
CREATE POLICY "Allow all updates" ON business_listings FOR UPDATE USING (true);

-- Verify it worked
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'business_listings';