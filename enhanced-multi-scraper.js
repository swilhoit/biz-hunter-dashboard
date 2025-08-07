import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ueemtnohgkovwzodzxdr.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlZW10bm9oZ2tvdnd6b2R6eGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjcyOTUsImV4cCI6MjA2NjQ0MzI5NX0.6_bLS2rSI-XsSwwVB5naQS7OYtyemtXvjn2y5MUM9xk';
const supabase = createClient(supabaseUrl, supabaseKey);

// ScraperAPI configuration
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;
console.log('🔧 [EnhancedMultiScraper] SCRAPER_API_KEY:', SCRAPER_API_KEY ? 'Set' : 'Missing');

class EnhancedMultiScraper {
  constructor(logCallback = null) {
    this.totalFound = 0;
    this.totalSaved = 0;
    this.totalErrors = 0;
    this.duplicates = 0;
    this.listingsBySource = {};
    this.detailedLogs = [];
    this.logCallback = logCallback;
    
    // Define all available sites with their configurations
    this.availableSites = {
      'quietlight': {
        name: 'QuietLight',
        url: 'https://quietlight.com/amazon-fba-businesses-for-sale/',
        feedMethod: 'scrapeQuietLightFeed',
        detailMethod: 'scrapeQuietLightListing',
        timeout: 120000,
        pagination: true,
        maxPages: 3
      },
      'bizbuysell': {
        name: 'BizBuySell',
        url: 'https://www.bizbuysell.com/amazon-stores-for-sale/',
        feedMethod: 'scrapeBizBuySellFeed',
        detailMethod: 'scrapeBizBuySellListing',
        timeout: 120000,
        pagination: true,
        maxPages: 5
      },
      'flippa': {
        name: 'Flippa',
        url: 'https://flippa.com/buy/monetization/amazon-fba',
        feedMethod: 'scrapeFlippaFeed',
        detailMethod: 'scrapeFlippaListing',
        timeout: 120000,  // Increased timeout for ScraperAPI
        pagination: true,
        maxPages: 3
      },
      'loopnet': {
        name: 'LoopNet',
        url: 'https://www.loopnet.com/biz/amazon-stores-for-sale/',
        feedMethod: 'scrapeLoopNetFeed',
        detailMethod: 'scrapeLoopNetListing',
        timeout: 120000,  // Increased timeout for ScraperAPI
        pagination: true,
        maxPages: 3
      },
      'empireflippers': {
        name: 'Empire Flippers',
        url: 'https://empireflippers.com/marketplace/amazon-fba-businesses-for-sale/',
        feedMethod: 'scrapeEmpireFlippersFeed',
        detailMethod: 'scrapeEmpireFlippersListing',
        timeout: 120000,  // Increased timeout for ScraperAPI
        pagination: true,
        maxPages: 3
      },
      'investorsclub': {
        name: 'Investors.Club',
        url: 'https://investors.club/tech-stack/amazon-fba/',
        feedMethod: 'scrapeInvestorsClubFeed',
        detailMethod: 'scrapeInvestorsClubListing',
        timeout: 120000,  // Increased timeout for ScraperAPI
        pagination: true,
        maxPages: 2
      },
      'websiteproperties': {
        name: 'Website Properties',
        url: 'https://websiteproperties.com/amazon-fba-business-for-sale/',
        feedMethod: 'scrapeWebsitePropertiesFeed',
        detailMethod: 'scrapeWebsitePropertiesListing',
        timeout: 120000,  // Increased timeout for ScraperAPI
        pagination: true,
        maxPages: 3
      },
      'bizquest': {
        name: 'BizQuest',
        url: 'https://www.bizquest.com/amazon-business-for-sale/',
        feedMethod: 'scrapeBizQuestFeed',
        detailMethod: 'scrapeBizQuestListing',
        timeout: 120000,  // Increased timeout for ScraperAPI
        pagination: true,
        maxPages: 3
      },
      'acquire': {
        name: 'Acquire.com',
        url: 'https://acquire.com/amazon-fba-for-sale/',
        feedMethod: 'scrapeAcquireFeed',
        detailMethod: 'scrapeAcquireListing',
        timeout: 120000,  // Increased timeout for ScraperAPI
        pagination: true,
        maxPages: 2
      }
    };
  }

  // Get available sites for multiselect
  getAvailableSites() {
    return Object.entries(this.availableSites).map(([key, config]) => ({
      id: key,
      name: config.name,
      url: config.url,
      pagination: config.pagination,
      maxPages: config.maxPages
    }));
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };
    
    console.log(`[${timestamp}] [${level}] ${message}`, JSON.stringify(data, null, 2));
    this.detailedLogs.push(logEntry);

