-- Reorder deal_stage enum to put 'analysis' before 'initial_contact'
-- This migration creates a new enum with the correct order and migrates all existing data

-- Step 1: Create the new enum with the correct order
CREATE TYPE deal_stage_new AS ENUM (
  'prospecting',
  'analysis',
  'initial_contact',
  'loi_submitted',
  'due_diligence',
  'negotiation',
  'under_contract',
  'closing',
  'closed_won',
  'closed_lost',
  'on_hold'
);

-- Step 2: Add new column with the correct enum type
ALTER TABLE deals ADD COLUMN stage_new deal_stage_new;

-- Step 3: Migrate existing data to the new column
-- Map the old stages to the new enum values
UPDATE deals SET stage_new = 
  CASE 
    WHEN stage::text = 'prospecting' THEN 'prospecting'::deal_stage_new
    WHEN stage::text = 'analysis' THEN 'analysis'::deal_stage_new
    WHEN stage::text = 'initial_contact' THEN 'initial_contact'::deal_stage_new
    WHEN stage::text = 'loi_submitted' THEN 'loi_submitted'::deal_stage_new
    WHEN stage::text = 'due_diligence' THEN 'due_diligence'::deal_stage_new
    WHEN stage::text = 'negotiation' THEN 'negotiation'::deal_stage_new
    WHEN stage::text = 'under_contract' THEN 'under_contract'::deal_stage_new
    WHEN stage::text = 'closing' THEN 'closing'::deal_stage_new
    WHEN stage::text = 'closed_won' THEN 'closed_won'::deal_stage_new
    WHEN stage::text = 'closed_lost' THEN 'closed_lost'::deal_stage_new
    -- Handle any legacy stages that might exist
    WHEN stage::text = 'first_contact' THEN 'initial_contact'::deal_stage_new
    WHEN stage::text = 'qualified_leads' THEN 'analysis'::deal_stage_new
    WHEN stage::text = 'loi' THEN 'loi_submitted'::deal_stage_new
    ELSE 'prospecting'::deal_stage_new -- Default fallback
  END;

-- Step 4: Drop the old column and rename the new one
ALTER TABLE deals DROP COLUMN stage;
ALTER TABLE deals RENAME COLUMN stage_new TO stage;

-- Step 5: Set the default value for the new column
ALTER TABLE deals ALTER COLUMN stage SET DEFAULT 'prospecting'::deal_stage_new;

-- Step 6: Update workflow templates table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_templates') THEN
    ALTER TABLE workflow_templates ADD COLUMN trigger_stage_new deal_stage_new;
    
    UPDATE workflow_templates SET trigger_stage_new = 
      CASE 
        WHEN trigger_stage::text = 'prospecting' THEN 'prospecting'::deal_stage_new
        WHEN trigger_stage::text = 'analysis' THEN 'analysis'::deal_stage_new
        WHEN trigger_stage::text = 'initial_contact' THEN 'initial_contact'::deal_stage_new
        WHEN trigger_stage::text = 'loi_submitted' THEN 'loi_submitted'::deal_stage_new
        WHEN trigger_stage::text = 'due_diligence' THEN 'due_diligence'::deal_stage_new
        WHEN trigger_stage::text = 'negotiation' THEN 'negotiation'::deal_stage_new
        WHEN trigger_stage::text = 'under_contract' THEN 'under_contract'::deal_stage_new
        WHEN trigger_stage::text = 'closing' THEN 'closing'::deal_stage_new
        WHEN trigger_stage::text = 'closed_won' THEN 'closed_won'::deal_stage_new
        WHEN trigger_stage::text = 'closed_lost' THEN 'closed_lost'::deal_stage_new
        WHEN trigger_stage::text = 'first_contact' THEN 'initial_contact'::deal_stage_new
        WHEN trigger_stage::text = 'qualified_leads' THEN 'analysis'::deal_stage_new
        WHEN trigger_stage::text = 'loi' THEN 'loi_submitted'::deal_stage_new
        ELSE 'prospecting'::deal_stage_new
      END;
    
    ALTER TABLE workflow_templates DROP COLUMN trigger_stage;
    ALTER TABLE workflow_templates RENAME COLUMN trigger_stage_new TO trigger_stage;
  END IF;
END $$;

-- Step 7: Drop the old enum type
DROP TYPE IF EXISTS deal_stage;

-- Step 8: Rename the new enum type to the original name
ALTER TYPE deal_stage_new RENAME TO deal_stage;

-- Step 9: Add comment explaining the new order
COMMENT ON TYPE deal_stage IS 'Deal pipeline stages in logical order: prospecting -> analysis -> initial_contact -> loi_submitted -> due_diligence -> negotiation -> under_contract -> closing -> closed_won/closed_lost';

-- Step 10: Create a function to help understand the stage progression
CREATE OR REPLACE FUNCTION get_deal_stage_order(stage_name deal_stage)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE stage_name
    WHEN 'prospecting' THEN 1
    WHEN 'analysis' THEN 2
    WHEN 'initial_contact' THEN 3
    WHEN 'loi_submitted' THEN 4
    WHEN 'due_diligence' THEN 5
    WHEN 'negotiation' THEN 6
    WHEN 'under_contract' THEN 7
    WHEN 'closing' THEN 8
    WHEN 'closed_won' THEN 9
    WHEN 'closed_lost' THEN 10
    WHEN 'on_hold' THEN 11
    ELSE 0
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 11: Add a check to ensure stage progression makes sense
CREATE OR REPLACE FUNCTION validate_stage_progression()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow any stage change for now, but log unusual progressions
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    -- Log stage changes that skip multiple stages (potential data quality issue)
    IF ABS(get_deal_stage_order(NEW.stage) - get_deal_stage_order(OLD.stage)) > 2 
       AND NEW.stage NOT IN ('closed_lost', 'on_hold') THEN
      RAISE NOTICE 'Large stage jump detected for deal %: % -> %', 
        NEW.id, OLD.stage, NEW.stage;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stage progression validation
DROP TRIGGER IF EXISTS validate_deal_stage_progression ON deals;
CREATE TRIGGER validate_deal_stage_progression
  BEFORE UPDATE OF stage ON deals
  FOR EACH ROW
  EXECUTE FUNCTION validate_stage_progression();

-- Step 12: Update any automation rules that reference stages
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'automation_rules') THEN
    UPDATE automation_rules 
    SET trigger_conditions = jsonb_set(
      trigger_conditions,
      '{stage}',
      CASE 
        WHEN trigger_conditions->>'stage' = 'first_contact' THEN '"initial_contact"'::jsonb
        WHEN trigger_conditions->>'stage' = 'qualified_leads' THEN '"analysis"'::jsonb
        WHEN trigger_conditions->>'stage' = 'loi' THEN '"loi_submitted"'::jsonb
        ELSE trigger_conditions->'stage'
      END
    )
    WHERE trigger_conditions->>'stage' IS NOT NULL;
  END IF;
END $$;

-- Step 13: Log the completion
SELECT 'Deal stages reordered successfully. Analysis now comes before initial contact.' AS migration_result; 