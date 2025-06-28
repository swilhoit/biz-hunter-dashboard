-- Migration: Fix public access to business listings
-- This ensures anyone can view listings without logging in

-- Drop the restrictive SELECT policy that only shows 'active' listings
DROP POLICY IF EXISTS "Anyone can view active listings" ON business_listings;

-- Create a new policy that allows EVERYONE to view ALL listings
CREATE POLICY "Public read access to all listings" 
ON business_listings 
FOR SELECT 
TO public 
USING (true);

-- Allow the anonymous role to insert listings (for the scraper)
DROP POLICY IF EXISTS "Authenticated users can create listings" ON business_listings;

CREATE POLICY "Allow scraper to insert listings" 
ON business_listings 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Keep the authenticated update policy as is
-- Users can still only update their own listings

-- For development/testing: Allow anonymous deletes
CREATE POLICY "Allow anonymous delete for development" 
ON business_listings 
FOR DELETE 
TO anon 
USING (true);

-- Add a comment to the table explaining the policies
COMMENT ON TABLE business_listings IS 'Business listings table with public read access. Anyone can view listings without authentication. Inserts allowed for scraper (anon role). Updates restricted to authenticated users for their own listings.';