import { ComprehensiveScrapingService } from './src/services/scraping/ComprehensiveScrapingService.ts';

async function populateDashboard() {
  console.log('🚀 Starting comprehensive dashboard population...\n');
  
  const scrapingService = new ComprehensiveScrapingService();
  
  console.log('Available scrapers:', scrapingService.getAvailableScrapers());
  console.log('Target sources: BizBuySell, Empire Flippers, Quiet Light, Flippa, MicroAcquire, Acquire, Centurica');
  console.log('🎯 Focus: Amazon FBA businesses only\n');
  
  try {
    // Configure for comprehensive but reasonable scraping
    const config = {
      maxPages: 2,           // 2 pages per source
      delayBetweenRequests: 3000, // 3 second delay between requests
      timeout: 60000         // 60 second timeout
    };
    
    console.log('Configuration:');
    console.log(`- Max pages per source: ${config.maxPages}`);
    console.log(`- Delay between requests: ${config.delayBetweenRequests}ms`);
    console.log(`- Timeout: ${config.timeout}ms\n`);
    
    const session = await scrapingService.scrapeAllSources(config);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE SCRAPING RESULTS');
    console.log('='.repeat(60));
    
    console.log(`\n🎯 Session Summary:`);
    console.log(`- Session ID: ${session.id}`);
    console.log(`- Status: ${session.status === 'completed' ? '✅ Completed' : '❌ Failed'}`);
    console.log(`- Total listings found: ${session.totalListings}`);
    console.log(`- Sources scraped: ${session.sources.length}`);
    console.log(`- Duration: ${Math.round((session.endTime.getTime() - session.startTime.getTime()) / 1000)}s`);
    
    if (session.errors.length > 0) {
      console.log(`\n⚠️ Errors: ${session.errors.length}`);
      session.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    console.log(`\n📈 Results by Source:`);
    Object.entries(session.results).forEach(([source, result]) => {
      const status = result.success ? '✅' : '❌';
      const listings = result.listings.length;
      const errors = result.errors?.length || 0;
      
      console.log(`\n${source.toUpperCase()}: ${status}`);
      console.log(`  - Listings: ${listings}`);
      if (errors > 0) {
        console.log(`  - Errors: ${errors}`);
        result.errors?.forEach(error => console.log(`    • ${error}`));
      }
      
      // Show sample listings
      if (listings > 0) {
        console.log(`  - Sample listings:`);
        result.listings.slice(0, 2).forEach((listing, index) => {
          console.log(`    ${index + 1}. ${listing.name.substring(0, 60)}${listing.name.length > 60 ? '...' : ''}`);
          console.log(`       Price: $${listing.askingPrice.toLocaleString()}, Revenue: $${listing.annualRevenue.toLocaleString()}`);
          console.log(`       Industry: ${listing.industry}, Location: ${listing.location}`);
        });
      }
    });
    
    // Industry breakdown
    const allListings = Object.values(session.results).flatMap(result => result.listings);
    const industryCount = {};
    allListings.forEach(listing => {
      industryCount[listing.industry] = (industryCount[listing.industry] || 0) + 1;
    });
    
    console.log(`\n🏭 Industry Breakdown:`);
    Object.entries(industryCount)
      .sort(([,a], [,b]) => b - a)
      .forEach(([industry, count]) => {
        console.log(`  - ${industry}: ${count} listings`);
      });
    
    // Price ranges
    const priceRanges = {
      'Under $100k': allListings.filter(l => l.askingPrice < 100000).length,
      '$100k - $500k': allListings.filter(l => l.askingPrice >= 100000 && l.askingPrice < 500000).length,
      '$500k - $1M': allListings.filter(l => l.askingPrice >= 500000 && l.askingPrice < 1000000).length,
      '$1M+': allListings.filter(l => l.askingPrice >= 1000000).length,
      'Price not specified': allListings.filter(l => l.askingPrice === 0).length
    };
    
    console.log(`\n💰 Price Range Distribution:`);
    Object.entries(priceRanges).forEach(([range, count]) => {
      if (count > 0) {
        console.log(`  - ${range}: ${count} listings`);
      }
    });
    
    console.log('\n🎉 Dashboard population completed!');
    console.log('You can now view the updated dashboard with real business listings.');
    
  } catch (error) {
    console.error('\n❌ Error during dashboard population:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
  }
}

populateDashboard();