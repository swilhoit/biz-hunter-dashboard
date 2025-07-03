import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ueemtnohgkovwzodzxdr.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlZW10bm9oZ2tvdnd6b2R6eGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjcyOTUsImV4cCI6MjA2NjQ0MzI5NX0.6_bLS2rSI-XsSwwVB5naQS7OYtyemtXvjn2y5MUM9xk';
const supabase = createClient(supabaseUrl, supabaseKey);

const testListing = {
  name: 'Test FBA Business ' + Date.now(),
  description: 'Test description for debugging',
  asking_price: 500000,
  annual_revenue: 300000,
  location: 'USA',
  original_url: 'https://test.com/listing-' + Date.now(),
  industry: 'E-commerce',
  highlights: ['Test 1', 'Test 2', 'Test 3'].join(', '),
  source: 'Test'
};

console.log('Testing database insert with:', testListing);

const { data, error } = await supabase
  .from('business_listings')
  .insert(testListing)
  .select();

if (error) {
  console.error('Database error:', error);
} else {
  console.log('Success\! Inserted:', data);
}

process.exit(0);
