-- Remove the estimated_traffic column from brand_ranking_summary table
-- This removes fake traffic estimates and keeps only real data

-- Drop the estimated_traffic column from brand_ranking_summary
ALTER TABLE brand_ranking_summary DROP COLUMN IF EXISTS estimated_traffic;