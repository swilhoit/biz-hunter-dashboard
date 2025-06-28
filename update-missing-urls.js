import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or key not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Source-specific URL creation
function createDefaultUrl(source, name, id) {
  // Create a fallback URL for listings that don't have one
  const sourceMap = {
    'BizBuySell': 'https://www.bizbuysell.com/businesses/',
    'EmpireFlippers': 'https://empireflippers.com/marketplace/',
    'Flippa': 'https://flippa.com/businesses/',
    'MicroAcquire': 'https://microacquire.com/marketplace/',
    'QuietLight': 'https://quietlight.com/listings/',
    'ExitAdviser': 'https://exitadviser.com/businesses-for-sale/',
    'BizQuest': 'https://www.bizquest.com/business-for-sale/',
    'Acquire': 'https://acquire.com/startups/'
  };
  
  const baseUrl = sourceMap[source] || 'https://bizbuysell.com/businesses/';
  const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'listing';
  return `${baseUrl}${slug}-${id || Date.now()}`;
}

// Function to validate URL
function isValidUrl(urlString) {
  if (!urlString) return false;
  
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

// Main function to fix missing URLs
async function fixMissingUrls() {
  console.log('Starting to fix missing URLs in existing listings...');
  
  // First, get all listings with missing or invalid URLs
  const { data: listings, error } = await supabase
    .from('business_listings')
    .select('*')
    .or('original_url.is.null,original_url.eq.');
  
  if (error) {
    console.error('Error fetching listings with missing URLs:', error);
    return;
  }
  
  console.log(`Found ${listings?.length || 0} listings with missing or invalid URLs`);
  
  // Keep track of updates
  const updates = [];
  const errors = [];
  
  // Process each listing
  for (const listing of listings || []) {
    try {
      let originalUrl = listing.original_url;
      
      // Check if we need to create a URL
      if (!originalUrl || !isValidUrl(originalUrl)) {
        originalUrl = createDefaultUrl(
          listing.source, 
          listing.name, 
          listing.id
        );
        
        // Update the listing in the database
        const { error: updateError } = await supabase
          .from('business_listings')
          .update({ original_url: originalUrl })
          .eq('id', listing.id);
        
        if (updateError) {
          console.error(`Failed to update listing ${listing.id}:`, updateError);
          errors.push({ id: listing.id, error: updateError });
        } else {
          console.log(`Updated listing "${listing.name}" with URL: ${originalUrl}`);
          updates.push({ id: listing.id, name: listing.name, url: originalUrl });
        }
      }
    } catch (err) {
      console.error(`Error processing listing ${listing.id}:`, err);
      errors.push({ id: listing.id, error: err.message });
    }
  }
  
  // Log results
  console.log(`\nUpdate Summary:`);
  console.log(`Total listings with missing URLs: ${listings?.length || 0}`);
  console.log(`Successfully updated: ${updates.length}`);
  console.log(`Errors: ${errors.length}`);
  
  // Save results to file for reference
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.writeFileSync(
    `url-update-results-${timestamp}.json`,
    JSON.stringify({ updates, errors }, null, 2)
  );
  
  console.log(`\nResults saved to url-update-results-${timestamp}.json`);
}

// Run the function
fixMissingUrls()
  .catch(err => console.error('Unhandled error:', err))
  .finally(() => console.log('Script completed'));
