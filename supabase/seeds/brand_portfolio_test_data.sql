-- Test data for Brand Portfolio System
-- This creates sample data for testing the portfolio functionality
-- Replace the user_id with your actual auth user ID

-- Get a test user ID (you'll need to replace this with an actual user ID from your auth.users table)
-- You can find your user ID by running: SELECT id FROM auth.users LIMIT 1;
DO $$
DECLARE
    test_user_id UUID;
    brand1_id UUID;
    brand2_id UUID;
    brand3_id UUID;
    portfolio1_id UUID;
BEGIN
    -- Get the first user ID (replace this with your actual user ID)
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'No users found. Please create a user first.';
        RETURN;
    END IF;

    -- Create sample brands
    INSERT INTO brands (id, user_id, name, description, logo_url, website_url, amazon_store_url)
    VALUES 
        (gen_random_uuid(), test_user_id, 'TechGear Pro', 'Premium technology accessories and gadgets', 
         'https://via.placeholder.com/150/4F46E5/FFFFFF?text=TechGear', 
         'https://techgearpro.com', 
         'https://amazon.com/stores/page/ABCD1234')
    RETURNING id INTO brand1_id;

    INSERT INTO brands (id, user_id, name, description, logo_url, website_url, amazon_store_url)
    VALUES 
        (gen_random_uuid(), test_user_id, 'HomeComfort Plus', 'Innovative home and kitchen solutions', 
         'https://via.placeholder.com/150/10B981/FFFFFF?text=HomeComfort', 
         'https://homecomfortplus.com', 
         'https://amazon.com/stores/page/EFGH5678')
    RETURNING id INTO brand2_id;

    INSERT INTO brands (id, user_id, name, description, logo_url, website_url, amazon_store_url)
    VALUES 
        (gen_random_uuid(), test_user_id, 'FitLife Essentials', 'Sports and fitness equipment for active lifestyles', 
         'https://via.placeholder.com/150/EF4444/FFFFFF?text=FitLife', 
         'https://fitlifeessentials.com', 
         'https://amazon.com/stores/page/IJKL9012')
    RETURNING id INTO brand3_id;

    -- Create a sample portfolio
    INSERT INTO user_portfolios (id, user_id, name, description)
    VALUES 
        (gen_random_uuid(), test_user_id, 'Main Portfolio', 'Primary product portfolio across all brands')
    RETURNING id INTO portfolio1_id;

    -- Add ASINs for TechGear Pro
    INSERT INTO user_asins (user_id, portfolio_id, brand_id, asin, product_name, brand, category, subcategory, 
                           current_price, current_rank, review_count, rating, monthly_revenue, monthly_profit, 
                           monthly_units_sold, profit_margin)
    VALUES 
        (test_user_id, portfolio1_id, brand1_id, 'B08N5WRWNW', 'Echo Dot (4th Gen)', 'TechGear Pro', 'Electronics', 'Smart Speakers',
         49.99, 125, 245000, 4.7, 125000, 37500, 2500, 30),
        (test_user_id, portfolio1_id, brand1_id, 'B07FZ8S74R', 'Wireless Charging Pad', 'TechGear Pro', 'Electronics', 'Phone Accessories',
         29.99, 450, 18500, 4.5, 45000, 18000, 1500, 40),
        (test_user_id, portfolio1_id, brand1_id, 'B08J4C8WJM', 'USB-C Hub 7-in-1', 'TechGear Pro', 'Electronics', 'Computer Accessories',
         39.99, 320, 12000, 4.6, 60000, 21000, 1500, 35),
        (test_user_id, portfolio1_id, brand1_id, 'B07XL5J89B', 'Bluetooth Earbuds Pro', 'TechGear Pro', 'Electronics', 'Headphones',
         79.99, 210, 35000, 4.4, 95000, 28500, 1200, 30);

    -- Add ASINs for HomeComfort Plus
    INSERT INTO user_asins (user_id, portfolio_id, brand_id, asin, product_name, brand, category, subcategory, 
                           current_price, current_rank, review_count, rating, monthly_revenue, monthly_profit, 
                           monthly_units_sold, profit_margin)
    VALUES 
        (test_user_id, portfolio1_id, brand2_id, 'B07QNJWVG3', 'Smart Air Purifier', 'HomeComfort Plus', 'Home & Kitchen', 'Air Quality',
         149.99, 89, 15000, 4.6, 180000, 54000, 1200, 30),
        (test_user_id, portfolio1_id, brand2_id, 'B08GC6WR5P', 'Bamboo Cutting Board Set', 'HomeComfort Plus', 'Home & Kitchen', 'Kitchen',
         34.99, 567, 28000, 4.8, 52500, 26250, 1500, 50),
        (test_user_id, portfolio1_id, brand2_id, 'B09K7JWQ8M', 'Silicone Kitchen Utensils', 'HomeComfort Plus', 'Home & Kitchen', 'Kitchen',
         24.99, 890, 42000, 4.7, 37500, 16875, 1500, 45);

    -- Add ASINs for FitLife Essentials
    INSERT INTO user_asins (user_id, portfolio_id, brand_id, asin, product_name, brand, category, subcategory, 
                           current_price, current_rank, review_count, rating, monthly_revenue, monthly_profit, 
                           monthly_units_sold, profit_margin)
    VALUES 
        (test_user_id, portfolio1_id, brand3_id, 'B08P5D3QKN', 'Resistance Bands Set', 'FitLife Essentials', 'Sports & Outdoors', 'Fitness',
         29.99, 234, 52000, 4.6, 90000, 36000, 3000, 40),
        (test_user_id, portfolio1_id, brand3_id, 'B07KCVW5YQ', 'Yoga Mat Premium', 'FitLife Essentials', 'Sports & Outdoors', 'Yoga',
         39.99, 456, 38000, 4.8, 60000, 24000, 1500, 40),
        (test_user_id, portfolio1_id, brand3_id, 'B09L8RTKPV', 'Adjustable Dumbbells', 'FitLife Essentials', 'Sports & Outdoors', 'Strength Training',
         199.99, 123, 12000, 4.5, 150000, 45000, 750, 30);

    -- Add some brand categories
    INSERT INTO brand_categories (brand_id, category)
    VALUES 
        (brand1_id, 'Electronics'),
        (brand1_id, 'Technology'),
        (brand1_id, 'Gadgets'),
        (brand2_id, 'Home & Kitchen'),
        (brand2_id, 'Smart Home'),
        (brand3_id, 'Fitness'),
        (brand3_id, 'Sports'),
        (brand3_id, 'Wellness');

    -- Add some performance history (last 7 days)
    INSERT INTO brand_performance_history (brand_id, date, total_revenue, total_profit, total_units_sold, avg_rank)
    SELECT 
        brand_id,
        CURRENT_DATE - INTERVAL '1 day' * generate_series(0, 6),
        SUM(monthly_revenue) * (0.9 + random() * 0.2), -- Add some variance
        SUM(monthly_profit) * (0.9 + random() * 0.2),
        SUM(monthly_units_sold) * (0.9 + random() * 0.2)::int,
        AVG(current_rank)
    FROM user_asins
    WHERE brand_id IN (brand1_id, brand2_id, brand3_id)
    GROUP BY brand_id;

    RAISE NOTICE 'Test data created successfully for user ID: %', test_user_id;
    RAISE NOTICE 'Created 3 brands, 1 portfolio, and 11 ASINs';
END $$;