#!/usr/bin/env node

// Run all individual scrapers (not just Centurica) to populate database
import { chromium } from 'playwright';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

dotenv.config();

class IndividualScrapersRunner {
  constructor() {
    this.supabaseUrl = process.env.VITE_SUPABASE_URL;
    this.supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    this.browser = null;
  }

  async initialize() {
    console.log('🚀 Initializing browser...');
    this.browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🧹 Browser closed');
    }
  }

  async scrapeWithBrowser(url, siteName) {
    console.log(`🎭 Scraping ${siteName}: ${url}`);
    
    try {
      const page = await this.browser.newPage({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });
      
      await page.goto(url, { 
        waitUntil: 'domcontentloaded', 
        timeout: 30000 
      });
      
      await page.waitForTimeout(3000);
      const content = await page.content();
      await page.close();
      
      return { success: true, content };
      
    } catch (error) {
      console.log(`   ❌ ${siteName} failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async scrapeBizBuySell() {
    const result = await this.scrapeWithBrowser('https://www.bizbuysell.com/businesses-for-sale/', 'BizBuySell');
    if (!result.success) return [];

    const $ = cheerio.load(result.content);
    const listings = [];

    $('.result-item, .listing-item, .business-item').each((i, element) => {
      const $item = $(element);
      const name = $item.find('.title, .business-title, h3, h2').first().text().trim();
      const priceText = $item.find('.price, .asking-price').first().text().trim();
      const location = $item.find('.location, .city-state').first().text().trim();
      const url = $item.find('a').first().attr('href');

      if (name && priceText) {
        const price = this.parsePrice(priceText);
        listings.push({
          name: name.substring(0, 200),
          asking_price: price,
          annual_revenue: null,
          industry: 'Business for Sale',
          location: location || 'Not specified',
          source: 'BizBuySell',
          highlights: [priceText],
          original_url: url ? (url.startsWith('http') ? url : `https://www.bizbuysell.com${url}`) : null,
          status: 'active'
        });
      }
    });

    console.log(`   ✅ BizBuySell: ${listings.length} listings`);
    return listings;
  }

  async scrapeEmpireFlippers() {
    const result = await this.scrapeWithBrowser('https://empireflippers.com/marketplace/', 'Empire Flippers');
    if (!result.success) return [];

    const $ = cheerio.load(result.content);
    const listings = [];

    $('.listing-item, .marketplace-listing, .listing-card').each((i, element) => {
      const $item = $(element);
      const name = $item.find('.listing-title, .title, h3').first().text().trim();
      const priceText = $item.find('.price, .asking-price, .listing-price').first().text().trim();
      const revenueText = $item.find('.revenue, .net-profit').first().text().trim();
      const url = $item.find('a').first().attr('href');

      if (name && priceText) {
        const price = this.parsePrice(priceText);
        const revenue = this.parsePrice(revenueText);
        
        listings.push({
          name: name.substring(0, 200),
          asking_price: price,
          annual_revenue: revenue,
          industry: 'Digital Business',
          location: 'Online',
          source: 'EmpireFlippers',
          highlights: [priceText, revenueText].filter(Boolean),
          original_url: url ? (url.startsWith('http') ? url : `https://empireflippers.com${url}`) : null,
          status: 'active'
        });
      }
    });

    console.log(`   ✅ Empire Flippers: ${listings.length} listings`);
    return listings;
  }

  async scrapeQuietLight() {
    const result = await this.scrapeWithBrowser('https://quietlight.com/listings/', 'Quiet Light');
    if (!result.success) return [];

    const $ = cheerio.load(result.content);
    const listings = [];

    $('.listing, .business-listing, .listing-card').each((i, element) => {
      const $item = $(element);
      const name = $item.find('.listing-title, .title, h3, h2').first().text().trim();
      const priceText = $item.find('.price, .asking-price').first().text().trim();
      const revenueText = $item.find('.revenue, .annual-revenue').first().text().trim();
      const url = $item.find('a').first().attr('href');

      if (name && priceText) {
        const price = this.parsePrice(priceText);
        const revenue = this.parsePrice(revenueText);
        
        listings.push({
          name: name.substring(0, 200),
          asking_price: price,
          annual_revenue: revenue,
          industry: 'Amazon FBA',
          location: 'Online',
          source: 'QuietLight',
          highlights: [priceText, revenueText].filter(Boolean),
          original_url: url ? (url.startsWith('http') ? url : `https://quietlight.com${url}`) : null,
          status: 'active'
        });
      }
    });

    console.log(`   ✅ Quiet Light: ${listings.length} listings`);
    return listings;
  }

  async scrapeFlippa() {
    const result = await this.scrapeWithBrowser('https://flippa.com/search?filter%5Bproperty_type%5D%5B%5D=website', 'Flippa');
    if (!result.success) return [];

    const $ = cheerio.load(result.content);
    const listings = [];

    $('.listing-item, .auction-item, .search-result').each((i, element) => {
      const $item = $(element);
      const name = $item.find('.listing-title, .title, h3').first().text().trim();
      const priceText = $item.find('.price, .current-bid, .buy-now').first().text().trim();
      const revenueText = $item.find('.revenue, .monthly-revenue').first().text().trim();
      const url = $item.find('a').first().attr('href');

      if (name && priceText) {
        const price = this.parsePrice(priceText);
        const revenue = this.parsePrice(revenueText);
        
        listings.push({
          name: name.substring(0, 200),
          asking_price: price,
          annual_revenue: revenue,
          industry: 'Website',
          location: 'Online',
          source: 'Flippa',
          highlights: [priceText, revenueText].filter(Boolean),
          original_url: url ? (url.startsWith('http') ? url : `https://flippa.com${url}`) : null,
          status: 'active'
        });
      }
    });

    console.log(`   ✅ Flippa: ${listings.length} listings`);
    return listings;
  }

  async scrapeBizQuest() {
    const result = await this.scrapeWithBrowser('https://www.bizquest.com/businesses-for-sale/', 'BizQuest');
    if (!result.success) return [];

    const $ = cheerio.load(result.content);
    const listings = [];

    $('.listing, .business-listing, .search-result').each((i, element) => {
      const $item = $(element);
      const name = $item.find('.business-name, .title, h3').first().text().trim();
      const priceText = $item.find('.price, .asking-price').first().text().trim();
      const location = $item.find('.location, .city-state').first().text().trim();
      const url = $item.find('a').first().attr('href');

      if (name && priceText) {
        const price = this.parsePrice(priceText);
        
        listings.push({
          name: name.substring(0, 200),
          asking_price: price,
          annual_revenue: null,
          industry: 'Business for Sale',
          location: location || 'Not specified',
          source: 'BizQuest',
          highlights: [priceText],
          original_url: url ? (url.startsWith('http') ? url : `https://www.bizquest.com${url}`) : null,
          status: 'active'
        });
      }
    });

    console.log(`   ✅ BizQuest: ${listings.length} listings`);
    return listings;
  }

  parsePrice(priceText) {
    if (!priceText) return null;
    
    const cleanPrice = priceText.replace(/[^\d.,]/g, '');
    const numericValue = parseFloat(cleanPrice.replace(/,/g, ''));
    
    if (isNaN(numericValue)) return null;
    
    // Handle K, M notation
    if (priceText.toLowerCase().includes('m')) {
      return Math.round(numericValue * 1000000);
    } else if (priceText.toLowerCase().includes('k')) {
      return Math.round(numericValue * 1000);
    }
    
    return Math.round(numericValue);
  }

  async saveToDatabase(listings) {
    if (listings.length === 0) {
      console.log('⚠️ No listings to save');
      return { saved: 0, errors: 0 };
    }

    console.log(`💾 Saving ${listings.length} listings to database...`);
    
    let saved = 0;
    let errors = 0;

    for (const listing of listings) {
      try {
        const { error } = await this.supabase
          .from('business_listings')
          .insert(listing);

        if (error) {
          console.error(`❌ Error saving listing "${listing.name}":`, error.message);
          errors++;
        } else {
          saved++;
        }
      } catch (err) {
        console.error(`❌ Exception saving listing "${listing.name}":`, err);
        errors++;
      }
    }

    return { saved, errors };
  }

  async runAllScrapers() {
    console.log('🚀 Starting individual scrapers for all sites...\n');
    
    await this.initialize();
    
    const allListings = [];
    
    try {
      // Run all individual scrapers
      const bizBuySellListings = await this.scrapeBizBuySell();
      const empireFlippersListings = await this.scrapeEmpireFlippers();
      const quietLightListings = await this.scrapeQuietLight();
      const flippaListings = await this.scrapeFlippa();
      const bizQuestListings = await this.scrapeBizQuest();
      
      allListings.push(
        ...bizBuySellListings,
        ...empireFlippersListings,
        ...quietLightListings,
        ...flippaListings,
        ...bizQuestListings
      );
      
      console.log(`\n📊 Total listings scraped: ${allListings.length}`);
      
      // Save to database
      const saveResults = await this.saveToDatabase(allListings);
      
      console.log(`\n✅ Scraping completed!`);
      console.log(`💾 Saved: ${saveResults.saved} listings`);
      console.log(`❌ Errors: ${saveResults.errors}`);
      
      // Get final stats
      const { data: stats } = await this.supabase
        .from('business_listings')
        .select('source')
        .eq('status', 'active');
      
      if (stats) {
        const sourceCounts = {};
        stats.forEach(item => {
          sourceCounts[item.source] = (sourceCounts[item.source] || 0) + 1;
        });
        
        console.log('\n📈 Current database totals by source:');
        Object.entries(sourceCounts).forEach(([source, count]) => {
          console.log(`  ${source}: ${count} listings`);
        });
      }
      
    } catch (error) {
      console.error('❌ Scraping failed:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the scrapers
const runner = new IndividualScrapersRunner();
runner.runAllScrapers().catch(console.error);