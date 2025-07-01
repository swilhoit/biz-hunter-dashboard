#!/usr/bin/env node

// Use ScraperAPI to populate database with listings from individual sites
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

class WorkingScrapersPopulator {
  constructor() {
    this.supabaseUrl = process.env.VITE_SUPABASE_URL;
    this.supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    this.scraperAPIKey = process.env.SCRAPER_API_KEY;
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }

  async scrapeWithScraperAPI(url, siteName) {
    console.log(`🌐 Scraping ${siteName} via ScraperAPI: ${url}`);
    
    try {
      const scraperUrl = `http://api.scraperapi.com?api_key=${this.scraperAPIKey}&url=${encodeURIComponent(url)}&render=true`;
      const response = await fetch(scraperUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const content = await response.text();
      console.log(`   ✅ Retrieved ${content.length} characters via ScraperAPI`);
      return { success: true, content };
      
    } catch (error) {
      console.log(`   ❌ ScraperAPI failed for ${siteName}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async scrapeBizBuySell() {
    const result = await this.scrapeWithScraperAPI('https://www.bizbuysell.com/businesses-for-sale/', 'BizBuySell');
    if (!result.success) return [];

    const $ = cheerio.load(result.content);
    const listings = [];

    // Updated selectors based on working test
    $('div[class*="listing"], .listing-item, .result-item').each((i, element) => {
      const $item = $(element);
      
      // Get title/name
      const name = $item.find('h3, h2, .title, .business-title, [class*="title"]').first().text().trim();
      
      // Get price
      const priceText = $item.find('[class*="price"], .asking-price, .price-display').first().text().trim();
      
      // Get location
      const location = $item.find('[class*="location"], .city-state, .address').first().text().trim();
      
      // Get URL
      const linkElement = $item.find('a').first();
      const relativeUrl = linkElement.attr('href');
      
      if (name && priceText && name.length > 5) {
        const price = this.parsePrice(priceText);
        const fullUrl = relativeUrl ? 
          (relativeUrl.startsWith('http') ? relativeUrl : `https://www.bizbuysell.com${relativeUrl}`) : 
          null;
        
        listings.push({
          name: name.substring(0, 200),
          asking_price: price,
          annual_revenue: null,
          industry: 'Business for Sale',
          location: location || 'Not specified',
          source: 'BizBuySell',
          highlights: [priceText],
          original_url: fullUrl,
          status: 'active',
          description: null
        });
      }
    });

    console.log(`   ✅ BizBuySell: ${listings.length} listings extracted`);
    return listings;
  }

