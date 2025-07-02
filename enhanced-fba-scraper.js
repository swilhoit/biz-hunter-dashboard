#!/usr/bin/env node

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';

dotenv.config();

class EnhancedFBAScraper {
  constructor() {
    this.supabaseUrl = process.env.VITE_SUPABASE_URL;
    this.supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    this.scraperAPIKey = process.env.SCRAPER_API_KEY;
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    this.browser = null;
    this.concurrentLimit = 3; // Reduced for individual listing scraping
    this.requestDelay = 3000; // Increased delay for detailed scraping
    this.scrapedListingUrls = new Set(); // Track scraped individual listings
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

  // FBA-specific URLs for targeted scraping
  generateFBATargetUrls() {
    return [
      // QuietLight - FBA specific pages
      {
        site: 'QuietLight',
        urls: [
          'https://quietlight.com/amazon-fba-businesses-for-sale/',
          'https://quietlight.com/amazon-fba-businesses-for-sale/page/2/',
          'https://quietlight.com/amazon-fba-businesses-for-sale/page/3/',
          'https://quietlight.com/listings/?type=amazon-fba',
          'https://quietlight.com/listings/?type=amazon-fba&sort=newest',
          'https://quietlight.com/listings/?type=amazon-fba&sort=price',
          'https://quietlight.com/listings/category/amazon-fba/',
          'https://quietlight.com/listings/category/amazon-fba/page/2/'
        ]
      },
      // Flippa - FBA specific sections
      {
        site: 'Flippa',
        urls: [
          'https://flippa.com/buy/monetization/amazon-fba',
          'https://flippa.com/search?filter%5Bmonetization%5D%5B%5D=amazon-fba',
          'https://flippa.com/search?search%5Bkeyword%5D=amazon+fba',
          'https://flippa.com/search?search%5Bkeyword%5D=fba+business',
          'https://flippa.com/search?search%5Bkeyword%5D=amazon+seller',
          'https://flippa.com/search?search%5Bkeyword%5D=private+label'
        ]
      },
      // Empire Flippers - FBA focused
      {
        site: 'EmpireFlippers',
        urls: [
          'https://empireflippers.com/marketplace/?industry=amazon-fba',
          'https://empireflippers.com/marketplace/?business_model=fulfillment_by_amazon',
          'https://empireflippers.com/marketplace/?industry=amazon-fba&sort=newest',
          'https://empireflippers.com/marketplace/?industry=amazon-fba&sort=price_high',
          'https://empireflippers.com/marketplace/?industry=amazon-fba&sort=price_low',
          'https://empireflippers.com/marketplace/?verified=1&industry=amazon-fba'
        ]
      },
      // BizBuySell - Amazon focused searches
      {
        site: 'BizBuySell',
        urls: [
          'https://www.bizbuysell.com/search/businesses-for-sale/?q=amazon+fba',
          'https://www.bizbuysell.com/search/businesses-for-sale/?q=amazon+business',
          'https://www.bizbuysell.com/search/businesses-for-sale/?q=fba+business',
          'https://www.bizbuysell.com/search/businesses-for-sale/?q=amazon+seller',
          'https://www.bizbuysell.com/search/businesses-for-sale/?q=private+label'
        ]
      },
      // BizQuest - Amazon searches
      {
        site: 'BizQuest',
        urls: [
          'https://www.bizquest.com/search/businesses-for-sale/?keywords=amazon+fba',
          'https://www.bizquest.com/search/businesses-for-sale/?keywords=amazon+business',
          'https://www.bizquest.com/search/businesses-for-sale/?keywords=fba',
          'https://www.bizquest.com/search/businesses-for-sale/?keywords=ecommerce+amazon'
        ]
      }
    ];
  }

  async scrapeWithMultipleMethods(url, siteName) {
    const userAgents = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];

    // Method 1: ScraperAPI Premium with FBA-specific parameters
    try {
      const scraperUrl = `http://api.scraperapi.com?api_key=${this.scraperAPIKey}&url=${encodeURIComponent(url)}&render=true&premium=true&country_code=us&wait=3000`;
      const response = await fetch(scraperUrl, { 
        timeout: 45000,
        headers: {
          'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)]
        }
      });
      
      if (response.ok) {
        const content = await response.text();
        if (content.length > 2000 && content.toLowerCase().includes('fba')) {
          return { success: true, content, method: 'scraperapi-premium' };
        }
      }
    } catch (error) {
      console.log(`   ScraperAPI failed: ${error.message}`);
    }

    // Method 2: Playwright with enhanced FBA detection
    try {
      await this.initBrowser();
      const context = await this.browser.newContext({
        userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
        viewport: { width: 1920, height: 1080 }
      });
      
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Wait longer for FBA-specific content to load
      await page.waitForTimeout(8000);
      
      // Try to wait for listings to load
      try {
        await page.waitForSelector('[class*="listing"], [class*="business"], .card', { timeout: 10000 });
      } catch (e) {
        // Continue if no specific selectors found
      }
      
      const content = await page.content();
      await context.close();
      
      if (content.length > 2000) {
        return { success: true, content, method: 'playwright' };
      }
      
    } catch (error) {
      console.log(`   Playwright failed: ${error.message}`);
    }

    return { success: false };
  }

