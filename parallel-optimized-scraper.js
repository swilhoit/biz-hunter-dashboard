#!/usr/bin/env node

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';

dotenv.config();

class ParallelOptimizedScraper {
  constructor() {
    this.supabaseUrl = process.env.VITE_SUPABASE_URL;
    this.supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    this.scraperAPIKey = process.env.SCRAPER_API_KEY;
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    this.browser = null;
    this.concurrentLimit = 5; // Parallel scraping limit
    this.requestDelay = 2000; // Delay between requests (ms)
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

  // Enhanced URL generation for better coverage
  generateTargetUrls() {
    return [
      // Empire Flippers - Extended coverage
      {
        site: 'EmpireFlippers',
        urls: [
          'https://empireflippers.com/marketplace/',
          'https://empireflippers.com/marketplace/?industry=amazon-fba',
          'https://empireflippers.com/marketplace/?industry=ecommerce',
          'https://empireflippers.com/marketplace/?industry=saas',
          'https://empireflippers.com/marketplace/?industry=content',
          'https://empireflippers.com/marketplace/?sort=newest',
          'https://empireflippers.com/marketplace/?sort=price_high',
          'https://empireflippers.com/marketplace/?sort=price_low',
          'https://empireflippers.com/marketplace/?verified=1',
          'https://empireflippers.com/marketplace/?business_model=fulfillment_by_amazon'
        ]
      },
      // BizBuySell - More comprehensive coverage
      {
        site: 'BizBuySell',
        urls: [
          'https://www.bizbuysell.com/businesses-for-sale/',
          'https://www.bizbuysell.com/businesses-for-sale/online-businesses',
          'https://www.bizbuysell.com/businesses-for-sale/technology-businesses',
          'https://www.bizbuysell.com/businesses-for-sale/retail-businesses',
          'https://www.bizbuysell.com/businesses-for-sale/ecommerce-businesses',
          'https://www.bizbuysell.com/businesses-for-sale/wholesale-distribution-businesses',
          'https://www.bizbuysell.com/businesses-for-sale/?sort=newest',
          'https://www.bizbuysell.com/businesses-for-sale/?sort=price_high',
          'https://www.bizbuysell.com/search/businesses-for-sale/?q=amazon',
          'https://www.bizbuysell.com/search/businesses-for-sale/?q=fba'
        ]
      },
      // QuietLight - Enhanced targeting
      {
        site: 'QuietLight',
        urls: [
          'https://quietlight.com/listings/',
          'https://quietlight.com/listings/?type=amazon-fba',
          'https://quietlight.com/listings/?type=ecommerce',
          'https://quietlight.com/listings/?type=saas',
          'https://quietlight.com/listings/?sort=newest',
          'https://quietlight.com/listings/?sort=price',
          'https://quietlight.com/listings/category/amazon-fba/',
          'https://quietlight.com/listings/category/ecommerce/'
        ]
      },
      // Flippa - Multiple entry points
      {
        site: 'Flippa',
        urls: [
          'https://flippa.com/search',
          'https://flippa.com/search?filter%5Bproperty_type%5D%5B%5D=website',
          'https://flippa.com/search?filter%5Bproperty_type%5D%5B%5D=app',
          'https://flippa.com/search?filter%5Bproperty_type%5D%5B%5D=domain',
          'https://flippa.com/search?search%5Bkeyword%5D=amazon',
          'https://flippa.com/search?search%5Bkeyword%5D=fba',
          'https://flippa.com/search?search%5Bkeyword%5D=ecommerce',
          'https://flippa.com/browse/websites',
          'https://flippa.com/browse/apps'
        ]
      },
      // BizQuest - More comprehensive
      {
        site: 'BizQuest',
        urls: [
          'https://www.bizquest.com/businesses-for-sale/',
          'https://www.bizquest.com/businesses-for-sale/online-businesses/',
          'https://www.bizquest.com/businesses-for-sale/internet-businesses/',
          'https://www.bizquest.com/businesses-for-sale/ecommerce-businesses/',
          'https://www.bizquest.com/search/businesses-for-sale/?keywords=amazon',
          'https://www.bizquest.com/search/businesses-for-sale/?keywords=online+store'
        ]
      },
      // ExitAdviser - New source
      {
        site: 'ExitAdviser',
        urls: [
          'https://www.exitadviser.com/business-for-sale',
          'https://www.exitadviser.com/business-for-sale/internet-business',
          'https://www.exitadviser.com/business-for-sale/e-commerce'
        ]
      }
    ];
  }

  // Parallel scraping with concurrency control
  async scrapeUrlsConcurrently(urls, siteName) {
    console.log(`🚀 Starting parallel scraping of ${urls.length} URLs for ${siteName}`);
    
    const results = [];
    const chunks = this.chunkArray(urls, this.concurrentLimit);
    
    for (const chunk of chunks) {
      const promises = chunk.map(async (url, index) => {
        // Stagger requests to avoid overwhelming servers
        await new Promise(resolve => setTimeout(resolve, index * this.requestDelay));
        
        try {
          const result = await this.scrapeWithMultipleMethods(url, siteName);
          if (result.success) {
            const listings = this.extractListingsFromContent(result.content, siteName);
            console.log(`   ✅ ${url}: ${listings.length} listings`);
            return { url, listings, success: true };
          }
          return { url, listings: [], success: false };
        } catch (error) {
          console.log(`   ❌ ${url}: ${error.message}`);
          return { url, listings: [], success: false, error: error.message };
        }
      });
      
      const chunkResults = await Promise.allSettled(promises);
      
      chunkResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value.success) {
          results.push(...result.value.listings);
        }
      });
      
