# Fix for Share of Voice Report Not Showing

## Issue Found
The Share of Voice report generation completes successfully according to the logs, but the report data is not being saved to the database. Investigation revealed:

1. **Permission Issue**: The `share_of_voice_reports` table exists but lacks proper INSERT/UPDATE permissions for authenticated users
2. **Data Mismatch**: The `ShareOfVoiceService.saveReport` method was trying to save a generic `report_data` field that doesn't exist in the table schema

## Fixes Applied

### 1. Fixed ShareOfVoiceService.saveReport Method
Updated the method to properly map the report data to the actual table columns:
- Maps share of voice metrics to specific columns (brand_market_share, brand_revenue, etc.)
- Stores raw data in JSONB columns (top_brands, keyword_analysis, category_distribution)
- Added detailed logging to track the save process

### 2. Created Migration for Permissions
Created a new migration file that needs to be applied:

```bash
# Apply the migration to grant proper permissions
supabase migration up
```

The migration grants:
- Full permissions to `authenticated` users for all share_of_voice tables
- SELECT permissions to `anon` users
- Full permissions to `service_role` for server operations

## Next Steps

1. **Apply the migration**:
   ```bash
   cd /Users/samwilhoit/CascadeProjects/biz-hunter-dashboard
   supabase migration up
   ```

2. **Test the fix**:
   - Go to a deal page
   - Click "Generate Report" or "Update Report"
   - The report should now save properly and display in the dashboard

3. **Monitor the console**:
   - The updated code includes detailed logging
   - Look for `[ShareOfVoice]` messages in the browser console
   - These will show the save process and any errors

## Files Modified

1. `/src/services/ShareOfVoiceService.ts`:
   - Fixed `saveReport` method to match table schema
   - Updated `StoredShareOfVoiceReport` interface
   - Added detailed logging

2. `/supabase/migrations/20250114_grant_share_of_voice_permissions.sql`:
   - New migration to grant proper permissions

## Technical Details

The share_of_voice_reports table has these columns that need to be populated:
- deal_id, brand_name, category
- Market overview: total_market_revenue, total_brands, total_products, etc.
- Brand metrics: brand_market_share, brand_revenue, brand_rank, etc.
- JSONB storage: top_brands, keyword_analysis, category_distribution

The fix ensures all these fields are properly mapped from the generated report data.