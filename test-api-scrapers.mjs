// Test script for ScraperAPI-based scrapers (ESM format)
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Setup path for imports
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Check API key
const apiKey = process.env.SCRAPER_API_KEY;
if (!apiKey) {
  console.error('❌ SCRAPER_API_KEY not found in environment variables');
  process.exit(1);
}

console.log('🚀 Testing refactored ScraperAPI-based scrapers');
console.log('✅ SCRAPER_API_KEY: Found');

// Import our scrapers dynamically to avoid TypeScript compilation issues
async function importScrapers() {
  // We'll use dynamic imports and handle ES module transpilation
  try {
    // Import dependencies from Vite-compiled output
    const { default: axios } = await import('axios');
    
    // Use the integrated scraper API
    console.log('\n⚡ Using integrated scraper API to test scrapers');
    
    // Test Empire Flippers
    console.log('\n📊 Testing EmpireFlippersScraper:');
    const efResponse = await axios.post('http://localhost:3001/api/scraper/empireflippers', {
      maxPages: 1,
      delayBetweenRequests: 2000
    }).catch(err => {
      console.log('  Connection error - local API server may not be running');
      return { data: null };
    });
    
    if (efResponse?.data) {
      const { success, listings, errors } = efResponse.data;
      console.log(`  Success: ${success ? '✅' : '❌'}`);
      console.log(`  Listings: ${listings?.length || 0}`);
      console.log(`  Errors: ${errors?.length || 0}`);
      
      if (listings?.length) {
        const sample = listings[0];
        console.log('\n  Sample listing:');
        console.log(`  Title: ${sample.name}`);
        console.log(`  Price: $${sample.askingPrice?.toLocaleString() || 'N/A'}`);
      }
    }
    
    // Test Exit Adviser
    console.log('\n📊 Testing ExitAdviserScraper:');
    const eaResponse = await axios.post('http://localhost:3001/api/scraper/exitadviser', {
      maxPages: 1,
      delayBetweenRequests: 2000
    }).catch(err => {
      console.log('  Connection error - local API server may not be running');
      return { data: null };
    });
    
    if (eaResponse?.data) {
      const { success, listings, errors } = eaResponse.data;
      console.log(`  Success: ${success ? '✅' : '❌'}`);
      console.log(`  Listings: ${listings?.length || 0}`);
      console.log(`  Errors: ${errors?.length || 0}`);
      
      if (listings?.length) {
        const sample = listings[0];
        console.log('\n  Sample listing:');
        console.log(`  Title: ${sample.name}`);
        console.log(`  Price: $${sample.askingPrice?.toLocaleString() || 'N/A'}`);
      }
    }
    
    console.log('\n📝 Alternative testing approach:');
    console.log('To fully test the scrapers, start the scraping API server with:');
    console.log('  npm run scraping-api');
    console.log('Then run this test script again.');
    
  } catch (error) {
    console.error('\n❌ Error running tests:', error);
  }
}

// Run the tests
importScrapers();
