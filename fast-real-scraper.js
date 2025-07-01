#!/usr/bin/env node

// Fast focused scraper for maximum real listings
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

class FastRealScraper {
  constructor() {
    this.supabaseUrl = process.env.VITE_SUPABASE_URL;
    this.supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    this.scraperAPIKey = process.env.SCRAPER_API_KEY;
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }

  async scrapeWithScraperAPI(url, siteName) {
    console.log(`🌐 ${siteName}: ${url}`);
    
    try {
      const scraperUrl = `http://api.scraperapi.com?api_key=${this.scraperAPIKey}&url=${encodeURIComponent(url)}&render=true`;
      const response = await fetch(scraperUrl, { timeout: 45000 });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const content = await response.text();
      console.log(`   ✅ Retrieved ${content.length} chars`);
      return { success: true, content };
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      return { success: false };
    }
  }

  extractListingsFromHTML(content, source) {
    const $ = cheerio.load(content);
    const listings = [];
    
    // Find elements that likely contain business listings
    const candidates = [];
    
    // Collect potential listing elements
    $('div, article, section, li').each((i, element) => {
      const $el = $(element);
      const text = $el.text();
      
      // Must contain price and reasonable amount of text
      if (text.includes('$') && text.length > 50 && text.length < 2000) {
        const priceMatches = text.match(/\$[\d,]+[kKmM]?/g);
        if (priceMatches && priceMatches.length >= 1) {
          candidates.push({ element: $el, text, priceMatches });
        }
      }
    });
    
    console.log(`   🔍 Found ${candidates.length} candidate elements`);
    
    // Process candidates to extract listings
    for (const candidate of candidates.slice(0, 100)) { // Limit processing
      const listing = this.extractListingFromCandidate(candidate, source);
      if (listing) {
        listings.push(listing);
      }
    }
    
    return this.deduplicateByName(listings);
  }

  extractListingFromCandidate(candidate, source) {
    const { element, text, priceMatches } = candidate;
    
    // Extract potential business name
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    // Find the best name candidate
    let bestName = '';
    for (const line of lines) {
      if (line.length > 15 && line.length < 150 && 
          !line.includes('$') && 
          !line.toLowerCase().includes('click') &&
          !line.toLowerCase().includes('view') &&
          line.match(/[a-zA-Z].*[a-zA-Z]/)) {
        bestName = line;
        break;
      }
    }
    
    // If no good name found, try element titles/headings
    if (!bestName) {
      const titleText = element.find('h1, h2, h3, h4, .title, [class*="title"]').first().text().trim();
      if (titleText && titleText.length > 10 && titleText.length < 150) {
        bestName = titleText;
      }
    }
    
    if (!bestName || bestName.length < 10) return null;
    
    // Get the best price (usually the largest meaningful number)
    const prices = priceMatches.map(p => this.parsePrice(p)).filter(p => p && p > 1000);
    const askingPrice = prices.length > 0 ? Math.max(...prices) : null;
    
    // Look for revenue indicators
    let revenue = null;
    const revenueKeywords = ['revenue', 'profit', 'monthly', 'annual', 'income'];
    for (const keyword of revenueKeywords) {
      const regex = new RegExp(`${keyword}[^$]*\\$[\\d,]+[kKmM]?`, 'i');
      const match = text.match(regex);
      if (match) {
        const priceInMatch = match[0].match(/\$[\d,]+[kKmM]?/);
        if (priceInMatch) {
          revenue = this.parsePrice(priceInMatch[0]);
          break;
        }
      }
    }
    
    // Determine industry
    const industry = this.determineIndustry(bestName + ' ' + text);
    
    // Get URL if available
    const url = element.find('a').first().attr('href');
    const fullUrl = url ? this.normalizeUrl(url, source) : null;
    
    return {
      name: bestName.substring(0, 200),
      asking_price: askingPrice,
      annual_revenue: revenue || 0,
      industry: industry,
      location: industry.includes('Online') || industry.includes('Digital') ? 'Online' : 'Not specified',
      source: source,
      highlights: priceMatches.slice(0, 3),
      original_url: fullUrl,
      status: 'active',
      description: null
    };
  }

  determineIndustry(text) {
    const lower = text.toLowerCase();
    if (lower.includes('amazon') || lower.includes('fba')) return 'Amazon FBA';
    if (lower.includes('saas') || lower.includes('software')) return 'SaaS';
    if (lower.includes('ecommerce') || lower.includes('e-commerce') || lower.includes('store')) return 'E-commerce';
    if (lower.includes('content') || lower.includes('blog') || lower.includes('affiliate')) return 'Content/Affiliate';
    if (lower.includes('app') || lower.includes('mobile')) return 'Mobile App';
    if (lower.includes('restaurant') || lower.includes('food')) return 'Restaurant';
    if (lower.includes('manufacturing')) return 'Manufacturing';
    if (lower.includes('service')) return 'Service Business';
    if (lower.includes('website') || lower.includes('online') || lower.includes('digital')) return 'Digital Business';
    return 'Business for Sale';
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
    
    return baseUrls[source] ? baseUrls[source] + url : url;
  }

