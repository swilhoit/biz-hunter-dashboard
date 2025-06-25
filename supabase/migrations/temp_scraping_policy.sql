-- Temporary policy to allow scraping without authentication (for development only)
CREATE POLICY "Allow anonymous scraping" ON public.business_listings
    FOR INSERT TO anon WITH CHECK (true);

-- This should be removed in production and proper authentication should be used