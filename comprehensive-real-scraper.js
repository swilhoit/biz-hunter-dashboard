#!/usr/bin/env node

// Comprehensive real data scraper using multiple approaches
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';

dotenv.config();

class ComprehensiveRealScraper {
  constructor() {
    this.supabaseUrl = process.env.VITE_SUPABASE_URL;
    this.supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    this.scraperAPIKey = process.env.SCRAPER_API_KEY;
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    this.browser = null;
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async scrapeWithMultipleMethods(url, siteName) {
    console.log(`🌐 Scraping ${siteName}: ${url}`);
    
    // Try ScraperAPI first
    try {
      const scraperUrl = `http://api.scraperapi.com?api_key=${this.scraperAPIKey}&url=${encodeURIComponent(url)}&render=true&premium=true`;
      const response = await fetch(scraperUrl, { timeout: 30000 });
      
      if (response.ok) {
        const content = await response.text();
        console.log(`   ✅ ScraperAPI: ${content.length} chars`);
        return { success: true, content, method: 'scraperapi' };
      }
    } catch (error) {
      console.log(`   ❌ ScraperAPI failed: ${error.message}`);
    }

    // Try Playwright as backup
    try {
      await this.initBrowser();
      const page = await this.browser.newPage({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      });
      
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(3000);
      
      const content = await page.content();
      await page.close();
      
      console.log(`   ✅ Playwright: ${content.length} chars`);
      return { success: true, content, method: 'playwright' };
      
    } catch (error) {
      console.log(`   ❌ Playwright failed: ${error.message}`);
    }

    return { success: false };
  }

  async scrapeEmpireFlippersComprehensive() {
    console.log('\n📍 EMPIRE FLIPPERS - Comprehensive Scraping');
    
    const urls = [
      'https://empireflippers.com/marketplace/',
      'https://empireflippers.com/marketplace/?industry=amazon-fba',
      'https://empireflippers.com/marketplace/?industry=content',
      'https://empireflippers.com/marketplace/?industry=ecommerce',
      'https://empireflippers.com/marketplace/?industry=saas',
      'https://empireflippers.com/marketplace/?sort=newest',
      'https://empireflippers.com/marketplace/?sort=price_high'
    ];
    
    const allListings = [];
    
    for (const url of urls) {
      console.log(`\n🔍 Scraping: ${url}`);
      const result = await this.scrapeWithMultipleMethods(url, 'Empire Flippers');
      
      if (result.success) {
        const listings = this.extractEmpireFlippersListings(result.content);
        console.log(`   📋 Extracted: ${listings.length} listings`);
        allListings.push(...listings);
        
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    return this.deduplicateListings(allListings);
  }

  extractEmpireFlippersListings(content) {
    const $ = cheerio.load(content);
    const listings = [];
    
    // Multiple selector strategies
    const selectors = [
      '.listing-card',
      '.marketplace-listing',
      '[class*="listing"]',
      '[class*="business"]',
      '.result-item',
      'article',
      '[data-listing]'
    ];
    
    for (const selector of selectors) {
      $(selector).each((i, element) => {
        const $item = $(element);
        const text = $item.text();
        
        // Skip if no meaningful content
        if (!text || text.length < 50) return;
        
        // Look for business indicators
        if (!text.includes('$') && !text.toLowerCase().includes('business') && !text.toLowerCase().includes('website')) return;
        
        const listing = this.extractListingFromElement($item, 'EmpireFlippers');
        if (listing && listing.name && listing.name.length > 10) {
          listings.push(listing);
        }
      });
      
      if (listings.length > 0) break; // Stop if we found listings with this selector
    }
    
    // If no structured listings found, try text-based extraction
    if (listings.length === 0) {
      const textListings = this.extractListingsFromText(content, 'EmpireFlippers');
      listings.push(...textListings);
    }
    
    return listings;
  }

  extractListingFromElement($item, source) {
    // Get name/title
    const titleSelectors = ['h1', 'h2', 'h3', '.title', '.name', '[class*="title"]', '[class*="name"]'];
    let name = '';
    
    for (const sel of titleSelectors) {
      const text = $item.find(sel).first().text().trim();
      if (text && text.length > 5 && text.length < 200) {
        name = text;
        break;
      }
    }
    
    // If no structured title, try getting from text content
    if (!name) {
      const lines = $item.text().split('\n').map(l => l.trim()).filter(l => l);
      name = lines.find(line => 
        line.length > 10 && 
        line.length < 150 && 
        !line.includes('$') && 
        line.match(/[a-zA-Z].*[a-zA-Z]/)
      ) || '';
    }
    
    // Get price
    const priceSelectors = ['.price', '[class*="price"]', '.cost', '.asking'];
    let priceText = '';
    
    for (const sel of priceSelectors) {
      const text = $item.find(sel).first().text().trim();
      if (text && text.includes('$')) {
        priceText = text;
        break;
      }
    }
    
    // If no structured price, extract from text
    if (!priceText) {
      const text = $item.text();
      const priceMatch = text.match(/\$[\d,]+[kKmM]?/);
      if (priceMatch) {
        priceText = priceMatch[0];
      }
    }
    
    // Get revenue/profit
    const revenueSelectors = ['.revenue', '.profit', '[class*="revenue"]', '[class*="profit"]'];
    let revenueText = '';
    
    for (const sel of revenueSelectors) {
      const text = $item.find(sel).first().text().trim();
      if (text && text.includes('$') && !text.includes(priceText)) {
        revenueText = text;
        break;
      }
    }
    
    // Get URL
    const url = $item.find('a').first().attr('href');
    
    if (!name || name.length < 10) return null;
    
    return {
      name: name.substring(0, 200),
      asking_price: this.parsePrice(priceText),
      annual_revenue: this.parsePrice(revenueText) || 0,
      industry: this.determineIndustry(name + ' ' + $item.text()),
      location: 'Online',
      source: source,
      highlights: [priceText, revenueText].filter(Boolean),
      original_url: url ? this.normalizeUrl(url, source) : null,
      status: 'active',
      description: null
    };
  }

  extractListingsFromText(content, source) {
    const $ = cheerio.load(content);
    const text = $.text();
    const listings = [];
    
    // Look for patterns like business names followed by prices
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i];
      const nextLine = lines[i + 1];
      
      // Look for business name (reasonable length, contains letters)
      if (line.length > 15 && line.length < 100 && line.match(/[a-zA-Z].*[a-zA-Z]/)) {
        // Check if next few lines contain price
        const context = lines.slice(i, i + 3).join(' ');
        const priceMatch = context.match(/\$[\d,]+[kKmM]?/);
        
        if (priceMatch && !line.includes('$')) {
          listings.push({
            name: line.substring(0, 200),
            asking_price: this.parsePrice(priceMatch[0]),
            annual_revenue: 0,
            industry: this.determineIndustry(line),
            location: 'Online',
            source: source,
            highlights: [priceMatch[0]],
            original_url: null,
            status: 'active',
            description: null
          });
        }
      }
    }
    
    return listings.slice(0, 20); // Limit to prevent spam
  }

  determineIndustry(text) {
    const lower = text.toLowerCase();
    if (lower.includes('amazon') || lower.includes('fba')) return 'Amazon FBA';
    if (lower.includes('saas') || lower.includes('software')) return 'SaaS';
    if (lower.includes('ecommerce') || lower.includes('e-commerce')) return 'E-commerce';
    if (lower.includes('content') || lower.includes('blog') || lower.includes('affiliate')) return 'Content/Affiliate';
    if (lower.includes('app') || lower.includes('mobile')) return 'Mobile App';
    if (lower.includes('restaurant') || lower.includes('food')) return 'Restaurant';
    if (lower.includes('manufacturing')) return 'Manufacturing';
    if (lower.includes('service')) return 'Service Business';
    return 'Digital Business';
  }

  isAmazonFBABusiness(listing) {
    const keywords = [
      'amazon fba', 'fulfillment by amazon', 'amazon seller',
      'fba business', 'amazon store', 'private label',
      'product sourcing', 'amazon marketplace', 'amazon brand',
      'wholesale to amazon', 'retail arbitrage', 'online arbitrage'
    ];
    const text = `${listing.name || ''} ${listing.description || ''}`.toLowerCase();
    return keywords.some(keyword => text.includes(keyword)) || listing.industry === 'Amazon FBA';
  }

  validateListing(listing) {
    // Check for valid business name
    if (!listing.name || listing.name === 'Unknown Business' || listing.name.length < 3) {
      return false;
    }
    
    // Check for valid prices
    if (!listing.asking_price || listing.asking_price < 1000 || listing.asking_price > 100000000) {
      return false;
    }
    
    // Check for valid revenue (if provided)
    if (listing.annual_revenue && (listing.annual_revenue < 0 || listing.annual_revenue > 100000000)) {
      return false;
    }
    
    return true;
  }

  normalizeUrl(url, source) {
    if (url.startsWith('http')) return url;
    
    const baseUrls = {
      'EmpireFlippers': 'https://empireflippers.com',
      'BizBuySell': 'https://www.bizbuysell.com',
      'QuietLight': 'https://quietlight.com',
      'Flippa': 'https://flippa.com',
      'BizQuest': 'https://www.bizquest.com'
    };
    
    return baseUrls[source] + url;
  }

  parsePrice(priceText) {
    if (!priceText) return null;
    
    const cleanPrice = priceText.replace(/[^\d.,kmKM]/g, '');
    const match = cleanPrice.match(/[\d.,]+/);
    if (!match) return null;
    
    const numericValue = parseFloat(match[0].replace(/,/g, ''));
    if (isNaN(numericValue)) return null;
    
    const lowerText = priceText.toLowerCase();
    let finalPrice;
    if (lowerText.includes('m') || lowerText.includes('million')) {
      finalPrice = Math.round(numericValue * 1000000);
    } else if (lowerText.includes('k') || lowerText.includes('thousand')) {
      finalPrice = Math.round(numericValue * 1000);
    } else {
      finalPrice = Math.round(numericValue);
    }
    
    // Validate price range for Amazon FBA businesses
    if (finalPrice < 1000 || finalPrice > 100000000) {
      console.log(`⚠️ Invalid price filtered out: $${finalPrice?.toLocaleString()}`);
      return null;
    }
    
    return finalPrice;
  }

  deduplicateListings(listings) {
    const seen = new Set();
    return listings.filter(listing => {
      const key = `${listing.name}-${listing.source}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async scrapeBizBuySellPages() {
    console.log('\n📍 BIZBUYSELL - Multiple Pages');
    
    const urls = [
      'https://www.bizbuysell.com/businesses-for-sale/',
      'https://www.bizbuysell.com/businesses-for-sale/online-businesses',
      'https://www.bizbuysell.com/businesses-for-sale/technology-businesses',
      'https://www.bizbuysell.com/businesses-for-sale/retail-businesses'
    ];
    
    const allListings = [];
    
    for (const url of urls) {
      const result = await this.scrapeWithMultipleMethods(url, 'BizBuySell');
      if (result.success) {
        const listings = this.extractGenericListings(result.content, 'BizBuySell');
        console.log(`   📋 Extracted: ${listings.length} listings`);
        allListings.push(...listings);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    return this.deduplicateListings(allListings);
  }

  extractGenericListings(content, source) {
    const $ = cheerio.load(content);
    const listings = [];
    
    // Generic extraction for any site
    $('div, article, section').each((i, element) => {
      if (i > 200) return false; // Limit iterations
      
      const $item = $(element);
      const text = $item.text();
      
      // Must contain price and business-related terms
      if (text.includes('$') && text.length > 50 && text.length < 1000) {
        if (text.toLowerCase().includes('business') || 
            text.toLowerCase().includes('website') || 
            text.toLowerCase().includes('company') ||
            text.toLowerCase().includes('sale')) {
          
          const listing = this.extractListingFromElement($item, source);
          if (listing && listing.name && listing.name.length > 10) {
            listings.push(listing);
          }
        }
      }
    });
    
    return listings.slice(0, 50); // Limit per page
  }

  async saveToDatabase(listings) {
    if (listings.length === 0) return { saved: 0, errors: 0 };

    // Filter for Amazon FBA businesses only and validate data quality
    const amazonFBAListings = listings
      .filter(listing => this.isAmazonFBABusiness(listing))
      .filter(listing => this.validateListing(listing));
    
    console.log(`🔍 Filtered to ${amazonFBAListings.length} valid Amazon FBA listings out of ${listings.length} total`);
    
    if (amazonFBAListings.length === 0) {
      console.log('⚠️ No valid Amazon FBA listings found to save');
      return { saved: 0, errors: 0 };
    }

    console.log(`💾 Saving ${amazonFBAListings.length} validated Amazon FBA listings to database...`);
    
    let saved = 0;
    let errors = 0;

    for (const listing of amazonFBAListings) {
      try {
        // Check for duplicates using multiple criteria
        const { data: existing } = await this.supabase
          .from('business_listings')
          .select('id')
          .or(`name.eq.${listing.name},original_url.eq.${listing.original_url || 'none'}`)
          .eq('source', listing.source)
          .limit(1);

        if (existing && existing.length > 0) {
          console.log(`   ⏭️ Skipped duplicate: "${listing.name}"`);
          continue;
        }

        const { error } = await this.supabase
          .from('business_listings')
          .insert(listing);

        if (error) {
          errors++;
          if (errors <= 3) console.error(`❌ Error: ${error.message}`);
        } else {
          saved++;
          if (saved <= 5) {
            console.log(`   ✅ Saved Amazon FBA: "${listing.name}" - $${listing.asking_price?.toLocaleString() || 'N/A'}`);
          }
        }
      } catch (err) {
        errors++;
        if (errors <= 3) console.error(`❌ Save error: ${err.message}`);
      }
    }

    return { saved, errors };
  }

  async runComprehensiveScraping() {
    console.log('🚀 STARTING COMPREHENSIVE REAL DATA SCRAPING\n');
    
    const allListings = [];
    
    try {
      // Empire Flippers - comprehensive
      const empireFlippersListings = await this.scrapeEmpireFlippersComprehensive();
      console.log(`\n✅ Empire Flippers Total: ${empireFlippersListings.length} listings`);
      allListings.push(...empireFlippersListings);
      
      // BizBuySell - multiple pages
      const bizBuySellListings = await this.scrapeBizBuySellPages();
      console.log(`\n✅ BizBuySell Total: ${bizBuySellListings.length} listings`);
      allListings.push(...bizBuySellListings);
      
      // Flippa variations
      console.log('\n📍 FLIPPA - Multiple Categories');
      const flippaUrls = [
        'https://flippa.com/search?filter%5Bproperty_type%5D%5B%5D=website',
        'https://flippa.com/search?filter%5Bproperty_type%5D%5B%5D=app',
        'https://flippa.com/search?filter%5Bproperty_type%5D%5B%5D=domain'
      ];
      
      for (const url of flippaUrls) {
        const result = await this.scrapeWithMultipleMethods(url, 'Flippa');
        if (result.success) {
          const listings = this.extractGenericListings(result.content, 'Flippa');
          console.log(`   📋 Flippa page: ${listings.length} listings`);
          allListings.push(...listings);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      
      console.log(`\n📊 TOTAL LISTINGS EXTRACTED: ${allListings.length}`);
      
      if (allListings.length > 0) {
        const saveResults = await this.saveToDatabase(allListings);
        
        console.log(`\n✅ COMPREHENSIVE SCRAPING COMPLETED!`);
        console.log(`💾 New listings saved: ${saveResults.saved}`);
        console.log(`❌ Errors: ${saveResults.errors}`);
      }
      
      // Final stats
      const { data: stats } = await this.supabase
        .from('business_listings')
        .select('source')
        .eq('status', 'active');
      
      if (stats) {
        const sourceCounts = {};
        stats.forEach(item => {
          sourceCounts[item.source] = (sourceCounts[item.source] || 0) + 1;
        });
        
        console.log('\n📈 FINAL DATABASE TOTALS:');
        Object.entries(sourceCounts)
          .sort(([,a], [,b]) => b - a)
          .forEach(([source, count]) => {
            console.log(`  ${source}: ${count} listings`);
          });
        
        const total = Object.values(sourceCounts).reduce((sum, count) => sum + count, 0);
        console.log(`\n🎯 TOTAL ACTIVE LISTINGS: ${total}`);
      }
      
    } catch (error) {
      console.error('❌ Comprehensive scraping failed:', error);
    } finally {
      await this.closeBrowser();
    }
  }
}

// Run comprehensive scraper
const scraper = new ComprehensiveRealScraper();
scraper.runComprehensiveScraping().catch(console.error);