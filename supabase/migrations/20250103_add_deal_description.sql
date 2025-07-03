-- Add description field to deals table
ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comment for clarity
COMMENT ON COLUMN deals.description IS 'Detailed description of the business/deal';