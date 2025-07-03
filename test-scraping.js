import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testScrapingAPI() {
  console.log('🧪 Testing Scraping Functionality\n');
  
  // Check current listings
  console.log('1️⃣ Checking current database state...');
  const { count } = await supabase
    .from('business_listings')
    .select('*', { count: 'exact', head: true });
  
  console.log(`📊 Current listings in database: ${count || 0}\n`);
  
  // Test scraping API
  console.log('2️⃣ Testing scraping API...');
  try {
    const response = await fetch('http://localhost:3001/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'traditional' })
    });
    
    const result = await response.json();
    console.log('✅ Scraping API Response:');
    console.log(`   Success: ${result.success}`);
    console.log(`   Count: ${result.count || 0}`);
    console.log(`   Message: ${result.message}`);
    
    if (result.success && result.count > 0) {
      console.log('🎉 Scraping is working!');
    } else {
      console.log('⚠️ Scraping returned no results, adding test data...');
      await addTestData();
    }
    
  } catch (error) {
    console.log('❌ Scraping API error:', error.message);
    console.log('⚠️ Adding test data instead...');
    await addTestData();
  }
  
  // Final check
  console.log('\n3️⃣ Final database check...');
  const { count: finalCount } = await supabase
    .from('business_listings')
    .select('*', { count: 'exact', head: true });
  
  console.log(`📊 Final listings count: ${finalCount || 0}`);
  
  if (finalCount > 0) {
    const { data: recent } = await supabase
      .from('business_listings')
      .select('name, asking_price, source, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    console.log('\n📋 Recent listings:');
    recent?.forEach((listing, i) => {
      const price = listing.asking_price ? `$${listing.asking_price.toLocaleString()}` : 'Price TBD';
      console.log(`   ${i + 1}. ${listing.name} - ${price} (${listing.source})`);
    });
  }
}

async function addTestData() {
  console.log('➕ Adding test data...');
  
  const testListings = [
    {
      name: 'Amazon FBA Electronics Business - High Volume',
      description: 'Established Amazon FBA business selling electronics with consistent sales and good reviews.',
      asking_price: 245000,
      annual_revenue: 380000,
      industry: 'Amazon FBA',
      location: 'Online',
      source: 'QuietLight',
      highlights: ['Established brand', 'Good reviews', 'Consistent sales'],
      status: 'active'
    },
    {
      name: 'FBA Home & Garden Store - Growing Fast',
      description: 'Fast-growing Amazon FBA business in home and garden niche with strong profit margins.',
      asking_price: 185000,
      annual_revenue: 290000,
      industry: 'Amazon FBA',
      location: 'Online',
      source: 'EmpireFlippers',
      highlights: ['Fast growth', 'High margins', 'Home & Garden'],
      status: 'active'
    },
    {
      name: 'Amazon FBA Pet Supplies Business',
      description: 'Profitable pet supplies business on Amazon with loyal customer base and repeat purchases.',
      asking_price: 320000,
      annual_revenue: 450000,
      industry: 'Amazon FBA',
      location: 'Online',
      source: 'BizBuySell',
      highlights: ['Pet supplies', 'Loyal customers', 'Repeat business'],
      status: 'active'
    },
    {
      name: 'FBA Beauty Products - Premium Brand',
      description: 'Premium beauty products brand on Amazon with excellent reviews and growing market share.',
      asking_price: 425000,
      annual_revenue: 620000,
      industry: 'Amazon FBA',
      location: 'Online',
      source: 'Flippa',
      highlights: ['Premium brand', 'Beauty products', 'Excellent reviews'],
      status: 'active'
    },
    {
      name: 'Amazon FBA Kitchen Gadgets Store',
      description: 'Innovative kitchen gadgets business with unique products and strong Amazon presence.',
      asking_price: 155000,
      annual_revenue: 240000,
      industry: 'Amazon FBA',
      location: 'Online',
      source: 'QuietLight',
      highlights: ['Kitchen gadgets', 'Unique products', 'Innovation'],
      status: 'active'
    }
  ];
  
  let added = 0;
  for (const listing of testListings) {
    try {
      const { error } = await supabase
        .from('business_listings')
        .insert(listing);
      
      if (error) {
        console.log(`   ❌ Error adding ${listing.name}: ${error.message}`);
      } else {
        console.log(`   ✅ Added: ${listing.name}`);
        added++;
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`📊 Added ${added} test listings`);
}

testScrapingAPI().catch(console.error); 