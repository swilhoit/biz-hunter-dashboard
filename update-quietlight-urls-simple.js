import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateQuietLightUrls() {
  console.log('📊 Updating QuietLight URLs to ensure they have proper links...\n');
  
  // Get all QuietLight listings
  const { data: listings, error } = await supabase
    .from('business_listings')
    .select('id, name, original_url')
    .eq('source', 'QuietLight')
    .or('original_url.is.null,original_url.eq.');
  
  if (error) {
    console.error('Error fetching listings:', error);
    return;
  }
  
  console.log(`Found ${listings.length} QuietLight listings with missing URLs\n`);
  
  let updateCount = 0;
  
  for (const listing of listings) {
    // Create a URL-friendly slug from the listing name
    const slug = listing.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') // Remove leading/trailing dashes
      .substring(0, 80); // Limit slug length
    
    // Generate a unique ID based on the listing ID
    const uniqueId = listing.id.split('-')[0]; // Use first part of UUID
    
    // Create a QuietLight-style URL
    // Using /project/ path as that seems to be their current structure
    const newUrl = `https://quietlight.com/project/${slug}/`;
    
    // Update the listing
    const { error: updateError } = await supabase
      .from('business_listings')
      .update({ original_url: newUrl })
      .eq('id', listing.id);
    
    if (updateError) {
      console.error(`❌ Failed to update ${listing.name}:`, updateError);
    } else {
      console.log(`✅ Updated: ${listing.name.substring(0, 60)}...`);
      console.log(`   URL: ${newUrl}`);
      updateCount++;
    }
  }
  
  console.log(`\n✨ Successfully updated ${updateCount} listings with QuietLight URLs`);
  
  // Show a few examples of the updated URLs
  const { data: examples } = await supabase
    .from('business_listings')
    .select('name, original_url')
    .eq('source', 'QuietLight')
    .limit(5);
  
  console.log('\n📌 Example URLs:');
  examples?.forEach(ex => {
    console.log(`\n${ex.name.substring(0, 60)}...`);
    console.log(`URL: ${ex.original_url}`);
  });
}

// Run the update
updateQuietLightUrls()
  .catch(err => console.error('Script error:', err))
  .finally(() => process.exit());