# Share of Voice Migration Instructions

To enable the Share of Voice feature with database storage, you need to run the following migration:

## 1. Apply the migration

Run this command in your project root:

```bash
npx supabase migration up
```

Or if you're using the Supabase CLI directly:

```bash
supabase db push
```

## 2. What this migration creates:

- `share_of_voice_reports` table - Stores the main report data
- `share_of_voice_competitors` table - Stores competitor analysis data
- `share_of_voice_keywords` table - Stores keyword performance data
- Proper indexes for performance
- Row Level Security (RLS) policies to ensure users can only see their own data

## 3. Migration file location:

`supabase/migrations/20250109_create_share_of_voice_tables.sql`

## 4. Features added:

- Share of Voice reports are now stored in the database
- Reports are cached for 7 days (considered fresh)
- Users can generate new reports or update existing ones
- Historical data is preserved
- Integrated into the Deal Market Analysis page

## 5. Usage:

1. Go to any deal's Market Analysis tab
2. Click "Generate Report" to create a new share of voice analysis
3. The report will be saved automatically
4. Future visits will show the cached report with the last update date
5. Click "Update Report" to refresh the data