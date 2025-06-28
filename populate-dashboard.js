#!/usr/bin/env node

/**
 * Dashboard Population Script
 * Runs all scrapers to populate the dashboard with real business listings
 */

import { createScraper, getAllScraperNames, getScraperInfo } from './src/services/scraping/scrapers/server.ts';
import { DatabaseService } from './src/services/scraping/DatabaseService.server.ts';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

class DashboardPopulator {
  constructor() {
    this.dbService = null;
    this.totalListings = 0;
    this.newListings = 0;
    this.errors = [];
  }

  async initialize() {
    console.log('🚀 Initializing Dashboard Populator...');
    
    try {
      this.dbService = new DatabaseService();
      await this.dbService.initialize();
      console.log('✅ Database connection established');
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      throw error;
    }
  }

  async populateFromAllSources() {
    const scraperNames = getAllScraperNames();
    const scraperInfo = getScraperInfo();
    
    console.log(`📊 Starting population from ${scraperNames.length} sources...`);
    console.log('Sources:', scraperNames.map(name => scraperInfo[name]?.name || name).join(', '));
    
    for (const [index, scraperName] of scraperNames.entries()) {
      const progress = `[${index + 1}/${scraperNames.length}]`;
      const sourceName = scraperInfo[scraperName]?.name || scraperName;
      
      console.log(`\n${progress} 🔄 Starting ${sourceName}...`);
      
      try {
        await this.runScraper(scraperName);
      } catch (error) {
        console.error(`${progress} ❌ ${sourceName} failed:`, error.message);
        this.errors.push(`${sourceName}: ${error.message}`);
      }
      
      // Add delay between scrapers to be respectful
      if (index < scraperNames.length - 1) {
        console.log('⏱️  Waiting 5 seconds before next scraper...');
        await this.delay(5000);
      }
    }
  }

  async runScraper(scraperName) {
    const scraperInfo = getScraperInfo()[scraperName];
    const sourceName = scraperInfo?.name || scraperName;
    
    try {
      // Create scraper with optimized settings for initial population
      const scraper = createScraper(scraperName, {
        maxPages: 10, // Get more data for initial population
        delayBetweenRequests: 3000, // Be more respectful
        headless: true,
        timeout: 45000, // Longer timeout
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });
      
      console.log(`   🌐 Scraping ${sourceName}...`);
      const result = await scraper.scrape();
      
      if (result.success && result.listings.length > 0) {
        console.log(`   📝 Found ${result.listings.length} listings from ${sourceName}`);
        
        // Save to database with duplicate prevention
        const savedCount = await this.dbService.saveListings(result.listings);
        
        console.log(`   💾 Saved ${savedCount} new listings (${result.listings.length - savedCount} duplicates filtered)`);
        
        this.totalListings += result.listings.length;
        this.newListings += savedCount;
        
      } else {
        console.log(`   ⚠️  No listings found from ${sourceName}`);
        if (result.errors && result.errors.length > 0) {
          console.log(`   🐛 Errors: ${result.errors.join(', ')}`);
          this.errors.push(...result.errors.map(err => `${sourceName}: ${err}`));
        }
      }
      
    } catch (error) {
      console.error(`   ❌ Scraper failed:`, error.message);
      this.errors.push(`${sourceName}: ${error.message}`);
    }
  }

  async showFinalStats() {
    console.log('\n📊 Final Population Statistics:');
    console.log('=' .repeat(50));
    console.log(`Total listings found: ${this.totalListings}`);
    console.log(`New listings saved: ${this.newListings}`);
    console.log(`Duplicates filtered: ${this.totalListings - this.newListings}`);
    console.log(`Errors encountered: ${this.errors.length}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach(error => console.log(`   • ${error}`));
    }
    
    // Get database stats
    if (this.dbService) {
      try {
        const stats = await this.dbService.getScrapingStats();
        console.log('\n📈 Database Statistics by Source:');
        Object.entries(stats).forEach(([source, count]) => {
          console.log(`   ${source}: ${count} listings`);
        });
        
        const totalInDb = Object.values(stats).reduce((sum, count) => sum + count, 0);
        console.log(`   Total in database: ${totalInDb} listings`);
      } catch (error) {
        console.error('Failed to get database stats:', error);
      }
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
async function main() {
  const populator = new DashboardPopulator();
  
  try {
    await populator.initialize();
    await populator.populateFromAllSources();
    await populator.showFinalStats();
    
    console.log('\n🎉 Dashboard population completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 Population failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Population interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Population terminated');
  process.exit(1);
});

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default DashboardPopulator;