  // Extract listing URLs for individual scraping
  extractListingUrls(content, siteName) {
    const $ = cheerio.load(content);
    const listingUrls = [];
    
    const urlSelectors = {
      'QuietLight': [
        'a[href*="/listing/"]', 
        'a[href*="/business/"]',
        '.listing-card a',
        '.business-card a'
      ],
      'Flippa': [
        'a[href*="/listing/"]',
        'a[href*="/auction/"]',
        '[data-cy*="listing"] a',
        '.flip-card a'
      ],
      'EmpireFlippers': [
        'a[href*="/listing/"]',
        'a[href*="/marketplace/"]',
        '.listing-card a',
        '.marketplace-listing a'
      ],
      'BizBuySell': [
        'a[href*="/listing/"]',
        'a[href*="/business/"]',
        '.result-item a',
        '.listing-item a'
      ],
      'BizQuest': [
        'a[href*="/listing/"]',
        'a[href*="/business/"]',
        '.listing-row a'
      ]
    };

    const selectors = urlSelectors[siteName] || ['a[href*="/listing/"]', 'a[href*="/business/"]'];
    
    selectors.forEach(selector => {
      $(selector).each((i, element) => {
        const href = $(element).attr('href');
        if (href) {
          const fullUrl = href.startsWith('http') ? href : this.normalizeUrl(href, siteName);
          if (fullUrl && !this.scrapedListingUrls.has(fullUrl)) {
            listingUrls.push(fullUrl);
          }
        }
      });
    });

    // Remove duplicates and limit
    return [...new Set(listingUrls)].slice(0, 15);
  }

  // Scrape individual listing details
  async scrapeListingDetails(listingUrl, siteName) {
    console.log(`🔍 Scraping details: ${listingUrl}`);
    
    try {
      const result = await this.scrapeWithMultipleMethods(listingUrl, siteName);
      if (!result.success) {
        return null;
      }

      const $ = cheerio.load(result.content);
      const listing = this.extractDetailedListingData($, siteName, listingUrl);
      
      if (listing && this.validateDetailedListing(listing)) {
        this.scrapedListingUrls.add(listingUrl);
        return listing;
      }
    } catch (error) {
      console.log(`❌ Failed to scrape ${listingUrl}: ${error.message}`);
    }

    return null;
  }

  // Extract comprehensive listing data
  extractDetailedListingData($, siteName, url) {
    // Enhanced extraction based on site structure
    const extractors = {
      'QuietLight': () => this.extractQuietLightDetails($),
      'Flippa': () => this.extractFlippaDetails($),
      'EmpireFlippers': () => this.extractEmpireFlippersDetails($),
      'BizBuySell': () => this.extractBizBuySellDetails($),
      'BizQuest': () => this.extractBizQuestDetails($)
    };

    let listing = null;
    if (extractors[siteName]) {
      listing = extractors[siteName]();
    }

    // Fallback to generic extraction
    if (!listing) {
      listing = this.extractGenericDetails($);
    }

    if (listing) {
      listing.source = siteName;
      listing.original_url = url;
      listing.status = 'active';
    }

    return listing;
  }

