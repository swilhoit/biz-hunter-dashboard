import dotenv from 'dotenv';
dotenv.config();

// Test if SCRAPER_API_KEY is set
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;

console.log('🔧 ScraperAPI Configuration Test');
console.log('================================');
console.log('SCRAPER_API_KEY:', SCRAPER_API_KEY ? `Set (${SCRAPER_API_KEY.substr(0, 8)}...)` : 'NOT SET - This is the problem!');

if (!SCRAPER_API_KEY) {
  console.log('\n❌ ERROR: SCRAPER_API_KEY is not configured!');
  console.log('📝 To fix this issue:');
  console.log('   1. Get your API key from https://www.scraperapi.com/');
  console.log('   2. Add to your .env file: SCRAPER_API_KEY=your_api_key_here');
  console.log('   3. Restart the server');
  console.log('\n⚠️  Without ScraperAPI, the scraper cannot bypass Cloudflare protection!');
} else {
  console.log('\n✅ SCRAPER_API_KEY is configured');
  console.log('📡 Testing ScraperAPI connection...');
  
  // Test a simple request
  const testUrl = 'https://httpbin.org/user-agent';
  const scraperApiUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(testUrl)}`;
  
  try {
    const response = await fetch(scraperApiUrl);
    if (response.ok) {
      const data = await response.text();
      console.log('✅ ScraperAPI is working!');
      console.log('Response:', data.substring(0, 100) + '...');
    } else {
      console.log('❌ ScraperAPI returned error:', response.status, response.statusText);
      if (response.status === 403) {
        console.log('⚠️  API key may be invalid or out of credits');
      }
    }
  } catch (error) {
    console.log('❌ Failed to connect to ScraperAPI:', error.message);
  }
}

console.log('\n📌 Current timeout configurations:');
console.log('   - ScraperAPI request timeout: 30 seconds');
console.log('   - Stage 1 site timeout: 60 seconds (may be too short)');
console.log('\n💡 Recommendation: Increase Stage 1 timeout to 120-180 seconds for ScraperAPI');