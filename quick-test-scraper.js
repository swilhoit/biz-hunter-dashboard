#!/usr/bin/env node

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

class QuickTestScraper {
  constructor() {
    this.supabaseUrl = process.env.VITE_SUPABASE_URL;
    this.supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    this.scraperAPIKey = process.env.SCRAPER_API_KEY;
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }

  async testScrapeWithAPI(url, siteName) {
    try {
      const scraperUrl = `http://api.scraperapi.com?api_key=${this.scraperAPIKey}&url=${encodeURIComponent(url)}&render=true&premium=true`;
      const response = await fetch(scraperUrl, { timeout: 15000 });
      
      if (response.ok) {
        const content = await response.text();
        const $ = cheerio.load(content);
        
        // Quick extraction
        const listings = [];
        $('div, article, section').each((i, element) => {
          if (i > 50) return false;
          
          const $item = $(element);
          const text = $item.text();
          
          if (text.includes('$') && text.length > 100 && text.length < 1000) {
            const businessKeywords = ['business', 'website', 'amazon', 'fba', 'ecommerce'];
            if (businessKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
              
              // Extract name
              const lines = text.split('\n').map(l => l.trim()).filter(l => l);
              const name = lines.find(line => 
                line.length > 15 && 
                line.length < 100 && 
                !line.includes('$') && 
                line.match(/[a-zA-Z].*[a-zA-Z]/)
              );
              
              // Extract price
              const priceMatch = text.match(/\$[\d,]+[kKmM]?/);
              
              if (name && priceMatch) {
                const price = this.parsePrice(priceMatch[0]);
                if (price && price > 5000) {
                  listings.push({
                    name: name.substring(0, 100),
                    asking_price: price,
                    source: siteName,
                    industry: text.toLowerCase().includes('amazon') || text.toLowerCase().includes('fba') ? 'Amazon FBA' : 'Digital Business'
                  });
                }
              }
            }
          }
        });
        
        return listings.slice(0, 10); // Limit for testing
      }
    } catch (error) {
      console.log(`❌ Error scraping ${url}: ${error.message}`);
    }
    
    return [];
  }

  parsePrice(priceText) {
    if (!priceText) return null;
    
    const cleanPrice = priceText.replace(/[^\d.,kmKM]/g, '');
    const match = cleanPrice.match(/[\d.,]+/);
    if (!match) return null;
    
    const numericValue = parseFloat(match[0].replace(/,/g, ''));
    if (isNaN(numericValue)) return null;
    
    const lowerText = priceText.toLowerCase();
    if (lowerText.includes('m')) {
      return Math.round(numericValue * 1000000);
    } else if (lowerText.includes('k')) {
      return Math.round(numericValue * 1000);
    } else {
      return Math.round(numericValue);
    }
  }

  async runQuickTest() {
    console.log('🧪 Quick Test Scraper - Testing 3 key URLs\n');
    
    const testUrls = [
      { url: 'https://empireflippers.com/marketplace/?industry=amazon-fba', site: 'EmpireFlippers' },
      { url: 'https://quietlight.com/listings/?type=amazon-fba', site: 'QuietLight' },
      { url: 'https://www.bizbuysell.com/search/businesses-for-sale/?q=amazon', site: 'BizBuySell' }
    ];
    
    const allListings = [];
    
    for (const test of testUrls) {
      console.log(`🔍 Testing ${test.site}...`);
      const listings = await this.testScrapeWithAPI(test.url, test.site);
      console.log(`   Found: ${listings.length} listings`);
      
      if (listings.length > 0) {
        console.log(`   Sample: "${listings[0].name}" - $${listings[0].asking_price.toLocaleString()}`);
        allListings.push(...listings);
      }
      
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log(`\n📊 Total listings found: ${allListings.length}`);
    
    const amazonFBAListings = allListings.filter(l => l.industry === 'Amazon FBA');
    console.log(`🛒 Amazon FBA listings: ${amazonFBAListings.length}`);
    
    if (amazonFBAListings.length > 0) {
      console.log('\n📋 Amazon FBA Sample Listings:');
      amazonFBAListings.slice(0, 5).forEach((listing, i) => {
        console.log(`${i + 1}. ${listing.name} - $${listing.asking_price.toLocaleString()} (${listing.source})`);
      });
    }
    
    return allListings;
  }
}

const scraper = new QuickTestScraper();
scraper.runQuickTest().catch(console.error);