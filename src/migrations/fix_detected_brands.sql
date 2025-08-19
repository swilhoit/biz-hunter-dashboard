-- Migration to fix detected_brand values that are actually product descriptions
-- This will clean up the keyword_rankings table to have proper brand names

-- First, let's create a temporary mapping table for known good brands
CREATE TEMP TABLE brand_mappings (
  bad_brand TEXT,
  good_brand TEXT
);

-- Insert some common mappings based on patterns
INSERT INTO brand_mappings (bad_brand, good_brand) VALUES
-- Numbers and single characters
('1', NULL),
('12', NULL),
('100', NULL),
('3', NULL),
('10', NULL),
-- Generic product descriptions that should be NULL
('Candle', NULL),
('Scented Candles', NULL),
('Scented Candles Gift Set', NULL),
('Scented Candles for Home', NULL),
('Citronella Candles Outdoor', NULL),
('6 Pack Candles', NULL),
('4 Pack Candles for Home Scented', NULL),
-- Known actual brands (keep these)
('Mister Candle', 'Mister Candle'),
('A Cheerful Giver', 'A Cheerful Giver'),
('Yankee Candle', 'Yankee Candle'),
('Bath & Body Works', 'Bath & Body Works'),
('Paddywax', 'Paddywax'),
('Voluspa', 'Voluspa'),
('Nest Fragrances', 'Nest Fragrances'),
('Diptyque', 'Diptyque'),
('Jo Malone', 'Jo Malone'),
('Capri Blue', 'Capri Blue');

-- Update keyword_rankings to fix obvious product descriptions
UPDATE keyword_rankings kr
SET detected_brand = CASE
  -- If it starts with a number followed by product keywords, it's not a brand
  WHEN detected_brand ~ '^[0-9]+\s+(Pack|Count|Pcs|Pieces|oz|ml|inch)' THEN NULL
  -- If it contains obvious product descriptors at the start
  WHEN detected_brand ~ '^(Scented|Unscented|Large|Small|Medium|Natural|Luxury|Premium)\s+Candle' THEN NULL
  -- If it's just a number
  WHEN detected_brand ~ '^[0-9]+$' THEN NULL
  -- If it's too long (> 50 chars), it's probably a product description
  WHEN LENGTH(detected_brand) > 50 THEN NULL
  -- If it contains size measurements
  WHEN detected_brand ~ '\d+\s*["\''x×]' THEN NULL
  -- Keep brands that look legitimate (start with capital letter, reasonable length)
  WHEN detected_brand ~ '^[A-Z][A-Za-z0-9\s&\.\-]{1,30}$' 
       AND detected_brand !~ '(Candle|Pack|Set|Gift|Count|Pieces)' THEN detected_brand
  ELSE NULL
END
WHERE detected_brand IS NOT NULL
  AND (
    -- Product descriptions patterns
    detected_brand ~ '^[0-9]+\s+' OR
    detected_brand ~ '(Pack|Count|Pcs|Pieces|oz|ml|inch|Candle)' OR
    detected_brand ~ '^(Scented|Unscented|Large|Small)' OR
    LENGTH(detected_brand) > 50
  );

-- Apply known mappings
UPDATE keyword_rankings kr
SET detected_brand = bm.good_brand
FROM brand_mappings bm
WHERE kr.detected_brand = bm.bad_brand;

-- Update the ASINs table as well
UPDATE asins
SET brand = CASE
  -- Same logic as above
  WHEN brand ~ '^[0-9]+\s+(Pack|Count|Pcs|Pieces|oz|ml|inch)' THEN 'Unknown'
  WHEN brand ~ '^(Scented|Unscented|Large|Small|Medium|Natural|Luxury|Premium)\s+Candle' THEN 'Unknown'
  WHEN brand ~ '^[0-9]+$' THEN 'Unknown'
  WHEN LENGTH(brand) > 50 THEN 'Unknown'
  WHEN brand ~ '\d+\s*["\''x×]' THEN 'Unknown'
  WHEN brand ~ '^[A-Z][A-Za-z0-9\s&\.\-]{1,30}$' 
       AND brand !~ '(Candle|Pack|Set|Gift|Count|Pieces)' THEN brand
  ELSE 'Unknown'
END
WHERE brand IS NOT NULL
  AND (
    brand ~ '^[0-9]+\s+' OR
    brand ~ '(Pack|Count|Pcs|Pieces|oz|ml|inch|Candle)' OR
    brand ~ '^(Scented|Unscented|Large|Small)' OR
    LENGTH(brand) > 50
  );

-- Apply known mappings to ASINs
UPDATE asins a
SET brand = COALESCE(bm.good_brand, 'Unknown')
FROM brand_mappings bm
WHERE a.brand = bm.bad_brand;

-- Log the results
DO $$
DECLARE
  rankings_updated INTEGER;
  asins_updated INTEGER;
BEGIN
  GET DIAGNOSTICS rankings_updated = ROW_COUNT;
  
  SELECT COUNT(*) INTO asins_updated 
  FROM asins 
  WHERE brand = 'Unknown';
  
  RAISE NOTICE 'Updated % keyword rankings and set % ASINs to Unknown brand', rankings_updated, asins_updated;
END $$;