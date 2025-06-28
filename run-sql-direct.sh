#!/bin/bash

# Direct SQL execution using psql
export PGPASSWORD="8\$&.sQJ3Ms26KBm"

echo "🔧 Executing RLS policy fix directly..."

psql "postgresql://postgres.ueemtnohgkovwzodzxdr:8\$&.sQJ3Ms26KBm@aws-0-us-east-2.pooler.supabase.com:6543/postgres" << 'EOF'
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can view active listings" ON business_listings;
DROP POLICY IF EXISTS "Authenticated users can create listings" ON business_listings;
DROP POLICY IF EXISTS "Users can update their own listings" ON business_listings;

-- Create new permissive policies
CREATE POLICY "Public read access" ON business_listings FOR SELECT USING (true);
CREATE POLICY "Anonymous insert access" ON business_listings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anonymous delete access" ON business_listings FOR DELETE USING (true);
CREATE POLICY "Authenticated update access" ON business_listings FOR UPDATE USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

-- Verify the new policies
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'business_listings' ORDER BY cmd;
EOF

echo "✅ RLS policies updated!"