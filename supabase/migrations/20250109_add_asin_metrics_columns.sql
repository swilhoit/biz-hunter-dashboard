-- Add monthly metrics columns to asins table if they don't exist
ALTER TABLE asins 
ADD COLUMN IF NOT EXISTS monthly_revenue DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS monthly_units INTEGER,
ADD COLUMN IF NOT EXISTS seller_name TEXT,
ADD COLUMN IF NOT EXISTS fulfillment TEXT,
ADD COLUMN IF NOT EXISTS date_first_available DATE;