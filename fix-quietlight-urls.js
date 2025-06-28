import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or key not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// QuietLight's actual URL structure appears to be:
// https://quietlight.com/project/[business-slug]/
// We need to map the listings to their real URLs

const quietLightRealUrls = {
  // Example mappings - you'll need to add the real URLs here
  // 'Distressed $28M Global Footwear Platform': 'https://quietlight.com/project/actual-url/',
  // Add more mappings as you find them
};

async function fixQuietLightUrls() {
  console.log('Fetching QuietLight listings to fix URLs...\n');
  
  // Get all QuietLight listings
  const { data: listings, error } = await supabase
    .from('business_listings')
    .select('id, name, original_url')
    .eq('source', 'QuietLight')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching QuietLight listings:', error);
    return;
  }
  
  console.log(`Found ${listings.length} QuietLight listings\n`);
  
  // Display current state
  console.log('Current QuietLight listings and their URLs:');
  console.log('=' .repeat(80));
  
  listings.forEach((listing, index) => {
    console.log(`\n${index + 1}. ${listing.name}`);
    console.log(`   Current URL: ${listing.original_url}`);
    console.log(`   ID: ${listing.id}`);
    
    // Check if we have a real URL mapping
    const realUrl = quietLightRealUrls[listing.name];
    if (realUrl) {
      console.log(`   ✓ Real URL found: ${realUrl}`);
    } else {
      console.log(`   ✗ No real URL mapping found`);
    }
  });
  
  console.log('\n' + '=' .repeat(80));
  console.log('\nTo fix these URLs, you need to:');
  console.log('1. Visit https://quietlight.com and find the actual listing URLs');
  console.log('2. Add them to the quietLightRealUrls object in this script');
  console.log('3. Run this script again with --update flag to apply the changes');
  
  // If update flag is passed, apply the updates
  if (process.argv.includes('--update')) {
    console.log('\n🔄 Update mode enabled. Applying URL fixes...\n');
    
    let updateCount = 0;
    for (const listing of listings) {
      const realUrl = quietLightRealUrls[listing.name];
      if (realUrl && realUrl !== listing.original_url) {
        const { error: updateError } = await supabase
          .from('business_listings')
          .update({ original_url: realUrl })
          .eq('id', listing.id);
        
        if (updateError) {
          console.error(`❌ Failed to update ${listing.name}:`, updateError);
        } else {
          console.log(`✅ Updated ${listing.name} with real URL: ${realUrl}`);
          updateCount++;
        }
      }
    }
    
    console.log(`\n✨ Updated ${updateCount} listings with real URLs`);
  }
  
  // Alternative approach: Try to construct better URLs based on the listing names
  console.log('\n📍 Alternative: Constructing potential URLs based on listing names...\n');
  
  listings.slice(0, 5).forEach(listing => {
    // Extract key terms from the listing name for URL construction
    const name = listing.name.toLowerCase();
    
    // Try to extract business type or key identifier
    let slug = '';
    
    // Common patterns in QuietLight listings
    if (name.includes('footwear')) slug = 'footwear-platform';
    else if (name.includes('electrolyte')) slug = 'electrolyte-brand';
    else if (name.includes('health supplement')) slug = 'health-supplement-business';
    else if (name.includes('edtech')) slug = 'edtech-business';
    else if (name.includes('pet')) slug = 'pet-authority-site';
    else {
      // Generic slug from first few words
      slug = name.split(' ').slice(0, 3).join('-').replace(/[^a-z0-9-]/g, '');
    }
    
    const potentialUrl = `https://quietlight.com/project/${slug}/`;
    console.log(`${listing.name.substring(0, 50)}...`);
    console.log(`  Potential URL: ${potentialUrl}`);
  });
}

// Run the script
fixQuietLightUrls()
  .catch(err => console.error('Error:', err))
  .finally(() => process.exit());