import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Sample listings data for testing
const sampleListings = [
  {
    name: "Profitable Restaurant in Downtown",
    asking_price: 350000,
    annual_revenue: 280000,
    industry: "Food & Beverage",
    location: "San Francisco, CA",
    description: "Established restaurant with loyal customer base. Prime location in downtown area with high foot traffic.",
    highlights: "Profitable, Established, Prime Location",
    original_url: "https://www.bizbuysell.com/business/1",
    scraped_at: new Date().toISOString().split('T')[0]
  },
  {
    name: "E-commerce Fashion Store",
    asking_price: 120000,
    annual_revenue: 95000,
    industry: "E-commerce",
    location: "Los Angeles, CA",
    description: "Online fashion store with strong social media presence and growing customer base.",
    highlights: "Growing, Online Business, Strong Brand",
    original_url: "https://www.bizbuysell.com/business/2",
    scraped_at: new Date().toISOString().split('T')[0]
  },
  {
    name: "Tech Consulting Services",
    asking_price: 500000,
    annual_revenue: 420000,
    industry: "Technology",
    location: "Austin, TX",
    description: "Specialized IT consulting firm serving enterprise clients. Established relationships and recurring contracts.",
    highlights: "Profitable, Established, Strong Cash Flow",
    original_url: "https://www.bizbuysell.com/business/3",
    scraped_at: new Date().toISOString().split('T')[0]
  },
  {
    name: "Profitable Restaurant in Downtown", // Duplicate to test uniqueness
    asking_price: 350000,
    annual_revenue: 280000,
    industry: "Food & Beverage",
    location: "San Francisco, CA",
    description: "Established restaurant with loyal customer base. Prime location in downtown area with high foot traffic.",
    highlights: "Profitable, Established, Prime Location",
    original_url: "https://www.bizbuysell.com/business/1", // Same URL - should be duplicate
    scraped_at: new Date().toISOString().split('T')[0]
  }
];

async function testSupabaseConnection() {
  console.log('🔗 Testing Supabase connection...');
  
  try {
    const { data, error } = await supabase
      .from('business_listings')
      .select('count(*)')
      .single();

    if (error) {
      console.log(`❌ Connection error: ${error.message}`);
      return false;
    }

    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.log(`❌ Connection error: ${error.message}`);
    return false;
  }
}

async function testDuplicateDetection() {
  console.log('\n🔍 Testing duplicate detection...');
  
  let saved = 0;
  let duplicates = 0;

  for (const listing of sampleListings) {
    try {
      const { data, error } = await supabase
        .from('business_listings')
        .upsert(listing, {
          onConflict: 'name,original_url',
          ignoreDuplicates: true
        })
        .select();

      if (error) {
        if (error.code === '23505') {
          duplicates++;
          console.log(`   🔄 Duplicate detected: ${listing.name}`);
        } else {
          console.log(`   ❌ Error: ${error.message}`);
        }
      } else if (data && data.length > 0) {
        saved++;
        console.log(`   ✅ Saved: ${listing.name}`);
      } else {
        duplicates++;
        console.log(`   🔄 Duplicate skipped: ${listing.name}`);
      }
    } catch (error) {
      console.log(`   ❌ Error with ${listing.name}: ${error.message}`);
    }
  }

  return { saved, duplicates };
}

async function getCurrentCount() {
  try {
    const { count, error } = await supabase
      .from('business_listings')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`   ⚠️ Error counting: ${error.message}`);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.log(`   ⚠️ Error counting: ${error.message}`);
    return 0;
  }
}

async function displayRecentListings() {
  try {
    const { data: listings, error } = await supabase
      .from('business_listings')
      .select('name, asking_price, industry, location, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.log(`   ⚠️ Error fetching listings: ${error.message}`);
      return;
    }

    if (listings && listings.length > 0) {
      console.log('\n📋 Current listings in database:');
      listings.forEach((listing, i) => {
        const price = listing.asking_price ? `$${listing.asking_price.toLocaleString()}` : 'Price TBD';
        const date = new Date(listing.created_at).toLocaleDateString();
        console.log(`${i + 1}. ${listing.name} - ${price} (${listing.industry || 'Business'}) - ${date}`);
      });
    } else {
      console.log('\n📭 No listings found in database');
    }
  } catch (error) {
    console.log(`   ⚠️ Error displaying listings: ${error.message}`);
  }
}

async function main() {
  console.log('🧪 Testing Supabase Integration for Business Listings');
  console.log('====================================================');

  // Test connection
  const connected = await testSupabaseConnection();
  if (!connected) {
    console.log('❌ Cannot proceed without Supabase connection');
    return;
  }

  // Get initial count
  const initialCount = await getCurrentCount();
  console.log(`📊 Initial count: ${initialCount} listings`);

  // Test duplicate detection
  const { saved, duplicates } = await testDuplicateDetection();

  // Get final count
  const finalCount = await getCurrentCount();

  // Results
  console.log('\n📊 Test Results:');
  console.log(`   Initial listings: ${initialCount}`);
  console.log(`   Final listings: ${finalCount}`);
  console.log(`   New listings saved: ${saved}`);
  console.log(`   Duplicates detected: ${duplicates}`);
  console.log(`   Expected new listings: 3`);
  console.log(`   Expected duplicates: 1`);

  // Verify results
  if (saved === 3 && duplicates === 1) {
    console.log('\n✅ All tests passed! Duplicate detection working correctly.');
  } else {
    console.log('\n⚠️ Test results don\'t match expectations. Check the implementation.');
  }

  // Display current listings
  await displayRecentListings();
}

main().catch(console.error);