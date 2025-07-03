import dotenv from 'dotenv';
dotenv.config();

const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;

console.log('🧪 Testing ScraperAPI with render=true');
console.log('=====================================');

const testUrl = 'https://quietlight.com/amazon-fba-businesses-for-sale/';
const scraperUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(testUrl)}&render=true&country_code=us`;

console.log('URL:', testUrl);
console.log('Render:', 'true (JavaScript enabled)');
console.log('Timeout:', '45 seconds');
console.log('\nFetching...');

try {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);
  
  const startTime = Date.now();
  const response = await fetch(scraperUrl, { signal: controller.signal });
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  
  clearTimeout(timeoutId);
  
  if (response.ok) {
    const html = await response.text();
    console.log(`\n✅ Success! Got ${html.length} characters in ${elapsed}s`);
    
    // Check for Cloudflare
    if (html.includes('Cloudflare') || html.includes('Access denied')) {
      console.log('⚠️  Still contains Cloudflare - may need premium features');
    } else {
      console.log('✅ Cloudflare bypassed!');
    }
    
    // Check for real content
    const hasListings = html.includes('listing-item') || html.includes('business-listing');
    const hasFBA = html.includes('FBA') || html.includes('Amazon');
    const hasPrice = html.includes('$') && html.includes('asking-price');
    
    console.log('\nContent check:');
    console.log('  Listings found:', hasListings ? '✅' : '❌');
    console.log('  FBA content:', hasFBA ? '✅' : '❌');
    console.log('  Price data:', hasPrice ? '✅' : '❌');
    
    // Save a sample for inspection
    if (hasListings || hasFBA) {
      console.log('\n✅ Scraper is working properly with render=true!');
    } else {
      console.log('\n⚠️  No listings found - may need to check selectors');
    }
  } else {
    console.log(`\n❌ ScraperAPI error: ${response.status} ${response.statusText}`);
  }
} catch (error) {
  console.log(`\n❌ Error: ${error.message}`);
}

process.exit(0);