  async scrapeEmpireFlippers() {
    const result = await this.scrapeWithScraperAPI('https://empireflippers.com/marketplace/', 'Empire Flippers');
    if (!result.success) return [];

    const $ = cheerio.load(result.content);
    const listings = [];

    $('.marketplace-listing, .listing-card, [class*="listing"]').each((i, element) => {
      const $item = $(element);
      
      const name = $item.find('h3, h2, .listing-title, [class*="title"]').first().text().trim();
      const priceText = $item.find('[class*="price"], .asking-price').first().text().trim();
      const revenueText = $item.find('[class*="revenue"], [class*="profit"]').first().text().trim();
      const url = $item.find('a').first().attr('href');

      if (name && priceText && name.length > 5) {
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
          status: 'active',
          description: null
        });
      }
    });

    console.log(`   ✅ Empire Flippers: ${listings.length} listings extracted`);
    return listings;
  }

  async scrapeFlippa() {
    const result = await this.scrapeWithScraperAPI('https://flippa.com/search?filter%5Bproperty_type%5D%5B%5D=website', 'Flippa');
    if (!result.success) return [];

    const $ = cheerio.load(result.content);
    const listings = [];

    $('.listing-item, .auction-item, [class*="listing"]').each((i, element) => {
      const $item = $(element);
      
      const name = $item.find('h3, h2, .listing-title, [class*="title"]').first().text().trim();
      const priceText = $item.find('[class*="price"], .current-bid, .buy-now').first().text().trim();
      const revenueText = $item.find('[class*="revenue"], .monthly-revenue').first().text().trim();
      const url = $item.find('a').first().attr('href');

      if (name && priceText && name.length > 5) {
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
          status: 'active',
          description: null
        });
      }
    });

    console.log(`   ✅ Flippa: ${listings.length} listings extracted`);
    return listings;
  }

  async scrapeQuietLight() {
    const result = await this.scrapeWithScraperAPI('https://quietlight.com/businesses-for-sale/', 'Quiet Light');
    if (!result.success) return [];

    const $ = cheerio.load(result.content);
    const listings = [];

    $('.listing, .business-listing, [class*="listing"]').each((i, element) => {
      const $item = $(element);
      
      const name = $item.find('h3, h2, .listing-title, [class*="title"]').first().text().trim();
      const priceText = $item.find('[class*="price"], .asking-price').first().text().trim();
      const revenueText = $item.find('[class*="revenue"], .annual-revenue').first().text().trim();
      const url = $item.find('a').first().attr('href');

      if (name && priceText && name.length > 5) {
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
          status: 'active',
          description: null
        });
      }
    });

    console.log(`   ✅ Quiet Light: ${listings.length} listings extracted`);
    return listings;
  }

  parsePrice(priceText) {
    if (!priceText) return null;
    
    // Remove currency symbols and extra text
    const cleanPrice = priceText.replace(/[^\d.,kmKM]/g, '');
    
    // Extract numeric part
    const match = cleanPrice.match(/[\d.,]+/);
    if (!match) return null;
    
    const numericValue = parseFloat(match[0].replace(/,/g, ''));
    if (isNaN(numericValue)) return null;
    
    // Handle K, M notation
    const lowerText = priceText.toLowerCase();
    if (lowerText.includes('m') || lowerText.includes('million')) {
      return Math.round(numericValue * 1000000);
    } else if (lowerText.includes('k') || lowerText.includes('thousand')) {
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
        // Check if listing already exists
        const { data: existing } = await this.supabase
          .from('business_listings')
          .select('id')
          .eq('name', listing.name)
          .eq('source', listing.source)
          .limit(1);

        if (existing && existing.length > 0) {
          console.log(`   ⏭️ Skipping duplicate: "${listing.name}"`);
          continue;
        }

        const { error } = await this.supabase
          .from('business_listings')
          .insert(listing);

        if (error) {
          console.error(`❌ Error saving "${listing.name}": ${error.message}`);
          errors++;
        } else {
          saved++;
          if (saved <= 3) {
            console.log(`   ✅ Saved: "${listing.name}" - $${listing.asking_price?.toLocaleString() || 'N/A'}`);
          }
        }
      } catch (err) {
        console.error(`❌ Exception saving "${listing.name}": ${err.message}`);
        errors++;
      }
    }

    return { saved, errors };
  }

  async runAll() {
    console.log('🚀 Starting ScraperAPI-powered individual site scraping...\n');
    
    const allListings = [];
    
    try {
      // Run scrapers with working methods
      console.log('📍 Scraping BizBuySell...');
      const bizBuySellListings = await this.scrapeBizBuySell();
      allListings.push(...bizBuySellListings);
      
      console.log('\n📍 Scraping Empire Flippers...');
      const empireFlippersListings = await this.scrapeEmpireFlippers();
      allListings.push(...empireFlippersListings);
      
      console.log('\n📍 Scraping Flippa...');
      const flippaListings = await this.scrapeFlippa();
      allListings.push(...flippaListings);
      
      console.log('\n📍 Scraping Quiet Light...');
      const quietLightListings = await this.scrapeQuietLight();
      allListings.push(...quietLightListings);
      
      console.log(`\n📊 TOTAL LISTINGS EXTRACTED: ${allListings.length}`);
      
      if (allListings.length > 0) {
        const saveResults = await this.saveToDatabase(allListings);
        
        console.log(`\n✅ SCRAPING COMPLETED!`);
        console.log(`💾 New listings saved: ${saveResults.saved}`);
        console.log(`❌ Errors: ${saveResults.errors}`);
      }
      
      // Get final database stats
      const { data: stats } = await this.supabase
        .from('business_listings')
        .select('source')
        .eq('status', 'active');
      
      if (stats) {
        const sourceCounts = {};
        stats.forEach(item => {
          sourceCounts[item.source] = (sourceCounts[item.source] || 0) + 1;
        });
        
        console.log('\n📈 FINAL DATABASE TOTALS BY SOURCE:');
        Object.entries(sourceCounts)
          .sort(([,a], [,b]) => b - a)
          .forEach(([source, count]) => {
            console.log(`  ${source}: ${count} listings`);
          });
        
        const total = Object.values(sourceCounts).reduce((sum, count) => sum + count, 0);
        console.log(`\n🎯 TOTAL ACTIVE LISTINGS: ${total}`);
      }
      
    } catch (error) {
      console.error('❌ Scraping failed:', error);
    }
  }
}

// Run the scraper
const populator = new WorkingScrapersPopulator();
populator.runAll().catch(console.error);