  extractQuietLightDetails($) {
    const highlights = this.extractHighlights($);
    const financialDetails = this.extractFinancialDetails($);
    
    // Add financial details to highlights if available
    if (financialDetails) {
      Object.entries(financialDetails).forEach(([key, value]) => {
        if (value) highlights.push(`${key}: ${value}`);
      });
    }

    return {
      name: this.cleanText($('h1, .listing-title, .business-title').first().text()) || 
            this.cleanText($('.title').first().text()),
      description: this.cleanText($('.listing-description, .business-description, .description').text()),
      asking_price: this.parsePrice($('.asking-price, .price, .list-price').first().text()),
      annual_revenue: this.parsePrice($('.annual-revenue, .revenue, .gross-revenue').first().text()),
      industry: 'Amazon FBA',
      location: this.cleanText($('.location, .business-location').first().text()) || 'Online',
      highlights: highlights,
      status: 'active'
    };
  }

  extractFlippaDetails($) {
    const highlights = this.extractHighlights($);
    
    // Add additional details to highlights
    const pageViews = this.parseNumber($('.page-views, .monthly-pageviews').first().text());
    const uniqueVisitors = this.parseNumber($('.unique-visitors, .monthly-uniques').first().text());
    const monetization = this.cleanText($('.monetization, .revenue-source').first().text());
    const auctionEnd = this.extractDate($('.auction-end, .ends-in').first().text());
    
    if (pageViews) highlights.push(`Page Views: ${pageViews.toLocaleString()}/month`);
    if (uniqueVisitors) highlights.push(`Unique Visitors: ${uniqueVisitors.toLocaleString()}/month`);
    if (monetization) highlights.push(`Monetization: ${monetization}`);
    if (auctionEnd) highlights.push(`Auction Ends: ${auctionEnd}`);

    return {
      name: this.cleanText($('h1, .auction-title, .listing-title').first().text()),
      description: this.cleanText($('.auction-description, .description, .about').text()),
      asking_price: this.parsePrice($('.current-bid, .buy-now-price, .starting-bid, .price').first().text()),
      annual_revenue: this.parsePrice($('.annual-revenue, .yearly-revenue').first().text()),
      industry: 'Amazon FBA',
      location: this.cleanText($('.location, .seller-location').first().text()) || 'Online',
      highlights: highlights,
      status: 'active'
    };
  }

  extractEmpireFlippersDetails($) {
    const highlights = this.extractHighlights($);
    
    // Add financial metrics to highlights
    const annualProfit = this.parsePrice($('.annual-profit, .ttm-profit, .net-profit').first().text());
    const monthlyRevenue = this.parsePrice($('.monthly-revenue, .avg-monthly-revenue').first().text());
    const monthlyProfit = this.parsePrice($('.monthly-profit, .avg-monthly-profit').first().text());
    const multiple = this.parseMultiple($('.multiple, .earnings-multiple').first().text());
    const establishedYear = this.parseYear($('.established, .business-age, .founded').first().text());
    const growthRate = this.parsePercentage($('.growth-rate, .yoy-growth').first().text());
    const verified = $('.verified, .verified-listing').length > 0;
    const businessModel = this.cleanText($('.business-model, .model').first().text());
    
    if (annualProfit) highlights.push(`Annual Profit: $${annualProfit.toLocaleString()}`);
    if (monthlyRevenue) highlights.push(`Monthly Revenue: $${monthlyRevenue.toLocaleString()}`);
    if (monthlyProfit) highlights.push(`Monthly Profit: $${monthlyProfit.toLocaleString()}`);
    if (multiple) highlights.push(`Multiple: ${multiple}x`);
    if (establishedYear) highlights.push(`Established: ${establishedYear}`);
    if (growthRate) highlights.push(`Growth Rate: ${growthRate}%`);
    if (verified) highlights.push('Verified Listing');
    if (businessModel) highlights.push(`Model: ${businessModel}`);

    return {
      name: this.cleanText($('h1, .listing-title, .business-name').first().text()),
      description: this.cleanText($('.listing-description, .business-overview, .overview').text()),
      asking_price: this.parsePrice($('.asking-price, .list-price, .price').first().text()),
      annual_revenue: this.parsePrice($('.annual-revenue, .ttm-revenue, .revenue').first().text()),
      industry: 'Amazon FBA',
      location: this.cleanText($('.location, .business-location').first().text()) || 'Online',
      highlights: highlights,
      status: 'active'
    };
  }

