-- First, remove existing duplicates by keeping only the most recent entry for each URL
WITH duplicates AS (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY original_url ORDER BY created_at DESC, id DESC) as row_num
  FROM public.business_listings 
  WHERE original_url IS NOT NULL
)
DELETE FROM public.business_listings 
WHERE id IN (
  SELECT id FROM duplicates WHERE row_num > 1
);

-- Drop the old composite constraint
ALTER TABLE public.business_listings
DROP CONSTRAINT IF EXISTS unique_business_listing;

-- Add the new unique constraint on original_url
ALTER TABLE public.business_listings
ADD CONSTRAINT business_listings_original_url_key UNIQUE (original_url); 