-- Fix decimal field sizes for monthly_trend and quarterly_trend
-- These fields need to accommodate larger values than DECIMAL(5,2)

ALTER TABLE asin_keywords 
ALTER COLUMN monthly_trend TYPE DECIMAL(10,2),
ALTER COLUMN quarterly_trend TYPE DECIMAL(10,2);