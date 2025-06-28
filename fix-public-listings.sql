-- Fix RLS policies to make listings publicly viewable
-- This allows anyone to view listings without authentication

-- First, let's see current policies
SELECT policyname, cmd, roles, qual FROM pg_policies WHERE tablename = 'business_listings';

-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "Anyone can view active listings" ON business_listings;

-- Create a new policy that allows anyone to view ALL listings (not just active ones)
CREATE POLICY "Anyone can view all listings" ON business_listings
    FOR SELECT 
    TO public 
    USING (true);

-- Also create a policy to allow anonymous inserts from the scraper
-- This is temporary for testing - you may want to use a service role key in production
CREATE POLICY "Allow anonymous inserts for scraping" ON business_listings
    FOR INSERT 
    TO anon
    WITH CHECK (true);

-- Verify the new policies
SELECT policyname, cmd, roles, qual, with_check FROM pg_policies WHERE tablename = 'business_listings';

-- Optional: If you want to allow clearing data without authentication
CREATE POLICY "Allow anonymous deletes for testing" ON business_listings
    FOR DELETE
    TO anon
    USING (true);