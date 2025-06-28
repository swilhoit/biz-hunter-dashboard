# 🚀 CLI Solution for RLS Policy Fix

## **Option 1: Use CLI with Database Password (Recommended)**

You need to get your database password:

1. **Get your database password:**
   - Go to [Supabase Dashboard Settings](https://supabase.com/dashboard/project/ueemtnohgkovwzodzxdr/settings/database)
   - Look for "Database password" 
   - Copy it

2. **Apply the migration:**
   ```bash
   cd /Users/samwilhoit/CascadeProjects/biz-hunter-dashboard
   npx supabase db push -p "YOUR_DATABASE_PASSWORD_HERE"
   ```

## **Option 2: Temporary RLS Disable (Quick Fix)**

If you can't find the password, temporarily disable RLS:

1. Go to [SQL Editor](https://supabase.com/dashboard/project/ueemtnohgkovwzodzxdr/sql/new)
2. Run this ONE line:
   ```sql
   ALTER TABLE business_listings DISABLE ROW LEVEL SECURITY;
   ```
3. Click "Run"

This will immediately allow:
- ✅ Public viewing of listings
- ✅ Scraper to add listings
- ✅ Admin functions to work

## **Option 3: Direct Policy Fix (Permanent Solution)**

Run this in SQL Editor:
```sql
DROP POLICY IF EXISTS "Anyone can view active listings" ON business_listings;
DROP POLICY IF EXISTS "Authenticated users can create listings" ON business_listings;
DROP POLICY IF EXISTS "Users can update their own listings" ON business_listings;

CREATE POLICY "Allow all reads" ON business_listings FOR SELECT USING (true);
CREATE POLICY "Allow all inserts" ON business_listings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all deletes" ON business_listings FOR DELETE USING (true);
CREATE POLICY "Allow all updates" ON business_listings FOR UPDATE USING (true);
```

## **Current Status**
- Migration file created: ✅
- CLI linked to project: ✅ 
- Need: Database password OR manual SQL execution

**Choose Option 2 for immediate fix, then Option 1 for proper migration management!**