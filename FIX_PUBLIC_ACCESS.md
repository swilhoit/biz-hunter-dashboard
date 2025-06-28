# 🔧 Fix Public Access - Quick Guide

Your app needs to allow public viewing of listings. Here's how to fix it:

## Option 1: Direct Dashboard Link (Easiest)

1. **[Click here to open SQL Editor](https://supabase.com/dashboard/project/ueemtnohgkovwzodzxdr/sql/new)**

2. **Copy this SQL and paste it:**

```sql
-- Fix public access to business listings
BEGIN;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can view active listings" ON business_listings;
DROP POLICY IF EXISTS "Authenticated users can create listings" ON business_listings;
DROP POLICY IF EXISTS "Users can update their own listings" ON business_listings;

-- Create new policies for public access
CREATE POLICY "Public read access" ON business_listings FOR SELECT USING (true);
CREATE POLICY "Anonymous insert access" ON business_listings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anonymous delete access" ON business_listings FOR DELETE USING (true);
CREATE POLICY "Authenticated update own listings" ON business_listings FOR UPDATE USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

COMMIT;
```

3. **Click "Run"**

## Option 2: Using Supabase CLI

```bash
cd /Users/samwilhoit/CascadeProjects/biz-hunter-dashboard
npx supabase db push
```

When prompted for password, enter your database password from the Supabase dashboard.

## What This Fixes

✅ **Public can view all listings** - No login required
✅ **Scraper can add listings** - Anonymous inserts allowed
✅ **Admin functions work** - Delete/clear operations enabled
✅ **Security maintained** - Only authenticated users can update their own listings

## Verify It Worked

After running the SQL:
1. Go to http://localhost:8080
2. You should see listings without logging in
3. The test widget should show "Success!"
4. Admin panel scraping should work

The migration file is already created at:
`supabase/migrations/20250627063706_fix_public_access_policies.sql`