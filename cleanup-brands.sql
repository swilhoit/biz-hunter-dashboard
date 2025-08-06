-- Script to clean up bad brand names in keyword_rankings table
-- Run this in your Supabase SQL editor

-- Clean up the obviously bad brand names and extract actual brands
UPDATE keyword_rankings 
SET detected_brand = CASE
  -- Extract actual brand names from common patterns
  WHEN detected_brand = 'SALT & STONE Scented Candle for Women & Men | Hand' THEN 'SALT & STONE'
  WHEN detected_brand = 'LA JOLIE MUSE Sandalwood Rose Candle' THEN 'LA JOLIE MUSE'
  WHEN detected_brand = 'AOOVOO Coconut Vanilla Candles' THEN 'AOOVOO'
  WHEN detected_brand LIKE 'MOZEAL%' THEN 'MOZEAL'
  WHEN detected_brand = 'Lulu Candles | Jasmine' THEN 'Lulu Candles'
  WHEN detected_brand LIKE 'Stonebriar%' THEN 'Stonebriar'
  WHEN detected_brand = '96NORTH Luxury Vanilla' THEN '96NORTH'
  
  -- Clean up generic product descriptions
  WHEN detected_brand IN (
    'Citronella Candles Outdoor',
    'Scented Candles Gift Set',
    'Scented Candles',
    '4 Pack Candles for Home Scented',
    '6 Pack Candles for Home Scented',
    '6 Pack Candles',
    '6 Pack Natural Beeswax Pillar Candles',
    'Organic Lavender Candles',
    '6 Pack Candles for Home Scented Aromatherapy Candles Gifts Set for Women',
    'Large Jar Scented Candle with up to 150 Hour Burn Time',
    'Candle'
  ) THEN NULL
  
  -- Remove numeric-only brands and obvious product descriptions
  WHEN detected_brand ~ '^[0-9]+$' THEN NULL
  WHEN LENGTH(detected_brand) > 50 THEN NULL
  WHEN detected_brand ILIKE '%pack%' AND detected_brand ILIKE '%candle%' THEN NULL
  WHEN detected_brand ILIKE '%scented%' AND detected_brand ILIKE '%candle%' AND detected_brand NOT ILIKE 'salt%' THEN NULL
  
  ELSE detected_brand
END
WHERE detected_brand IS NOT NULL;

-- Refresh any dependent views (remove this line if the view doesn't exist)
-- REFRESH MATERIALIZED VIEW competitor_market_share_analysis;