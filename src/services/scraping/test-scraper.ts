import { ScrapingService } from './ScrapingService';
import { BizBuySellScraper } from './scrapers/BizBuySellScraper';
import logger from './utils/logger';

async function testBizBuySellScraper() {
  console.log('Testing BizBuySell scraper...');
  
  const scraper = new BizBuySellScraper({
    maxPages: 1,
    headless: false, // Set to true in production
    delayBetweenRequests: 2000,
  });

  try {
    const result = await scraper.scrape();
    console.log('Scraping Result:', {
      success: result.success,
      totalListings: result.listings.length,
      errors: result.errors,
    });

    if (result.listings.length > 0) {
      console.log('Sample listing:', result.listings[0]);
    }

    const metrics = scraper.getMetrics();
    console.log('Scraper Metrics:', metrics);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

async function testScrapingService() {
  console.log('Testing ScrapingService...');
  
  const service = new ScrapingService();
  console.log('Available scrapers:', service.getAvailableScrapers());

  try {
    // Test single source scraping
    const result = await service.scrapeSource('bizbuysell', {
      maxPages: 1,
      headless: false,
      delayBetweenRequests: 2000,
    });

    console.log('Service Result:', {
      success: result.success,
      totalListings: result.listings.length,
      errors: result.errors,
    });
  } catch (error) {
    console.error('Service test failed:', error);
  }
}

async function runTests() {
  console.log('Starting scraper tests...\n');
  
  try {
    await testBizBuySellScraper();
    console.log('\n' + '='.repeat(50) + '\n');
    await testScrapingService();
  } catch (error) {
    console.error('Test suite failed:', error);
  }
  
  console.log('\nTests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

export { testBizBuySellScraper, testScrapingService, runTests };