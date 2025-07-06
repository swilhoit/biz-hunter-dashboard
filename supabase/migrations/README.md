# Supabase Migrations

## Market Analysis Schema Migration

The `20250106_market_analysis_schema.sql` migration adds comprehensive tables to support market analysis with competitive features across multiple channels.

### Tables Created:

1. **market_analysis** - Overall market analysis data for deals
2. **channel_performance** - Performance metrics for each sales channel
3. **amazon_channel_analysis** - Amazon-specific metrics and competitive scores
4. **amazon_competitors** - Detailed Amazon competitor information
5. **seo_analysis** - SEO metrics and competitive analysis
6. **seo_competitors** - SEO competitor data
7. **seo_keywords** - Keyword tracking with competitive metrics
8. **social_media_analysis** - Social media metrics across platforms
9. **social_competitors** - Social media competitor analysis
10. **market_insights** - SWOT analysis insights
11. **competitive_advantages** - Documented competitive advantages by channel

### Features:

- **Competitive Analysis**: Each channel includes competitor tracking and benchmarking
- **Market Positioning**: Track market share, visibility scores, and competitive rankings
- **Opportunity Identification**: Content gaps, keyword opportunities, and growth potential
- **Performance Tracking**: Historical data with trend analysis
- **Multi-channel View**: Comprehensive view across Amazon, SEO, and Social channels

### Usage:

To apply this migration:

```bash
# Using Supabase CLI
supabase migration up

# Or apply directly in Supabase Dashboard
# Navigate to SQL Editor and run the migration file
```

### Security:

All tables have Row Level Security (RLS) enabled with policies that ensure users can only access market analysis data for their own deals.