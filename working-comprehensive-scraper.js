#!/usr/bin/env node

// Comprehensive scraper for actually working sites to populate dashboard

import { chromium } from 'playwright';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';

dotenv.config();

class ComprehensiveScraper {
  constructor() {
    this.supabaseUrl = process.env.VITE_SUPABASE_URL;
    this.supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    this.scraperAPIKey = process.env.SCRAPER_API_KEY;
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }

  async scrapeWithPlaywright(url) {
    console.log(`🎭 Trying Playwright: ${url}`);
    
    let browser;
    try {
      browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });
      
      await page.goto(url, { 
        waitUntil: 'domcontentloaded', 
        timeout: 30000 
      });
      
      await page.waitForTimeout(5000); // Wait for dynamic content
      
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
    if (!this.scraperAPIKey) {
      return { success: false, error: 'No ScraperAPI key' };
    }
    
    console.log(`🌐 Trying ScraperAPI: ${url}`);
    
    try {
      const scraperUrl = `http://api.scraperapi.com?api_key=${this.scraperAPIKey}&url=${encodeURIComponent(url)}&render=true&premium=true`;
      
      const response = await fetch(scraperUrl, { timeout: 45000 });
      
      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }
      
      const content = await response.text();
      return { success: true, content, method: 'scraperapi' };
      
    } catch (error) {
      console.log(`   ❌ ScraperAPI failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  extractListings(html, siteName) {
    const $ = cheerio.load(html);
    const listings = [];
    
    console.log(`   🔍 Extracting listings for ${siteName}...`);
    
    // Define selectors for each site
    const siteConfigs = {
      'Acquire': {
        containerSelectors: ['.startup-card', '.listing-card', '.startup', '.business-card', 'article', '.card'],
        nameSelectors: ['.startup-name', '.business-name', '.title', 'h2', 'h3', 'h4'],
        priceSelectors: ['.price', '.asking-price', '.valuation', '.revenue'],
        descSelectors: ['.description', '.summary', '.excerpt', 'p'],
        linkSelectors: ['a[href*="/startup/"]', 'a[href*="/business/"]', 'a']
      },
      'Flippa': {
        containerSelectors: ['.listing-card', '.auction-card', '.website-card', 'article', '.card'],
        nameSelectors: ['.listing-title', '.website-name', '.title', 'h2', 'h3'],
        priceSelectors: ['.current-bid', '.buy-now-price', '.price', '.revenue'],
        descSelectors: ['.description', '.summary', 'p'],
        linkSelectors: ['a[href*="/website/"]', 'a[href*="/listing/"]', 'a']
      },
      'BizBuySell': {
        containerSelectors: ['div[class*="listing"]', '.business-card', 'article', '.listing-item'],
        nameSelectors: ['.listing-title', '.business-name', 'h2', 'h3'],
        priceSelectors: ['.asking-price', '.price', '.value'],
        descSelectors: ['.description', '.summary', 'p'],
        linkSelectors: ['a[href*="/business-"]', 'a']
      },
      'QuietLight': {
        containerSelectors: ['article', '.business-card', '.listing-card', '.post'],
        nameSelectors: ['.listing-title', 'h1', 'h2', 'h3', '.title'],
        priceSelectors: ['.price', '.asking-price', '.valuation'],
        descSelectors: ['.description', '.summary', '.excerpt', 'p'],
        linkSelectors: ['a[href*="/listing"]', 'a']
      }
    };
    
    const config = siteConfigs[siteName] || siteConfigs['Acquire'];
    
    // Try each container selector
    for (const containerSelector of config.containerSelectors) {
      const containers = $(containerSelector);
      
      if (containers.length > 0) {
        console.log(`   ✅ Found ${containers.length} containers with: ${containerSelector}`);
        
        containers.each((i, container) => {
          if (i >= 20) return; // Limit to 20 listings per site
          
          const $container = $(container);
          
          // Extract name
          let name = '';
          for (const nameSelector of config.nameSelectors) {
            const nameEl = $container.find(nameSelector).first();
            if (nameEl.length) {
              name = nameEl.text().trim();
              if (name.length > 3) break;
            }
          }
          
          // Extract price/revenue
          let priceText = '';
          for (const priceSelector of config.priceSelectors) {
            const priceEl = $container.find(priceSelector).first();
            if (priceEl.length) {
              priceText = priceEl.text().trim();
              if (priceText.length > 0) break;
            }
          }
          
          // Extract description
          let description = '';
          for (const descSelector of config.descSelectors) {
            const descEl = $container.find(descSelector).first();
            if (descEl.length) {
              description = descEl.text().trim();
              if (description.length > 20) break;
            }
          }
          
          // Extract link
          let link = '';
          for (const linkSelector of config.linkSelectors) {
            const linkEl = $container.find(linkSelector).first();
            if (linkEl.length) {
              link = linkEl.attr('href') || '';
              if (link.length > 0) break;
            }
          }
          
          // Parse financial data
          const { askingPrice, annualRevenue } = this.parseFinancialData(name, priceText, description);
          
          if (name && name.length > 3) {
            listings.push({
              name: name.substring(0, 200),
              description: description.substring(0, 500) || `${siteName} business opportunity`,
              asking_price: askingPrice,
              annual_revenue: annualRevenue,
              industry: this.extractIndustry(name, description),
              location: this.extractLocation(description) || 'Remote',
              source: siteName,
              original_url: this.normalizeUrl(link, siteName),
              highlights: [],
              status: 'active'
            });
          }
        });
        
        break; // Found listings with this selector, stop trying others
      }
    }
    
    console.log(`   📊 Extracted ${listings.length} listings from ${siteName}`);
    return listings;
  }

  parseFinancialData(name, priceText, description) {
    const fullText = `${name} ${priceText} ${description}`.toLowerCase();
    
    let askingPrice = 0;
    let annualRevenue = 0;
    
    // Enhanced financial parsing patterns
    const patterns = [
      // Revenue patterns
      { type: 'revenue', regex: /revenue[:\s]*\$?([\d,]+(?:\.\d+)?[km]?)/i },
      { type: 'revenue', regex: /\$?([\d,]+(?:\.\d+)?[km]?)\s*revenue/i },
      { type: 'revenue', regex: /\$?([\d.]+[km]?)\s*annual/i },
      
      // SDE patterns (use as revenue)
      { type: 'revenue', regex: /sde[:\s]*\$?([\d,]+(?:\.\d+)?[km]?)/i },
      { type: 'revenue', regex: /\$?([\d,]+(?:\.\d+)?[km]?)\s*sde/i },
      
      // Price patterns
      { type: 'price', regex: /asking[:\s]*\$?([\d,]+(?:\.\d+)?[km]?)/i },
      { type: 'price', regex: /price[:\s]*\$?([\d,]+(?:\.\d+)?[km]?)/i },
      { type: 'price', regex: /\$?([\d,]+(?:\.\d+)?[km]?)\s*asking/i },
      
      // General money patterns
      { type: 'general', regex: /\$(\d+(?:\.\d+)?[km])\b/i }
    ];
    
    for (const pattern of patterns) {
      const match = fullText.match(pattern.regex);
      if (match && match[1]) {
        const value = this.parseFinancialValue(match[1]);
        
        if (pattern.type === 'revenue' && !annualRevenue) {
          annualRevenue = value;
        } else if (pattern.type === 'price' && !askingPrice) {
          askingPrice = value;
        } else if (pattern.type === 'general' && !annualRevenue && !askingPrice) {
          // Use as revenue if nothing else found
          annualRevenue = value;
        }
      }
    }
    
    return { askingPrice, annualRevenue };
  }

  parseFinancialValue(text) {
    if (!text) return 0;
    
    const cleanText = text.toLowerCase().replace(/[^0-9.km]/g, '');
    
    if (cleanText.includes('m')) {
      return Math.floor(parseFloat(cleanText.replace('m', '')) * 1000000);
    }
    
    if (cleanText.includes('k')) {
      return Math.floor(parseFloat(cleanText.replace('k', '')) * 1000);
    }
    
    const num = parseFloat(cleanText);
    return isNaN(num) ? 0 : Math.floor(num);
  }

  extractIndustry(name, description) {
    const text = `${name} ${description}`.toLowerCase();
    
    const industries = {
      'SaaS': /\b(saas|software|platform|app|application|subscription)\b/,
      'E-commerce': /\b(ecommerce|e-commerce|shopify|store|retail|marketplace)\b/,
      'Content': /\b(blog|content|media|newsletter|publication)\b/,
      'Technology': /\b(tech|ai|automation|api|development)\b/,
      'Health': /\b(health|medical|wellness|fitness|supplement)\b/,
      'Education': /\b(education|learning|course|training|school)\b/,
      'Finance': /\b(finance|fintech|payment|trading|crypto)\b/,
      'Food & Beverage': /\b(food|restaurant|beverage|cafe|kitchen)\b/
    };
    
    for (const [industry, pattern] of Object.entries(industries)) {
      if (pattern.test(text)) {
        return industry;
      }
    }
    
    return 'Online Business';
  }

  extractLocation(text) {
    if (!text) return null;
    
    const locationPatterns = [
      /located in ([^,.\n]+)/i,
      /based in ([^,.\n]+)/i,
      /([A-Z][a-z]+,\s*[A-Z]{2})/,
      /(United States|USA|US|Remote|Global)/i
    ];
    
    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return null;
  }

  normalizeUrl(url, siteName) {
    if (!url) return null;
    
    if (url.startsWith('http')) return url;
    
    const baseUrls = {
      'Acquire': 'https://acquire.com',
      'Flippa': 'https://flippa.com',
      'BizBuySell': 'https://www.bizbuysell.com',
      'QuietLight': 'https://quietlight.com'
    };
    
    const baseUrl = baseUrls[siteName] || 'https://example.com';
    return url.startsWith('/') ? baseUrl + url : baseUrl + '/' + url;
  }

  async saveListings(listings) {
    if (listings.length === 0) return 0;
    
    console.log(`💾 Saving ${listings.length} listings to database...`);
    
    try {
      const { data, error } = await this.supabase
        .from('business_listings')
        .insert(listings)
        .select();
      
      if (error) {
        console.log(`❌ Error saving listings: ${error.message}`);
        return 0;
      }
      
      console.log(`✅ Successfully saved ${data.length} listings`);
      return data.length;
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      return 0;
    }
  }

  async scrapeAndPopulate() {
    console.log('🚀 Starting Comprehensive Dashboard Population\n');
    
    const sitesToScrape = [
      { name: 'Acquire', url: 'https://acquire.com/' },
      { name: 'Flippa', url: 'https://flippa.com/browse/websites' }
    ];
    
    let totalNewListings = 0;
    
    for (const site of sitesToScrape) {
      console.log(`\n📍 Scraping ${site.name}`);
      console.log('='.repeat(site.name.length + 12));
      
      // Try Playwright first, then ScraperAPI
      let result = await this.scrapeWithPlaywright(site.url);
      
      if (!result.success) {
        result = await this.scrapeWithScraperAPI(site.url);
      }
      
      if (result.success) {
        console.log(`   ✅ Retrieved content via ${result.method}`);
        
        const listings = this.extractListings(result.content, site.name);
        
        if (listings.length > 0) {
          // Show sample listings
          console.log(`   📋 Sample listings:`);
          listings.slice(0, 3).forEach((listing, i) => {
            console.log(`     ${i + 1}. ${listing.name.substring(0, 50)}...`);
            console.log(`        Price: $${listing.asking_price.toLocaleString()}`);
            console.log(`        Revenue: $${listing.annual_revenue.toLocaleString()}`);
          });
          
          const saved = await this.saveListings(listings);
          totalNewListings += saved;
        } else {
          console.log('   ⚠️ No listings extracted');
        }
      } else {
        console.log(`   ❌ Failed to scrape ${site.name}: ${result.error}`);
      }
      
      // Rate limiting between sites
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    console.log(`\n🎉 POPULATION COMPLETE!`);
    console.log(`📊 Total new listings added: ${totalNewListings}`);
    
    // Get final count
    const { count } = await this.supabase
      .from('business_listings')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📈 Total listings in database: ${count}`);
    
    return totalNewListings;
  }
}

async function main() {
  const scraper = new ComprehensiveScraper();
  await scraper.scrapeAndPopulate();
}

main().catch(console.error);