  extractBizBuySellDetails($) {
    const highlights = this.extractHighlights($);
    
    // Add business details to highlights
    const cashFlow = this.parsePrice($('.cash-flow, .annual-cash-flow, .profit').first().text());
    const inventory = this.parsePrice($('.inventory-value, .inventory').first().text());
    const establishedYear = this.parseYear($('.established, .year-established').first().text());
    const employees = this.parseNumber($('.employees, .full-time-employees').first().text());
    const reasonForSelling = this.cleanText($('.reason-selling, .seller-motivation').first().text());
    const facilities = this.cleanText($('.facilities, .real-estate').first().text());
    
    if (cashFlow) highlights.push(`Cash Flow: $${cashFlow.toLocaleString()}`);
    if (inventory) highlights.push(`Inventory Value: $${inventory.toLocaleString()}`);
    if (establishedYear) highlights.push(`Established: ${establishedYear}`);
    if (employees) highlights.push(`Employees: ${employees}`);
    if (reasonForSelling) highlights.push(`Reason for Selling: ${reasonForSelling}`);
    if (facilities) highlights.push(`Facilities: ${facilities}`);

    return {
      name: this.cleanText($('h1, .listing-title, .business-title').first().text()),
      description: this.cleanText($('.business-description, .description, .overview').text()),
      asking_price: this.parsePrice($('.asking-price, .price, .list-price').first().text()),
      annual_revenue: this.parsePrice($('.annual-revenue, .gross-sales, .revenue').first().text()),
      industry: 'Amazon FBA',
      location: this.cleanText($('.location, .business-location, .city-state').first().text()) || 'Online',
      highlights: highlights,
      status: 'active'
    };
  }

  extractBizQuestDetails($) {
    const highlights = this.extractHighlights($);
    
    // Add business details to highlights
    const cashFlow = this.parsePrice($('.cash-flow, .profit').first().text());
    const establishedYear = this.parseYear($('.year-established, .established').first().text());
    
    if (cashFlow) highlights.push(`Cash Flow: $${cashFlow.toLocaleString()}`);
    if (establishedYear) highlights.push(`Established: ${establishedYear}`);

    return {
      name: this.cleanText($('h1, .listing-title').first().text()),
      description: this.cleanText($('.business-description, .description').text()),
      asking_price: this.parsePrice($('.asking-price, .price').first().text()),
      annual_revenue: this.parsePrice($('.annual-sales, .revenue').first().text()),
      industry: 'Amazon FBA',
      location: this.cleanText($('.location, .business-location').first().text()) || 'Online',
      highlights: highlights,
      status: 'active'
    };
  }

  extractGenericDetails($) {
    const text = $.text();
    
    // Extract name from title or first heading
    const name = this.cleanText($('h1').first().text()) || 
                 this.cleanText($('title').first().text()) ||
                 this.findBusinessName(text);

    return {
      name: name,
      description: this.extractGenericDescription(text),
      asking_price: this.findPrice(text, ['asking', 'price', 'list']),
      annual_revenue: this.findPrice(text, ['revenue', 'sales', 'annual']),
      net_profit: this.findPrice(text, ['profit', 'net', 'income']),
      industry: 'Amazon FBA',
      location: 'Online',
      highlights: this.extractGenericHighlights(text)
    };
  }

  extractHighlights($) {
    const highlights = [];
    
    // Common highlight selectors
    $('.highlight, .key-point, .feature, .benefit, li').each((i, el) => {
      const text = this.cleanText($(el).text());
      if (text && text.length > 10 && text.length < 200) {
        highlights.push(text);
      }
    });

    return highlights.slice(0, 10); // Limit highlights
  }

  extractFinancialDetails($) {
    const financials = {};
    
    // Extract various financial metrics
    const metrics = {
      'cost_of_goods': ['.cogs', '.cost-of-goods', '.product-cost'],
      'advertising_spend': ['.ad-spend', '.advertising-cost', '.ppc-cost'],
      'profit_margin': ['.profit-margin', '.margin', '.gross-margin'],
      'inventory_value': ['.inventory', '.stock-value', '.inventory-cost'],
      'monthly_expenses': ['.monthly-expenses', '.operating-expenses'],
      'growth_rate': ['.growth', '.growth-rate', '.yoy-growth']
    };

    Object.entries(metrics).forEach(([key, selectors]) => {
      for (const selector of selectors) {
        const value = $(selector).first().text();
        if (value) {
          financials[key] = this.parsePrice(value) || this.parsePercentage(value) || this.cleanText(value);
          break;
        }
      }
    });

    return Object.keys(financials).length > 0 ? financials : null;
  }

