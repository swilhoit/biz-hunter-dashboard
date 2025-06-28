// Simple test script for refactored scrapers
import { config } from 'dotenv';
import { EmpireFlippersScraper } from './src/services/scraping/scrapers/EmpireFlippersScraper.js';
import { ExitAdviserScraper } from './src/services/scraping/scrapers/ExitAdviserScraper.js';

config();

async function testScraper(scraperName) {
  try {
    console.log(`🔍 Testing ${scraperName} scraper...`);
    
    let scraper;
    if (scraperName === 'empireflippers') {
      scraper = new EmpireFlippersScraper({
        maxPages: 1,
        delayBetweenRequests: 2000,
        timeout: 60000
      });
    } else if (scraperName === 'exitadviser') {
      scraper = new ExitAdviserScraper({
        maxPages: 1,
        delayBetweenRequests: 2000,
        timeout: 60000
      });
    } else {
      console.error(`Unknown scraper: ${scraperName}`);
      return;
    }
    
    console.log(`Using ScraperAPI key: ${process.env.SCRAPER_API_KEY ? '✅ Found' : '❌ Missing'}`);
    
    const result = await scraper.scrape();
    
    console.log(`\n📊 Results for ${scraperName}:`);
    console.log(`Status: ${result.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`Listings found: ${result.listings.length}`);
    console.log(`Errors: ${result.errors?.length || 0}`);
    
    if (result.errors?.length) {
      console.log('\nErrors:');
      result.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (result.listings.length > 0) {
      console.log('\nSample listings:');
      result.listings.slice(0, 3).forEach((listing, i) => {
        console.log(`  ${i + 1}. ${listing.name}`);
        console.log(`     Price: $${listing.askingPrice?.toLocaleString() || 'N/A'}`);
        console.log(`     Revenue: $${listing.annualRevenue?.toLocaleString() || 'N/A'}`);
        console.log(`     Industry: ${listing.industry || 'Unknown'}`);
        console.log(`     Location: ${listing.location || 'Unknown'}`);
        console.log(`     Description: ${listing.description?.substring(0, 100)}...`);
        console.log(`     URL: ${listing.originalUrl || 'N/A'}`);
        console.log();
      });
    }
  } catch (error) {
    console.error(`❌ Test failed for ${scraperName}:`, error);
  }
}

// Run tests
const args = process.argv.slice(2);
const scraperName = args[0] || 'empireflippers';

console.log('🚀 Testing refactored scrapers with ScraperAPI\n');
testScraper(scraperName).then(() => {
  console.log('\nTest completed!');
});
