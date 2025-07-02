// Testing utility for refactored ScraperAPI-based scrapers
import { EmpireFlippersScraper } from './scrapers/EmpireFlippersScraper';
import { ExitAdviserScraper } from './scrapers/ExitAdviserScraper';
import { ScrapingConfig } from './types';
import logger from './utils/logger';

export async function testRefactoredScrapers() {
  // Test configuration - minimal settings to quickly check functionality
  const config: ScrapingConfig = {
    maxPages: 1,
    delayBetweenRequests: 2000,
    timeout: 60000
  };

  logger.info('🚀 TESTING REFACTORED SCRAPERS WITH SCRAPERAPI');
  logger.info('=============================================');
  
  // Check SCRAPER_API_KEY
  const apiKey = process.env.SCRAPER_API_KEY;
  if (!apiKey) {
    logger.error('❌ SCRAPER_API_KEY environment variable not found!');
    return;
  }
  logger.info('✅ SCRAPER_API_KEY found in environment');
  
  // Test EmpireFlippersScraper
  logger.info('\n📌 Testing EmpireFlippersScraper...');
  try {
    const empireFlipper = new EmpireFlippersScraper(config);
    const efResults = await empireFlipper.scrape();
    
    logger.info(`Status: ${efResults.success ? '✅ Success' : '❌ Failed'}`);
    logger.info(`Listings found: ${efResults.listings.length}`);
    
    if (efResults.listings.length > 0) {
      const sample = efResults.listings[0];
      logger.info(`Sample: "${sample.name}" - $${sample.askingPrice?.toLocaleString() || 'N/A'}`);
    }
    
    if (efResults.errors?.length) {
      logger.error('Errors:', efResults.errors);
    }
  } catch (error) {
    logger.error('❌ Error testing EmpireFlippersScraper:', error);
  }
  
  // Test ExitAdviserScraper
  logger.info('\n📌 Testing ExitAdviserScraper...');
  try {
    const exitAdviser = new ExitAdviserScraper(config);
    const eaResults = await exitAdviser.scrape();
    
    logger.info(`Status: ${eaResults.success ? '✅ Success' : '❌ Failed'}`);
    logger.info(`Listings found: ${eaResults.listings.length}`);
    
    if (eaResults.listings.length > 0) {
      const sample = eaResults.listings[0];
      logger.info(`Sample: "${sample.name}" - $${sample.askingPrice?.toLocaleString() || 'N/A'}`);
    }
    
    if (eaResults.errors?.length) {
      logger.error('Errors:', eaResults.errors);
    }
  } catch (error) {
    logger.error('❌ Error testing ExitAdviserScraper:', error);
  }
  
  logger.info('\n✅ Testing completed!');
}

// Expose function for importing in other files
export default testRefactoredScrapers;
