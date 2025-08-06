import dotenv from 'dotenv';
dotenv.config();

console.log('\n🔍 DEBUGGING SCRAPING ISSUE');
console.log('===========================');

// Check environment variables
console.log('\n1. Environment Variables:');
console.log('   SCRAPER_API_KEY:', process.env.SCRAPER_API_KEY ? `Set (${process.env.SCRAPER_API_KEY.substr(0, 8)}...)` : 'NOT SET');
console.log('   VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'Set' : 'NOT SET');
console.log('   VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'NOT SET');

// Test a simple ScraperAPI request
console.log('\n2. Testing ScraperAPI directly:');
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;

if (SCRAPER_API_KEY) {
  const testUrl = 'https://quietlight.com/amazon-fba-businesses-for-sale/';
  const scraperUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(testUrl)}&render=false&country_code=us`;
  
  console.log('   Testing URL:', testUrl);
  console.log('   Timeout: 30 seconds');
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const startTime = Date.now();
    const response = await fetch(scraperUrl, { signal: controller.signal });
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const html = await response.text();
      console.log(`   ✅ Success! Got ${html.length} characters in ${elapsed}s`);
      
      // Check if it's Cloudflare blocked
      if (html.includes('Cloudflare') || html.includes('Access denied')) {
        console.log('   ⚠️  WARNING: Response contains Cloudflare block');
      } else {
        console.log('   ✅ No Cloudflare block detected');
      }
      
      // Check for listings
      if (html.includes('listing') || html.includes('FBA')) {
        console.log('   ✅ Found listing-related content');
      }
    } else {
      console.log(`   ❌ ScraperAPI returned: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
} else {
  console.log('   ❌ Cannot test - SCRAPER_API_KEY not set');
}

console.log('\n3. Issue Analysis:');
console.log('   The enhanced scraper has its own fetchPage method that:');
console.log('   - Makes direct ScraperAPI calls (good)');
console.log('   - Falls back to direct fetch on failure (bad - will be blocked by Cloudflare)');
console.log('   - Has a short 20-second timeout (may be too short for ScraperAPI)');
console.log('\n   The server\'s fetchPageWithScraperAPI is properly configured but not being used.');

console.log('\n4. Recommendations:');
console.log('   a) Increase timeout in enhanced scraper from 20s to 45s');
console.log('   b) Remove direct fetch fallback in enhanced scraper');
console.log('   c) OR: Modify enhanced scraper to use server\'s fetchPageWithScraperAPI');

process.exit(0);