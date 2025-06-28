// Direct test script for refactored scrapers
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { EmpireFlippersScraper } from './src/services/scraping/scrapers/EmpireFlippersScraper';
import { ExitAdviserScraper } from './src/services/scraping/scrapers/ExitAdviserScraper';
import { RawListing, ScrapingConfig } from './src/services/scraping/types';

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

async function runDirectTest() {
  try {
    // Test EmpireFlippersScraper
    console.log('\n🔍 Testing EmpireFlippersScraper directly:');
    const empireConfig: ScrapingConfig = { 
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
      console.log(`  Sample listing title: ${empireResults.listings[0].name}`);
      console.log(`  Price: ${empireResults.listings[0].askingPrice}`);
    }
    
    if (empireResults.errors && empireResults.errors.length > 0) {
      console.log(`  Errors: ${empireResults.errors.join(', ')}`);
    }
    
    // Test ExitAdviserScraper
    console.log('\n🔍 Testing ExitAdviserScraper directly:');
    const exitConfig: ScrapingConfig = { 
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
      console.log(`  Sample listing title: ${exitResults.listings[0].name}`);
      console.log(`  Price: ${exitResults.listings[0].askingPrice}`);
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
    
    // Save listings to separate files for analysis
    if (empireResults.listings.length > 0) {
      fs.writeFileSync(
        path.join(resultsDir, 'empire-flippers-listings.json'), 
        JSON.stringify(empireResults.listings, null, 2)
      );
      console.log(`✅ Saved ${empireResults.listings.length} Empire Flippers listings`);
    }
    
    if (exitResults.listings.length > 0) {
      fs.writeFileSync(
        path.join(resultsDir, 'exit-adviser-listings.json'), 
        JSON.stringify(exitResults.listings, null, 2)
      );
      console.log(`✅ Saved ${exitResults.listings.length} ExitAdviser listings`);
    }
    
  } catch (error) {
    console.error('❌ Error running direct test:', error);
  }
}

// Run the test
runDirectTest();
