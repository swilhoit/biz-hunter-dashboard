-- Quick cleanup of the worst offenders
UPDATE keyword_rankings 
SET detected_brand = CASE
  WHEN detected_brand ILIKE '%salt & stone%' THEN 'SALT & STONE'
  WHEN detected_brand ILIKE '%stonebriar%' THEN 'Stonebriar'
  WHEN detected_brand ILIKE '%mozeal%' THEN 'MOZEAL'
  WHEN detected_brand ILIKE '%aoovoo%' THEN 'AOOVOO'
  WHEN detected_brand ILIKE '%lulu candles%' THEN 'Lulu Candles'
  WHEN detected_brand ILIKE '%96north%' THEN '96NORTH'
  WHEN detected_brand ILIKE '%woodwick%' THEN 'WoodWick'
  WHEN detected_brand ILIKE '%yankee candle%' THEN 'Yankee Candle'
  WHEN detected_brand ~ '^[0-9]+' THEN NULL
  WHEN detected_brand ILIKE '%scented candle%' THEN NULL
  WHEN detected_brand ILIKE '%pack candle%' THEN NULL
  WHEN detected_brand ILIKE '%hour burn%' THEN NULL
  WHEN detected_brand ILIKE '%jar candle%' THEN NULL
  WHEN detected_brand = 'Candle' THEN NULL
  WHEN detected_brand = 'Candles' THEN NULL
  WHEN LENGTH(detected_brand) > 50 THEN NULL
  ELSE detected_brand
END
WHERE detected_brand IS NOT NULL;