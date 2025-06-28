// Test script for refactored scrapers using ScraperManager
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check API key
const scraperApiKey = process.env.SCRAPER_API_KEY;
if (!scraperApiKey) {
  console.error('❌ SCRAPER_API_KEY not found in environment variables');
  process.exit(1);
}

console.log('🚀 Testing refactored scrapers through ScraperManager');
console.log('✅ SCRAPER_API_KEY: Found');

// Test function
async function runTest() {
  try {
    // Dynamically import the ScraperManager
    const { ScraperManager } = await import('./src/services/scraping/ScraperManager.ts');
    // If the above import fails for any reason, try the compiled version
    /*
    const { ScraperManager } = await import('./dist/services/scraping/ScraperManager.js');
    */
    
    // Create results directory
    const resultsDir = join(__dirname, 'scraper-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir);
    }
    
    // Test our refactored scrapers
    const testScrapers = ['empireflippers', 'exitadviser'];
    
    for (const scraperName of testScrapers) {
      console.log(`\n📊 Testing ${scraperName}:`);
      
      // Create scraper manager for individual scraper
      const manager = new ScraperManager({
        maxConcurrentScrapers: 1,
        maxPages: 1,
        delayBetweenRequests: 2000,
        timeout: 60000,
        verbose: true
      });
      
      try {
        // Run the scraper
        const results = await manager.runScraper(scraperName);
        
        // Log results
        console.log(`  Success: ${results.success ? '✅' : '❌'}`);
        console.log(`  Listings found: ${results.totalFound || 0}`);
        console.log(`  Errors: ${results.errors?.length || 0}`);
        
        // Check URL extraction
        let urlsFound = 0;
        let missingUrls = 0;
        
        if (results.listings && results.listings.length > 0) {
          // Count listings with and without URLs
          results.listings.forEach(listing => {
            if (listing.originalUrl) urlsFound++;
            else missingUrls++;
          });
          
          console.log(`  First listing name: ${results.listings[0].name}`);
          console.log(`  First listing price: $${results.listings[0].askingPrice}`);
          console.log(`  First listing URL: ${results.listings[0].originalUrl || 'MISSING'}`);
          console.log(`  URL stats: ${urlsFound} listings with URLs, ${missingUrls} listings missing URLs`);
          
          // Display URL validation for each listing
          console.log('\n  URL Validation:');
          results.listings.slice(0, 5).forEach((listing, index) => {
            const url = listing.originalUrl || 'MISSING';
            const isValid = url !== 'MISSING';
            console.log(`    [${index+1}] ${isValid ? '✅' : '❌'} ${listing.name.substring(0, 30)}... : ${url.substring(0, 60)}${url.length > 60 ? '...' : ''}`);
          });
        } else {
          console.log('  No listings found');
        }
        
        // Save results to file
        fs.writeFileSync(
          join(resultsDir, `${scraperName}-results.json`),
          JSON.stringify(results, null, 2)
        );
        
      } catch (error) {
        console.error(`  Error testing ${scraperName}:`, error);
      }
    }
    
    console.log(`\n✅ Test results saved to ${resultsDir}`);
    
  } catch (error) {
    console.error('❌ Error importing ScraperManager:', error);
  }
}

// Run the test
runTest();
