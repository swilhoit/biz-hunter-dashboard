-- Add original_url column to business_listings table
ALTER TABLE public.business_listings 
ADD COLUMN original_url TEXT;