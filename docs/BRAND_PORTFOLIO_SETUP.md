# Brand Portfolio System Setup Guide

## Overview
This guide explains how to set up the Brand Portfolio system in your Supabase database. The system allows users to organize their Amazon products (ASINs) by brands and track performance metrics.

## Database Structure

### Core Tables

1. **brands** - Stores brand information
   - `id` (UUID, Primary Key)
   - `user_id` (UUID, Foreign Key to auth.users)
   - `name` (VARCHAR)
   - `logo_url` (TEXT)
   - `description` (TEXT)
   - `website_url` (TEXT)
   - `amazon_store_url` (TEXT)
   - Metrics fields (auto-calculated)

2. **user_portfolios** - Portfolio collections
   - `id` (UUID, Primary Key)
   - `user_id` (UUID, Foreign Key to auth.users)
   - `name` (VARCHAR)
   - `description` (TEXT)

3. **user_asins** - Individual product tracking
   - `id` (UUID, Primary Key)
   - `user_id` (UUID, Foreign Key to auth.users)
   - `portfolio_id` (UUID, Foreign Key, optional)
   - `brand_id` (UUID, Foreign Key, optional)
   - Product details (ASIN, name, category, etc.)
   - Performance metrics (revenue, profit, units, etc.)

### Supporting Tables

- **brand_categories** - Tags/categories for brands
- **brand_performance_history** - Historical performance tracking
- **user_asin_metrics** - ASIN-level historical metrics

### Views

- **brand_metrics** - Aggregated brand performance metrics
- **portfolio_metrics** - Aggregated portfolio metrics
- **user_portfolio_summary** - User-level summary across all portfolios

## Setup Instructions

### 1. Apply the Migration

1. Navigate to your Supabase dashboard
2. Go to SQL Editor
3. Copy the contents of `/supabase/migrations/20250107_create_brand_portfolio_system.sql`
4. Run the migration

```sql
-- The migration will:
-- 1. Create all necessary tables
-- 2. Set up indexes for performance
-- 3. Create views for metrics
-- 4. Enable Row Level Security (RLS)
-- 5. Create RLS policies
-- 6. Set up triggers for automatic metric updates
```

### 2. Verify the Setup

Run the verification script to ensure everything was created correctly:

```sql
-- Copy contents of /supabase/verify_portfolio_setup.sql
-- This will check:
-- - Table creation
-- - View creation
-- - RLS status
-- - Policies
-- - Triggers
-- - Indexes
```

### 3. Load Test Data (Optional)

To test the system with sample data:

```sql
-- First, get your user ID
SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- Then update the test data script with your user ID
-- Copy contents of /supabase/seeds/brand_portfolio_test_data.sql
-- This will create:
-- - 3 sample brands
-- - 1 portfolio
-- - 11 ASINs across brands
-- - Performance history data
```

### 4. Configure API Access

The server already has endpoints configured at:

- `GET /api/brands/:userId` - Get user's brands
- `POST /api/brands` - Create new brand
- `PUT /api/brands/:brandId` - Update brand
- `DELETE /api/brands/:brandId` - Delete brand
- `GET /api/brands/:brandId/asins` - Get brand's ASINs
- `POST /api/asins/bulk-import` - Bulk import ASINs

## Features

### Automatic Metric Updates
Brand metrics are automatically updated when ASINs are added, modified, or removed thanks to database triggers.

### Row Level Security
All tables have RLS enabled, ensuring users can only see and modify their own data.

### Performance Optimization
- Indexes on foreign keys and commonly queried fields
- Materialized views for complex aggregations
- Efficient trigger-based updates

### Historical Tracking
- Brand performance snapshots can be recorded daily
- ASIN-level metrics tracking for trend analysis

## Using the Portfolio System

### Creating a Brand
```javascript
// Frontend example
const response = await fetch('/api/brands', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: user.id,
    name: 'My Brand',
    description: 'Brand description',
    logo_url: 'https://example.com/logo.png',
    website_url: 'https://mybrand.com',
    amazon_store_url: 'https://amazon.com/stores/mybrand'
  })
});
```

### Adding ASINs to a Brand
```javascript
// Single ASIN
const response = await fetch('/api/portfolio/0/asins', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: user.id,
    brand_id: brandId,
    asin: 'B08N5WRWNW',
    productName: 'Product Name',
    category: 'Electronics',
    monthlyRevenue: 10000,
    monthlyProfit: 3000,
    // ... other fields
  })
});

// Bulk import
const response = await fetch('/api/asins/bulk-import', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: user.id,
    asins: [
      { asin: 'B08N5WRWNW', brand_id: brandId, ... },
      { asin: 'B07FZ8S74R', brand_id: brandId, ... }
    ]
  })
});
```

### Viewing Brand Metrics
```javascript
// Get all brands with metrics
const response = await fetch(`/api/brands/${userId}`);
const brands = await response.json();

// Each brand includes:
// - total_asins
// - total_monthly_revenue  
// - total_monthly_profit
// - avg_profit_margin
// - avg_rank, avg_reviews, avg_rating
```

## Maintenance

### Recording Performance Snapshots
Set up a daily cron job to record brand performance:

```sql
SELECT record_brand_performance_snapshot();
```

### Cleaning Old Data
Periodically clean up old performance history:

```sql
DELETE FROM brand_performance_history 
WHERE date < CURRENT_DATE - INTERVAL '90 days';

DELETE FROM user_asin_metrics 
WHERE recorded_at < CURRENT_DATE - INTERVAL '90 days';
```

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**
   - Ensure user is authenticated
   - Check that user_id matches auth.uid()

2. **Performance Issues**
   - Run `ANALYZE` on tables after bulk imports
   - Check index usage with `EXPLAIN`

3. **Metric Calculation Errors**
   - Verify trigger is active
   - Check for NULL values in calculations

### Debug Queries

```sql
-- Check user's brands
SELECT * FROM brands WHERE user_id = 'your-user-id';

-- Check brand metrics calculation
SELECT * FROM brand_metrics WHERE user_id = 'your-user-id';

-- Verify trigger execution
SELECT * FROM brands WHERE updated_at > NOW() - INTERVAL '1 hour';
```

## Security Considerations

1. All tables have RLS enabled
2. Users can only access their own data
3. API endpoints should validate user authentication
4. Consider rate limiting for bulk operations

## Future Enhancements

1. **Analytics Dashboard**
   - Time-series charts for performance
   - Comparative brand analysis
   - Export functionality

2. **Advanced Features**
   - Brand comparison tools
   - Automated ASIN discovery
   - Performance alerts

3. **Integration Options**
   - Amazon API integration
   - Automated data sync
   - Third-party analytics tools