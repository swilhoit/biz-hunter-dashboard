-- Verification script for Brand Portfolio System
-- Run this after applying the migration to verify everything is set up correctly

-- 1. Check if tables were created
SELECT 'Tables Created:' as check_type;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('brands', 'user_portfolios', 'user_asins', 'brand_categories', 
                   'brand_performance_history', 'user_asin_metrics')
ORDER BY table_name;

-- 2. Check if views were created
SELECT '
Views Created:' as check_type;
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN ('brand_metrics', 'portfolio_metrics', 'user_portfolio_summary')
ORDER BY table_name;

-- 3. Check if RLS is enabled
SELECT '
RLS Status:' as check_type;
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('brands', 'user_portfolios', 'user_asins', 'brand_categories', 
                  'brand_performance_history', 'user_asin_metrics')
ORDER BY tablename;

-- 4. Check policies
SELECT '
RLS Policies:' as check_type;
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('brands', 'user_portfolios', 'user_asins', 'brand_categories', 
                  'brand_performance_history', 'user_asin_metrics')
ORDER BY tablename, policyname;

-- 5. Check triggers
SELECT '
Triggers:' as check_type;
SELECT trigger_name, event_object_table, action_timing, event_manipulation 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name = 'update_brand_metrics_on_asin_change';

-- 6. Check indexes
SELECT '
Indexes:' as check_type;
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('brands', 'user_portfolios', 'user_asins', 'brand_categories', 
                  'brand_performance_history', 'user_asin_metrics')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- 7. Check table structures
SELECT '
Table Structures:' as check_type;
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('brands', 'user_asins')
ORDER BY table_name, ordinal_position;

-- 8. Get current user count
SELECT '
User Count:' as check_type;
SELECT COUNT(*) as total_users FROM auth.users;

-- 9. Test brand metrics view (should return empty if no data)
SELECT '
Brand Metrics View Test:' as check_type;
SELECT COUNT(*) as brand_count FROM brand_metrics;

-- 10. Test user portfolio summary view (should return empty if no data)
SELECT '
Portfolio Summary View Test:' as check_type;
SELECT COUNT(*) as user_count FROM user_portfolio_summary;