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
      }
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

async function extractListingIds(html) {
  // Extract QuietLight listing IDs from HTML
  const listingIds = [];
  
  // Multiple patterns to match QuietLight listing URLs
  const patterns = [
    /\/listings\/(\d+)\//g,
    /href=["']\/listings\/(\d+)\/["']/g,
    /href=["']https:\/\/quietlight\.com\/listings\/(\d+)\/["']/g
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const id = match[1];
      if (id && id.length >= 6) { // QuietLight IDs are typically 6+ digits
        listingIds.push(id);
      }
    }
  }
  
  return [...new Set(listingIds)]; // Remove duplicates
}

async function getRealQuietLightUrls() {
  console.log('🕵️ Getting real QuietLight listing IDs with ScraperAPI...\n');
  
  // Try to fetch the main listings page
  const mainPageHtml = await fetchWithScraperAPI('https://quietlight.com/listings/');
  
  if (!mainPageHtml) {
    console.error('❌ Failed to fetch QuietLight listings page');
    return;
  }
  
  console.log('✅ Successfully fetched QuietLight listings page');
  
  // Extract listing IDs
  const listingIds = await extractListingIds(mainPageHtml);
  console.log(`\n📋 Found ${listingIds.length} real QuietLight listing IDs:`);
  
  // Show first 20 IDs
  listingIds.slice(0, 20).forEach((id, index) => {
    console.log(`  ${index + 1}. https://quietlight.com/listings/${id}/`);
  });
  
  if (listingIds.length === 0) {
    console.log('\n⚠️ No listing IDs found. Let me try a different approach...');
    
    // Try to extract any URLs that contain "listings"
    const listingUrls = [];
    const urlPattern = /href=["'](\/[^"']*listings[^"']*)["']/g;
    let match;
    while ((match = urlPattern.exec(mainPageHtml)) !== null) {
      listingUrls.push(`https://quietlight.com${match[1]}`);
    }
    
    console.log(`Found ${listingUrls.length} potential listing URLs:`);
    listingUrls.slice(0, 10).forEach(url => console.log(`  - ${url}`));
  }
  
  // Now let's update some of our QuietLight listings with real IDs
  if (listingIds.length > 0) {
    console.log('\n🔄 Updating database with real QuietLight listing IDs...');
    
    const { data: dbListings, error } = await supabase
      .from('business_listings')
      .select('id, name, original_url')
      .eq('source', 'QuietLight')
      .limit(Math.min(listingIds.length, 20));
    
    if (error) {
      console.error('Error fetching database listings:', error);
      return;
    }
    
    let updateCount = 0;
    for (let i = 0; i < Math.min(dbListings.length, listingIds.length); i++) {
      const listing = dbListings[i];
      const realId = listingIds[i];
      const realUrl = `https://quietlight.com/listings/${realId}/`;
      
      const { error: updateError } = await supabase
        .from('business_listings')
        .update({ original_url: realUrl })
        .eq('id', listing.id);
      
      if (updateError) {
        console.error(`❌ Failed to update ${listing.name}:`, updateError);
      } else {
        console.log(`✅ ${listing.name.substring(0, 50)}...`);
        console.log(`   Updated URL: ${realUrl}`);
        updateCount++;
      }
    }
    
    console.log(`\n✨ Successfully updated ${updateCount} listings with real QuietLight URLs`);
  }
}

// Run the script
getRealQuietLightUrls()
  .catch(err => console.error('Script error:', err))
  .finally(() => process.exit());