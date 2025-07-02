import { createScrapeGraphService } from './ScrapeGraphService';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

async function testScrapeGraph() {
  console.log('🤖 Testing ScrapeGraph AI Scraper...\n');
  
  try {
    // Create service instance
    const scraper = await createScrapeGraphService();
    
    // Test options
    const testMode = process.argv[2] || 'single';
    const siteName = process.argv[3] || 'quietlight';
    const maxPages = parseInt(process.argv[4]) || 1;
    
    console.log(`Mode: ${testMode}`);
    console.log(`Site: ${siteName}`);
    console.log(`Max pages: ${maxPages}\n`);
    
    if (testMode === 'single') {
      // Test single site
      console.log(`🔍 Scraping ${siteName}...`);
      const listings = await scraper.scrapeSite(siteName, maxPages);
      
      console.log(`\n✅ Found ${listings.length} listings from ${siteName}:\n`);
      
      listings.forEach((listing, index) => {
        console.log(`${index + 1}. ${listing.name || 'Unnamed'}`);
        console.log(`   Price: ${listing.askingPrice || 'N/A'}`);
        console.log(`   Revenue: ${listing.annualRevenue || listing.monthlyRevenue || 'N/A'}`);
        console.log(`   FBA: ${listing.isFBA ? 'Yes' : 'No'}`);
        console.log(`   URL: ${listing.listingUrl || 'N/A'}`);
        console.log('');
      });
      
    } else if (testMode === 'all') {
      // Test all sites
      console.log('🔍 Scraping all configured sites...\n');
      const results = await scraper.scrapeAllSites(maxPages);
      
      console.log('\n📊 Summary:\n');
      for (const [site, listings] of Object.entries(results)) {
        console.log(`${site}: ${listings.length} listings found`);
        
        // Show first few from each
        if (listings.length > 0) {
          console.log(`  Sample listings:`);
          listings.slice(0, 3).forEach(listing => {
            console.log(`  - ${listing.name || 'Unnamed'} (${listing.askingPrice || 'Price N/A'})`);
          });
        }
        console.log('');
      }
      
      // Total FBA listings
      const totalFBA = Object.values(results)
        .flat()
        .filter(l => l.isFBA).length;
      
      console.log(`\n🎯 Total FBA listings found: ${totalFBA}`);
      
    } else if (testMode === 'credits') {
      // Check API credits
      console.log('Checking API credits...');
      const credits = await scraper.checkCredits();
      if (credits >= 0) {
        console.log(`💳 Available credits: ${credits}`);
      } else {
        console.log('❌ Could not retrieve credit information');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    
    if (error.message.includes('API key')) {
      console.log('\n💡 Make sure to set VITE_SCRAPEGRAPH_API_KEY in your .env file');
    }
  }
}

// Show usage
if (process.argv.length < 3) {
  console.log('Usage: npm run test:scrapegraph [mode] [site] [maxPages]');
  console.log('');
  console.log('Modes:');
  console.log('  single - Scrape a single site (default)');
  console.log('  all    - Scrape all configured sites');
  console.log('  credits - Check API credits');
  console.log('');
  console.log('Sites: quietlight, bizbuysell, flippa, empireflippers');
  console.log('');
  console.log('Examples:');
  console.log('  npm run test:scrapegraph single quietlight 2');
  console.log('  npm run test:scrapegraph all 1');
}

// Run the test
testScrapeGraph();