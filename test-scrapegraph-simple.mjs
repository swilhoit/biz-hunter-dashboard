import { smartScraper, getCredits } from 'scrapegraph-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testScrapeGraph() {
  const apiKey = process.env.VITE_SCRAPEGRAPH_API_KEY || process.env.SCRAPEGRAPH_API_KEY;
  
  if (!apiKey) {
    console.error('❌ No ScrapeGraph API key found!');
    console.log('Please add VITE_SCRAPEGRAPH_API_KEY to your .env file');
    return;
  }
  
  console.log('🤖 Testing ScrapeGraph AI...');
  console.log('API Key:', apiKey.substring(0, 10) + '...');
  
  try {
    // First, check credits
    console.log('\n💳 Checking API credits...');
    const credits = await getCredits(apiKey);
    console.log(`Available credits: ${credits}`);
    
    // Test scraping QuietLight
    console.log('\n🔍 Testing QuietLight scrape...');
    const url = 'https://quietlight.com/listings/';
    const prompt = `Extract ALL business listings from this page. For EACH listing, extract:
      - name: Business name or title
      - askingPrice: The asking price (e.g., "$1.2M")
      - url: The FULL URL to the listing detail page
      - description: Brief description
      - isFBA: true if it mentions Amazon FBA, false otherwise
      
      Return ONLY valid JSON with a "listings" array.`;
    
    console.log('Scraping:', url);
    const result = await smartScraper(apiKey, url, prompt);
    
    console.log('\n📊 Raw result:');
    console.log(JSON.stringify(result, null, 2));
    
    // Try to parse if it's a string
    let parsed = result;
    if (typeof result === 'string') {
      try {
        parsed = JSON.parse(result);
      } catch (e) {
        console.log('Could not parse as JSON');
      }
    }
    
    if (parsed && parsed.listings) {
      console.log(`\n✅ Found ${parsed.listings.length} listings!`);
      parsed.listings.slice(0, 3).forEach((listing, i) => {
        console.log(`\n${i + 1}. ${listing.name || 'Unnamed'}`);
        console.log(`   Price: ${listing.askingPrice || 'N/A'}`);
        console.log(`   URL: ${listing.url || 'N/A'}`);
        console.log(`   FBA: ${listing.isFBA ? 'Yes' : 'No'}`);
      });
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testScrapeGraph();