  parsePrice(priceText) {
    if (!priceText) return null;
    
    const cleanPrice = priceText.replace(/[^\d.,kmKM]/g, '');
    const match = cleanPrice.match(/[\d.,]+/);
    if (!match) return null;
    
    const numericValue = parseFloat(match[0].replace(/,/g, ''));
    if (isNaN(numericValue) || numericValue === 0) return null;
    
    const lowerText = priceText.toLowerCase();
    if (lowerText.includes('m') || lowerText.includes('million')) {
      return Math.round(numericValue * 1000000);
    } else if (lowerText.includes('k') || lowerText.includes('thousand')) {
      return Math.round(numericValue * 1000);
    }
    
    return Math.round(numericValue);
  }

  deduplicateByName(listings) {
    const seen = new Set();
    return listings.filter(listing => {
      const key = listing.name.toLowerCase().substring(0, 50);
      if (seen.has(key)) return false;
      seen.add(key);
      return listing.name.length > 10;
    });
  }

  async saveListings(listings) {
    if (listings.length === 0) return { saved: 0, errors: 0 };

    console.log(`💾 Saving ${listings.length} listings...`);
    
    let saved = 0;
    let errors = 0;

    for (const listing of listings) {
      try {
        // Quick duplicate check
        const { data: existing } = await this.supabase
          .from('business_listings')
          .select('id')
          .eq('name', listing.name)
          .eq('source', listing.source)
          .limit(1);

        if (existing && existing.length > 0) continue;

        const { error } = await this.supabase
          .from('business_listings')
          .insert(listing);

        if (error) {
          errors++;
        } else {
          saved++;
          if (saved <= 10) {
            console.log(`   ✅ ${saved}. "${listing.name}" - $${listing.asking_price?.toLocaleString() || 'N/A'}`);
          }
        }
      } catch (err) {
        errors++;
      }
    }

    return { saved, errors };
  }

  async scrapeMultipleSites() {
    console.log('🚀 FAST REAL DATA SCRAPING\n');
    
    // High-value sites and URLs
    const targets = [
      { url: 'https://empireflippers.com/marketplace/', source: 'EmpireFlippers' },
      { url: 'https://empireflippers.com/marketplace/?industry=amazon-fba', source: 'EmpireFlippers' },
      { url: 'https://empireflippers.com/marketplace/?industry=content', source: 'EmpireFlippers' },
      { url: 'https://empireflippers.com/marketplace/?industry=ecommerce', source: 'EmpireFlippers' },
      { url: 'https://empireflippers.com/marketplace/?industry=saas', source: 'EmpireFlippers' },
      { url: 'https://flippa.com/search?filter%5Bproperty_type%5D%5B%5D=website', source: 'Flippa' },
      { url: 'https://flippa.com/search?filter%5Bproperty_type%5D%5B%5D=app', source: 'Flippa' },
      { url: 'https://www.bizbuysell.com/businesses-for-sale/', source: 'BizBuySell' }
    ];
    
    const allListings = [];
    
    for (const target of targets) {
      console.log(`\n📍 ${target.source.toUpperCase()}`);
      
      const result = await this.scrapeWithScraperAPI(target.url, target.source);
      
      if (result.success) {
        const listings = this.extractListingsFromHTML(result.content, target.source);
        console.log(`   📋 Extracted: ${listings.length} listings`);
        allListings.push(...listings);
        
        // Save immediately to prevent loss
        if (listings.length > 0) {
          const saveResult = await this.saveListings(listings);
          console.log(`   💾 Saved: ${saveResult.saved}, Errors: ${saveResult.errors}`);
        }
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log(`\n📊 TOTAL EXTRACTED: ${allListings.length} listings`);
    
    // Final database stats
    const { data: stats } = await this.supabase
      .from('business_listings')
      .select('source')
      .eq('status', 'active');
    
    if (stats) {
      const sourceCounts = {};
      stats.forEach(item => {
        sourceCounts[item.source] = (sourceCounts[item.source] || 0) + 1;
      });
      
      console.log('\n📈 CURRENT DATABASE TOTALS:');
      Object.entries(sourceCounts)
        .sort(([,a], [,b]) => b - a)
        .forEach(([source, count]) => {
          console.log(`  ${source}: ${count} listings`);
        });
      
      const total = Object.values(sourceCounts).reduce((sum, count) => sum + count, 0);
      console.log(`\n🎯 TOTAL LISTINGS: ${total}`);
    }
  }
}

const scraper = new FastRealScraper();
scraper.scrapeMultipleSites().catch(console.error);