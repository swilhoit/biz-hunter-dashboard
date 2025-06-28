import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const scraperApiKey = process.env.SCRAPER_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase credentials not found');
  process.exit(1);
}

if (!scraperApiKey) {
  console.error('Error: SCRAPER_API_KEY not found in environment variables');
  console.log('Please add SCRAPER_API_KEY to your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchWithScraperAPI(url) {
  const apiUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(url)}&render=true`;
  
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

async function extractListingUrls(html) {
  // Extract listing URLs from the HTML
  const listingUrls = [];
  
  // Multiple patterns to match QuietLight URLs
  const patterns = [
    /<a[^>]+href=["']([^"']*\/project\/[^"']+)["']/gi,
    /<a[^>]+href=["']([^"']*\/listing\/[^"']+)["']/gi,
    /<a[^>]+href=["'](https:\/\/quietlight\.com\/[^"']+)["']/gi,
  ];
  
  for (const pattern of patterns) {
    let match;
    // Reset the pattern for each search
    pattern.lastIndex = 0;
    while ((match = pattern.exec(html)) !== null) {
      const url = match[1];
      if (url && !url.includes('#') && !url.includes('page/')) {
        listingUrls.push(url.startsWith('http') ? url : `https://quietlight.com${url}`);
      }
    }
  }
  
  return [...new Set(listingUrls)]; // Remove duplicates
}

async function findRealQuietLightUrls() {
  console.log('🔍 Starting QuietLight URL discovery with ScraperAPI...\n');
  
  // First, let's try to fetch the main listings page
  const mainPageHtml = await fetchWithScraperAPI('https://quietlight.com/listings/');
  
  if (!mainPageHtml) {
    console.error('Failed to fetch QuietLight listings page');
    return;
  }
  
  console.log('✅ Successfully fetched QuietLight listings page\n');
  
  // Extract listing URLs
  const listingUrls = extractListingUrls(mainPageHtml);
  
  console.log(`Found ${listingUrls.length} potential listing URLs:\n`);
  listingUrls.forEach(url => console.log(`  - ${url}`));
  
  // Now let's get our QuietLight listings from the database
  const { data: dbListings, error } = await supabase
    .from('business_listings')
    .select('id, name, original_url')
    .eq('source', 'QuietLight')
    .limit(10); // Start with first 10 for testing
  
  if (error) {
    console.error('Error fetching database listings:', error);
    return;
  }
  
  console.log('\n📊 Attempting to match database listings with real URLs...\n');
  
  // Try to match listings by visiting individual pages
  for (const listing of dbListings) {
    console.log(`\nChecking: ${listing.name.substring(0, 60)}...`);
    
    // Try to find a matching URL from our extracted URLs
    const nameWords = listing.name.toLowerCase().split(' ').slice(0, 5);
    let matchedUrl = null;
    
    for (const url of listingUrls) {
      const urlLower = url.toLowerCase();
      const matchCount = nameWords.filter(word => urlLower.includes(word)).length;
      
      if (matchCount >= 2) { // At least 2 words match
        matchedUrl = url;
        break;
      }
    }
    
    if (matchedUrl) {
      console.log(`  ✓ Potential match: ${matchedUrl}`);
      
      // Update the database
      const { error: updateError } = await supabase
        .from('business_listings')
        .update({ original_url: matchedUrl })
        .eq('id', listing.id);
      
      if (updateError) {
        console.error(`  ✗ Failed to update: ${updateError.message}`);
      } else {
        console.log(`  ✓ Updated in database`);
      }
    } else {
      console.log(`  ✗ No matching URL found`);
    }
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n✨ URL discovery process completed');
}

// Run the script
findRealQuietLightUrls()
  .catch(err => console.error('Script error:', err))
  .finally(() => process.exit());