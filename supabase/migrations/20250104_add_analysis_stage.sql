-- Add analysis stage to the deal pipeline
-- This adds the 'analysis' stage after 'first_contact' and before 'due_diligence'

-- Add the new enum value to the existing deal_stage type
ALTER TYPE deal_stage ADD VALUE 'analysis' BEFORE 'due_diligence';

-- Update any workflow templates or automation rules that might reference stages
-- Note: This will require manual updates to any hardcoded stage references in automation rules

-- Create a function to help migrate existing 'first_contact' deals to 'analysis' if needed
CREATE OR REPLACE FUNCTION migrate_first_contact_to_analysis()
RETURNS void AS $$
BEGIN
  -- This function can be used to selectively move deals from first_contact to analysis
  -- Uncomment and modify as needed:
  -- UPDATE deals SET stage = 'analysis' WHERE stage = 'first_contact' AND <your_conditions>;
  
  -- For now, we'll just log that the migration is available
  RAISE NOTICE 'Analysis stage added to deal_stage enum. Use migrate_first_contact_to_analysis() to migrate existing deals if needed.';
END;
$$ LANGUAGE plpgsql;

-- Execute the migration notice
SELECT migrate_first_contact_to_analysis(); 