ALTER TABLE public.business_listings
DROP CONSTRAINT IF EXISTS unique_business_listing;

ALTER TABLE public.business_listings
ADD CONSTRAINT business_listings_original_url_key UNIQUE (original_url); 