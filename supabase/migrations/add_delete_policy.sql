-- Add DELETE policy for business_listings table
-- This allows authenticated users to delete listings (temporary for development)

CREATE POLICY "Allow authenticated users to delete listings" ON public.business_listings
    FOR DELETE TO authenticated USING (true);

-- Also allow anonymous deletion for development/scraping cleanup
CREATE POLICY "Allow anonymous deletion for development" ON public.business_listings
    FOR DELETE TO anon USING (true);