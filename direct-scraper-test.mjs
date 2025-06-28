// Direct test script for refactored scrapers
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Check API key
const apiKey = process.env.SCRAPER_API_KEY;
if (!apiKey) {
  console.error('❌ SCRAPER_API_KEY not found in environment variables');
  process.exit(1);
}

console.log('🚀 Directly testing refactored ScraperAPI-based scrapers');
console.log('✅ SCRAPER_API_KEY found in env');

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Direct import of the compiled scrapers
async function runDirectTest() {
  try {
    console.log('\nImporting scrapers directly...');
    
    // Import dynamically - this will require the TypeScript files to be compiled
    const { EmpireFlippersScraper } = await import('./src/services/scraping/scrapers/EmpireFlippersScraper.js');
    const { ExitAdviserScraper } = await import('./src/services/scraping/scrapers/ExitAdviserScraper.js');
    
    console.log('✅ Successfully imported scrapers');
    
    // Test EmpireFlippersScraper
    console.log('\n🔍 Testing EmpireFlippersScraper directly:');
    const empireConfig = { 
      maxPages: 1, 
      delayBetweenRequests: 1000,
      timeout: 60000,
      verbose: true
    };
    
    const empireScraper = new EmpireFlippersScraper(empireConfig);
    
    console.log('Running EmpireFlippers scraper...');
    const empireResults = await empireScraper.scrape();
    
    console.log(`✅ Empire Flippers Results:`);
    console.log(`  Success: ${empireResults.success}`);
    console.log(`  Total Listings: ${empireResults.totalScraped}`);
    
    if (empireResults.listings.length > 0) {
      console.log(`  First listing: ${JSON.stringify(empireResults.listings[0], null, 2)}`);
    }
    
    if (empireResults.errors && empireResults.errors.length > 0) {
      console.log(`  Errors: ${empireResults.errors.join(', ')}`);
    }
    
    // Test ExitAdviserScraper
    console.log('\n🔍 Testing ExitAdviserScraper directly:');
    const exitConfig = { 
      maxPages: 1, 
      delayBetweenRequests: 1000,
      timeout: 60000,
      verbose: true
    };
    
    const exitScraper = new ExitAdviserScraper(exitConfig);
    
    console.log('Running ExitAdviser scraper...');
    const exitResults = await exitScraper.scrape();
    
    console.log(`✅ ExitAdviser Results:`);
    console.log(`  Success: ${exitResults.success}`);
    console.log(`  Total Listings: ${exitResults.totalScraped}`);
    
    if (exitResults.listings.length > 0) {
      console.log(`  First listing: ${JSON.stringify(exitResults.listings[0], null, 2)}`);
    }
    
    if (exitResults.errors && exitResults.errors.length > 0) {
      console.log(`  Errors: ${exitResults.errors.join(', ')}`);
    }
    
    // Save results to file
    const resultsDir = path.join(__dirname, 'scraper-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir);
    }
    
    fs.writeFileSync(
      path.join(resultsDir, 'empire-flippers-results.json'), 
      JSON.stringify(empireResults, null, 2)
    );
    
    fs.writeFileSync(
      path.join(resultsDir, 'exit-adviser-results.json'), 
      JSON.stringify(exitResults, null, 2)
    );
    
    console.log(`\n✅ Results saved to ${resultsDir}`);
    
  } catch (error) {
    console.error('❌ Error running direct test:', error);
  }
}

runDirectTest();
