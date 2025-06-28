#!/usr/bin/env node

// Script to apply migration using Supabase Management API
// This bypasses the need for database passwords

const fs = require('fs');
const https = require('https');

// Read the migration SQL
const migrationSQL = fs.readFileSync('./supabase/migrations/20250627063706_fix_public_access_policies.sql', 'utf8');

// Configuration
const PROJECT_REF = 'ueemtnohgkovwzodzxdr';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlZW10bm9oZ2tvdnd6b2R6eGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjcyOTUsImV4cCI6MjA2NjQ0MzI5NX0.6_bLS2rSI-XsSwwVB5naQS7OYtyemtXvjn2y5MUM9xk';

console.log('🚀 Applying migration to fix public access...');
console.log('Migration content:', migrationSQL.substring(0, 100) + '...');

// For now, output instructions for manual application
console.log('\n📋 To apply this migration:');
console.log('1. Go to: https://supabase.com/dashboard/project/' + PROJECT_REF + '/sql/new');
console.log('2. Copy and paste the migration SQL from:');
console.log('   supabase/migrations/20250627063706_fix_public_access_policies.sql');
console.log('3. Click "Run"\n');

console.log('Or use the Supabase CLI with your database password:');
console.log('npx supabase db push\n');

// Alternative: Direct SQL execution endpoint (requires service role key)
console.log('🔧 Testing current policies...');

// Test query to check current policies
const testQuery = `
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'business_listings'
ORDER BY cmd;
`;

const url = `https://${PROJECT_REF}.supabase.co/rest/v1/rpc/query`;
const options = {
  method: 'POST',
  headers: {
    'apikey': ANON_KEY,
    'Authorization': `Bearer ${ANON_KEY}`,
    'Content-Type': 'application/json'
  }
};

// Note: This won't work with anon key for DDL, but shows the approach
console.log('\n⚠️  Note: DDL statements require admin access.');
console.log('Please use one of the manual methods above.');