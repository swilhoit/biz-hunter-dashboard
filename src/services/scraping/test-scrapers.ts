#!/usr/bin/env ts-node

import { ScraperManager } from './ScraperManager';
import { DatabaseService } from './DatabaseService.server';
import { ScrapingConfig } from './types';
import logger from './utils/logger';

async function testAllScrapers() {
  console.log('🚀 Starting comprehensive scraper test...\n');

  const config: ScrapingConfig = {
    maxPages: 1, // Limit to 1 page for testing
    delayBetweenRequests: 2000,
    headless: true,
    timeout: 30000,
  };

  const scraperManager = new ScraperManager();
  const dbService = new DatabaseService();

  try {
    // Test all scrapers
    console.log('📊 Available scrapers:');
    const availableScrapers = scraperManager.getAvailableScrapers();
    Object.entries(availableScrapers).forEach(([key, info]) => {
      console.log(`  - ${info.name} (${key}): ${info.description}`);
    });
    console.log();

    // Run scraping session
    console.log('🔄 Starting scraping session...');
    const session = await scraperManager.scrapeAll(config);

    console.log(`\n✅ Scraping session completed: ${session.sessionId}`);
    console.log(`⏱️  Duration: ${session.endTime!.getTime() - session.startTime.getTime()}ms`);
    console.log(`📦 Total listings found: ${session.totalListings}`);
    console.log(`❌ Total errors: ${session.totalErrors}\n`);

    // Display results for each scraper
    const scraperInfo = availableScrapers;
    Object.entries(session.results).forEach(([scraperName, result]) => {
      const info = scraperInfo[scraperName as keyof typeof scraperInfo];
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${info.name}: ${result.listings.length} listings${result.errors?.length ? `, ${result.errors.length} errors` : ''}`);
      
      if (result.errors?.length) {
        result.errors.forEach(error => console.log(`   Error: ${error}`));
      }
      
      // Show sample listings
      if (result.listings.length > 0) {
        console.log(`   Sample: "${result.listings[0].name}" - $${result.listings[0].askingPrice?.toLocaleString() || 'N/A'}`);
      }
    });

    // Test database integration
    console.log('\n💾 Testing database integration...');
    const allListings = scraperManager.getAllListings();
    
    if (allListings.length > 0) {
      const dbResult = await dbService.saveListings(allListings);
      console.log(`✅ Database save: ${dbResult.saved} saved, ${dbResult.errors} errors`);
      
      // Get stats
      const stats = await dbService.getListingStats();
      console.log('\n📈 Database stats by source:');
      Object.entries(stats).forEach(([source, count]) => {
        console.log(`  ${source}: ${count} listings`);
      });
    } else {
      console.log('⚠️  No listings to save to database');
    }

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

async function testSingleScraper(scraperName: string) {
  console.log(`🔍 Testing single scraper: ${scraperName}\n`);

  const config: ScrapingConfig = {
    maxPages: 1,
    delayBetweenRequests: 1000,
    headless: false, // Show browser for debugging
    timeout: 30000,
  };

  const scraperManager = new ScraperManager();

  try {
    const result = await scraperManager.scrapeOne(scraperName as any, config);
    
    console.log(`\n📊 Results for ${scraperName}:`);
    console.log(`Status: ${result.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`Listings found: ${result.listings.length}`);
    console.log(`Errors: ${result.errors?.length || 0}`);

    if (result.errors?.length) {
      console.log('\nErrors:');
      result.errors.forEach(error => console.log(`  - ${error}`));
    }

    if (result.listings.length > 0) {
      console.log('\nSample listings:');
      result.listings.slice(0, 3).forEach((listing, i) => {
        console.log(`  ${i + 1}. ${listing.name}`);
        console.log(`     Price: $${listing.askingPrice?.toLocaleString() || 'N/A'}`);
        console.log(`     Revenue: $${listing.annualRevenue?.toLocaleString() || 'N/A'}`);
        console.log(`     Industry: ${listing.industry}`);
        console.log(`     Location: ${listing.location}`);
        console.log(`     URL: ${listing.originalUrl}`);
        console.log();
      });
    }

  } catch (error) {
    console.error(`❌ Test failed for ${scraperName}:`, error);
    process.exit(1);
  }
}

// Command line interface
const args = process.argv.slice(2);
if (args.length === 0) {
  testAllScrapers();
} else {
  const scraperName = args[0];
  testSingleScraper(scraperName);
}