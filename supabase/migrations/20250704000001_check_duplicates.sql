-- Check for duplicate URLs and show what will be cleaned up
SELECT 
  original_url,
  COUNT(*) as duplicate_count,
  MIN(created_at) as first_created,
  MAX(created_at) as last_created
FROM public.business_listings 
WHERE original_url IS NOT NULL
GROUP BY original_url
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 10;

-- Show total counts
SELECT 
  'Total listings' as metric,
  COUNT(*) as count
FROM public.business_listings
UNION ALL
SELECT 
  'Listings with URLs' as metric,
  COUNT(*) as count
FROM public.business_listings 
WHERE original_url IS NOT NULL
UNION ALL
SELECT 
  'Duplicate URLs' as metric,
  COUNT(*) as count
FROM (
  SELECT original_url
  FROM public.business_listings 
  WHERE original_url IS NOT NULL
  GROUP BY original_url
  HAVING COUNT(*) > 1
) duplicates
UNION ALL
SELECT 
  'Total duplicates to remove' as metric,
  COUNT(*) - COUNT(DISTINCT original_url) as count
FROM public.business_listings 
WHERE original_url IS NOT NULL; 