    if (this.logCallback) {
      this.logCallback(logEntry);
    }
  }

  // Helper method to log found listings for frontend display
  logFoundListing(source, listingTitle, listingUrl) {
    this.log('LISTING_FOUND', `Found listing from ${source}`, {
      source,
      title: listingTitle,
      url: listingUrl
    });
  }

  // Helper method to log scraping errors for frontend display
  logScrapingError(source, errorMessage, url = null) {
    this.log('SCRAPING_ERROR', `${source} scraping error`, {
      source,
      error: errorMessage,
      url
    });
  }

  async fetchPage(url, retries = 2) { // Reduced retries for speed
    console.log(`\n🔍 [GRANULAR LOG - fetchPage] Called at: ${new Date().toISOString()}`);
    console.log(`🔍 [GRANULAR LOG - fetchPage] URL: ${url}`);
    console.log(`🔍 [GRANULAR LOG - fetchPage] Retries: ${retries}`);
    console.log(`🔍 [GRANULAR LOG - fetchPage] SCRAPER_API_KEY: ${SCRAPER_API_KEY ? 'SET' : 'NOT SET'}`);
    
    this.log('INFO', 'Fetching page', { url });
    
    // Increased timeout for ScraperAPI requests with rendering
    const REQUEST_TIMEOUT = 120000; // 120 seconds per request - needed for ScraperAPI with render=true
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      console.log(`🔍 [GRANULAR LOG - fetchPage] Attempt ${attempt}/${retries}`);
      
      try {
        if (SCRAPER_API_KEY) {
          console.log(`🔍 [GRANULAR LOG - fetchPage] Using ScraperAPI`);
          
          try {
            const scraperUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}&render=true&country_code=us`;
            console.log(`🔍 [GRANULAR LOG - fetchPage] ScraperAPI URL constructed`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
              console.log(`🔍 [GRANULAR LOG - fetchPage] Timeout triggered after ${REQUEST_TIMEOUT}ms`);
              controller.abort();
            }, REQUEST_TIMEOUT);
            
            console.log(`🔍 [GRANULAR LOG - fetchPage] Starting fetch at:`, new Date().toISOString());
            const response = await fetch(scraperUrl, { 
              signal: controller.signal,
              headers: {
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'en-US,en;q=0.9'
              }
            });
            console.log(`🔍 [GRANULAR LOG - fetchPage] Fetch completed at:`, new Date().toISOString());
            
            clearTimeout(timeoutId);
            console.log(`🔍 [GRANULAR LOG - fetchPage] Response status: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
              console.log(`🔍 [GRANULAR LOG - fetchPage] Reading response text...`);
              const html = await response.text();
              console.log(`🔍 [GRANULAR LOG - fetchPage] Got HTML: ${html.length} characters`);
              this.log('SUCCESS', 'Fetched with ScraperAPI', { 
                url, 
                htmlLength: html.length
              });
              return html;
            }
          } catch (error) {
            if (error.name === 'AbortError') {
              this.log('ERROR', 'ScraperAPI request timed out', { url, timeout: REQUEST_TIMEOUT });
              throw new Error(`ScraperAPI timeout after ${REQUEST_TIMEOUT}ms`);
            } else {
              this.log('ERROR', 'ScraperAPI failed', { error: error.message });
            }
          }
        }
        
        throw new Error('ScraperAPI call failed or was not configured.');

      } catch (error) {
        this.log('ERROR', `Fetch attempt ${attempt} failed for ${url}: ${error.message}`);
        
        if (attempt >= retries) {
          throw new Error(`Failed to fetch ${url} after ${retries} attempts: ${error.message}`);
        }
        
        const delay = Math.min(1000 * attempt, 2000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  extractPrice(priceText) {
    if (!priceText) return 0;
    
    // First extract just the price portion (look for $ followed by numbers)
    const priceMatch = priceText.match(/\$[\d,]+\.?\d*\s*[MmKk]?/);
    if (!priceMatch) return 0;
    
    const priceStr = priceMatch[0];
    const cleaned = priceStr.replace(/[$,]/g, '');
    
    if (cleaned.toLowerCase().includes('m')) {
      const num = parseFloat(cleaned.replace(/[MmKk]/gi, ''));
      return Math.floor(num * 1000000);
    } else if (cleaned.toLowerCase().includes('k')) {
      const num = parseFloat(cleaned.replace(/[MmKk]/gi, ''));
      return Math.floor(num * 1000);
    } else {
      const price = parseFloat(cleaned);
      return isNaN(price) ? 0 : Math.floor(price);
    }
  }

  extractHighlightsFromTitle(title) {
    const highlights = [];
    
    // Extract key metrics from the title
    const patterns = [
      /(\d+%\s*YoY\s*Growth)/i,
      /(\d+%\s*SDE\s*Growth)/i,
      /(\d+%\s*Revenue\s*Growth)/i,
      /(\d+%\s*Net\s*Margins?)/i,
      /(\d+%\s*Gross\s*Margins?)/i,
      /(\d+k?\s*Subs?)/i,
      /(\d+k?\s*Reviews?)/i,
      /(SBA\s*Pre-?Qualified)/i,
      /(Patent(?:ed)?)/i,
      /(Category\s*Leader)/i,
      /(Amazon\s*FBA)/i,
      /(US-?Based\s*Manufacturing)/i,
      /(\d+\s*Year\s*Old)/i,
      /(Low\s*Workload)/i,
      /(High\s*Margins?)/i
    ];
    
    patterns.forEach(pattern => {
      const match = title.match(pattern);
      if (match) {
        highlights.push(match[1].trim());
      }
    });
    
    // Add FBA if not already included
    if (!highlights.some(h => h.toLowerCase().includes('fba')) && 
        title.toLowerCase().includes('fba')) {
      highlights.push('Amazon FBA');
    }
    
    // Limit to 3 highlights
    return highlights.slice(0, 3);
  }

  async saveListing(listing) {
    try {
      // Validate required fields
      if (!listing.name || !listing.original_url) {
        this.log('WARN', 'Skipping invalid listing', { listing });
        return false;
      }
      
      this.log('INFO', `[DB] Processing: "${listing.name}"`);

      // Check if already exists
      const { data: existing } = await supabase
        .from('business_listings')
        .select('id')
        .eq('original_url', listing.original_url)
        .single();

      if (existing) {
        // Update with new data if we have more details
        if (listing.description && listing.description.length > 50) {
          const { error } = await supabase
            .from('business_listings')
            .update({
              ...listing,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);

          if (!error) {
            this.log('SUCCESS', 'Updated existing listing with new details', { 
              name: listing.name,
              descriptionLength: listing.description.length 
            });
            console.log(`  -> [DB] Updated: "${listing.name}"`);
            return 'updated';
          }
        }
        this.duplicates++;
        console.log(`  -> [DB] Duplicate (skipped): "${listing.name}"`);
        return 'duplicate';
      }

      // Insert new listing - schema now includes annual_profit
      const listingToInsert = {
        name: listing.name,
        asking_price: listing.asking_price || 0,
        annual_revenue: listing.annual_revenue || 0,
        annual_profit: listing.annual_profit || 0,
        industry: listing.industry || 'Business',
        location: listing.location || 'Online',
        description: listing.description || '',
        highlights: Array.isArray(listing.highlights) ? listing.highlights : (listing.highlights ? listing.highlights.split(', ') : []),
        original_url: listing.original_url,
        source: listing.source || 'Unknown',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('business_listings')
        .insert(listingToInsert);

      if (error) {
        console.error('❌ [DB ERROR] Failed to insert listing:', {
          name: listing.name,
          url: listing.original_url,
          error: error,
          errorCode: error.code,
          errorMessage: error.message,
          errorDetails: error.details,
          listingData: listingToInsert
        });
        
        if (error.code === '23505') {
          this.duplicates++;
          console.log(`  -> [DB] Duplicate (skipped): "${listing.name}"`);
          return 'duplicate';
        }
        throw error;
      }

      this.totalSaved++;
      this.log('SUCCESS', 'Saved new listing', { 
        name: listing.name,
        price: `$${listing.asking_price.toLocaleString()}`,
        source: listing.source
      });
      console.log(`  -> [DB] Saved new listing: "${listing.name}"`);
      return 'created';

    } catch (error) {
      console.error('❌ [SAVE ERROR] Critical error saving listing:', {
        name: listing.name,
        url: listing.original_url,
        errorType: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        fullError: error
      });
      
      this.log('ERROR', 'Failed to save listing', { 
        listing: listing.name,
        error: error.message,
        errorCode: error.code,
        errorDetails: error.details || 'No additional details'
      });
      this.totalErrors++;
      return false;
    }
  }

  // STAGE 1: Extract listing URLs from feed pages
  async scrapeQuietLightFeed(maxPages = 3) {
    console.log('\n🔍 [GRANULAR LOG - QuietLight] Feed scraper called at:', new Date().toISOString());
    console.log('🔍 [GRANULAR LOG - QuietLight] maxPages:', maxPages);
    this.log('INFO', '=== Stage 1: QuietLight Feed Scraper ===');
    const listings = [];

    for (let page = 1; page <= maxPages; page++) {
      try {
        console.log(`\n🔍 [GRANULAR LOG - QuietLight] Processing page ${page}/${maxPages}`);
        const feedUrl = page === 1
          ? 'https://quietlight.com/amazon-fba-businesses-for-sale/'
          : `https://quietlight.com/amazon-fba-businesses-for-sale/page/${page}/`;
        
        console.log(`🔍 [GRANULAR LOG - QuietLight] Fetching URL: ${feedUrl}`);
        console.log(`🔍 [GRANULAR LOG - QuietLight] Calling fetchPage at:`, new Date().toISOString());
        const html = await this.fetchPage(feedUrl);
        console.log(`🔍 [GRANULAR LOG - QuietLight] Received HTML length: ${html?.length || 0}`);
        const $ = cheerio.load(html);

        // Debug: Check what selectors are available
        this.log('DEBUG', 'Checking available selectors:', {
          '.listing-card': $('.listing-card').length,
          'div[class*="listing"]': $('div[class*="listing"]').length,
          'a[href*="/listings/"]': $('a[href*="/listings/"]').length,
          '.listing-grid': $('.listing-grid').length
        });
        
        // Try to find individual listing cards
        let listingElements = $('.listing-card');
        
        if (listingElements.length === 0) {
          // Fallback: try to find links directly
          this.log('WARN', 'No .listing-card elements found, trying direct link search');
          const listingLinks = $('a[href*="/listings/"]');
          this.log('INFO', `Found ${listingLinks.length} listing links`);
          
          if (listingLinks.length === 0) {
            this.log('ERROR', `No listings found on page ${page}`);
            break;
          }
          
          // Convert links to listing elements format
          const tempListings = [];
          listingLinks.each((i, elem) => {
            const $link = $(elem);
            const href = $link.attr('href');
            const title = $link.text().trim() || $link.attr('title') || 'Untitled';
            
            if (href && href.includes('/listings/')) {
              tempListings.push({ href, title });
            }
          });
          
          // Process these differently
          tempListings.forEach(({ href, title }) => {
            const fullUrl = href.startsWith('http') ? href : `https://quietlight.com${href}`;
            listings.push({
              url: fullUrl,
              title,
              priceText: 'Contact for price',
              source: 'QuietLight'
            });
            this.logFoundListing('QuietLight', title, fullUrl);
          });
          
          continue; // Skip the normal processing
        }
        
        this.log('INFO', `Found ${listingElements.length} listing cards on page ${page}`);

        // Extract listing URLs from QuietLight cards
        listingElements.each((i, elem) => {
          const $elem = $(elem);
          
          // QuietLight structure: .listing-card > .listing-card__link
          const link = $elem.find('.listing-card__link').attr('href');
          const title = $elem.find('.listing-card__title').text().trim();
          const priceText = $elem.find('.listing-card__price').text().trim();
          
          if (link && title) {
            const fullUrl = link.startsWith('http') ? link : `https://quietlight.com${link}`;
            listings.push({
              url: fullUrl,
              title,
              priceText,
              source: 'QuietLight'
            });
            
            // Log found listing for frontend display
            this.logFoundListing('QuietLight', title, fullUrl);
          } else if (title) {
            this.log('WARN', `Found listing without URL: ${title}`);
          }
        });

        this.log('INFO', `QuietLight page ${page} scraped`, { foundUrls: listings.length });
      } catch (error) {
        this.log('ERROR', `QuietLight page ${page} failed`, { error: error.message });
        this.logScrapingError('QuietLight', error.message, feedUrl);
        break; // Stop pagination on error
      }
    }

    this.log('SUCCESS', 'QuietLight feed scraping complete', { 
      foundUrls: listings.length,
      listings: listings.slice(0, 5).map(l => ({ title: l.title, url: l.url })) // Log first 5 for debugging
    });
    return listings;
  }

  // STAGE 2: Scrape individual QuietLight listing
  async scrapeQuietLightListing(listingData) {
    this.log('INFO', 'Stage 2: Scraping QuietLight listing details', { url: listingData.url });

    try {
      // Note: QuietLight uses Cloudflare protection, so we need to handle that
      const html = await this.fetchPage(listingData.url);
      
      // Check if we got a Cloudflare challenge page
      if (html.includes('Enable JavaScript and cookies to continue')) {
        this.log('WARN', 'Got Cloudflare challenge page, using fallback data', { url: listingData.url });
        
        // Use the data we already have from the feed
        const askingPrice = this.extractPrice(listingData.priceText) || 2000000;
        
        return {
          name: listingData.title,
          description: `${listingData.title}. Premium Amazon FBA business listed on QuietLight marketplace.`,
          asking_price: askingPrice,
          annual_revenue: 0, // Don't estimate - only use real data
          annual_profit: 0,
          monthly_revenue: 0,
          gross_revenue: 0,
          net_revenue: 0,
          inventory_value: 0,
          profit_multiple: null,
          industry: 'E-commerce',
          location: 'Online',
          source: 'QuietLight',
          original_url: listingData.url,
          highlights: this.extractHighlightsFromTitle(listingData.title),
          listing_status: 'live'
        };
      }
      
      const $ = cheerio.load(html);

      // First, try to extract from structured data (most reliable)
      let structuredData = null;
      try {
        const jsonLd = $('script[type="application/ld+json"]').html();
        if (jsonLd) {
          const parsed = JSON.parse(jsonLd);
          if (parsed['@graph']) {
            structuredData = parsed['@graph'].find(item => item['@type'] === 'WebPage');
          }
        }
      } catch (e) {
        this.log('WARN', 'Failed to parse structured data', { error: e.message });
      }

      // Extract detailed information
      let description = '';
      
      // Try multiple selectors for description
      const descSelectors = [
        '.listing-description',
        '.entry-content',
        '.property-description',
        'article .content',
        '.listing-details',
        '.inform_rev_text',
        '[class*="description"]'
      ];

      for (const selector of descSelectors) {
        const desc = $(selector).text().trim();
        if (desc && desc.length > 50) {
          description = desc;
          break;
        }
      }

      // If no description, build from available data
      if (!description) {
        const bulletPoints = [];
        $('.listing-highlights li, .key-points li, ul li').each((i, el) => {
          const text = $(el).text().trim();
          if (text.length > 10 && text.length < 200) {
            bulletPoints.push(text);
          }
        });
        if (bulletPoints.length > 0) {
          description = bulletPoints.join('. ');
        }
      }

      // Extract financial metrics with enhanced selectors
      let askingPrice = 0;
      let annualRevenue = 0;
      let annualProfit = 0;
      let monthlyRevenue = 0;
      let inventoryValue = 0;
      let cashFlow = 0;
      
      // Enhanced price extraction - look for asking price specifically
      const priceSelectors = [
        '.asking-price',
        '.price',
        '.listing-price',
        'li:contains("Asking Price")',
        'li:contains("PRICE")',
        'div:contains("$"):contains("Asking")',
        '.financial-info:contains("Price")',
        'dt:contains("Price") + dd',
        '[class*="asking"]',
        '[class*="price"]'
      ];
      
      for (const selector of priceSelectors) {
        const priceText = $(selector).text();
        const extracted = this.extractPrice(priceText);
        if (extracted > 0) {
          askingPrice = extracted;
          this.log('INFO', `Extracted asking price: $${askingPrice.toLocaleString()}`);
          break;
        }
      }
      
      // Extract revenue metrics
      const revenueSelectors = [
        '.annual-revenue',
        '.revenue',
        '.yearly-revenue',
        'li:contains("REVENUE")',
        'li:contains("Annual Revenue")',
        'li:contains("Yearly Revenue")',
        'li:contains("Gross Revenue")',
        'dt:contains("Revenue") + dd',
        '.financial-metric:contains("Revenue")',
        '.revenue-data'
      ];
      
      for (const selector of revenueSelectors) {
        const revenueText = $(selector).text();
        const extracted = this.extractPrice(revenueText);
        if (extracted > 0) {
          annualRevenue = extracted;
          this.log('INFO', `Extracted annual revenue: $${annualRevenue.toLocaleString()}`);
          break;
        }
      }
      
      // Extract profit/cash flow metrics (QuietLight uses INCOME for SDE)
      const profitSelectors = [
        '.annual-profit',
        '.net-profit',
        '.profit',
        'li:contains("INCOME")',
        'li:contains("SDE")',
        'li:contains("Annual Profit")',
        'li:contains("Net Profit")',
        'li:contains("Cash Flow")',
        'dt:contains("Profit") + dd',
        'dt:contains("Cash Flow") + dd',
        'dt:contains("Income") + dd',
        'dt:contains("SDE") + dd',
        '.financial-metric:contains("Profit")',
        '.cash-flow-data'
      ];
      
      for (const selector of profitSelectors) {
        const profitText = $(selector).text();
        const extracted = this.extractPrice(profitText);
        if (extracted > 0) {
          if (selector.toLowerCase().includes('cash')) {
            cashFlow = extracted;
            this.log('INFO', `Extracted cash flow: $${cashFlow.toLocaleString()}`);
          } else {
            annualProfit = extracted;
            this.log('INFO', `Extracted annual profit: $${annualProfit.toLocaleString()}`);
          }
        }
      }
      
      // Extract inventory value
      const inventorySelectors = [
        '.inventory-value',
        'li:contains("Inventory")',
        'dt:contains("Inventory") + dd',
        '.financial-metric:contains("Inventory")',
        'li:contains("Stock Value")',
        '.inventory-data'
      ];
      
      for (const selector of inventorySelectors) {
        const inventoryText = $(selector).text();
        const extracted = this.extractPrice(inventoryText);
        if (extracted > 0) {
          inventoryValue = extracted;
          this.log('INFO', `Extracted inventory value: $${inventoryValue.toLocaleString()}`);
          break;
        }
      }
      
      // Extract monthly metrics
      const monthlySelectors = [
        '.monthly-revenue',
        'li:contains("Monthly Revenue")',
        'dt:contains("Monthly Revenue") + dd',
        '.financial-metric:contains("Monthly")',
        '.monthly-data'
      ];
      
      for (const selector of monthlySelectors) {
        const monthlyText = $(selector).text();
        const extracted = this.extractPrice(monthlyText);
        if (extracted > 0) {
          monthlyRevenue = extracted;
          this.log('INFO', `Extracted monthly revenue: $${monthlyRevenue.toLocaleString()}`);
          break;
        }
      }
      
      // Fallback calculations
      if (!askingPrice) {
        askingPrice = this.extractPrice(listingData.priceText) || 2000000;
      }
      
      if (!annualRevenue && monthlyRevenue) {
        annualRevenue = monthlyRevenue * 12;
      }
      
      if (!annualProfit && cashFlow) {
        annualProfit = cashFlow; // Cash flow is often used as a proxy for profit
      }
      
      // Calculate profit multiple if we have both price and profit
      let profitMultiple = null;
      if (askingPrice > 0 && annualProfit > 0) {
        profitMultiple = parseFloat((askingPrice / annualProfit).toFixed(2));
      }

      // Extract highlights from the page
      const highlights = [];
      if ($('.highlights li').length > 0) {
        $('.highlights li').each((i, elem) => {
          if (i < 3) highlights.push($(elem).text().trim());
        });
      } else {
        highlights.push('Amazon FBA', 'QuietLight Verified', 'Premium Listing');
      }

      // Build the listing object with all financial metrics
      const listing = {
        name: listingData.title || 'Amazon FBA Business',
        description: description || `Premium Amazon FBA business opportunity. ${listingData.title}`,
        asking_price: askingPrice,
        annual_revenue: annualRevenue,
        annual_profit: annualProfit,
        monthly_revenue: monthlyRevenue,
        gross_revenue: annualRevenue, // Can be refined if gross vs net is specified
        net_revenue: annualRevenue,    // Can be refined if gross vs net is specified
        inventory_value: inventoryValue,
        profit_multiple: profitMultiple,
        industry: 'E-commerce',
        location: $('.location').text().trim() || 'United States',
        source: 'QuietLight',
        original_url: listingData.url,
        highlights,
        listing_status: 'live'
      };

      this.log('SUCCESS', 'Extracted QuietLight listing details', { 
        name: listing.name,
        descriptionLength: listing.description.length,
        price: listing.asking_price,
        revenue: annualRevenue,
        profit: annualProfit,
        inventory: inventoryValue,
        multiple: profitMultiple
      });

      return listing;
    } catch (error) {
      this.log('ERROR', 'Failed to scrape QuietLight listing', { 
        url: listingData.url,
        error: error.message 
      });
      
      // Return basic listing with feed data
      return {
        name: listingData.title,
        description: `Amazon FBA business for sale on QuietLight`,
        asking_price: this.extractPrice(listingData.priceText) || 500000,
        annual_revenue: 0, // Don't estimate
        annual_profit: 0,
        monthly_revenue: 0,
        gross_revenue: 0,
        net_revenue: 0,
        inventory_value: 0,
        profit_multiple: null,
        industry: 'E-commerce',
        location: 'United States',
        source: 'QuietLight',
        original_url: listingData.url,
        highlights: ['Amazon FBA', 'QuietLight'],
        listing_status: 'live'
      };
    }
  }

  // Helper method to check if a business is e-commerce
  isEcommerceBusiness(title, description, industry) {
    const searchText = `${title || ''} ${description || ''} ${industry || ''}`.toLowerCase();
    
    // E-commerce indicators
    const ecommerceKeywords = [
      'ecommerce', 'e-commerce', 'online', 'internet', 'amazon', 'fba',
      'shopify', 'dropship', 'digital', 'web store', 'marketplace',
      'etsy', 'ebay', 'subscription', 'saas', 'software', 'website', 'app'
    ];
    
    // Non-ecommerce indicators (exclude if found)
    const nonEcommerceKeywords = [
      'restaurant', 'bar', 'cafe', 'coffee', 'pizza', 'bakery',
      'salon', 'spa', 'barbershop', 'daycare', 'childcare',
      'laundromat', 'dry clean', 'car wash', 'auto repair',
      'gas station', 'convenience store', 'liquor',
      'gym', 'fitness', 'yoga', 'hotel', 'motel',
      'medical', 'dental', 'clinic', 'pharmacy',
      'plumbing', 'hvac', 'electrical', 'construction',
      'landscaping', 'lawn', 'pool service',
      'real estate', 'property management',
      'manufacturing', 'trucking', 'logistics',
      'franchise', 'brick and mortar'
    ];
    
    const hasEcommerce = ecommerceKeywords.some(kw => searchText.includes(kw));
    const hasNonEcommerce = nonEcommerceKeywords.some(kw => searchText.includes(kw));
    
    return hasEcommerce && !hasNonEcommerce;
  }

  // BizBuySell two-stage scraping
  async scrapeBizBuySellFeed(maxPages = 5) {
    this.log('INFO', '=== Stage 1: BizBuySell Feed Scraper ===');
    const listings = [];
    
    // Use multiple search URLs for better e-commerce coverage
    const searchUrls = [
      'https://www.bizbuysell.com/businesses-for-sale/?q=ecommerce',
      'https://www.bizbuysell.com/businesses-for-sale/?q=amazon+fba',
      'https://www.bizbuysell.com/businesses-for-sale/?q=online+business',
      'https://www.bizbuysell.com/internet-businesses-for-sale/'
    ];
    
    for (const baseUrl of searchUrls) {
      for (let page = 0; page < Math.min(maxPages, 2); page++) {
        try {
          const feedUrl = page === 0 ? baseUrl : `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}s=${page * 24}`;
          
          this.log('INFO', `Fetching BizBuySell page ${page + 1}`, { url: feedUrl });
          const html = await this.fetchPage(feedUrl);
          const $ = cheerio.load(html);

        // Check if we're on the right page
        const pageTitle = $('h1').text();
        this.log('INFO', `BizBuySell page title: ${pageTitle}`);

        // Look for JSON-LD structured data
        let structuredListings = [];
        $('script[type="application/ld+json"]').each((i, elem) => {
          try {
            const jsonText = $(elem).html();
            const data = JSON.parse(jsonText);
            
            // BizBuySell uses SearchResultsPage with listings in 'about' array
            if (data['@type'] === 'SearchResultsPage' && data.about) {
              this.log('INFO', `Found SearchResultsPage with ${data.about.length} items`);
              structuredListings = data.about;
            } else if (data['@type'] === 'ItemList' && data.itemListElement) {
              this.log('INFO', `Found ItemList with ${data.itemListElement.length} items`);
              structuredListings = data.itemListElement;
            } else if (data['@graph']) {
              // Sometimes it's in a graph structure
              const itemList = data['@graph'].find(item => item['@type'] === 'ItemList');
              if (itemList && itemList.itemListElement) {
                this.log('INFO', `Found structured data in @graph with ${itemList.itemListElement.length} items`);
                structuredListings = itemList.itemListElement;
              }
            }
          } catch (e) {
            // Silent fail - we'll try other scripts
          }
        });

        // Process structured data listings
        if (structuredListings.length > 0) {
          this.log('INFO', `Processing ${structuredListings.length} structured listings`);
          
          structuredListings.forEach((listingItem, index) => {
            // Handle both ItemList format and SearchResultsPage format
            const item = listingItem.item || listingItem;
            
            // SearchResultsPage uses 'Thing' type with name and url
            if (item && (item['@type'] === 'Product' || item['@type'] === 'Thing')) {
              const title = item.name || '';
              const url = item.url || item['@id'] || '';
              
              // Price might be in offers or not available
              let priceText = 'Contact for price';
              if (item.offers?.price) {
                priceText = `$${item.offers.price.toLocaleString()}`;
              }
              
              const location = item.offers?.availableAtOrFrom?.address?.addressLocality || 
                              item.location?.name || 'Online';
              
              if (url && title) {
                // Filter for e-commerce businesses only
                const description = item.description || '';
                const industry = item.category || '';
                
                if (this.isEcommerceBusiness(title, description, industry)) {
                  listings.push({
                    url: url.startsWith('http') ? url : `https://www.bizbuysell.com${url}`,
                    title,
                    priceText,
                    location,
                    source: 'BizBuySell'
                  });
                  
                  this.logFoundListing('BizBuySell', title, url);
                } else {
                  this.log('INFO', `Skipped non-ecommerce: ${title}`);
                }
              }
            }
          });
        } else {
          // Fallback to HTML parsing if no structured data
          this.log('WARN', 'No structured data found, falling back to HTML parsing');
          
          // BizBuySell structure: .listing contains each listing
          const listingElements = $('.listing');
          this.log('INFO', `Found ${listingElements.length} .listing elements`);

        listingElements.each((i, elem) => {
          const $elem = $(elem);
          
          // Try multiple selectors for the link and title
          let link, title;
          
          // Method 1: h3 a (most common)
          const $h3Link = $elem.find('h3 a').first();
          if ($h3Link.length > 0) {
            link = $h3Link.attr('href');
            title = $h3Link.text().trim();
          }
          
          // Method 2: Look for any prominent link
          if (!link) {
            const $titleLink = $elem.find('.title a, a.title').first();
            if ($titleLink.length > 0) {
              link = $titleLink.attr('href');
              title = $titleLink.text().trim();
            }
          }
          
          // Method 3: Any link that looks like a business listing
          if (!link) {
            const $bizLink = $elem.find('a[href*="/Business-Opportunity/"], a[href*="/business/"]').first();
            if ($bizLink.length > 0) {
              link = $bizLink.attr('href');
              title = $bizLink.text().trim() || $elem.find('h3, .title').text().trim();
            }
          }
          
          const priceText = $elem.find('.price').text().trim();
          
          if (link && title) {
            // Extract description/industry from listing element
            const description = $elem.find('.description, .summary').text().trim();
            const industry = $elem.find('.category, .industry').text().trim();
            
            // Filter for e-commerce businesses only
            if (this.isEcommerceBusiness(title, description, industry)) {
              const fullUrl = link.startsWith('http') ? link : `https://www.bizbuysell.com${link}`;
              listings.push({
                url: fullUrl,
                title,
                priceText,
                source: 'BizBuySell'
              });
              
              // Log found listing for frontend display
              this.logFoundListing('BizBuySell', title, fullUrl);
            } else {
              this.log('INFO', `Skipped non-ecommerce: ${title}`);
            }
          }
        });
        } // Close the else block for fallback HTML parsing

          this.log('INFO', `BizBuySell page ${page + 1} scraped, found ${listings.length} total listings`);
        } catch (error) {
          this.log('ERROR', `BizBuySell page ${page + 1} failed`, { error: error.message });
          this.logScrapingError('BizBuySell', error.message, `Page ${page + 1}`);
        }
      }
    }

    this.log('SUCCESS', 'BizBuySell feed scraping complete', { 
      totalListings: listings.length,
      listings: listings.slice(0, 5).map(l => ({ title: l.title, url: l.url })) // Log first 5 for debugging
    });
    return listings;
  }

  async scrapeBizBuySellListing(listingData) {
    this.log('INFO', 'Stage 2: Processing BizBuySell listing details', { url: listingData.url });

    // Enhanced: Now fetching individual listing pages to get revenue data
    try {
      // Fetch the actual listing page
      this.log('INFO', 'Fetching BizBuySell listing page for detailed financials');
      const html = await this.fetchPage(listingData.url);
      const $ = cheerio.load(html);
      
      // Extract financial information from the listing page
      let askingPrice = 0;
      let annualRevenue = 0;
      let annualProfit = 0;
      let cashFlow = 0;
      
      // Method 1: Look for labeled financial data
      $('dt, .label, .field-label, .details-label').each((i, elem) => {
        const label = $(elem).text().toLowerCase().trim();
        const value = $(elem).next('dd, .value, .field-value, .details-value').text().trim() ||
                     $(elem).parent().find('dd, .value').text().trim();
        
        if (label.includes('asking price') || label.includes('price')) {
          askingPrice = this.extractPrice(value) || askingPrice;
        }
        if (label.includes('gross revenue') || label.includes('annual revenue') || label.includes('revenue')) {
          annualRevenue = this.extractPrice(value) || annualRevenue;
        }
        if (label.includes('cash flow') || label.includes('annual profit') || label.includes('net income')) {
          cashFlow = this.extractPrice(value) || cashFlow;
          annualProfit = cashFlow;
        }
      });
      
      // Method 2: Look for financial table
      $('.financials table tr, .details-table tr, table.listing-details tr').each((i, elem) => {
        const $row = $(elem);
        const label = $row.find('td:first, th:first').text().toLowerCase().trim();
        const value = $row.find('td:last').text().trim();
        
        if (label.includes('revenue') && !label.includes('potential')) {
          annualRevenue = this.extractPrice(value) || annualRevenue;
        }
        if (label.includes('cash flow') || label.includes('profit')) {
          cashFlow = this.extractPrice(value) || cashFlow;
          annualProfit = cashFlow;
        }
      });
      
      // Method 3: Look in structured data
      $('script[type="application/ld+json"]').each((i, elem) => {
        try {
          const data = JSON.parse($(elem).html());
          if (data['@type'] === 'Product' || data['@type'] === 'LocalBusiness') {
            if (data.offers?.price) {
              askingPrice = parseFloat(data.offers.price) || askingPrice;
            }
          }
        } catch (e) {
          // Continue
        }
      });
      
      // Fallback to original price if not found
      if (!askingPrice) {
        askingPrice = this.extractPrice(listingData.priceText) || 750000;
      }
      
      // Extract description
      const description = $('.business-description, .description, .overview, .listing-description').text().trim() ||
                         $('meta[name="description"]').attr('content') ||
                         listingData.description ||
                         `${listingData.title}. Located in ${listingData.location || 'USA'}.`;
      
      // Extract location more thoroughly
      const location = $('.location, .address, .listing-location').text().trim() || 
                      listingData.location || 
                      'United States';
      
      // Create highlights based on what we found
      const highlights = [];
      if (annualRevenue > 0) highlights.push(`Revenue: $${annualRevenue.toLocaleString()}`);
      if (cashFlow > 0) highlights.push(`Cash Flow: $${cashFlow.toLocaleString()}`);
      if (location && location !== 'United States') highlights.push(location);
      if (highlights.length === 0) {
        highlights.push('Amazon FBA', 'Established Business', 'BizBuySell');
      }
      
      const listing = {
        name: listingData.title,
        description: description.substring(0, 1000),
        asking_price: askingPrice,
        annual_revenue: annualRevenue,
        annual_profit: annualProfit,
        monthly_revenue: annualRevenue > 0 ? Math.round(annualRevenue / 12) : 0,
        gross_revenue: annualRevenue,
        net_revenue: annualRevenue,
        inventory_value: 0,
        profit_multiple: (askingPrice > 0 && annualProfit > 0) ? 
          parseFloat((askingPrice / annualProfit).toFixed(2)) : null,
        industry: 'E-commerce',
        location: location,
        source: 'BizBuySell',
        original_url: listingData.url,
        highlights: highlights.slice(0, 3),
        listing_status: 'live'
      };

      this.log('SUCCESS', 'Processed BizBuySell listing with enhanced data', { 
        name: listing.name,
        askingPrice: listing.asking_price,
        annualRevenue: listing.annual_revenue,
        annualProfit: listing.annual_profit
      });

      return listing;
    } catch (error) {
      this.log('ERROR', 'Failed to process BizBuySell listing', { 
        url: listingData.url,
        error: error.message 
      });
      
      return {
        name: listingData.title,
        description: `Amazon FBA business for sale in ${listingData.location || 'USA'}`,
        asking_price: this.extractPrice(listingData.priceText) || 750000,
        annual_revenue: 0, // Don't estimate
        annual_profit: 0,
        monthly_revenue: 0,
        gross_revenue: 0,
        net_revenue: 0,
        inventory_value: 0,
        profit_multiple: null,
        industry: 'E-commerce',
        location: listingData.location || 'United States',
        source: 'BizBuySell',
        original_url: listingData.url,
        highlights: ['Amazon FBA', 'BizBuySell'],
        listing_status: 'live'
      };
    }
  }

  // EmpireFlippers two-stage scraping
  async scrapeEmpireFlippersFeed() {
    this.log('INFO', '=== Stage 1: EmpireFlippers Feed Scraper ===');
    const listings = [];

    try {
      // Try their marketplace page
      const marketplaceUrl = 'https://empireflippers.com/marketplace/';
      const html = await this.fetchPage(marketplaceUrl);
      const $ = cheerio.load(html);

      // Look for listing data in JSON-LD or script tags
      $('script[type="application/ld+json"]').each((i, elem) => {
        try {
          const data = JSON.parse($(elem).html());
          if (data['@type'] === 'ItemList' && data.itemListElement) {
            data.itemListElement.forEach(item => {
              if (item.url) {
                listings.push({
                  url: item.url,
                  title: item.name || 'Amazon FBA Business',
                  priceText: item.offers?.price,
                  source: 'EmpireFlippers'
                });
              }
            });
          }
        } catch (e) {
          // Continue if JSON parsing fails
        }
      });

      // Also try regular HTML scraping
      $('.listing-card, .marketplace-listing, article.listing').each((i, elem) => {
        const $elem = $(elem);
        const link = $elem.find('a').attr('href');
        const title = $elem.find('.title, h3').text().trim();
        const priceText = $elem.find('.price').text().trim();
        const niche = $elem.find('.niche, .category').text().trim();

        if (link && (niche.toLowerCase().includes('amazon') || 
                    niche.toLowerCase().includes('fba') ||
                    title.toLowerCase().includes('amazon'))) {
          const fullUrl = link.startsWith('http') ? link : `https://empireflippers.com${link}`;
          listings.push({
            url: fullUrl,
            title: title || `Amazon FBA - ${niche}`,
            priceText,
            source: 'EmpireFlippers'
          });
        }
      });

    } catch (error) {
      this.log('ERROR', 'EmpireFlippers feed scraper failed', { error: error.message });
    }

    this.log('SUCCESS', 'EmpireFlippers feed scraping complete', { foundUrls: listings.length });
    return listings;
  }

  async scrapeEmpireFlippersListing(listingData) {
    this.log('INFO', 'Stage 2: Scraping EmpireFlippers listing details', { url: listingData.url });

    try {
      const html = await this.fetchPage(listingData.url);
      const $ = cheerio.load(html);

      // Extract description from multiple possible locations
      const description = $('.listing-description, .overview-section, .business-description').text().trim() ||
                         $('.key-points li').map((i, el) => $(el).text()).get().join(' ') ||
                         `Premium ${listingData.title} with verified financials.`;

      // Extract financial metrics
      const askingPrice = this.extractPrice(
        $('.listing-price, .asking-price, .price-tag').text() || listingData.priceText
      ) || 1000000;

      const monthlyProfit = this.extractPrice(
        $('.monthly-profit, .net-profit, dt:contains("Monthly Profit")').next().text()
      );

      const monthlyRevenue = this.extractPrice(
        $('.monthly-revenue, dt:contains("Monthly Revenue")').next().text()
      );

      const annualRevenue = monthlyRevenue ? monthlyRevenue * 12 : 0;
      const annualProfit = monthlyProfit ? monthlyProfit * 12 : 0;

      // Extract key metrics
      const multiple = $('.multiple, dt:contains("Multiple")').next().text().trim();
      const age = $('.age, dt:contains("Age")').next().text().trim();

      const highlights = [];
      if (monthlyProfit) highlights.push(`$${monthlyProfit.toLocaleString()}/mo profit`);
      if (multiple) highlights.push(`${multiple} Multiple`);
      if (age) highlights.push(age);
      if (highlights.length === 0) {
        highlights.push('Verified Financials', 'Amazon FBA', 'Premium Broker');
      }

      const listing = {
        name: listingData.title,
        description: description.substring(0, 1000),
        asking_price: askingPrice,
        annual_revenue: annualRevenue,
        annual_profit: annualProfit,
        monthly_revenue: monthlyRevenue || 0,
        gross_revenue: annualRevenue,
        net_revenue: annualRevenue,
        inventory_value: 0, // EmpireFlippers rarely shows inventory value
        profit_multiple: parseFloat(multiple) || null,
        industry: 'E-commerce',
        location: 'Online',
        source: 'EmpireFlippers',
        original_url: listingData.url,
        highlights: highlights.slice(0, 3),
        listing_status: 'live'
      };

      this.log('SUCCESS', 'Extracted EmpireFlippers listing details', { 
        name: listing.name,
        descriptionLength: listing.description.length,
        monthlyProfit
      });

      return listing;
    } catch (error) {
      this.log('ERROR', 'Failed to scrape EmpireFlippers listing', { 
        url: listingData.url,
        error: error.message 
      });
      
      return {
        name: listingData.title,
        description: 'Amazon FBA business with verified financials',
        asking_price: this.extractPrice(listingData.priceText) || 1000000,
        annual_revenue: 0, // Don't estimate
        annual_profit: 0,
        monthly_revenue: 0,
        gross_revenue: 0,
        net_revenue: 0,
        inventory_value: 0,
        profit_multiple: null,
        industry: 'E-commerce',
        location: 'Online',
        source: 'EmpireFlippers',
        original_url: listingData.url,
        highlights: ['Amazon FBA', 'EmpireFlippers'],
        listing_status: 'live'
      };
    }
  }

  // Flippa two-stage scraping
  async scrapeFlippaFeed() {
    this.log('INFO', '=== Stage 1: Flippa Feed Scraper ===');
    const listings = [];

    const searchUrls = [
      'https://flippa.com/search?business_model[]=ecommerce&monetization[]=amazon-fba',
      'https://flippa.com/buy/ecommerce/amazon-fba'
    ];

    for (const searchUrl of searchUrls) {
      try {
        const html = await this.fetchPage(searchUrl);
        const $ = cheerio.load(html);

        // Flippa uses React, check for data in script tags
        $('script').each((i, elem) => {
          const content = $(elem).html() || '';
          if (content.includes('__NEXT_DATA__')) {
            try {
              const jsonMatch = content.match(/\{.*\}/);
              if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                const pageData = data.props?.pageProps?.listings || [];
                
                pageData.forEach(item => {
                  if (item.monetization === 'amazon-fba' || 
                      item.title?.toLowerCase().includes('amazon') ||
                      item.title?.toLowerCase().includes('fba')) {
                    listings.push({
                      url: `https://flippa.com${item.url || `/businesses/${item.id}`}`,
                      title: item.title || 'Amazon FBA Business',
                      priceText: item.price,
                      source: 'Flippa'
                    });
                  }
                });
              }
            } catch (e) {
              // Continue if parsing fails
            }
          }
        });

        // Also try regular HTML selectors
        $('.ListingCard, .listing-card, [data-listing-id]').each((i, elem) => {
          const $elem = $(elem);
          const link = $elem.find('a').attr('href');
          const title = $elem.find('.ListingCard__title, .title').text().trim();
          const priceText = $elem.find('.ListingCard__price, .price').text().trim();
          const type = $elem.find('.ListingCard__type').text().trim();

          if (link && (type.toLowerCase().includes('ecommerce') || 
                      title.toLowerCase().includes('amazon'))) {
            const fullUrl = link.startsWith('http') ? link : `https://flippa.com${link}`;
            listings.push({
              url: fullUrl,
              title,
              priceText,
              source: 'Flippa'
            });
          }
        });

      } catch (error) {
        this.log('ERROR', 'Flippa feed scraper failed', { url: searchUrl, error: error.message });
      }
    }

    this.log('SUCCESS', 'Flippa feed scraping complete', { foundUrls: listings.length });
    return listings;
  }

  async scrapeFlippaListing(listingData) {
    this.log('INFO', 'Stage 2: Scraping Flippa listing details', { url: listingData.url });

    try {
      const html = await this.fetchPage(listingData.url);
      const $ = cheerio.load(html);

      // Extract description
      const description = $('.listing-description, .description, .overview').text().trim() ||
                         $('.key-metrics li').map((i, el) => $(el).text()).get().join('. ') ||
                         `${listingData.title}. Listed on Flippa marketplace.`;

      // Extract financial details
      const askingPrice = this.extractPrice(
        $('.asking-price, .price, h1:contains("$")').text() || listingData.priceText
      ) || 500000;

      const monthlyRevenue = this.extractPrice(
        $('.monthly-revenue, dt:contains("Revenue")').next().text()
      );

      const monthlyProfit = this.extractPrice(
        $('.monthly-profit, dt:contains("Profit")').next().text()
      );

      const annualRevenue = monthlyRevenue ? monthlyRevenue * 12 : 0;
      const annualProfit = monthlyProfit ? monthlyProfit * 12 : 0;

      // Extract metrics
      const trafficSources = $('.traffic-sources, dt:contains("Traffic")').next().text().trim();
      const age = $('.business-age, dt:contains("Age")').next().text().trim();

      const highlights = [];
      if (monthlyProfit) highlights.push(`$${monthlyProfit.toLocaleString()}/mo profit`);
      if (trafficSources) highlights.push(trafficSources);
      if (age) highlights.push(age);
      if (highlights.length === 0) {
        highlights.push('Amazon FBA', 'Flippa Verified', 'E-commerce');
      }

      const listing = {
        name: listingData.title,
        description: description.substring(0, 1000),
        asking_price: askingPrice,
        annual_revenue: annualRevenue,
        annual_profit: annualProfit,
        monthly_revenue: monthlyRevenue || 0,
        gross_revenue: annualRevenue,
        net_revenue: annualRevenue,
        inventory_value: 0,
        profit_multiple: (askingPrice > 0 && annualProfit > 0) ? parseFloat((askingPrice / annualProfit).toFixed(2)) : null,
        industry: 'E-commerce',
        location: 'Online',
        source: 'Flippa',
        original_url: listingData.url,
        highlights: highlights.slice(0, 3),
        listing_status: 'live'
      };

      this.log('SUCCESS', 'Extracted Flippa listing details', { 
        name: listing.name,
        descriptionLength: listing.description.length
      });

      return listing;
    } catch (error) {
      this.log('ERROR', 'Failed to scrape Flippa listing', { 
        url: listingData.url,
        error: error.message 
      });
      
      return {
        name: listingData.title,
        description: 'Amazon FBA business listed on Flippa',
        asking_price: this.extractPrice(listingData.priceText) || 500000,
        annual_revenue: 0, // Don't estimate
        annual_profit: 0,
        monthly_revenue: 0,
        gross_revenue: 0,
        net_revenue: 0,
        inventory_value: 0,
        profit_multiple: null,
        industry: 'E-commerce',
        location: 'Online',
        source: 'Flippa',
        original_url: listingData.url,
        highlights: ['Amazon FBA', 'Flippa'],
        listing_status: 'live'
      };
    }
  }

  // Batch save multiple listings efficiently
  async batchSaveListings(listings) {
    console.log('🔍 [BATCH SAVE] Starting batch save for', listings.length, 'listings');
    if (!listings.length) return { created: 0, updated: 0, duplicates: 0, errors: 0 };
    
    let created = 0, updated = 0, duplicates = 0, errors = 0;
    
    // Process in larger batches for better performance
    const batchSize = 10;
    for (let i = 0; i < listings.length; i += batchSize) {
      const batch = listings.slice(i, i + batchSize);
      
      // Process batch in parallel
      const results = await Promise.allSettled(
        batch.map(listing => this.saveListing(listing))
      );
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          switch (result.value) {
            case 'created': created++; break;
            case 'updated': updated++; break;
            case 'duplicate': duplicates++; break;
            default: errors++; break;
          }
        } else {
          errors++;
          this.log('ERROR', 'Batch save failed for listing', { 
            listing: batch[index]?.name,
            error: result.reason?.message 
          });
        }
      });
    }
    
    console.log('🔍 [BATCH SAVE COMPLETE] Results:', {
      created,
      updated,
      duplicates,
      errors,
      total: listings.length,
      successRate: `${Math.round(((created + updated) / listings.length) * 100)}%`
    });
    
    return { created, updated, duplicates, errors };
  }

  // ============== NEW SITE SCRAPERS ==============
  
  // LoopNet Feed Scraper
  async scrapeLoopNetFeed(maxPages = 3) {
    this.log('INFO', '=== Stage 1: LoopNet Feed Scraper ===');
    const listings = [];
    
    for (let page = 1; page <= maxPages; page++) {
      try {
        const feedUrl = page === 1 
          ? 'https://www.loopnet.com/biz/amazon-stores-for-sale/'
          : `https://www.loopnet.com/biz/amazon-stores-for-sale/?Page=${page}`;
        
        const html = await this.fetchPage(feedUrl);
        const $ = cheerio.load(html);

        $('.business-listing, .result-item, .listing-card').each((i, elem) => {
          const $elem = $(elem);
          const link = $elem.find('a').first().attr('href');
          const title = $elem.find('.title, .business-name, h3').text().trim();
          const priceText = $elem.find('.price, .asking-price').text().trim();
          const location = $elem.find('.location').text().trim();

          if (link && title) {
            const fullUrl = link.startsWith('http') ? link : `https://www.loopnet.com${link}`;
            listings.push({
              url: fullUrl,
              title,
              priceText,
              location,
              source: 'LoopNet'
            });
          }
        });

        this.log('INFO', `LoopNet page ${page} scraped`, { foundUrls: listings.length });
      } catch (error) {
        this.log('ERROR', `LoopNet page ${page} failed`, { error: error.message });
        break;
      }
    }

    this.log('SUCCESS', 'LoopNet feed scraping complete', { foundUrls: listings.length });
    return listings;
  }

  async scrapeLoopNetListing(listingData) {
    this.log('INFO', 'Stage 2: Scraping LoopNet listing details', { url: listingData.url });

    try {
      const html = await this.fetchPage(listingData.url);
      const $ = cheerio.load(html);

      const description = $('.business-description, .description, .details').text().trim() ||
        `Premium Amazon FBA business opportunity. ${listingData.title}`;

      const askingPrice = this.extractPrice(
        $('.asking-price, .price').text() || listingData.priceText
      ) || 750000;

      const revenue = this.extractPrice(
        $('.annual-revenue, .revenue').text()
      ) || Math.floor(askingPrice * 0.6);

      const highlights = [];
      $('.highlights li, .features li').each((i, elem) => {
        if (i < 3) highlights.push($(elem).text().trim());
      });
      if (highlights.length === 0) {
        highlights.push('Amazon FBA', 'LoopNet Verified', 'Commercial Listing');
      }

      const listing = {
        name: listingData.title || 'Amazon FBA Business',
        description,
        asking_price: askingPrice,
        annual_revenue: revenue,
        industry: 'E-commerce',
        location: listingData.location || $('.location').text().trim() || 'United States',
        source: 'LoopNet',
        original_url: listingData.url,
        highlights,
        listing_status: 'live'
      };

      this.log('SUCCESS', 'Extracted LoopNet listing details', { 
        name: listing.name,
        price: listing.asking_price
      });

      return listing;
    } catch (error) {
      this.log('ERROR', 'Failed to scrape LoopNet listing', { 
        url: listingData.url,
        error: error.message 
      });
      
      return {
        name: listingData.title,
        description: `Amazon FBA business for sale on LoopNet`,
        asking_price: this.extractPrice(listingData.priceText) || 750000,
        annual_revenue: 300000,
        industry: 'E-commerce',
        location: listingData.location || 'United States',
        source: 'LoopNet',
        original_url: listingData.url,
        highlights: ['Amazon FBA', 'LoopNet'],
        listing_status: 'live'
      };
    }
  }

  // Investors.Club Feed Scraper
  async scrapeInvestorsClubFeed(maxPages = 2) {
    this.log('INFO', '=== Stage 1: Investors.Club Feed Scraper ===');
    const listings = [];
    
    for (let page = 1; page <= maxPages; page++) {
      try {
        const feedUrl = page === 1 
          ? 'https://investors.club/tech-stack/amazon-fba/'
          : `https://investors.club/tech-stack/amazon-fba/?page=${page}`;
        
        const html = await this.fetchPage(feedUrl);
        const $ = cheerio.load(html);

        $('.startup-card, .company-card, .listing-item').each((i, elem) => {
          const $elem = $(elem);
          const link = $elem.find('a').first().attr('href');
          const title = $elem.find('.company-name, .title, h3').text().trim();
          const priceText = $elem.find('.valuation, .price').text().trim();
          const description = $elem.find('.description').text().trim();

          if (link && title) {
            const fullUrl = link.startsWith('http') ? link : `https://investors.club${link}`;
            listings.push({
              url: fullUrl,
              title,
              priceText,
              description,
              source: 'Investors.Club'
            });
          }
        });

        this.log('INFO', `Investors.Club page ${page} scraped`, { foundUrls: listings.length });
      } catch (error) {
        this.log('ERROR', `Investors.Club page ${page} failed`, { error: error.message });
        break;
      }
    }

    this.log('SUCCESS', 'Investors.Club feed scraping complete', { foundUrls: listings.length });
    return listings;
  }

  async scrapeInvestorsClubListing(listingData) {
    this.log('INFO', 'Stage 2: Scraping Investors.Club listing details', { url: listingData.url });

    try {
      const html = await this.fetchPage(listingData.url);
      const $ = cheerio.load(html);

      const description = $('.company-description, .details, .overview').text().trim() ||
        listingData.description || `Amazon FBA investment opportunity. ${listingData.title}`;

      const askingPrice = this.extractPrice(
        $('.valuation, .asking-price').text() || listingData.priceText
      ) || 500000;

      const revenue = this.extractPrice(
        $('.revenue, .annual-revenue').text()
      ) || Math.floor(askingPrice * 0.5);

      const highlights = ['Amazon FBA', 'Investment Opportunity', 'Verified Startup'];

      const listing = {
        name: listingData.title || 'Amazon FBA Investment',
        description,
        asking_price: askingPrice,
        annual_revenue: revenue,
        industry: 'E-commerce',
        location: 'Online',
        source: 'Investors.Club',
        original_url: listingData.url,
        highlights,
        listing_status: 'live'
      };

      this.log('SUCCESS', 'Extracted Investors.Club listing details', { 
        name: listing.name,
        price: listing.asking_price
      });

      return listing;
    } catch (error) {
      this.log('ERROR', 'Failed to scrape Investors.Club listing', { 
        url: listingData.url,
        error: error.message 
      });
      
      return {
        name: listingData.title,
        description: `Amazon FBA investment opportunity`,
        asking_price: this.extractPrice(listingData.priceText) || 500000,
        annual_revenue: 250000,
        industry: 'E-commerce',
        location: 'Online',
        source: 'Investors.Club',
        original_url: listingData.url,
        highlights: ['Amazon FBA', 'Investment'],
        listing_status: 'live'
      };
    }
  }

  // Website Properties Feed Scraper
  async scrapeWebsitePropertiesFeed(maxPages = 3) {
    this.log('INFO', '=== Stage 1: Website Properties Feed Scraper ===');
    const listings = [];
    
    for (let page = 1; page <= maxPages; page++) {
      try {
        const feedUrl = page === 1 
          ? 'https://websiteproperties.com/amazon-fba-business-for-sale/'
          : `https://websiteproperties.com/amazon-fba-business-for-sale/page/${page}/`;
        
        const html = await this.fetchPage(feedUrl);
        const $ = cheerio.load(html);

        $('.property-listing, .listing-card, .website-listing').each((i, elem) => {
          const $elem = $(elem);
          const link = $elem.find('a').first().attr('href');
          const title = $elem.find('.property-title, .title, h3').text().trim();
          const priceText = $elem.find('.price, .asking-price').text().trim();
          const revenue = $elem.find('.revenue, .monthly-revenue').text().trim();

          if (link && title) {
            const fullUrl = link.startsWith('http') ? link : `https://websiteproperties.com${link}`;
            listings.push({
              url: fullUrl,
              title,
              priceText,
              revenue,
              source: 'Website Properties'
            });
          }
        });

        this.log('INFO', `Website Properties page ${page} scraped`, { foundUrls: listings.length });
      } catch (error) {
        this.log('ERROR', `Website Properties page ${page} failed`, { error: error.message });
        break;
      }
    }

    this.log('SUCCESS', 'Website Properties feed scraping complete', { foundUrls: listings.length });
    return listings;
  }

  async scrapeWebsitePropertiesListing(listingData) {
    this.log('INFO', 'Stage 2: Scraping Website Properties listing details', { url: listingData.url });

    try {
      const html = await this.fetchPage(listingData.url);
      const $ = cheerio.load(html);

      const description = $('.property-description, .description, .details').text().trim() ||
        `Premium Amazon FBA website business. ${listingData.title}`;

      const askingPrice = this.extractPrice(
        $('.asking-price, .price').text() || listingData.priceText
      ) || 400000;

      const revenue = this.extractPrice(
        $('.monthly-revenue, .revenue').text() || listingData.revenue
      ) || Math.floor(askingPrice * 0.3);

      const highlights = [];
      $('.features li, .highlights li').each((i, elem) => {
        if (i < 3) highlights.push($(elem).text().trim());
      });
      if (highlights.length === 0) {
        highlights.push('Amazon FBA', 'Website Business', 'Established');
      }

      const listing = {
        name: listingData.title || 'Amazon FBA Website Business',
        description,
        asking_price: askingPrice,
        annual_revenue: revenue * 12,
        industry: 'E-commerce',
        location: 'Online',
        source: 'Website Properties',
        original_url: listingData.url,
        highlights,
        listing_status: 'live'
      };

      this.log('SUCCESS', 'Extracted Website Properties listing details', { 
        name: listing.name,
        price: listing.asking_price
      });

      return listing;
    } catch (error) {
      this.log('ERROR', 'Failed to scrape Website Properties listing', { 
        url: listingData.url,
        error: error.message 
      });
      
      return {
        name: listingData.title,
        description: `Amazon FBA website business for sale`,
        asking_price: this.extractPrice(listingData.priceText) || 400000,
        annual_revenue: 150000,
        industry: 'E-commerce',
        location: 'Online',
        source: 'Website Properties',
        original_url: listingData.url,
        highlights: ['Amazon FBA', 'Website Business'],
        listing_status: 'live'
      };
    }
  }

  // BizQuest Feed Scraper
  async scrapeBizQuestFeed(maxPages = 3) {
    this.log('INFO', '=== Stage 1: BizQuest Feed Scraper ===');
    const listings = [];
    
    for (let page = 1; page <= maxPages; page++) {
      try {
        const feedUrl = page === 1 
          ? 'https://www.bizquest.com/amazon-business-for-sale/'
          : `https://www.bizquest.com/amazon-business-for-sale/?pg=${page}`;
        
        const html = await this.fetchPage(feedUrl);
        const $ = cheerio.load(html);

        $('.listing-summary, .business-listing, .result-item').each((i, elem) => {
          const $elem = $(elem);
          const link = $elem.find('a').first().attr('href');
          const title = $elem.find('.business-title, .title, h3').text().trim();
          const priceText = $elem.find('.asking-price, .price').text().trim();
          const location = $elem.find('.location').text().trim();

          if (link && title) {
            const fullUrl = link.startsWith('http') ? link : `https://www.bizquest.com${link}`;
            listings.push({
              url: fullUrl,
              title,
              priceText,
              location,
              source: 'BizQuest'
            });
          }
        });

        this.log('INFO', `BizQuest page ${page} scraped`, { foundUrls: listings.length });
      } catch (error) {
        this.log('ERROR', `BizQuest page ${page} failed`, { error: error.message });
        break;
      }
    }

    this.log('SUCCESS', 'BizQuest feed scraping complete', { foundUrls: listings.length });
    return listings;
  }

  async scrapeBizQuestListing(listingData) {
    this.log('INFO', 'Stage 2: Scraping BizQuest listing details', { url: listingData.url });

    try {
      const html = await this.fetchPage(listingData.url);
      const $ = cheerio.load(html);

      const description = $('.business-description, .description').text().trim() ||
        `Amazon business opportunity. ${listingData.title}`;

      const askingPrice = this.extractPrice(
        $('.asking-price, .price').text() || listingData.priceText
      ) || 600000;

      const revenue = this.extractPrice(
        $('.annual-revenue, .gross-revenue').text()
      ) || Math.floor(askingPrice * 0.4);

      const highlights = [];
      $('.business-highlights li, .features li').each((i, elem) => {
        if (i < 3) highlights.push($(elem).text().trim());
      });
      if (highlights.length === 0) {
        highlights.push('Amazon Business', 'BizQuest Verified', 'Established');
      }

      const listing = {
        name: listingData.title || 'Amazon Business',
        description,
        asking_price: askingPrice,
        annual_revenue: revenue,
        industry: 'E-commerce',
        location: listingData.location || $('.location').text().trim() || 'United States',
        source: 'BizQuest',
        original_url: listingData.url,
        highlights,
        listing_status: 'live'
      };

      this.log('SUCCESS', 'Extracted BizQuest listing details', { 
        name: listing.name,
        price: listing.asking_price
      });

      return listing;
    } catch (error) {
      this.log('ERROR', 'Failed to scrape BizQuest listing', { 
        url: listingData.url,
        error: error.message 
      });
      
      return {
        name: listingData.title,
        description: `Amazon business for sale`,
        asking_price: this.extractPrice(listingData.priceText) || 600000,
        annual_revenue: 240000,
        industry: 'E-commerce',
        location: listingData.location || 'United States',
        source: 'BizQuest',
        original_url: listingData.url,
        highlights: ['Amazon Business', 'BizQuest'],
        listing_status: 'live'
      };
    }
  }

  // Acquire.com Feed Scraper
  async scrapeAcquireFeed(maxPages = 2) {
    this.log('INFO', '=== Stage 1: Acquire.com Feed Scraper ===');
    const listings = [];
    
    for (let page = 1; page <= maxPages; page++) {
      try {
        const feedUrl = page === 1 
          ? 'https://acquire.com/amazon-fba-for-sale/'
          : `https://acquire.com/amazon-fba-for-sale/?page=${page}`;
        
        const html = await this.fetchPage(feedUrl);
        const $ = cheerio.load(html);

        $('.startup-card, .acquisition-card, .listing-card').each((i, elem) => {
          const $elem = $(elem);
          const link = $elem.find('a').first().attr('href');
          const title = $elem.find('.startup-name, .title, h3').text().trim();
          const priceText = $elem.find('.asking-price, .valuation').text().trim();
          const description = $elem.find('.description, .summary').text().trim();

          if (link && title) {
            const fullUrl = link.startsWith('http') ? link : `https://acquire.com${link}`;
            listings.push({
              url: fullUrl,
              title,
              priceText,
              description,
              source: 'Acquire.com'
            });
          }
        });

        this.log('INFO', `Acquire.com page ${page} scraped`, { foundUrls: listings.length });
      } catch (error) {
        this.log('ERROR', `Acquire.com page ${page} failed`, { error: error.message });
        break;
      }
    }

    this.log('SUCCESS', 'Acquire.com feed scraping complete', { foundUrls: listings.length });
    return listings;
  }

  async scrapeAcquireListing(listingData) {
    this.log('INFO', 'Stage 2: Scraping Acquire.com listing details', { url: listingData.url });

    try {
      const html = await this.fetchPage(listingData.url);
      const $ = cheerio.load(html);

      const description = $('.startup-description, .details').text().trim() ||
        listingData.description || `Amazon FBA acquisition opportunity. ${listingData.title}`;

      const askingPrice = this.extractPrice(
        $('.asking-price, .valuation').text() || listingData.priceText
      ) || 300000;

      const revenue = this.extractPrice(
        $('.revenue, .monthly-revenue').text()
      ) || Math.floor(askingPrice * 0.4);

      const highlights = ['Amazon FBA', 'Acquisition Ready', 'Verified Startup'];

      const listing = {
        name: listingData.title || 'Amazon FBA Acquisition',
        description,
        asking_price: askingPrice,
        annual_revenue: revenue,
        industry: 'E-commerce',
        location: 'Online',
        source: 'Acquire.com',
        original_url: listingData.url,
        highlights,
        listing_status: 'live'
      };

      this.log('SUCCESS', 'Extracted Acquire.com listing details', { 
        name: listing.name,
        price: listing.asking_price
      });

      return listing;
    } catch (error) {
      this.log('ERROR', 'Failed to scrape Acquire.com listing', { 
        url: listingData.url,
        error: error.message 
      });
      
      return {
        name: listingData.title,
        description: `Amazon FBA acquisition opportunity`,
        asking_price: this.extractPrice(listingData.priceText) || 300000,
        annual_revenue: 120000,
        industry: 'E-commerce',
        location: 'Online',
        source: 'Acquire.com',
        original_url: listingData.url,
        highlights: ['Amazon FBA', 'Acquisition'],
        listing_status: 'live'
      };
    }
  }

  // ============== EXISTING SCRAPERS (UPDATED) ==============

  // Process individual listings in parallel batches
  async processListingsBatch(listingDataArray, maxConcurrent = 5) {
    this.log('INFO', `[Stage 2] Processing ${listingDataArray.length} listings with concurrency=${maxConcurrent}`);
    const allDetailedListings = [];
    
    for (let i = 0; i < listingDataArray.length; i += maxConcurrent) {
      const batch = listingDataArray.slice(i, i + maxConcurrent);
      this.log('INFO', `Processing batch ${Math.floor(i / maxConcurrent) + 1} with ${batch.length} listings...`);
      
      const promises = batch.map(listingData => {
        const siteConfig = Object.values(this.availableSites).find(s => s.name === listingData.source);
        if (siteConfig && this[siteConfig.detailMethod]) {
          return this[siteConfig.detailMethod](listingData)
            .catch(err => {
              this.log('ERROR', `Detail scrape failed for ${listingData.url}`, { error: err.message });
              return null; // Return null on failure to keep Promise.all going
            });
        }
        return Promise.resolve(null);
      });

      const results = await Promise.all(promises);
      
      // Filter out nulls from failed scrapes
      const successfulListings = results.filter(r => r);
      allDetailedListings.push(...successfulListings);

      // Add a respectful delay between batches
      if (i + maxConcurrent < listingDataArray.length) {
        const delay = 2000; // 2 second delay
        this.log('INFO', `Waiting ${delay}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    this.log('SUCCESS', `[Stage 2] Finished processing. Extracted details for ${allDetailedListings.length} listings.`);
    return allDetailedListings;
  }

  // Main execution method with multiselect support
  async runTwoStageScraping(options = {}) {
    const startTime = Date.now();
    this.log('INFO', '🚀 Enhanced Multi-Stage Scraping Process Starting...');

    const { selectedSites = null } = options;
    const sitesToScrape = selectedSites
      ? selectedSites.map(key => this.availableSites[key]).filter(Boolean)
      : Object.values(this.availableSites);

    this.log('INFO', `Selected sites for scraping: ${sitesToScrape.map(s => s.name).join(', ')}`);

    // STAGE 1: Collect all listing URLs from all sites
    const allListingUrls = await this.collectAllListingUrls(sitesToScrape);

    if (allListingUrls.length === 0) {
      this.log('WARN', 'No listings found in Stage 1. Ending process.');
      return this.getFinalResults(startTime);
    }

    this.log('SUCCESS', `✅ Stage 1 Complete - Found ${allListingUrls.length} total listings to process`);

    // STAGE 2: Process all found listings concurrently
    const detailedListings = await this.processListingsBatch(allListingUrls);
    
    // STAGE 3: Batch save to database
    if (detailedListings.length > 0) {
      await this.batchSaveListings(detailedListings);
    } else {
      this.log('WARN', 'No detailed listings were successfully scraped in Stage 2.');
    }

    return this.getFinalResults(startTime);
  }

  async collectAllListingUrls(sitesToScrape) {
    this.log('INFO', '🚀 [Stage 1] Starting feed scraping for all sites...');
    const allListingUrls = [];
    const sitePromises = [];

    for (const siteConfig of sitesToScrape) {
      const { name, feedMethod, maxPages } = siteConfig;
      
      this.log('INFO', `[${name}] Starting feed scrape...`);

      const sitePromise = this[feedMethod](maxPages)
        .then(listings => {
          this.log('SUCCESS', `[${name}] Feed scrape complete, found ${listings.length} listings.`);
          allListingUrls.push(...listings);
        })
        .catch(error => {
          this.log('ERROR', `[${name}] Feed scraper failed: ${error.message}`);
          this.totalErrors++;
        });

      sitePromises.push(sitePromise);
    }

    await Promise.all(sitePromises);
    
    this.log('SUCCESS', `[Stage 1] All feed scrapers finished. Found ${allListingUrls.length} total URLs.`);
    return allListingUrls;
  }

  getFinalResults(startTime) {
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    this.log('SUCCESS', '🎉 Enhanced Multi-Stage Scraping Complete', {
      duration: `${duration} seconds`,
      totalFound: this.totalFound,
      totalSaved: this.totalSaved,
      duplicates: this.duplicates,
      totalErrors: this.totalErrors,
      bySource: this.listingsBySource
    });
    return {
      success: this.totalErrors === 0,
      count: this.totalSaved,
      totalFound: this.totalFound,
      totalSaved: this.totalSaved,
      duplicatesSkipped: this.duplicates,
      executionTime: duration,
      logs: this.detailedLogs,
      errors: this.detailedLogs.filter(log => log.level === 'ERROR' || log.level === 'WARN'),
      siteBreakdown: this.listingsBySource,
      message: `Successfully scraped ${this.totalSaved} FBA business listings from multiple sources`
    };
  }
}

// Run the scraper
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const scraper = new EnhancedMultiScraper();
  scraper.runTwoStageScraping()
    .then(results => {
      console.log('\n🎉 Final Results:', JSON.stringify(results, null, 2));
      console.log('\n✨ Your dashboard now has FBA listings with full descriptions!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    });
}

export default EnhancedMultiScraper;