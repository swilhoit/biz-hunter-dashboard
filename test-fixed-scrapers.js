import { ComprehensiveScrapingService } from './src/services/scraping/ComprehensiveScrapingService.ts';

async function testFixedScrapers() {
  console.log('🧪 TESTING ALL FIXED SCRAPERS');
  console.log('='.repeat(50));
  console.log('Testing individual scrapers with fixes:\n');
  
  const scrapingService = new ComprehensiveScrapingService();
  
  console.log('Available scrapers:', scrapingService.getAvailableScrapers());
  console.log('');
  
  // Test configuration - single page for speed
  const testConfig = {
    maxPages: 1,
    delayBetweenRequests: 2000,
    timeout: 60000
  };
  
  try {
    console.log('🚀 Running comprehensive test with all fixed scrapers...\n');
    
    const session = await scrapingService.scrapeAllSources(testConfig);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 FIXED SCRAPERS TEST RESULTS');
    console.log('='.repeat(60));
    
    console.log(`\n📊 Session Summary:`);
    console.log(`- Status: ${session.status === 'completed' ? '✅ Completed' : '❌ Failed'}`);
    console.log(`- Total listings: ${session.totalListings}`);
    console.log(`- Sources tested: ${session.sources.length}`);
    console.log(`- Errors: ${session.errors.length}`);
    
    if (session.errors.length > 0) {
      console.log('\n⚠️ Session Errors:');
      session.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    console.log(`\n🔍 Individual Scraper Results:`);
    Object.entries(session.results).forEach(([source, result]) => {
      const status = result.success ? '✅' : '❌';
      const listings = result.listings.length;
      const errors = result.errors?.length || 0;
      
      console.log(`\n${source.toUpperCase()}: ${status}`);
      console.log(`  Listings: ${listings}`);
      
      if (errors > 0) {
        console.log(`  Errors: ${errors}`);
        result.errors?.forEach(error => console.log(`    • ${error}`));
      }
      
      if (listings > 0) {
        console.log(`  Sample listing:`);
        const sample = result.listings[0];
        console.log(`    Name: ${sample.name.substring(0, 60)}${sample.name.length > 60 ? '...' : ''}`);
        console.log(`    Price: $${sample.askingPrice.toLocaleString()}`);
        console.log(`    Revenue: $${sample.annualRevenue.toLocaleString()}`);
        console.log(`    Industry: ${sample.industry}`);
        console.log(`    Location: ${sample.location}`);
      }
    });
    
    // Summary of improvements
    const successfulScrapers = Object.entries(session.results).filter(([_, result]) => result.success && result.listings.length > 0);
    const fixedScrapers = successfulScrapers.filter(([source]) => source !== 'bizbuysell'); // BizBuySell was already working
    
    console.log(`\n🎉 TROUBLESHOOTING SUCCESS SUMMARY:`);
    console.log(`- Working scrapers: ${successfulScrapers.length}/${Object.keys(session.results).length}`);
    console.log(`- Newly fixed scrapers: ${fixedScrapers.length}`);
    console.log(`- Total listings collected: ${session.totalListings}`);
    
    if (fixedScrapers.length > 0) {
      console.log(`\n✨ Fixed scrapers that are now working:`);
      fixedScrapers.forEach(([source, result]) => {
        console.log(`  - ${source}: ${result.listings.length} listings`);
      });
    }
    
    // Industry analysis
    const allListings = Object.values(session.results).flatMap(result => result.listings);
    if (allListings.length > 0) {
      const industries = {};
      allListings.forEach(listing => {
        industries[listing.industry] = (industries[listing.industry] || 0) + 1;
      });
      
      console.log(`\n🏭 Industry Distribution:`);
      Object.entries(industries)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([industry, count]) => {
          console.log(`  - ${industry}: ${count} listings`);
        });
    }
    
    console.log('\n✅ All scrapers tested with fixes applied!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
  }
}

testFixedScrapers();