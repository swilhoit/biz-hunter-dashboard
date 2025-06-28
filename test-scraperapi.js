import { ScraperAPIBizBuySellScraper } from './src/services/scraping/scrapers/ScraperAPIBizBuySellScraper.ts';
import { ScraperAPIEmpireFlippersScraper } from './src/services/scraping/scrapers/ScraperAPIEmpireFlippersScraper.ts';

async function testScrapers() {
  console.log('Testing ScraperAPI implementation...\n');
  
  // Test BizBuySell
  console.log('Testing BizBuySell scraper...');
  const bizBuySellScraper = new ScraperAPIBizBuySellScraper({ maxPages: 1 });
  const bizBuySellResult = await bizBuySellScraper.scrape();
  
  console.log(`BizBuySell Results:`);
  console.log(`- Success: ${bizBuySellResult.success}`);
  console.log(`- Listings found: ${bizBuySellResult.listings.length}`);
  console.log(`- Errors: ${bizBuySellResult.errors?.join(', ') || 'None'}`);
  
  if (bizBuySellResult.listings.length > 0) {
    console.log('\nFirst listing:');
    const firstListing = bizBuySellResult.listings[0];
    console.log(`- Name: ${firstListing.name}`);
    console.log(`- Price: $${firstListing.askingPrice.toLocaleString()}`);
    console.log(`- Revenue: $${firstListing.annualRevenue.toLocaleString()}`);
    console.log(`- Industry: ${firstListing.industry}`);
    console.log(`- Location: ${firstListing.location}`);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test Empire Flippers
  console.log('Testing Empire Flippers scraper...');
  const empireFlippersScraper = new ScraperAPIEmpireFlippersScraper({ maxPages: 1 });
  const empireFlippersResult = await empireFlippersScraper.scrape();
  
  console.log(`Empire Flippers Results:`);
  console.log(`- Success: ${empireFlippersResult.success}`);
  console.log(`- Listings found: ${empireFlippersResult.listings.length}`);
  console.log(`- Errors: ${empireFlippersResult.errors?.join(', ') || 'None'}`);
  
  if (empireFlippersResult.listings.length > 0) {
    console.log('\nFirst listing:');
    const firstListing = empireFlippersResult.listings[0];
    console.log(`- Name: ${firstListing.name}`);
    console.log(`- Price: $${firstListing.askingPrice.toLocaleString()}`);
    console.log(`- Revenue: $${firstListing.annualRevenue.toLocaleString()}`);
    console.log(`- Industry: ${firstListing.industry}`);
    console.log(`- Location: ${firstListing.location}`);
  }
  
  console.log('\nTest completed!');
}

testScrapers().catch(console.error);