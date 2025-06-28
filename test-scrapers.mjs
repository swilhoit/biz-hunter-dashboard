// ES Module test script for ScraperAPI scrapers
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// Setup path for imports
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

async function runTests() {
  console.log('🚀 Testing ScraperAPI-based scrapers...');
  
  // Check if SCRAPER_API_KEY is available
  if (!process.env.SCRAPER_API_KEY) {
    console.error('❌ Error: SCRAPER_API_KEY not found in environment variables');
    return;
  }
  
  console.log('✅ SCRAPER_API_KEY found in environment');
  
  try {
    // Dynamically import the scrapers
    const { EmpireFlippersScraper } = await import('./src/services/scraping/scrapers/EmpireFlippersScraper.js');
    const { ExitAdviserScraper } = await import('./src/services/scraping/scrapers/ExitAdviserScraper.js');
    
    // Define minimal config
    const config = {
      maxPages: 1,
      delayBetweenRequests: 2000,
      timeout: 60000
    };
    
    // Test EmpireFlippersScraper
    console.log('\n📌 Testing EmpireFlippersScraper...');
    const efScraper = new EmpireFlippersScraper(config);
    const efResults = await efScraper.scrape();
    
    console.log(`Status: ${efResults.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`Listings found: ${efResults.listings.length}`);
    
    if (efResults.listings.length > 0) {
      const sample = efResults.listings[0];
      console.log('\nSample listing:');
      console.log(`Name: ${sample.name}`);
      console.log(`Price: $${sample.askingPrice?.toLocaleString() || 'N/A'}`);
      console.log(`Revenue: $${sample.annualRevenue?.toLocaleString() || 'N/A'}`);
      console.log(`URL: ${sample.originalUrl}`);
    }
    
    // Test ExitAdviserScraper
    console.log('\n📌 Testing ExitAdviserScraper...');
    const eaScraper = new ExitAdviserScraper(config);
    const eaResults = await eaScraper.scrape();
    
    console.log(`Status: ${eaResults.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`Listings found: ${eaResults.listings.length}`);
    
    if (eaResults.listings.length > 0) {
      const sample = eaResults.listings[0];
      console.log('\nSample listing:');
      console.log(`Name: ${sample.name}`);
      console.log(`Price: $${sample.askingPrice?.toLocaleString() || 'N/A'}`);
      console.log(`Revenue: $${sample.annualRevenue?.toLocaleString() || 'N/A'}`);
      console.log(`URL: ${sample.originalUrl}`);
    }
    
    console.log('\n✅ Tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error running tests:', error);
  }
}

// Run the tests
runTests();