      // Pause between chunks to be respectful
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        console.log(`   ⏱️ Pausing ${this.requestDelay * 2}ms between chunks...`);
        await new Promise(resolve => setTimeout(resolve, this.requestDelay * 2));
      }
    }
    
    return this.deduplicateListings(results);
  }

  // Enhanced scraping with multiple fallback methods
  async scrapeWithMultipleMethods(url, siteName) {
    const userAgents = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    
    // Method 1: ScraperAPI Premium
    try {
      const scraperUrl = `http://api.scraperapi.com?api_key=${this.scraperAPIKey}&url=${encodeURIComponent(url)}&render=true&premium=true&country_code=us`;
      const response = await fetch(scraperUrl, { 
        timeout: 30000,
        headers: {
          'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)]
        }
      });
      
      if (response.ok) {
        const content = await response.text();
        if (content.length > 1000) { // Ensure we got meaningful content
          return { success: true, content, method: 'scraperapi-premium' };
        }
      }
    } catch (error) {
      console.log(`   ScraperAPI Premium failed: ${error.message}`);
    }

    // Method 2: ScraperAPI Ultra Premium
    try {
      const scraperUrl = `http://api.scraperapi.com?api_key=${this.scraperAPIKey}&url=${encodeURIComponent(url)}&render=true&ultra_premium=true&country_code=us`;
      const response = await fetch(scraperUrl, { timeout: 40000 });
      
      if (response.ok) {
        const content = await response.text();
        if (content.length > 1000) {
          return { success: true, content, method: 'scraperapi-ultra' };
        }
      }
    } catch (error) {
      console.log(`   ScraperAPI Ultra failed: ${error.message}`);
    }

    // Method 3: Playwright with enhanced stealth
    try {
      await this.initBrowser();
      const context = await this.browser.newContext({
        userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
        viewport: { width: 1920, height: 1080 },
        extraHTTPHeaders: {
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        }
      });
      
      const page = await context.newPage();
      
      // Enhanced navigation with multiple wait strategies
      await page.goto(url, { 
        waitUntil: 'domcontentloaded', 
        timeout: 30000 
      });
      
      // Wait for dynamic content
      await page.waitForTimeout(5000);
      
      // Try to wait for common loading indicators to disappear
      try {
        await page.waitForSelector('[class*="loading"], [class*="spinner"], .loader', { 
          state: 'detached', 
          timeout: 10000 
        });
      } catch (e) {
        // Loading indicator may not exist, continue
      }
      
      const content = await page.content();
      await context.close();
      
      if (content.length > 1000) {
        return { success: true, content, method: 'playwright-stealth' };
      }
      
    } catch (error) {
      console.log(`   Playwright failed: ${error.message}`);
    }

    // Method 4: Direct fetch with rotation
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 15000
      });
      
      if (response.ok) {
        const content = await response.text();
        if (content.length > 500) {
          return { success: true, content, method: 'direct-fetch' };
        }
      }
    } catch (error) {
      console.log(`   Direct fetch failed: ${error.message}`);
    }

    return { success: false };
  }

  // Enhanced listing extraction with multiple strategies
  extractListingsFromContent(content, siteName) {
    const $ = cheerio.load(content);
    const listings = [];
    
    // Site-specific extraction strategies
    const extractors = {
      'EmpireFlippers': () => this.extractEmpireFlippersListings($),
      'BizBuySell': () => this.extractBizBuySellListings($),
      'QuietLight': () => this.extractQuietLightListings($),
      'Flippa': () => this.extractFlippaListings($),
      'BizQuest': () => this.extractBizQuestListings($),
      'ExitAdviser': () => this.extractExitAdviserListings($)
    };
    
    // Try site-specific extractor first
    if (extractors[siteName]) {
      const siteListings = extractors[siteName]();
      if (siteListings.length > 0) {
        listings.push(...siteListings);
      }
    }
    
    // Fallback to generic extraction
    if (listings.length === 0) {
      const genericListings = this.extractGenericListings($, siteName);
      listings.push(...genericListings);
    }
    
    // Text-based extraction as last resort
    if (listings.length === 0) {
      const textListings = this.extractListingsFromText(content, siteName);
      listings.push(...textListings);
    }
    
    return listings;
  }

  extractEmpireFlippersListings($) {
    const listings = [];
    const selectors = [
      '.listing-card', '.marketplace-listing', '.business-card',
      '[class*="listing"]', '[class*="business"]', '.result-item',
      'article', '[data-listing]', '.card'
    ];
    
    for (const selector of selectors) {
      $(selector).each((i, element) => {
        const $item = $(element);
        const listing = this.extractListingFromElement($item, 'EmpireFlippers');
        if (listing && this.validateListing(listing)) {
          listings.push(listing);
        }
      });
      if (listings.length > 0) break;
    }
    
    return listings;
  }

  extractBizBuySellListings($) {
    const listings = [];
    const selectors = [
      '.result-item', '.listing-item', '.business-item',
      '[class*="listing"]', '[class*="business"]', '.search-result'
    ];
    
    for (const selector of selectors) {
      $(selector).each((i, element) => {
        const $item = $(element);
        const listing = this.extractListingFromElement($item, 'BizBuySell');
        if (listing && this.validateListing(listing)) {
          listings.push(listing);
        }
      });
      if (listings.length > 0) break;
    }
    
    return listings;
  }

  extractQuietLightListings($) {
    const listings = [];
    const selectors = [
      '.listing-card', '.business-card', '.property-card',
      '.listing-item', '[class*="listing"]'
    ];
    
    for (const selector of selectors) {
      $(selector).each((i, element) => {
        const $item = $(element);
        const listing = this.extractListingFromElement($item, 'QuietLight');
        if (listing && this.validateListing(listing)) {
          listings.push(listing);
        }
      });
      if (listings.length > 0) break;
    }
    
    return listings;
  }

  extractFlippaListings($) {
    const listings = [];
    const selectors = [
      '[data-cy*="listing"]', '[data-testid*="listing"]',
      '.flip-card', '.search-result', '.listing-item',
      '.property-card', '[class*="listing"]'
    ];
    
    for (const selector of selectors) {
      $(selector).each((i, element) => {
        const $item = $(element);
        const listing = this.extractListingFromElement($item, 'Flippa');
        if (listing && this.validateListing(listing)) {
          listings.push(listing);
        }
      });
      if (listings.length > 0) break;
    }
    
    return listings;
  }

  extractBizQuestListings($) {
    const listings = [];
    const selectors = [
      '.listing-row', '.business-listing', '.result-item',
      '[class*="listing"]', '[class*="business"]'
    ];
    
    for (const selector of selectors) {
      $(selector).each((i, element) => {
        const $item = $(element);
        const listing = this.extractListingFromElement($item, 'BizQuest');
        if (listing && this.validateListing(listing)) {
          listings.push(listing);
        }
      });
      if (listings.length > 0) break;
    }
    
    return listings;
  }

  extractExitAdviserListings($) {
    const listings = [];
    const selectors = [
      '.business-card', '.listing-card', '.result-item',
      '[class*="business"]', '[class*="listing"]'
    ];
    
    for (const selector of selectors) {
      $(selector).each((i, element) => {
        const $item = $(element);
        const listing = this.extractListingFromElement($item, 'ExitAdviser');
        if (listing && this.validateListing(listing)) {
          listings.push(listing);
        }
      });
      if (listings.length > 0) break;
    }
    
    return listings;
  }

  extractGenericListings($, source) {
    const listings = [];
    
    $('div, article, section').each((i, element) => {
      if (i > 100) return false; // Limit iterations
      
      const $item = $(element);
      const text = $item.text();
      
      // Enhanced business detection
      if (text.includes('$') && text.length > 100 && text.length < 2000) {
        const businessKeywords = [
          'business', 'website', 'company', 'sale', 'selling',
          'amazon', 'fba', 'ecommerce', 'saas', 'app', 'store',
          'revenue', 'profit', 'income', 'monthly', 'annual'
        ];
        
        const hasBusinessKeywords = businessKeywords.some(keyword => 
          text.toLowerCase().includes(keyword)
        );
        
        if (hasBusinessKeywords) {
          const listing = this.extractListingFromElement($item, source);
          if (listing && this.validateListing(listing)) {
            listings.push(listing);
          }
        }
      }
    });
    
    return listings.slice(0, 30); // Limit per page
  }

  extractListingFromElement($item, source) {
    // Enhanced title extraction
    const titleSelectors = [
      'h1', 'h2', 'h3', 'h4', '.title', '.name', '.business-name',
      '[class*="title"]', '[class*="name"]', '[class*="heading"]'
    ];
    
    let name = '';
    for (const sel of titleSelectors) {
      const text = $item.find(sel).first().text().trim();
      if (text && text.length > 8 && text.length < 200 && !text.includes('$')) {
        name = text;
        break;
      }
    }
    
    // Fallback name extraction from text content
    if (!name) {
      const lines = $item.text().split('\n').map(l => l.trim()).filter(l => l);
      name = lines.find(line => 
        line.length > 15 && 
        line.length < 150 && 
        !line.includes('$') && 
        line.match(/[a-zA-Z].*[a-zA-Z]/) &&
        !line.toLowerCase().includes('price') &&
        !line.toLowerCase().includes('click')
      ) || '';
    }
    
    // Enhanced price extraction
    const priceSelectors = [
      '.price', '.asking-price', '.cost', '.asking', '.value',
      '[class*="price"]', '[class*="cost"]', '[class*="asking"]'
    ];
    
    let priceText = '';
    for (const sel of priceSelectors) {
      const text = $item.find(sel).first().text().trim();
      if (text && text.includes('$')) {
        priceText = text;
        break;
      }
    }
    
    // Fallback price extraction
    if (!priceText) {
      const text = $item.text();
      const priceMatches = text.match(/\$[\d,]+[kKmM]?/g);
      if (priceMatches) {
        // Find the largest price (likely the asking price)
        const prices = priceMatches.map(p => this.parsePrice(p)).filter(p => p);
        if (prices.length > 0) {
          const maxPrice = Math.max(...prices);
          priceText = priceMatches.find(p => this.parsePrice(p) === maxPrice);
        }
      }
    }
    
    // Enhanced revenue/profit extraction
    const revenueKeywords = ['revenue', 'profit', 'income', 'earnings', 'monthly', 'annual'];
    let revenueText = '';
    
    const textContent = $item.text().toLowerCase();
    const sentences = textContent.split(/[.!?]/).filter(s => s.length > 10);
    
    for (const sentence of sentences) {
      if (revenueKeywords.some(keyword => sentence.includes(keyword)) && sentence.includes('$')) {
        const revenueMatch = sentence.match(/\$[\d,]+[kKmM]?/);
        if (revenueMatch && revenueMatch[0] !== priceText) {
          revenueText = revenueMatch[0];
          break;
        }
      }
    }
    
    // URL extraction
    let url = $item.find('a').first().attr('href');
    if (url) {
      url = this.normalizeUrl(url, source);
    }
    
    if (!name || name.length < 8) return null;
    
    const listing = {
      name: name.substring(0, 200),
      asking_price: this.parsePrice(priceText),
      annual_revenue: this.parsePrice(revenueText) || 0,
      industry: this.determineIndustry(name + ' ' + $item.text()),
      location: this.extractLocation($item.text()) || 'Online',
      source: source,
      highlights: [priceText, revenueText].filter(Boolean),
      original_url: url,
      status: 'active',
      description: this.extractDescription($item.text(), name)
    };
    
    return listing;
  }

  extractLocation(text) {
    const locationPattern = /(California|CA|New York|NY|Texas|TX|Florida|FL|Online|Remote|USA|United States)/i;
    const match = text.match(locationPattern);
    return match ? match[0] : null;
  }

  extractDescription(text, name) {
    const sentences = text.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 20);
    const relevantSentences = sentences.filter(s => 
      !s.includes('$') && 
      !s.toLowerCase().includes('click') &&
      !s.toLowerCase().includes('learn more') &&
      s.toLowerCase() !== name.toLowerCase()
    );
    
    return relevantSentences.slice(0, 3).join('. ').substring(0, 500) || null;
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
    if (lower.includes('retail')) return 'Retail';
    if (lower.includes('wholesale')) return 'Wholesale';
    return 'Digital Business';
  }

  isAmazonFBABusiness(listing) {
    const keywords = [
      'amazon fba', 'fulfillment by amazon', 'amazon seller',
      'fba business', 'amazon store', 'private label',
      'product sourcing', 'amazon marketplace', 'amazon brand',
      'wholesale to amazon', 'retail arbitrage', 'online arbitrage',
      'amazon seller central', 'amazon account', 'fba inventory'
    ];
    const text = `${listing.name || ''} ${listing.description || ''}`.toLowerCase();
    return keywords.some(keyword => text.includes(keyword)) || listing.industry === 'Amazon FBA';
  }

  validateListing(listing) {
    // Enhanced validation
    if (!listing.name || listing.name.length < 8 || listing.name === 'Unknown Business') {
      return false;
    }
    
    // Check for spam/invalid names
    const spamPatterns = ['click here', 'learn more', 'view details', 'contact us'];
    if (spamPatterns.some(pattern => listing.name.toLowerCase().includes(pattern))) {
      return false;
    }
    
    // Price validation
    if (!listing.asking_price || listing.asking_price < 5000 || listing.asking_price > 100000000) {
      return false;
    }
    
    // Revenue validation
    if (listing.annual_revenue && (listing.annual_revenue < 0 || listing.annual_revenue > 100000000)) {
      return false;
    }
    
    return true;
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
    
    return (finalPrice >= 1000 && finalPrice <= 100000000) ? finalPrice : null;
  }

  normalizeUrl(url, source) {
    if (url.startsWith('http')) return url;
    
    const baseUrls = {
      'EmpireFlippers': 'https://empireflippers.com',
      'BizBuySell': 'https://www.bizbuysell.com',
      'QuietLight': 'https://quietlight.com',
      'Flippa': 'https://flippa.com',
      'BizQuest': 'https://www.bizquest.com',
      'ExitAdviser': 'https://www.exitadviser.com'
    };
    
    return baseUrls[source] + url;
  }

  extractListingsFromText(content, source) {
    const $ = cheerio.load(content);
    const text = $.text();
    const listings = [];
    
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    for (let i = 0; i < lines.length - 2; i++) {
      const line = lines[i];
      const context = lines.slice(i, i + 4).join(' ');
      
      // Look for business name patterns
      if (line.length > 20 && line.length < 100 && line.match(/[a-zA-Z].*[a-zA-Z]/)) {
        const priceMatch = context.match(/\$[\d,]+[kKmM]?/);
        const businessKeywords = ['business', 'website', 'company', 'amazon', 'store'];
        
        if (priceMatch && businessKeywords.some(keyword => context.toLowerCase().includes(keyword))) {
          const listing = {
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
          };
          
          if (this.validateListing(listing)) {
            listings.push(listing);
          }
        }
      }
    }
    
    return listings.slice(0, 15);
  }

  deduplicateListings(listings) {
    const seen = new Set();
    return listings.filter(listing => {
      const key = `${listing.name.toLowerCase()}-${listing.source}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  async saveToDatabase(listings) {
    if (listings.length === 0) return { saved: 0, errors: 0 };

    // Filter for Amazon FBA businesses and validate
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

    // Process in batches for better performance
    const batchSize = 10;
    const batches = this.chunkArray(amazonFBAListings, batchSize);

    for (const batch of batches) {
      try {
        // Check for duplicates in batch
        const uniqueListings = [];
        for (const listing of batch) {
          const { data: existing } = await this.supabase
            .from('business_listings')
            .select('id')
            .or(`name.eq.${listing.name},original_url.eq.${listing.original_url || 'none'}`)
            .eq('source', listing.source)
            .limit(1);

          if (!existing || existing.length === 0) {
            uniqueListings.push(listing);
          }
        }

        if (uniqueListings.length > 0) {
          const { data, error } = await this.supabase
            .from('business_listings')
            .insert(uniqueListings)
            .select();

          if (error) {
            errors += uniqueListings.length;
            console.error(`❌ Batch error: ${error.message}`);
          } else {
            saved += data?.length || 0;
            console.log(`   ✅ Batch saved: ${data?.length || 0} listings`);
          }
        }
      } catch (err) {
        errors += batch.length;
        console.error(`❌ Batch save error: ${err.message}`);
      }
    }

    return { saved, errors };
  }

  async runOptimizedScraping() {
    console.log('🚀 STARTING PARALLEL OPTIMIZED SCRAPING\n');
    
    const allListings = [];
    const targetSites = this.generateTargetUrls();
    
    try {
      // Process all sites in parallel
      const sitePromises = targetSites.map(async (site) => {
        console.log(`\n📍 Processing ${site.site} with ${site.urls.length} URLs`);
        const siteListings = await this.scrapeUrlsConcurrently(site.urls, site.site);
        console.log(`✅ ${site.site} completed: ${siteListings.length} listings`);
        return siteListings;
      });

      const siteResults = await Promise.allSettled(sitePromises);
      
      siteResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allListings.push(...result.value);
          console.log(`✅ ${targetSites[index].site}: ${result.value.length} listings`);
        } else {
          console.error(`❌ ${targetSites[index].site} failed: ${result.reason}`);
        }
      });
      
      console.log(`\n📊 TOTAL LISTINGS EXTRACTED: ${allListings.length}`);
      
      if (allListings.length > 0) {
        const saveResults = await this.saveToDatabase(allListings);
        
        console.log(`\n✅ PARALLEL SCRAPING COMPLETED!`);
        console.log(`💾 New listings saved: ${saveResults.saved}`);
        console.log(`❌ Errors: ${saveResults.errors}`);
        
        // Show sample of saved listings
        if (saveResults.saved > 0) {
          const amazonListings = allListings.filter(l => this.isAmazonFBABusiness(l)).slice(0, 5);
          console.log('\n📋 Sample Amazon FBA listings found:');
          amazonListings.forEach((listing, i) => {
            console.log(`${i + 1}. ${listing.name} - $${listing.asking_price?.toLocaleString() || 'N/A'} (${listing.source})`);
          });
        }
      }
      
      // Final database statistics
      const { data: stats } = await this.supabase
        .from('business_listings')
        .select('source, industry')
        .eq('status', 'active');
      
      if (stats) {
        const sourceCounts = {};
        const industryCounts = {};
        
        stats.forEach(item => {
          sourceCounts[item.source] = (sourceCounts[item.source] || 0) + 1;
          industryCounts[item.industry] = (industryCounts[item.industry] || 0) + 1;
        });
        
        console.log('\n📈 FINAL DATABASE TOTALS BY SOURCE:');
        Object.entries(sourceCounts)
          .sort(([,a], [,b]) => b - a)
          .forEach(([source, count]) => {
            console.log(`  ${source}: ${count} listings`);
          });
        
        console.log('\n🏭 FINAL DATABASE TOTALS BY INDUSTRY:');
        Object.entries(industryCounts)
          .sort(([,a], [,b]) => b - a)
          .forEach(([industry, count]) => {
            console.log(`  ${industry}: ${count} listings`);
          });
        
        const total = Object.values(sourceCounts).reduce((sum, count) => sum + count, 0);
        const amazonFBATotal = industryCounts['Amazon FBA'] || 0;
        console.log(`\n🎯 TOTAL ACTIVE LISTINGS: ${total}`);
        console.log(`🛒 AMAZON FBA LISTINGS: ${amazonFBATotal}`);
      }
      
    } catch (error) {
      console.error('❌ Parallel scraping failed:', error);
    } finally {
      await this.closeBrowser();
    }
  }
}

// Run the optimized scraper
const scraper = new ParallelOptimizedScraper();
scraper.runOptimizedScraping().catch(console.error);