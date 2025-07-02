-- Add duplicate detection fields to business_listings table
ALTER TABLE business_listings ADD COLUMN IF NOT EXISTS normalized_name TEXT;
ALTER TABLE business_listings ADD COLUMN IF NOT EXISTS duplicate_group_id UUID;
ALTER TABLE business_listings ADD COLUMN IF NOT EXISTS is_primary_listing BOOLEAN DEFAULT true;
ALTER TABLE business_listings ADD COLUMN IF NOT EXISTS similarity_score DECIMAL(3,2);
ALTER TABLE business_listings ADD COLUMN IF NOT EXISTS duplicate_count INTEGER DEFAULT 0;

-- Create index for faster duplicate detection
CREATE INDEX IF NOT EXISTS idx_business_listings_normalized_name ON business_listings(normalized_name);
CREATE INDEX IF NOT EXISTS idx_business_listings_duplicate_group ON business_listings(duplicate_group_id);
CREATE INDEX IF NOT EXISTS idx_business_listings_source ON business_listings(source);

-- Function to normalize business names for comparison
CREATE OR REPLACE FUNCTION normalize_business_name(name TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Remove common business suffixes and normalize
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              REGEXP_REPLACE(
                TRIM(name),
                '\s+(llc|inc|corp|corporation|company|co|ltd|limited|group|holdings|enterprises|partners|lp|llp)\.?\s*$', '', 'gi'
              ),
              '[^a-z0-9\s]', '', 'gi'  -- Remove special characters
            ),
            '\s+', ' ', 'g'  -- Normalize spaces
          ),
          '(^the\s+|\s+the$)', '', 'gi'  -- Remove leading/trailing 'the'
        ),
        '\s+(and|&)\s+', ' ', 'gi'  -- Normalize 'and' and '&'
      ),
      '\s+', ' ', 'g'  -- Final space normalization
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update existing records with normalized names
UPDATE business_listings 
SET normalized_name = normalize_business_name(name)
WHERE normalized_name IS NULL;

-- Trigger to automatically set normalized name on insert/update
CREATE OR REPLACE FUNCTION set_normalized_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.normalized_name := normalize_business_name(NEW.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER business_listings_normalize_name
BEFORE INSERT OR UPDATE OF name ON business_listings
FOR EACH ROW
EXECUTE FUNCTION set_normalized_name();

-- View to show duplicate groups
CREATE OR REPLACE VIEW business_listing_duplicates AS
WITH duplicate_groups AS (
  SELECT 
    normalized_name,
    COUNT(*) as duplicate_count,
    MIN(created_at) as first_seen,
    MAX(created_at) as last_seen,
    ARRAY_AGG(DISTINCT source ORDER BY source) as sources,
    ARRAY_AGG(id ORDER BY created_at) as listing_ids,
    ARRAY_AGG(DISTINCT asking_price) as price_variations,
    MIN(asking_price) as min_price,
    MAX(asking_price) as max_price
  FROM business_listings
  WHERE status = 'active'
  GROUP BY normalized_name
  HAVING COUNT(*) > 1
)
SELECT * FROM duplicate_groups
ORDER BY duplicate_count DESC, first_seen DESC;

-- Function to find similar listings using fuzzy matching
CREATE OR REPLACE FUNCTION find_similar_listings(listing_id UUID, threshold DECIMAL DEFAULT 0.8)
RETURNS TABLE (
  similar_id UUID,
  similar_name TEXT,
  similar_source TEXT,
  similarity_score DECIMAL,
  price_difference DECIMAL
) AS $$
DECLARE
  target_listing RECORD;
BEGIN
  -- Get target listing details
  SELECT id, name, normalized_name, asking_price, source
  INTO target_listing
  FROM business_listings
  WHERE id = listing_id;

  RETURN QUERY
  SELECT 
    bl.id as similar_id,
    bl.name as similar_name,
    bl.source as similar_source,
    ROUND(
      GREATEST(
        similarity(target_listing.normalized_name, bl.normalized_name),
        similarity(target_listing.name, bl.name)
      )::DECIMAL, 2
    ) as similarity_score,
    CASE 
      WHEN target_listing.asking_price > 0 AND bl.asking_price > 0 
      THEN ROUND(ABS(target_listing.asking_price - bl.asking_price)::DECIMAL / target_listing.asking_price, 2)
      ELSE NULL
    END as price_difference
  FROM business_listings bl
  WHERE bl.id != target_listing.id
    AND bl.status = 'active'
    AND (
      similarity(target_listing.normalized_name, bl.normalized_name) >= threshold
      OR similarity(target_listing.name, bl.name) >= threshold
    )
  ORDER BY similarity_score DESC, bl.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to merge duplicate listings
CREATE OR REPLACE FUNCTION merge_duplicate_listings(primary_id UUID, duplicate_ids UUID[])
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  group_id UUID;
BEGIN
  -- Generate or get group ID
  SELECT duplicate_group_id INTO group_id FROM business_listings WHERE id = primary_id;
  IF group_id IS NULL THEN
    group_id := gen_random_uuid();
  END IF;

  -- Update primary listing
  UPDATE business_listings
  SET 
    duplicate_group_id = group_id,
    is_primary_listing = true,
    duplicate_count = array_length(duplicate_ids, 1)
  WHERE id = primary_id;

  -- Mark duplicates
  UPDATE business_listings
  SET 
    duplicate_group_id = group_id,
    is_primary_listing = false,
    status = 'duplicate'
  WHERE id = ANY(duplicate_ids);

  -- Return summary
  SELECT jsonb_build_object(
    'success', true,
    'primary_id', primary_id,
    'group_id', group_id,
    'merged_count', array_length(duplicate_ids, 1),
    'duplicate_ids', duplicate_ids
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON business_listing_duplicates TO authenticated;
GRANT EXECUTE ON FUNCTION normalize_business_name TO authenticated;
GRANT EXECUTE ON FUNCTION find_similar_listings TO authenticated;
GRANT EXECUTE ON FUNCTION merge_duplicate_listings TO authenticated;