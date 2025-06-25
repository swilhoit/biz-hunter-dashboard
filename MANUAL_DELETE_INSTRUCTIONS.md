# Manual Database Cleanup Instructions

Since the Row Level Security (RLS) policies are preventing automated deletion, you need to manually clean the database through the Supabase dashboard.

## Option 1: Add DELETE Policy (Recommended)

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Database** → **Tables** → **business_listings**
4. Click on **RLS Policies** tab
5. Click **New Policy** → **Create a policy from scratch**
6. Configure:
   - Policy name: `Allow all deletions (temporary)`
   - Policy command: `DELETE`
   - Target roles: Select both `authenticated` and `anon`
   - Policy definition: `true` (this allows all deletions)
7. Click **Review** then **Save policy**
8. Now refresh your app and use the "DELETE ALL FAKE LISTINGS" button

## Option 2: Run SQL Query Directly

1. Go to your Supabase dashboard
2. Go to **SQL Editor**
3. Run this query:

```sql
-- Delete all non-BizBuySell listings
DELETE FROM business_listings 
WHERE source != 'BizBuySell';
```

4. Click **Run**

## Option 3: Temporarily Disable RLS

1. Go to **Database** → **Tables** → **business_listings**
2. Click **RLS disabled/enabled** toggle to disable it temporarily
3. Run the delete query or use the app's delete button
4. Re-enable RLS after cleanup

## After Cleanup

Once cleaned, your app will only show real BizBuySell listings. The background scraping will continue to add only real, non-duplicate listings every minute.