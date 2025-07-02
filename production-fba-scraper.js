#!/usr/bin/env node

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

class ProductionFBAScraper {
  constructor() {
    this.supabaseUrl = process.env.VITE_SUPABASE_URL;
    this.supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    this.scraperAPIKey = process.env.SCRAPER_API_KEY;
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    this.maxRetries = 2;
    this.requestDelay = 2000;
    this.timeout = 15000; // Reduced timeout
  }

  // Focused FBA URLs that are known to work
  getFBAUrls() {
    return [
      {
        site: 'QuietLight',
        urls: [
          'https://quietlight.com/amazon-fba-businesses-for-sale/',
          'https://quietlight.com/amazon-fba-businesses-for-sale/page/2/'
        ]
      },
      {
        site: 'EmpireFlippers', 
        urls: [
          'https://empireflippers.com/marketplace/?industry=amazon-fba',
          'https://empireflippers.com/marketplace/?business_model=fulfillment_by_amazon'
        ]
      },
      {
        site: 'Flippa',
        urls: [
          'https://flippa.com/buy/monetization/amazon-fba',
          'https://flippa.com/search?filter%5Bmonetization%5D%5B%5D=amazon-fba'
        ]
      },
      {
        site: 'BizBuySell',
        urls: [
          'https://www.bizbuysell.com/search/businesses-for-sale/?q=amazon+fba',
          'https://www.bizbuysell.com/search/businesses-for-sale/?q=fba+business'
        ]
      }
    ];
  }

  async scrapeUrl(url, timeout = this.timeout) {
    const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    
    // Try ScraperAPI first (most reliable)
    if (this.scraperAPIKey) {
      try {
        const scraperUrl = `http://api.scraperapi.com?api_key=${this.scraperAPIKey}&url=${encodeURIComponent(url)}&render=true&country_code=us`;
        const response = await fetch(scraperUrl, { 
          timeout,
          headers: { 'User-Agent': userAgent }
        });
        
        if (response.ok) {
          const content = await response.text();
          if (content.length > 1000) {
            return { success: true, content, method: 'scraperapi' };
          }
        }
      } catch (error) {
        console.log(`   ScraperAPI failed: ${error.message}`);
      }
    }

    // Fallback to direct fetch
    try {
      const response = await fetch(url, {
        timeout,
        headers: { 'User-Agent': userAgent }
      });
      
      if (response.ok) {
        const content = await response.text();
        return { success: true, content, method: 'direct' };
      }
    } catch (error) {
      console.log(`   Direct fetch failed: ${error.message}`);
    }

    return { success: false };
  }

  extractFeedListings(content, siteName) {
    const $ = cheerio.load(content);
    const listings = [];
    
    // Site-specific selectors for listing cards
    const siteSelectors = {
      'QuietLight': [
        '.listing-card, .listing-item, .business-card',
        'article[class*="listing"], article[class*="business"]',
        '[class*="listing-"] a, [class*="business-"] a'
      ],
      'EmpireFlippers': [
        '.listing-card, .marketplace-listing, .business-listing',
        '[data-listing], [data-business]',
        'article, .result-item'
      ],
      'Flippa': [
        '.flip-card, .listing-card, .auction-card',
        '[data-cy*="listing"], [data-testid*="listing"]',
        '.search-result, .auction-item'
      ],
      'BizBuySell': [
        '.result-item, .listing-item, .business-item',
        '.search-result, .business-card',
        'article, .listing-row'
      ]
    };

    const selectors = siteSelectors[siteName] || ['.listing-card', 'article', '.result-item'];
    
    // Try each selector until we find listings
    for (const selector of selectors) {
      $(selector).each((i, element) => {
        if (i >= 30) return false; // Limit per selector
        
        const $item = $(element);
        const listing = this.extractListingFromCard($item, siteName);
        
        if (listing && this.isValidFBAListing(listing)) {
          listings.push(listing);
        }
      });
      
      if (listings.length >= 10) break; // Stop if we found enough
    }

    return listings.slice(0, 20); // Limit results
  }

  extractListingFromCard($item, siteName) {
    const text = $item.text() || '';
    if (text.length < 30) return null;

    // Extract name/title
    let name = '';
    const titleSelectors = ['h1', 'h2', 'h3', '.title', '.business-name', '.listing-title', 'a[href*="listing"]'];
    
    for (const sel of titleSelectors) {
      const titleText = $item.find(sel).first().text().trim();
      if (titleText && titleText.length > 10 && titleText.length < 200 && !titleText.includes('$')) {
        name = titleText;
        break;
      }
    }

    // If no structured title, extract from text
    if (!name) {
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 15);
      name = lines.find(line => 
        !line.includes('$') && 
        line.length < 150 && 
        line.match(/[a-zA-Z].*[a-zA-Z]/)
      ) || '';
    }

