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

class ComprehensiveFBAScraper {
  constructor() {
    this.totalFound = 0;
    this.totalSaved = 0;
    this.totalErrors = 0;
    this.listingsBySource = {};
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data
    };
    console.log(`[${timestamp}] [${level}] ${message}`, JSON.stringify(data, null, 2));
  }

  async fetchPage(url, useScraperAPI = true) {
    this.log('INFO', 'Fetching page', { url, useScraperAPI });
    
    try {
      if (useScraperAPI && SCRAPER_API_KEY) {
        const scraperUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}&render=true`;
        const response = await fetch(scraperUrl, { timeout: 30000 });
        
        if (!response.ok) {
          throw new Error(`ScraperAPI returned ${response.status}`);
        }
        
        const html = await response.text();
        this.log('SUCCESS', 'Fetched with ScraperAPI', { url, htmlLength: html.length });
        return html;
      } else {
        // Direct fetch
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 15000
        });
        
        if (!response.ok) {
          throw new Error(`Direct fetch returned ${response.status}`);
        }
        
        const html = await response.text();
        this.log('SUCCESS', 'Fetched directly', { url, htmlLength: html.length });
        return html;
      }
    } catch (error) {
      this.log('ERROR', 'Failed to fetch page', { url, error: error.message });
      throw error;
    }
  }

  extractPrice(priceText) {
    if (!priceText) return 0;
    
    const cleaned = priceText.replace(/[^0-9.,MmKk]/g, '');
    
    if (cleaned.toLowerCase().includes('m')) {
      return Math.floor(parseFloat(cleaned) * 1000000);
    } else if (cleaned.toLowerCase().includes('k')) {
      return Math.floor(parseFloat(cleaned) * 1000);
    } else {
      const price = parseFloat(cleaned.replace(/,/g, ''));
      return isNaN(price) ? 0 : Math.floor(price);
    }
  }

  async saveListing(listing) {
    try {
      // Validate required fields
      if (!listing.name || listing.name === 'Unknown Business') {
        this.log('WARN', 'Skipping listing with no name', { listing });
        return false;
      }

      if (!listing.asking_price || listing.asking_price < 1000) {
        this.log('WARN', 'Skipping listing with invalid price', { listing });
        return false;
      }

      // Check if already exists
      const { data: existing } = await supabase
        .from('business_listings')
        .select('id')
        .eq('original_url', listing.original_url)
        .single();

      if (existing) {
        this.log('INFO', 'Listing already exists, updating', { url: listing.original_url });
        
        const { error } = await supabase
          .from('business_listings')
          .update({
            ...listing,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
        return 'updated';
      } else {
        this.log('INFO', 'Saving new listing', { name: listing.name, price: listing.asking_price });
        
        const { error } = await supabase
          .from('business_listings')
          .insert({
            ...listing,
            created_at: new Date().toISOString()
          });

        if (error) throw error;
        this.totalSaved++;
        return 'created';
      }
    } catch (error) {
      this.log('ERROR', 'Failed to save listing', { listing, error: error.message });
      this.totalErrors++;
      return false;
    }
  }

  async scrapeQuietLight() {
    this.log('INFO', '=== Starting QuietLight FBA scraper ===');
    const baseUrl = 'https://quietlight.com/amazon-fba-businesses-for-sale/';
    let pageNum = 1;
    let foundListings = 0;

    try {
      while (pageNum <= 5) { // Limit to 5 pages for testing
        const url = pageNum === 1 ? baseUrl : `${baseUrl}page/${pageNum}/`;
        this.log('INFO', `Scraping QuietLight page ${pageNum}`, { url });

        try {
          const html = await this.fetchPage(url);
          const $ = cheerio.load(html);

          // Find listing containers
          const listings = $('.listing-item, .business-listing, article.listing, .property-item');
          this.log('INFO', `Found ${listings.length} listing containers on page ${pageNum}`);

          if (listings.length === 0) {
            // Try alternative selectors
            const articles = $('article');
            this.log('INFO', `Trying articles: found ${articles.length}`);
            
            articles.each((index, elem) => {
              const article = $(elem);
              const title = article.find('h2, h3, .entry-title').text().trim();
              const link = article.find('a').attr('href');
              
              if (title && link) {
                this.log('DEBUG', 'Found article', { title, link });
              }
            });
          }

          let pageListings = 0;

          for (const elem of listings.toArray()) {
            const listing = $(elem);
            
            // Extract listing details
            const title = listing.find('h2, h3, .listing-title, .entry-title').text().trim();
            const link = listing.find('a').attr('href') || listing.find('.listing-link').attr('href');
            const priceText = listing.find('.price, .listing-price, .asking-price').text().trim();
            const description = listing.find('.description, .listing-description, .excerpt').text().trim();

            if (!title || !link) {
              this.log('DEBUG', 'Missing title or link', { title, link });
              continue;
            }

            // Only process FBA listings
            const isFBA = title.toLowerCase().includes('fba') || 
                         title.toLowerCase().includes('amazon') ||
                         description.toLowerCase().includes('fba') ||
                         description.toLowerCase().includes('amazon');

            if (!isFBA) {
              this.log('DEBUG', 'Not an FBA listing', { title });
              continue;
            }

            const fullUrl = link.startsWith('http') ? link : `https://quietlight.com${link}`;
            
            // Extract price
            const askingPrice = this.extractPrice(priceText);
            
            if (askingPrice < 10000) {
              this.log('DEBUG', 'Price too low or missing', { title, priceText, askingPrice });
              continue;
            }

            const listingData = {
              name: title,
              description: description || `FBA business opportunity: ${title}`,
              asking_price: askingPrice,
              annual_revenue: Math.floor(askingPrice * 0.4), // Estimate
              industry: 'E-commerce',
              location: 'United States',
              source: 'QuietLight',
              original_url: fullUrl,
              highlights: ['FBA Business', 'Established', 'QuietLight Brokerage'],
              listing_status: 'active'
            };

            const result = await this.saveListing(listingData);
            if (result) {
              foundListings++;
              pageListings++;
              this.totalFound++;
            }
          }

          this.log('INFO', `Page ${pageNum} complete`, { pageListings, totalFound: foundListings });

          if (pageListings === 0) {
            this.log('WARN', 'No listings found on page, stopping pagination');
            break;
          }

          pageNum++;
          await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limit

        } catch (pageError) {
          this.log('ERROR', `Failed to scrape page ${pageNum}`, { error: pageError.message });
        }
      }

      this.listingsBySource.QuietLight = foundListings;
      this.log('SUCCESS', 'QuietLight scraping complete', { foundListings });

    } catch (error) {
      this.log('ERROR', 'QuietLight scraper failed', { error: error.message });
    }
  }

  async scrapeBizBuySell() {
    this.log('INFO', '=== Starting BizBuySell FBA scraper ===');
    const searchUrl = 'https://www.bizbuysell.com/businesses-for-sale/?q=FBA';
    let foundListings = 0;

    try {
      const html = await this.fetchPage(searchUrl);
      const $ = cheerio.load(html);

      // Find listing cards
      const listings = $('.listing-card, .result, .bizResult');
      this.log('INFO', `Found ${listings.length} listing containers`);

      for (const elem of listings.toArray()) {
        const listing = $(elem);
        
        const title = listing.find('.title, .listing-title, h3').text().trim();
        const link = listing.find('a').attr('href');
        const priceText = listing.find('.price, .asking-price').text().trim();
        const location = listing.find('.location').text().trim();
        const description = listing.find('.description, .teaser').text().trim();

        if (!title || !link) continue;

        const fullUrl = link.startsWith('http') ? link : `https://www.bizbuysell.com${link}`;
        const askingPrice = this.extractPrice(priceText);

        if (askingPrice < 10000) continue;

        const listingData = {
          name: title,
          description: description || `FBA business for sale: ${title}`,
          asking_price: askingPrice,
          annual_revenue: Math.floor(askingPrice * 0.35), // Estimate
          industry: 'E-commerce',
          location: location || 'United States',
          source: 'BizBuySell',
          original_url: fullUrl,
          highlights: ['FBA Business', 'Turnkey Operation'],
          listing_status: 'active'
        };

        const result = await this.saveListing(listingData);
        if (result) {
          foundListings++;
          this.totalFound++;
        }
      }

      this.listingsBySource.BizBuySell = foundListings;
      this.log('SUCCESS', 'BizBuySell scraping complete', { foundListings });

    } catch (error) {
      this.log('ERROR', 'BizBuySell scraper failed', { error: error.message });
    }
  }

  async scrapeEmpireFlippers() {
    this.log('INFO', '=== Starting EmpireFlippers FBA scraper ===');
    const apiUrl = 'https://api.empireflippers.com/api/v1/listings/list?limit=100&monetization=Amazon%20FBA';
    let foundListings = 0;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.data && Array.isArray(data.data)) {
        this.log('INFO', `Found ${data.data.length} listings from API`);

        for (const item of data.data) {
          if (item.monetization !== 'Amazon FBA') continue;

          const listingData = {
            name: item.niche || 'Amazon FBA Business',
            description: `${item.monetization} business in ${item.niche} niche. ${item.summary || ''}`,
            asking_price: item.listing_price || 0,
            annual_revenue: (item.average_monthly_net_profit || 0) * 12,
            industry: 'E-commerce',
            location: 'Online',
            source: 'EmpireFlippers',
            original_url: `https://empireflippers.com/listing/${item.listing_number}/`,
            highlights: ['Amazon FBA', 'Verified Financials', 'Empire Flippers'],
            listing_status: 'active'
          };

          if (listingData.asking_price < 10000) continue;

          const result = await this.saveListing(listingData);
          if (result) {
            foundListings++;
            this.totalFound++;
          }
        }
      }

      this.listingsBySource.EmpireFlippers = foundListings;
      this.log('SUCCESS', 'EmpireFlippers scraping complete', { foundListings });

    } catch (error) {
      this.log('ERROR', 'EmpireFlippers scraper failed', { error: error.message });
    }
  }

  async scrapeFlipper() {
    this.log('INFO', '=== Starting Flippa FBA scraper ===');
    const searchUrl = 'https://flippa.com/search?filter[property_type]=business&filter[monetization][]=amazon-fba';
    let foundListings = 0;

    try {
      const html = await this.fetchPage(searchUrl);
      const $ = cheerio.load(html);

      const listings = $('.ListingCard, .listing-card, [data-testid="listing-card"]');
      this.log('INFO', `Found ${listings.length} listing containers`);

      for (const elem of listings.toArray()) {
        const listing = $(elem);
        
        const title = listing.find('.ListingCard__title, .listing-title').text().trim();
        const link = listing.find('a').attr('href');
        const priceText = listing.find('.ListingCard__price, .price').text().trim();
        const profitText = listing.find('.ListingCard__profit, .profit').text().trim();

        if (!title || !link) continue;

        const fullUrl = link.startsWith('http') ? link : `https://flippa.com${link}`;
        const askingPrice = this.extractPrice(priceText);
        const monthlyProfit = this.extractPrice(profitText);

        if (askingPrice < 10000) continue;

        const listingData = {
          name: title,
          description: `Amazon FBA business: ${title}`,
          asking_price: askingPrice,
          annual_revenue: monthlyProfit ? monthlyProfit * 12 : Math.floor(askingPrice * 0.3),
          industry: 'E-commerce',
          location: 'Online',
          source: 'Flippa',
          original_url: fullUrl,
          highlights: ['Amazon FBA', 'Verified Listing'],
          listing_status: 'active'
        };

        const result = await this.saveListing(listingData);
        if (result) {
          foundListings++;
          this.totalFound++;
        }
      }

      this.listingsBySource.Flippa = foundListings;
      this.log('SUCCESS', 'Flippa scraping complete', { foundListings });

    } catch (error) {
      this.log('ERROR', 'Flippa scraper failed', { error: error.message });
    }
  }

  async runAllScrapers() {
    this.log('INFO', '🚀 Starting comprehensive FBA scraping session');
    this.log('INFO', 'Configuration', {
      supabaseUrl,
      scraperApiConfigured: !!SCRAPER_API_KEY
    });

    const startTime = Date.now();

    // Run scrapers sequentially with delays
    await this.scrapeQuietLight();
    await new Promise(resolve => setTimeout(resolve, 3000));

    await this.scrapeBizBuySell();
    await new Promise(resolve => setTimeout(resolve, 3000));

    await this.scrapeEmpireFlippers();
    await new Promise(resolve => setTimeout(resolve, 3000));

    await this.scrapeFlipper();

    const duration = Math.floor((Date.now() - startTime) / 1000);

    this.log('SUCCESS', '✅ Scraping session complete', {
      duration: `${duration} seconds`,
      totalFound: this.totalFound,
      totalSaved: this.totalSaved,
      totalErrors: this.totalErrors,
      bySource: this.listingsBySource
    });

    // Get current database count
    const { count } = await supabase
      .from('business_listings')
      .select('*', { count: 'exact', head: true })
      .or('name.ilike.%fba%,description.ilike.%fba%,name.ilike.%amazon%,description.ilike.%amazon%');

    this.log('INFO', '📊 Database statistics', {
      totalFBAListings: count || 0
    });

    return {
      success: true,
      totalFound: this.totalFound,
      totalSaved: this.totalSaved,
      totalErrors: this.totalErrors,
      bySource: this.listingsBySource,
      databaseTotal: count || 0
    };
  }
}

// Run the scraper
const scraper = new ComprehensiveFBAScraper();
scraper.runAllScrapers()
  .then(results => {
    console.log('\n🎉 Final Results:', JSON.stringify(results, null, 2));
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });