import { ScrapingService } from './src/services/scraping/ScrapingService.ts';

async function testUpdatedScrapingService() {
  console.log('Testing updated ScrapingService with ScraperAPI...\n');
  
  const scrapingService = new ScrapingService();
  
  console.log('Available scrapers:', scrapingService.getAvailableScrapers());
  console.log();
  
  // Test just BizBuySell for now since it's working well
  console.log('Testing BizBuySell scraper through service...');
  
  try {
    const result = await scrapingService.scrapeSource('bizbuysell', { maxPages: 1 });
    
    console.log(`\nResults:`);
    console.log(`- Success: ${result.success}`);
    console.log(`- Listings found: ${result.listings.length}`);
    console.log(`- Total scraped: ${result.totalScraped}`);
    console.log(`- Errors: ${result.errors?.join(', ') || 'None'}`);
    
    if (result.listings.length > 0) {
      console.log('\nSample listings:');
      result.listings.slice(0, 3).forEach((listing, index) => {
        console.log(`\n${index + 1}. ${listing.name}`);
        console.log(`   Price: $${listing.askingPrice.toLocaleString()}`);
        console.log(`   Revenue: $${listing.annualRevenue.toLocaleString()}`);
        console.log(`   Location: ${listing.location}`);
        console.log(`   Industry: ${listing.industry}`);
        console.log(`   Source: ${listing.source}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing scraping service:', error.message);
  }
  
  console.log('\nTest completed!');
}

testUpdatedScrapingService().catch(console.error);