    if (!name || name.length < 10) return null;

    // Extract prices
    const asking_price = this.extractPrice(text, ['asking', 'price', 'list', 'sale']);
    const annual_revenue = this.extractPrice(text, ['revenue', 'sales', 'annual', 'yearly']);
    const net_profit = this.extractPrice(text, ['profit', 'net', 'income', 'earnings']);

    // Get URL
    const url = $item.find('a').first().attr('href');
    const original_url = url ? this.normalizeUrl(url, siteName) : null;

    // Extract description/highlights
    const description = this.extractDescription($item);
    const highlights = this.extractHighlights($item, text);

    return {
      name: name.substring(0, 200),
      description: description,
      asking_price: asking_price || 0, // Default to 0 for required field
      annual_revenue: annual_revenue || 0, // Default to 0 for required field
      net_profit: net_profit,
      industry: 'Amazon FBA', // Force FBA since we're scraping FBA-specific pages
      location: this.extractLocation($item) || 'Online',
      source: siteName,
      original_url: original_url,
      highlights: highlights,
      status: 'active',
      scraped_at: new Date().toISOString()
    };
  }

  extractPrice(text, keywords) {
    // Look for prices in context of keywords
    const sentences = text.split(/[.!?\n]/).filter(s => s.length > 10);
    
    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      if (keywords.some(keyword => lowerSentence.includes(keyword))) {
        const priceMatch = sentence.match(/\$[\d,]+(?:\.\d{2})?[kmKM]?/);
        if (priceMatch) {
          return this.parsePrice(priceMatch[0]);
        }
      }
    }

    // Fallback: find any price in text
    const allPrices = text.match(/\$[\d,]+(?:\.\d{2})?[kmKM]?/g);
    if (allPrices && allPrices.length > 0) {
      return this.parsePrice(allPrices[0]);
    }

    return null;
  }

  parsePrice(priceText) {
    if (!priceText) return null;
    
    const cleanPrice = priceText.replace(/[^\d.,kmKM]/g, '');
    const numMatch = cleanPrice.match(/[\d.,]+/);
    if (!numMatch) return null;
    
    const num = parseFloat(numMatch[0].replace(/,/g, ''));
    if (isNaN(num)) return null;
    
    const lower = priceText.toLowerCase();
    let finalPrice;
    if (lower.includes('m') || lower.includes('million')) {
      finalPrice = Math.round(num * 1000000);
    } else if (lower.includes('k') || lower.includes('thousand')) {
      finalPrice = Math.round(num * 1000);
    } else {
      finalPrice = Math.round(num);
    }
    
    // Validate reasonable price range
    return (finalPrice >= 5000 && finalPrice <= 50000000) ? finalPrice : null;
  }

  extractDescription($item) {
    const descSelectors = ['.description', '.overview', '.summary', '.details', '.content', 'p'];
    
    for (const sel of descSelectors) {
      const desc = $item.find(sel).first().text().trim();
      if (desc && desc.length > 50 && desc.length < 1000) {
        return desc.substring(0, 800);
      }
    }
    
    // Fallback: get first paragraph-like text
    const text = $item.text();
    const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 30);
    return sentences.slice(0, 3).join('. ').substring(0, 800) || null;
  }

  extractLocation($item) {
    const locationSelectors = ['.location', '.city', '.state', '.country', '[class*="location"]'];
    
    for (const sel of locationSelectors) {
      const loc = $item.find(sel).first().text().trim();
      if (loc && loc.length > 2 && loc.length < 100) {
        return loc;
      }
    }
    return null;
  }

  extractHighlights($item, text) {
    const highlights = [];
    
    // Look for list items or highlighted features
    $item.find('li, .feature, .highlight, .benefit').each((i, el) => {
      if (i >= 8) return false;
      const highlight = $(el).text().trim();
      if (highlight && highlight.length > 10 && highlight.length < 200) {
        highlights.push(highlight);
      }
    });

    // If no structured highlights, extract key sentences
    if (highlights.length === 0) {
      const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 20);
      const fbaKeywords = ['amazon', 'fba', 'revenue', 'profit', 'growth', 'brand', 'products'];
      
      sentences.forEach(sentence => {
        if (highlights.length >= 5) return;
        const lower = sentence.toLowerCase();
        if (fbaKeywords.some(keyword => lower.includes(keyword))) {
          highlights.push(sentence.trim().substring(0, 150));
        }
      });
    }

    return highlights.slice(0, 8);
  }

  // More relaxed FBA validation since we're scraping FBA-specific pages
  isValidFBAListing(listing) {
    if (!listing.name || listing.name.length < 5) return false;
    
    // Since we're scraping FBA-specific URLs, most listings should be valid
    // Just do basic sanity checks
    if (listing.asking_price < 0 || listing.annual_revenue < 0) return false;
    
    return true; // Accept most listings from FBA-specific pages
  }

  normalizeUrl(url, source) {
    if (url.startsWith('http')) return url;
    
    const baseUrls = {
      'QuietLight': 'https://quietlight.com',
      'EmpireFlippers': 'https://empireflippers.com',
      'Flippa': 'https://flippa.com',
      'BizBuySell': 'https://www.bizbuysell.com'
    };
    
    return baseUrls[source] + url;
  }

  async saveListing(listing) {
    try {
      // Check for existing listing by name and source
      const { data: existing } = await this.supabase
        .from('business_listings')
        .select('id')
        .eq('name', listing.name)
        .eq('source', listing.source)
        .single();

      if (existing) {
        // Update existing with more details
        const { error: updateError } = await this.supabase
          .from('business_listings')
          .update(listing)
          .eq('id', existing.id);

        if (!updateError) {
          console.log(`   ✅ Updated: "${listing.name}"`);
          return true;
        } else {
          console.error(`❌ Update error: ${updateError.message}`);
        }
      } else {
        // Insert new listing
        const { error: insertError } = await this.supabase
          .from('business_listings')
          .insert(listing);

        if (!insertError) {
          console.log(`   ✅ Saved: "${listing.name}" - $${listing.asking_price?.toLocaleString() || 'N/A'}`);
          return true;
        } else {
          console.error(`❌ Insert error: ${insertError.message}`);
        }
      }
    } catch (err) {
      console.error(`❌ Database error: ${err.message}`);
    }
    
    return false;
  }

  async runProductionScraping() {
    console.log('🚀 PRODUCTION FBA SCRAPER - FAST & RELIABLE\n');
    
    const sites = this.getFBAUrls();
    let totalSaved = 0;
    let totalProcessed = 0;

    try {
      for (const site of sites) {
        console.log(`\n📍 Scraping ${site.site} - ${site.urls.length} FBA URLs`);
        
        for (const url of site.urls) {
          console.log(`🔍 Processing: ${url}`);
          
          const result = await this.scrapeUrl(url);
          if (result.success) {
            const listings = this.extractFeedListings(result.content, site.site);
            console.log(`   📋 Found ${listings.length} FBA listings`);
            
            // Save each listing
            for (const listing of listings) {
              totalProcessed++;
              const saved = await this.saveListing(listing);
              if (saved) totalSaved++;
            }
          } else {
            console.log(`   ❌ Failed to scrape ${url}`);
          }
          
          // Delay between requests
          await new Promise(resolve => setTimeout(resolve, this.requestDelay));
        }
      }

      console.log(`\n🎯 PRODUCTION SCRAPING COMPLETED!`);
      console.log(`📊 Total processed: ${totalProcessed}`);
      console.log(`💾 Total saved: ${totalSaved}`);

      // Show final stats
      const { data: stats } = await this.supabase
        .from('business_listings')
        .select('source, asking_price, annual_revenue')
        .eq('industry', 'Amazon FBA')
        .eq('status', 'active');

      if (stats && stats.length > 0) {
        console.log(`\n📈 TOTAL FBA LISTINGS IN DATABASE: ${stats.length}`);
        
        const sourceCounts = {};
        stats.forEach(item => {
          sourceCounts[item.source] = (sourceCounts[item.source] || 0) + 1;
        });
        
        console.log('\n📋 FBA Listings by Source:');
        Object.entries(sourceCounts).forEach(([source, count]) => {
          console.log(`  ${source}: ${count} listings`);
        });

        const avgPrice = stats.reduce((sum, item) => sum + (item.asking_price || 0), 0) / stats.length;
        console.log(`\n💰 Average FBA asking price: $${Math.round(avgPrice).toLocaleString()}`);
      }

    } catch (error) {
      console.error('❌ Production scraping failed:', error);
    }
  }
}

// Run production scraper
const scraper = new ProductionFBAScraper();
scraper.runProductionScraping().catch(console.error);