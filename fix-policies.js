import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ueemtnohgkovwzodzxdr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlZW10bm9oZ2tvdnd6b2R6eGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjcyOTUsImV4cCI6MjA2NjQ0MzI5NX0.6_bLS2rSI-XsSwwVB5naQS7OYtyemtXvjn2y5MUM9xk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔧 Attempting to fix RLS policies...');

// Try to execute the policies fix
const sql = `
-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view active listings" ON business_listings;
DROP POLICY IF EXISTS "Authenticated users can create listings" ON business_listings; 
DROP POLICY IF EXISTS "Users can update their own listings" ON business_listings;

-- Create permissive policies
CREATE POLICY "Allow all reads" ON business_listings FOR SELECT USING (true);
CREATE POLICY "Allow all inserts" ON business_listings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all deletes" ON business_listings FOR DELETE USING (true);
CREATE POLICY "Allow all updates" ON business_listings FOR UPDATE USING (true);
`;

console.log('SQL to execute:', sql);
console.log('\nNote: This requires admin/service role permissions.');
console.log('The anon key cannot execute DDL statements.');
console.log('\nPlease run this SQL in the Supabase Dashboard SQL Editor:');
console.log('https://supabase.com/dashboard/project/ueemtnohgkovwzodzxdr/sql/new');