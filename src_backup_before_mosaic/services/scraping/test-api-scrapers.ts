// Simple testing script for ScraperAPI-based scrapers
import { EmpireFlippersScraper } from './scrapers/EmpireFlippersScraper';
import { ExitAdviserScraper } from './scrapers/ExitAdviserScraper';
import { ScrapingConfig } from './types';
import logger from './utils/logger';

// Directly read from process.env since we're running in a Node.js context
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;

async function testEmpireFlippers() {
  console.log('\n=== TESTING EMPIRE FLIPPERS SCRAPER ===');
  
  if (!SCRAPER_API_KEY) {
    console.error('Error: SCRAPER_API_KEY not found in environment variables');
    return;
  }
  
  console.log('ScraperAPI Key found. Running test...');
  
  try {
    const config: ScrapingConfig = {
      maxPages: 1,
      delayBetweenRequests: 2000,
      timeout: 60000
    };
    
    const scraper = new EmpireFlippersScraper(config);
    const result = await scraper.scrape();
    
    console.log(`Success: ${result.success}`);
    console.log(`Listings found: ${result.listings.length}`);
    
    if (result.listings.length > 0) {
      console.log('\nSample listing:');
      const sample = result.listings[0];
      console.log(`Name: ${sample.name}`);
      console.log(`Price: $${sample.askingPrice?.toLocaleString()}`);
      console.log(`Revenue: $${sample.annualRevenue?.toLocaleString()}`);
      console.log(`Industry: ${sample.industry}`);
      console.log(`Description: ${sample.description?.substring(0, 100)}...`);
    }
    
    if (result.errors?.length) {
      console.log('\nErrors:');
      result.errors.forEach(err => console.log(`- ${err}`));
    }
    
    return result;
  } catch (error) {
    console.error('Error running EmpireFlippersScraper:', error);
    return null;
  }
}

async function testExitAdviser() {
  console.log('\n=== TESTING EXIT ADVISER SCRAPER ===');
  
  if (!SCRAPER_API_KEY) {
    console.error('Error: SCRAPER_API_KEY not found in environment variables');
    return;
  }
  
  console.log('ScraperAPI Key found. Running test...');
  
  try {
    const config: ScrapingConfig = {
      maxPages: 1,
      delayBetweenRequests: 2000,
      timeout: 60000
    };
    
    const scraper = new ExitAdviserScraper(config);
    const result = await scraper.scrape();
    
    console.log(`Success: ${result.success}`);
    console.log(`Listings found: ${result.listings.length}`);
    
    if (result.listings.length > 0) {
      console.log('\nSample listing:');
      const sample = result.listings[0];
      console.log(`Name: ${sample.name}`);
      console.log(`Price: $${sample.askingPrice?.toLocaleString()}`);
      console.log(`Revenue: $${sample.annualRevenue?.toLocaleString()}`);
      console.log(`Industry: ${sample.industry}`);
      console.log(`Description: ${sample.description?.substring(0, 100)}...`);
    }
    
    if (result.errors?.length) {
      console.log('\nErrors:');
      result.errors.forEach(err => console.log(`- ${err}`));
    }
    
    return result;
  } catch (error) {
    console.error('Error running ExitAdviserScraper:', error);
    return null;
  }
}

// Export functions for use in other scripts
export { testEmpireFlippers, testExitAdviser };

// Immediately run the tests (ES modules don't have require.main === module check)
console.log('Testing ScraperAPI-based scrapers...');

Promise.all([
  testEmpireFlippers(),
  testExitAdviser()
])
.then(() => {
  console.log('\nAll tests completed.');
})
.catch(err => {
  console.error('Error running tests:', err);
});
