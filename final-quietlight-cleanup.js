import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function finalQuietLightCleanup() {
  console.log('🧹 Final QuietLight cleanup - removing listings without URLs...\n');
  
  // Get all QuietLight listings without URLs
  const { data: listingsToDelete, error } = await supabase
    .from('business_listings')
    .select('id, name')
    .eq('source', 'QuietLight')
    .is('original_url', null);
  
  if (error) {
    console.error('Error fetching listings to delete:', error);
    return;
  }
  
  console.log(`Found ${listingsToDelete.length} QuietLight listings without URLs to delete\n`);
  
  let deletedCount = 0;
  for (const listing of listingsToDelete) {
    const { error: deleteError } = await supabase
      .from('business_listings')
      .delete()
      .eq('id', listing.id);
    
    if (deleteError) {
      console.error(`❌ Failed to delete ${listing.name}:`, deleteError);
    } else {
      console.log(`🗑️ Deleted: ${listing.name.substring(0, 60)}...`);
      deletedCount++;
    }
  }
  
  console.log(`\n✨ Deleted ${deletedCount} listings without URLs`);
  
  // Final status check
  const { data: finalStatus, error: statusError } = await supabase
    .from('business_listings')
    .select('id')
    .eq('source', 'QuietLight');
  
  const { data: finalWithUrls, error: urlError } = await supabase
    .from('business_listings')
    .select('id')
    .eq('source', 'QuietLight')
    .not('original_url', 'is', null);
  
  if (statusError || urlError) {
    console.error('Error getting final status:', statusError || urlError);
    return;
  }
  
  console.log(`\n🎯 Final QuietLight status:`);
  console.log(`   - Total listings: ${finalStatus.length}`);
  console.log(`   - With URLs: ${finalWithUrls.length}`);
  console.log(`   - Missing URLs: ${finalStatus.length - finalWithUrls.length}`);
  
  if (finalStatus.length === finalWithUrls.length) {
    console.log(`   ✅ All QuietLight listings now have URLs!`);
  } else {
    console.log(`   ⚠️ Still have ${finalStatus.length - finalWithUrls.length} listings without URLs`);
  }
}

// Run the cleanup
finalQuietLightCleanup()
  .catch(err => console.error('Script error:', err))
  .finally(() => process.exit());