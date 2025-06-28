#!/usr/bin/env node

// Create a working scraper that combines direct scraping with ScraperAPI fallback

import { chromium } from 'playwright';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();

class HybridScraper {
  constructor(config = {}) {
    this.config = {
      headless: true,
      timeout: 30000,
      useScraperAPI: true,
      scraperAPIKey: process.env.SCRAPER_API_KEY,
      ...config
    };
  }
  
  async scrapeWithPlaywright(url) {
    console.log(`🎭 Trying Playwright: ${url}`);
    
    let browser;
    try {
      browser = await chromium.launch({
        headless: this.config.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      });
      
      await page.goto(url, { 
        waitUntil: 'domcontentloaded', 
        timeout: this.config.timeout 
      });
      
      await page.waitForTimeout(3000);
      
      const content = await page.content();
      await browser.close();
      
      return { success: true, content, method: 'playwright' };
      
    } catch (error) {
      if (browser) await browser.close();
      console.log(`   ❌ Playwright failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  async scrapeWithScraperAPI(url) {
    if (!this.config.scraperAPIKey) {
      return { success: false, error: 'No ScraperAPI key configured' };
    }
    
    console.log(`🌐 Trying ScraperAPI: ${url}`);
    
    try {
      const scraperUrl = `http://api.scraperapi.com?api_key=${this.config.scraperAPIKey}&url=${encodeURIComponent(url)}&render=true`;
      
      const response = await fetch(scraperUrl, { timeout: 30000 });
      
      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      const content = await response.text();
      return { success: true, content, method: 'scraperapi' };
      
    } catch (error) {
      console.log(`   ❌ ScraperAPI failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  async scrapeURL(url) {
    // Try Playwright first
    let result = await this.scrapeWithPlaywright(url);
    
    // Fallback to ScraperAPI if Playwright fails
    if (!result.success && this.config.useScraperAPI) {
      result = await this.scrapeWithScraperAPI(url);
    }
    
    return result;
  }
  
  extractListingsFromHTML(html, site) {
    const $ = cheerio.load(html);
    const listings = [];
    
    const siteConfigs = {
      bizbuysell: {
        selectors: ['div[class*="listing"]', '.business-card', 'article'],
        nameSelectors: ['.listing-title', 'h2', 'h3', 'a[title]'],
        priceSelectors: ['.price', '.asking-price', '[class*="price"]'],
        linkSelectors: ['a[href*="/business-"]']
      },
      quietlight: {
        selectors: ['article', '.business-card', '.post'],
        nameSelectors: ['.listing-title', 'h1', 'h2', 'h3'],
        priceSelectors: ['.price', '.asking-price'],
        linkSelectors: ['a[href*="/listing"]']
      },
      acquire: {
        selectors: ['.startup-card', '.listing-card', 'article'],
        nameSelectors: ['.startup-name', 'h2', 'h3'],
        priceSelectors: ['.price', '.valuation'],
        linkSelectors: ['a[href*="/startup"]']
      }
    };
    
    const config = siteConfigs[site] || siteConfigs.bizbuysell;
    
    // Try each selector until we find listings
    for (const selector of config.selectors) {
      const elements = $(selector);
      
      if (elements.length > 0) {
        console.log(`   ✅ Found ${elements.length} elements with: ${selector}`);
        
        elements.each((i, element) => {
          if (i >= 10) return; // Limit to first 10 for testing
          
          const $el = $(element);
          
          // Extract name
          let name = '';
          for (const nameSelector of config.nameSelectors) {
            const nameEl = $el.find(nameSelector).first();
            if (nameEl.length) {
              name = nameEl.text().trim() || nameEl.attr('title') || '';
              if (name.length > 3) break;
            }
          }
          
          // Extract price
          let price = '';
          for (const priceSelector of config.priceSelectors) {
            const priceEl = $el.find(priceSelector).first();
            if (priceEl.length) {
              price = priceEl.text().trim();
              if (price.length > 0) break;
            }
          }
          
          // Extract link
          let link = '';
          for (const linkSelector of config.linkSelectors) {
            const linkEl = $el.find(linkSelector).first();
            if (linkEl.length) {
              link = linkEl.attr('href') || '';
              if (link.length > 0) break;
            }
          }
          
          if (name && name.length > 3) {
            listings.push({
              name: name.substring(0, 100),
              price: price.substring(0, 50),
              link: link.startsWith('http') ? link : `https://${site}.com${link}`,
              source: site
            });
          }
        });
        
        break; // Found listings with this selector, stop trying others
      }
    }
    
    return listings;
  }
}

async function testHybridScraper() {
  console.log('🚀 Testing Hybrid Scraper\n');
  
  const scraper = new HybridScraper({
    headless: true,
    useScraperAPI: true
  });
  
  const sites = [
    {
      name: 'bizbuysell',
      url: 'https://www.bizbuysell.com/businesses-for-sale/'
    },
    {
      name: 'quietlight', 
      url: 'https://quietlight.com/businesses-for-sale/'
    },
    {
      name: 'acquire',
      url: 'https://acquire.com/search?type=startup&status=for-sale'
    }
  ];
  
  for (const site of sites) {
    console.log(`\n📍 Testing ${site.name.toUpperCase()}`);
    
    const result = await scraper.scrapeURL(site.url);
    
    if (result.success) {
      console.log(`   ✅ Success via ${result.method}`);
      console.log(`   📄 Content length: ${result.content.length} chars`);
      
      const listings = scraper.extractListingsFromHTML(result.content, site.name);
      console.log(`   📋 Extracted ${listings.length} listings`);
      
      if (listings.length > 0) {
        console.log('   Sample listings:');
        listings.slice(0, 3).forEach((listing, i) => {
          console.log(`     ${i + 1}. "${listing.name}"`);
          console.log(`        Price: ${listing.price || 'None'}`);
          console.log(`        Link: ${listing.link.substring(0, 60)}...`);
        });
      }
    } else {
      console.log(`   ❌ Failed: ${result.error}`);
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log('\n🎯 Hybrid scraper test complete!');
}

testHybridScraper().catch(console.error);