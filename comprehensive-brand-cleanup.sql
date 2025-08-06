-- Comprehensive brand cleanup script
-- Run this in your Supabase SQL editor to fix the brand name mess

-- First, let's see what we're dealing with
-- SELECT detected_brand, COUNT(*) as count 
-- FROM keyword_rankings 
-- WHERE detected_brand IS NOT NULL 
-- GROUP BY detected_brand 
-- ORDER BY count DESC 
-- LIMIT 50;

-- Step 1: Clean up obvious product descriptions and set them to NULL
UPDATE keyword_rankings 
SET detected_brand = NULL
WHERE detected_brand IS NOT NULL 
AND (
  -- Product descriptions with numbers and descriptive words
  detected_brand ~ '^\d+' OR  -- Starts with numbers
  detected_brand ~ '\d+\s*(pack|count|piece|pcs|oz|ml|fl\.oz|inch|"|pack)' OR
  
  -- Generic product terms
  detected_brand ILIKE '%scented candle%' OR
  detected_brand ILIKE '%candles gift%' OR
  detected_brand ILIKE '%pack candles%' OR
  detected_brand ILIKE '%jar candle%' OR
  detected_brand ILIKE '%pillar candle%' OR
  detected_brand ILIKE '%tea light%' OR
  detected_brand ILIKE '%aromatherapy%' OR
  detected_brand ILIKE '%home scented%' OR
  detected_brand ILIKE '%hour burn%' OR
  detected_brand ILIKE '%wick candle%' OR
  
  -- Size/quantity descriptors that aren't brand names
  detected_brand ILIKE 'large %' OR
  detected_brand ILIKE 'small %' OR
  detected_brand ILIKE 'extra %' OR
  detected_brand ILIKE 'mini %' OR
  detected_brand ILIKE 'jumbo %' OR
  
  -- Obviously not brand names
  detected_brand = 'Candle' OR
  detected_brand = 'Candles' OR
  detected_brand = 'Scented Candles' OR
  
  -- Too long to be a brand name
  LENGTH(detected_brand) > 50 OR
  
  -- Contains obvious product description words
  detected_brand ILIKE '%with essential%' OR
  detected_brand ILIKE '%natural soy%' OR
  detected_brand ILIKE '%battery operated%' OR
  detected_brand ILIKE '%led candle%' OR
  detected_brand ILIKE '%real wax%' OR
  detected_brand ILIKE '%flameless%'
);

-- Step 2: Extract actual brand names from mixed product descriptions
UPDATE keyword_rankings 
SET detected_brand = CASE
  -- Extract known brand names from longer descriptions
  WHEN detected_brand ILIKE '%salt & stone%' THEN 'SALT & STONE'
  WHEN detected_brand ILIKE '%la jolie muse%' THEN 'LA JOLIE MUSE'
  WHEN detected_brand ILIKE '%yankee candle%' THEN 'Yankee Candle'
  WHEN detected_brand ILIKE '%bath & body works%' THEN 'Bath & Body Works'
  WHEN detected_brand ILIKE '%stonebriar%' THEN 'Stonebriar'
  WHEN detected_brand ILIKE '%mozeal%' THEN 'MOZEAL'
  WHEN detected_brand ILIKE '%aoovoo%' THEN 'AOOVOO'
  WHEN detected_brand ILIKE '%lulu candles%' THEN 'Lulu Candles'
  WHEN detected_brand ILIKE '%96north%' THEN '96NORTH'
  WHEN detected_brand ILIKE '%vinkor%' THEN 'Vinkor'
  WHEN detected_brand ILIKE '%bask%' THEN 'Bask'
  WHEN detected_brand ILIKE '%woodwick%' THEN 'WoodWick'
  WHEN detected_brand ILIKE '%glade%' THEN 'Glade'
  WHEN detected_brand ILIKE '%febreze%' THEN 'Febreze'
  WHEN detected_brand ILIKE '%village candle%' THEN 'Village Candle'
  WHEN detected_brand ILIKE '%chesapeake bay%' THEN 'Chesapeake Bay Candle'
  WHEN detected_brand ILIKE '%paddywax%' THEN 'Paddywax'
  WHEN detected_brand ILIKE '%anthropologie%' THEN 'Anthropologie'
  WHEN detected_brand ILIKE '%diptyque%' THEN 'Diptyque'
  WHEN detected_brand ILIKE '%voluspa%' THEN 'Voluspa'
  WHEN detected_brand ILIKE '%nest%' THEN 'NEST Fragrances'
  WHEN detected_brand ILIKE '%jo malone%' THEN 'Jo Malone'
  WHEN detected_brand ILIKE '%capri blue%' THEN 'Capri Blue'
  WHEN detected_brand ILIKE '%boy smells%' THEN 'Boy Smells'
  WHEN detected_brand ILIKE '%mad et len%' THEN 'Mad et Len'
  WHEN detected_brand ILIKE '%le labo%' THEN 'Le Labo'
  WHEN detected_brand ILIKE '%malin%' THEN 'Malin+Goetz'
  WHEN detected_brand ILIKE '%goetz%' THEN 'Malin+Goetz'
  
  ELSE detected_brand
END
WHERE detected_brand IS NOT NULL;

-- Step 3: Final cleanup - remove any remaining invalid entries
UPDATE keyword_rankings 
SET detected_brand = NULL
WHERE detected_brand IS NOT NULL 
AND (
  detected_brand ~ '^[0-9]+$' OR  -- Pure numbers
  detected_brand = '' OR          -- Empty strings
  LENGTH(detected_brand) < 2      -- Too short
);

-- Report the cleanup results
SELECT 
  'BEFORE CLEANUP' as phase,
  COUNT(*) as total_rankings,
  COUNT(detected_brand) as with_brand,
  COUNT(DISTINCT detected_brand) as unique_brands
FROM keyword_rankings
WHERE created_at < NOW()
UNION ALL
SELECT 
  'AFTER CLEANUP' as phase,
  COUNT(*) as total_rankings,
  COUNT(detected_brand) as with_brand,
  COUNT(DISTINCT detected_brand) as unique_brands
FROM keyword_rankings;