  // Enhanced validation for detailed listings
  validateDetailedListing(listing) {
    if (!listing.name || listing.name.length < 10) return false;
    if (!listing.asking_price || listing.asking_price < 10000) return false;
    
    // Must be Amazon FBA related
    const text = `${listing.name} ${listing.description || ''}`.toLowerCase();
    const fbaKeywords = ['amazon', 'fba', 'fulfillment by amazon', 'amazon seller', 'private label'];
    if (!fbaKeywords.some(keyword => text.includes(keyword))) return false;

    return true;
  }

  // Utility methods
  cleanText(text) {
    return text ? text.trim().replace(/\s+/g, ' ').substring(0, 1000) : '';
  }

  parsePrice(text) {
    if (!text) return null;
    const match = text.match(/\$?[\d,]+\.?\d*[kmKM]?/);
    if (!match) return null;
    
    const cleanPrice = match[0].replace(/[^\d.,kmKM]/g, '');
    const numMatch = cleanPrice.match(/[\d.,]+/);
    if (!numMatch) return null;
    
    const num = parseFloat(numMatch[0].replace(/,/g, ''));
    if (isNaN(num)) return null;
    
    const lower = text.toLowerCase();
    if (lower.includes('m') || lower.includes('million')) {
      return Math.round(num * 1000000);
    } else if (lower.includes('k') || lower.includes('thousand')) {
      return Math.round(num * 1000);
    }
    return Math.round(num);
  }

  parseMultiple(text) {
    if (!text) return null;
    const match = text.match(/(\d+\.?\d*)\s*[x×]/i);
    return match ? parseFloat(match[1]) : null;
  }

  parsePercentage(text) {
    if (!text) return null;
    const match = text.match(/(\d+\.?\d*)\s*%/);
    return match ? parseFloat(match[1]) : null;
  }

  parseNumber(text) {
    if (!text) return null;
    const match = text.match(/\d+/);
    return match ? parseInt(match[0]) : null;
  }

  parseYear(text) {
    if (!text) return null;
    const match = text.match(/(19|20)\d{2}/);
    return match ? parseInt(match[0]) : null;
  }

