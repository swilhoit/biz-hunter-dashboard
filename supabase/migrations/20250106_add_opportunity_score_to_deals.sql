-- Add opportunity_score column to deals table
-- This replaces the priority field with a more nuanced 1-10 scoring system

-- Add the opportunity_score column
ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS opportunity_score INTEGER 
CHECK (opportunity_score >= 1 AND opportunity_score <= 10);

-- Migrate existing priority values to opportunity scores
-- Map old priority (1-5) to new opportunity score (1-10)
UPDATE deals 
SET opportunity_score = CASE 
    WHEN priority = 1 THEN 2  -- Low priority -> Low score
    WHEN priority = 2 THEN 4  -- Medium-low -> Medium-low score
    WHEN priority = 3 THEN 6  -- Medium -> Medium score
    WHEN priority = 4 THEN 8  -- High -> High score
    WHEN priority = 5 THEN 10 -- Critical -> Outstanding score
    ELSE 5 -- Default to medium
END
WHERE opportunity_score IS NULL AND priority IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN deals.opportunity_score IS 'Opportunity score from 1-10 indicating the potential value and fit of the deal. 1-2: Very Low, 3-4: Low-Medium, 5-6: Medium, 7-8: High, 9-10: Outstanding';

-- Create index for better performance when filtering/sorting by opportunity score
CREATE INDEX IF NOT EXISTS idx_deals_opportunity_score ON deals(opportunity_score);

-- Create a function to calculate opportunity score based on various factors
CREATE OR REPLACE FUNCTION calculate_opportunity_score(
    p_asking_price DECIMAL,
    p_annual_revenue DECIMAL,
    p_annual_profit DECIMAL,
    p_multiple DECIMAL,
    p_business_age INTEGER,
    p_employee_count INTEGER,
    p_has_market_analysis BOOLEAN DEFAULT FALSE,
    p_market_opportunity_score INTEGER DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_score INTEGER := 5; -- Default medium score
    v_profit_margin DECIMAL;
    v_size_score INTEGER := 0;
    v_profitability_score INTEGER := 0;
    v_multiple_score INTEGER := 0;
    v_stability_score INTEGER := 0;
BEGIN
    -- Calculate profit margin if we have revenue and profit
    IF p_annual_revenue > 0 AND p_annual_profit IS NOT NULL THEN
        v_profit_margin := (p_annual_profit / p_annual_revenue) * 100;
        
        -- Profitability score (0-3 points)
        IF v_profit_margin >= 30 THEN
            v_profitability_score := 3;
        ELSIF v_profit_margin >= 20 THEN
            v_profitability_score := 2;
        ELSIF v_profit_margin >= 10 THEN
            v_profitability_score := 1;
        END IF;
    END IF;
    
    -- Business size score (0-2 points)
    IF p_annual_revenue >= 5000000 THEN
        v_size_score := 2;
    ELSIF p_annual_revenue >= 1000000 THEN
        v_size_score := 1;
    END IF;
    
    -- Multiple score (0-2 points) - lower is better
    IF p_multiple IS NOT NULL THEN
        IF p_multiple <= 2.5 THEN
            v_multiple_score := 2;
        ELSIF p_multiple <= 3.5 THEN
            v_multiple_score := 1;
        END IF;
    END IF;
    
    -- Business stability score (0-2 points)
    IF p_business_age >= 5 THEN
        v_stability_score := 2;
    ELSIF p_business_age >= 3 THEN
        v_stability_score := 1;
    END IF;
    
    -- Calculate total score
    v_score := GREATEST(1, LEAST(10, 
        1 + v_profitability_score + v_size_score + v_multiple_score + v_stability_score
    ));
    
    -- If we have market analysis data, weight it 30%
    IF p_has_market_analysis AND p_market_opportunity_score IS NOT NULL THEN
        v_score := ROUND((v_score * 0.7) + (p_market_opportunity_score / 10.0 * 0.3));
    END IF;
    
    RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to auto-calculate opportunity score when deal is created/updated
CREATE OR REPLACE FUNCTION update_deal_opportunity_score()
RETURNS TRIGGER AS $$
DECLARE
    v_has_market_analysis BOOLEAN;
    v_market_score INTEGER;
BEGIN
    -- Only auto-calculate if opportunity_score is NULL
    IF NEW.opportunity_score IS NULL THEN
        -- Check if market analysis exists
        SELECT EXISTS(
            SELECT 1 FROM market_analysis WHERE deal_id = NEW.id
        ) INTO v_has_market_analysis;
        
        -- Get market opportunity score if exists
        SELECT market_opportunity_score 
        FROM market_analysis 
        WHERE deal_id = NEW.id 
        INTO v_market_score;
        
        -- Calculate and set the opportunity score
        NEW.opportunity_score := calculate_opportunity_score(
            NEW.asking_price,
            NEW.annual_revenue,
            NEW.annual_profit,
            NEW.valuation_multiple,
            NEW.business_age,
            NEW.employee_count,
            v_has_market_analysis,
            v_market_score
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER calculate_opportunity_score_trigger
BEFORE INSERT OR UPDATE ON deals
FOR EACH ROW
EXECUTE FUNCTION update_deal_opportunity_score();

-- Update existing deals to calculate opportunity scores where missing
UPDATE deals 
SET opportunity_score = calculate_opportunity_score(
    asking_price,
    annual_revenue,
    annual_profit,
    valuation_multiple,
    business_age,
    employee_count,
    FALSE,
    NULL
)
WHERE opportunity_score IS NULL;

-- Success message
SELECT 'Opportunity score column added successfully to deals table' as status;