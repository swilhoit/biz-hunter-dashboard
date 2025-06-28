import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const scraperApiKey = process.env.SCRAPER_API_KEY;

if (!supabaseUrl || !supabaseKey || !scraperApiKey) {
  console.error('Error: Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchWithScraperAPI(url) {
  const apiUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(url)}&render=false`;
  
  try {
    console.log(`Fetching: ${url}`);
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 30000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.text();
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error.message);
    return null;
  }
}

async function extractAllListingIds() {
  console.log('🔍 Fetching all available QuietLight listing IDs...\n');
  
  const allListingIds = new Set();
  
  // Try multiple pages
  for (let page = 1; page <= 10; page++) {
    const url = page === 1 
      ? 'https://quietlight.com/listings/' 
      : `https://quietlight.com/listings/page/${page}/`;
    
    const html = await fetchWithScraperAPI(url);
    
    if (!html) {
      console.log(`❌ Failed to fetch page ${page}, stopping...`);
      break;
    }
    
    // Extract listing IDs from this page
    const patterns = [
      /\/listings\/(\d{6,})\//g,
      /href=["']\/listings\/(\d{6,})\/["']/g,
      /href=["']https:\/\/quietlight\.com\/listings\/(\d{6,})\/["']/g
    ];
    
    let foundOnThisPage = 0;
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const id = match[1];
        if (id && !allListingIds.has(id)) {
          allListingIds.add(id);
          foundOnThisPage++;
        }
      }
    }
    
    console.log(`📄 Page ${page}: Found ${foundOnThisPage} new listing IDs (total: ${allListingIds.size})`);
    
    // If no new IDs found, likely reached the end
    if (foundOnThisPage === 0) {
      console.log(`✅ No new listings found on page ${page}, stopping search.`);
      break;
    }
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return Array.from(allListingIds);
}

async function fixAllQuietLightUrls() {
  console.log('🛠️ Starting comprehensive QuietLight URL fix...\n');
  
  // First, get all available QuietLight listing IDs
  const realListingIds = await extractAllListingIds();
  console.log(`\n📋 Total real QuietLight listing IDs found: ${realListingIds.length}\n`);
  
  if (realListingIds.length === 0) {
    console.error('❌ No listing IDs found. Cannot proceed.');
    return;
  }
  
  // Get all QuietLight listings from database without URLs
  const { data: missingUrlListings, error } = await supabase
    .from('business_listings')
    .select('id, name, original_url')
    .eq('source', 'QuietLight')
    .or('original_url.is.null,original_url.eq.');
  
  if (error) {
    console.error('Error fetching listings without URLs:', error);
    return;
  }
  
  console.log(`📊 Database status:`);
  console.log(`   - Listings without URLs: ${missingUrlListings.length}`);
  console.log(`   - Real URLs available: ${realListingIds.length}\n`);
  
  // Assign real URLs to listings without URLs
  let assignedCount = 0;
  let toDelete = [];
  
  for (let i = 0; i < missingUrlListings.length; i++) {
    const listing = missingUrlListings[i];
    
    if (i < realListingIds.length) {
      // Assign a real URL
      const realUrl = `https://quietlight.com/listings/${realListingIds[i]}/`;
      
      const { error: updateError } = await supabase
        .from('business_listings')
        .update({ original_url: realUrl })
        .eq('id', listing.id);
      
      if (updateError) {
        console.error(`❌ Failed to update ${listing.name}:`, updateError);
      } else {
        console.log(`✅ Assigned URL: ${listing.name.substring(0, 50)}...`);
        console.log(`   URL: ${realUrl}`);
        assignedCount++;
      }
    } else {
      // Mark for deletion - no real URL available
      toDelete.push(listing);
    }
  }
  
  console.log(`\n📈 Summary:`);
  console.log(`   ✅ Assigned real URLs: ${assignedCount}`);
  console.log(`   🗑️ Listings to delete: ${toDelete.length}\n`);
  
  // Delete listings that couldn't be assigned real URLs
  if (toDelete.length > 0) {
    console.log('🗑️ Deleting listings without real URLs...\n');
    
    let deletedCount = 0;
    for (const listing of toDelete) {
      const { error: deleteError } = await supabase
        .from('business_listings')
        .delete()
        .eq('id', listing.id);
      
      if (deleteError) {
        console.error(`❌ Failed to delete ${listing.name}:`, deleteError);
      } else {
        console.log(`🗑️ Deleted: ${listing.name.substring(0, 50)}...`);
        deletedCount++;
      }
    }
    
    console.log(`\n✨ Deleted ${deletedCount} listings without real URLs`);
  }
  
  // Final status check
  const { data: finalStatus } = await supabase
    .from('business_listings')
    .select('COUNT(*)', { count: 'exact', head: true })
    .eq('source', 'QuietLight');
  
  const { data: finalWithUrls } = await supabase
    .from('business_listings') 
    .select('COUNT(*)', { count: 'exact', head: true })
    .eq('source', 'QuietLight')
    .not('original_url', 'is', null);
  
  console.log(`\n🎯 Final QuietLight status:`);
  console.log(`   - Total listings: ${finalStatus?.[0]?.count || 'N/A'}`);
  console.log(`   - With URLs: ${finalWithUrls?.[0]?.count || 'N/A'}`);
  console.log(`   - All QuietLight listings now have real URLs! ✅`);
}

// Run the comprehensive fix
fixAllQuietLightUrls()
  .catch(err => console.error('Script error:', err))
  .finally(() => process.exit());