  extractDate(text) {
    if (!text) return null;
    const match = text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/);
    return match ? match[0] : null;
  }

  findBusinessName(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    return lines.find(line => 
      line.length > 15 && 
      line.length < 100 && 
      !line.includes('$') && 
      line.match(/[a-zA-Z].*[a-zA-Z]/)
    ) || 'Unknown Business';
  }

  findPrice(text, keywords) {
    const sentences = text.split(/[.!?]/).filter(s => s.length > 10);
    for (const sentence of sentences) {
      if (keywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
        const priceMatch = sentence.match(/\$[\d,]+[kKmM]?/);
        if (priceMatch) {
          return this.parsePrice(priceMatch[0]);
        }
      }
    }
    return null;
  }

  extractGenericDescription(text) {
    const sentences = text.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 30);
    return sentences.slice(0, 5).join('. ').substring(0, 1000) || null;
  }

  extractGenericHighlights(text) {
    const keywords = ['amazon', 'fba', 'revenue', 'profit', 'growth', 'brand', 'products', 'seller'];
    const sentences = text.split(/[.!?]/).filter(s => 
      s.length > 20 && 
      s.length < 200 && 
      keywords.some(keyword => s.toLowerCase().includes(keyword))
    );
    return sentences.slice(0, 8);
  }

  normalizeUrl(url, source) {
    if (url.startsWith('http')) return url;
    
    const baseUrls = {
      'QuietLight': 'https://quietlight.com',
      'Flippa': 'https://flippa.com',
      'EmpireFlippers': 'https://empireflippers.com',
      'BizBuySell': 'https://www.bizbuysell.com',
      'BizQuest': 'https://www.bizquest.com'
    };
    
    return baseUrls[source] + url;
  }

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  async saveDetailedListing(listing) {
    try {
      // Check for existing listing
      const { data: existing } = await this.supabase
        .from('business_listings')
        .select('id')
        .eq('original_url', listing.original_url)
        .single();

      if (existing) {
        // Update existing listing with more details
        const { error } = await this.supabase
          .from('business_listings')
          .update(listing)
          .eq('id', existing.id);

        if (error) {
          console.error(`❌ Update error: ${error.message}`);
          return false;
        } else {
          console.log(`   ✅ Updated: "${listing.name}"`);
          return true;
        }
      } else {
        // Insert new listing
        const { error } = await this.supabase
          .from('business_listings')
          .insert(listing);

        if (error) {
          console.error(`❌ Insert error: ${error.message}`);
          return false;
        } else {
          console.log(`   ✅ Saved: "${listing.name}" - $${listing.asking_price?.toLocaleString() || 'N/A'}`);
          return true;
        }
      }
    } catch (err) {
      console.error(`❌ Save error: ${err.message}`);
      return false;
    }
  }

  async runEnhancedFBAScraping() {
    console.log('🚀 STARTING ENHANCED FBA-FOCUSED SCRAPING\n');
    
    const targetSites = this.generateFBATargetUrls();
    let totalListings = 0;
    let savedListings = 0;

    try {
      for (const site of targetSites) {
        console.log(`\n📍 Processing ${site.site} - ${site.urls.length} FBA-specific URLs`);
        
        // Step 1: Scrape listing feeds to get individual listing URLs
        const allListingUrls = [];
        
        for (const feedUrl of site.urls) {
          console.log(`🔍 Scraping feed: ${feedUrl}`);
          
          const result = await this.scrapeWithMultipleMethods(feedUrl, site.site);
          if (result.success) {
            const listingUrls = this.extractListingUrls(result.content, site.site);
            console.log(`   Found ${listingUrls.length} listing URLs`);
            allListingUrls.push(...listingUrls);
          }
          
          await new Promise(resolve => setTimeout(resolve, this.requestDelay));
        }

        // Remove duplicates
        const uniqueListingUrls = [...new Set(allListingUrls)];
        console.log(`📋 Total unique listings found: ${uniqueListingUrls.length}`);

        // Step 2: Scrape individual listing details
        if (uniqueListingUrls.length > 0) {
          console.log(`🔍 Scraping individual listing details...`);
          
          // Process in smaller chunks for individual listings
          const chunks = this.chunkArray(uniqueListingUrls.slice(0, 20), 3); // Limit to 20 per site
          
          for (const chunk of chunks) {
            const promises = chunk.map(async (listingUrl) => {
              const listing = await this.scrapeListingDetails(listingUrl, site.site);
              if (listing) {
                const saved = await this.saveDetailedListing(listing);
                return saved ? 1 : 0;
              }
              return 0;
            });
            
            const results = await Promise.allSettled(promises);
            const chunkSaved = results.reduce((sum, result) => {
              return sum + (result.status === 'fulfilled' ? result.value : 0);
            }, 0);
            
            savedListings += chunkSaved;
            totalListings += chunk.length;
            
            console.log(`   Processed chunk: ${chunkSaved}/${chunk.length} saved`);
            
            // Longer delay between chunks for individual scraping
            await new Promise(resolve => setTimeout(resolve, this.requestDelay * 2));
          }
        }
        
        console.log(`✅ ${site.site} completed: ${savedListings} detailed listings saved`);
      }

      console.log(`\n🎯 ENHANCED FBA SCRAPING COMPLETED!`);
      console.log(`📊 Total listings processed: ${totalListings}`);
      console.log(`💾 Detailed listings saved: ${savedListings}`);

      // Final database statistics
      const { data: stats } = await this.supabase
        .from('business_listings')
        .select('source, asking_price, annual_revenue')
        .eq('industry', 'Amazon FBA')
        .eq('status', 'active');

      if (stats && stats.length > 0) {
        console.log(`\n📈 AMAZON FBA DATABASE TOTALS: ${stats.length} listings`);
        
        const avgPrice = stats.reduce((sum, item) => sum + (item.asking_price || 0), 0) / stats.length;
        const avgRevenue = stats.reduce((sum, item) => sum + (item.annual_revenue || 0), 0) / stats.length;
        
        console.log(`💰 Average asking price: $${Math.round(avgPrice).toLocaleString()}`);
        console.log(`📊 Average annual revenue: $${Math.round(avgRevenue).toLocaleString()}`);
        
        const sourceCounts = {};
        stats.forEach(item => {
          sourceCounts[item.source] = (sourceCounts[item.source] || 0) + 1;
        });
        
        console.log('\n📋 By Source:');
        Object.entries(sourceCounts).forEach(([source, count]) => {
          console.log(`  ${source}: ${count} FBA listings`);
        });
      }

    } catch (error) {
      console.error('❌ Enhanced FBA scraping failed:', error);
    } finally {
      await this.closeBrowser();
    }
  }
}

// Run the enhanced FBA scraper
const scraper = new EnhancedFBAScraper();
scraper.runEnhancedFBAScraping().catch(console.error);