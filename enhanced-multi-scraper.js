#!/usr/bin/env node

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchWithScraperAPI(url, options = {}) {
  const scraperApiUrl = new URL('https://api.scraperapi.com/');
  scraperApiUrl.searchParams.append('api_key', SCRAPER_API_KEY);
  scraperApiUrl.searchParams.append('url', url);
  scraperApiUrl.searchParams.append('render', 'true');
  scraperApiUrl.searchParams.append('country_code', 'us');
  
  if (options.premium) {
    scraperApiUrl.searchParams.append('premium', 'true');
  }
  if (options.ultra) {
    scraperApiUrl.searchParams.append('ultra_premium', 'true');
  }
  
  console.log(`📡 Fetching: ${url} ${options.premium ? '(premium)' : ''}`);
  
  const response = await fetch(scraperApiUrl.toString());
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const html = await response.text();
  console.log(`✅ Retrieved ${html.length} characters`);
  return html;
}

function extractPrice(text) {
  if (!text) return 0;
  const cleaned = text.replace(/[^0-9.,]/g, '');
  if (text.toLowerCase().includes('m') || text.toLowerCase().includes('million')) {
    return Math.round(parseFloat(cleaned) * 1000000);
  }
  if (text.toLowerCase().includes('k')) {
    return Math.round(parseFloat(cleaned) * 1000);
  }
  return Math.round(parseFloat(cleaned)) || 0;
}

function cleanText(text) {
  return text ? text.trim().replace(/\s+/g, ' ').substring(0, 500) : '';
}

// Enhanced QuietLight scraper
async function scrapeQuietLight() {
  console.log('\n🔄 Scraping QuietLight...');
  
  try {
    const html = await fetchWithScraperAPI('https://quietlight.com/listings/');
    const $ = cheerio.load(html);
    const listings = [];
    
    $('.listing-card').each((i, element) => {
      if (i >= 15) return false; // Get more listings
      
      const $el = $(element);
      const name = cleanText($el.find('.listing-card__title').text());
      const priceText = cleanText($el.find('.listing-card__price, .price').text());
      const href = $el.find('a').attr('href');
      
      if (name && href && name.length > 10) {
        const fullUrl = href.startsWith('http') ? href : `https://quietlight.com${href}`;
        
        listings.push({
          name,
          description: name,
          asking_price: extractPrice(priceText),
          annual_revenue: 0,
          industry: 'Online Business',
          location: 'United States',
          source: 'QuietLight',
          original_url: fullUrl
        });
      }
    });
    
    console.log(`✅ Found ${listings.length} QuietLight listings`);
    return listings;
    
  } catch (error) {
    console.error(`❌ QuietLight error: ${error.message}`);
    return [];
  }
}

// Try Flippa with different approaches
async function scrapeFlippa() {
  console.log('\n🔄 Scraping Flippa...');
  
  const urls = [
    'https://flippa.com/search',
    'https://flippa.com/browse',
    'https://flippa.com/marketplace'
  ];
  
  for (const url of urls) {
    try {
      console.log(`Trying Flippa URL: ${url}`);
      const html = await fetchWithScraperAPI(url, { premium: true });
      const $ = cheerio.load(html);
      const listings = [];
      
      // Try multiple Flippa-specific selectors
      const selectors = [
        '[data-cy*="listing"]',
        '[data-testid*="listing"]',
        '.flip-card',
        '.search-result',
        '.listing-item'
      ];
      
      for (const selector of selectors) {
        $(selector).each((i, element) => {
          if (i >= 10) return false;
          
          const $el = $(element);
          const name = cleanText($el.find('h3, h4, .title').first().text());
          const priceText = cleanText($el.find('[class*="price"], .price').first().text());
          const href = $el.find('a').first().attr('href');
          
          if (name && href && name.length > 10) {
            const fullUrl = href.startsWith('http') ? href : `https://flippa.com${href}`;
            
            if (!listings.find(l => l.name === name)) {
              listings.push({
                name,
                description: name,
                asking_price: extractPrice(priceText),
                annual_revenue: 0,
                industry: 'Digital Asset',
                location: 'Remote',
                source: 'Flippa',
                original_url: fullUrl
              });
            }
          }
        });
        
        if (listings.length > 0) break;
      }
      
      if (listings.length > 0) {
        console.log(`✅ Found ${listings.length} Flippa listings`);
        return listings;
      }
      
    } catch (error) {
      console.log(`Failed ${url}: ${error.message}`);
    }
  }
  
  console.log('❌ No Flippa listings found');
  return [];
}

// Try Acquire with multiple URLs
async function scrapeAcquire() {
  console.log('\n🔄 Scraping Acquire...');
  
  const urls = [
    'https://acquire.com',
    'https://acquire.com/marketplace',
    'https://acquire.com/browse'
  ];
  
  for (const url of urls) {
    try {
      console.log(`Trying Acquire URL: ${url}`);
      const html = await fetchWithScraperAPI(url, { ultra: true });
      const $ = cheerio.load(html);
      const listings = [];
      
      const selectors = [
        '.startup-card',
        '.company-card',
        '.acquisition-card',
        '[class*="card"]'
      ];
      
      for (const selector of selectors) {
        $(selector).each((i, element) => {
          if (i >= 8) return false;
          
          const $el = $(element);
          const name = cleanText($el.find('h3, h4, .name, .title').first().text());
          const priceText = cleanText($el.find('.price, .valuation').first().text());
          const href = $el.find('a').first().attr('href');
          
          if (name && href && name.length > 10) {
            const fullUrl = href.startsWith('http') ? href : `https://acquire.com${href}`;
            
            listings.push({
              name,
              description: name,
              asking_price: extractPrice(priceText),
              annual_revenue: 0,
              industry: 'Startup',
              location: 'Remote',
              source: 'Acquire',
              original_url: fullUrl
            });
          }
        });
        
        if (listings.length > 0) break;
      }
      
      if (listings.length > 0) {
        console.log(`✅ Found ${listings.length} Acquire listings`);
        return listings;
      }
      
    } catch (error) {
      console.log(`Failed ${url}: ${error.message}`);
    }
  }
  
  console.log('❌ No Acquire listings found');
  return [];
}

// Try MicroAcquire
async function scrapeMicroAcquire() {
  console.log('\n🔄 Scraping MicroAcquire...');
  
  const urls = [
    'https://microacquire.com',
    'https://microacquire.com/startups',
    'https://microacquire.com/browse'
  ];
  
  for (const url of urls) {
    try {
      console.log(`Trying MicroAcquire URL: ${url}`);
      const html = await fetchWithScraperAPI(url, { premium: true });
      const $ = cheerio.load(html);
      const listings = [];
      
      const selectors = [
        '.startup-card',
        '.project-card',
        '[data-testid*="startup"]',
        '.card'
      ];
      
      for (const selector of selectors) {
        $(selector).each((i, element) => {
          if (i >= 8) return false;
          
          const $el = $(element);
          const name = cleanText($el.find('h3, h4, .name, .title').first().text());
          const priceText = cleanText($el.find('.price, .asking').first().text());
          const href = $el.find('a').first().attr('href');
          
          if (name && href && name.length > 5) {
            const fullUrl = href.startsWith('http') ? href : `https://microacquire.com${href}`;
            
            listings.push({
              name,
              description: name,
              asking_price: extractPrice(priceText),
              annual_revenue: 0,
              industry: 'Micro SaaS',
              location: 'Remote',
              source: 'MicroAcquire',
              original_url: fullUrl
            });
          }
        });
        
        if (listings.length > 0) break;
      }
      
      if (listings.length > 0) {
        console.log(`✅ Found ${listings.length} MicroAcquire listings`);
        return listings;
      }
      
    } catch (error) {
      console.log(`Failed ${url}: ${error.message}`);
    }
  }
  
  console.log('❌ No MicroAcquire listings found');
  return [];
}

function isAmazonFBABusiness(listing) {
  const keywords = [
    'amazon fba', 'fulfillment by amazon', 'amazon seller',
    'fba business', 'amazon store', 'private label',
    'product sourcing', 'amazon marketplace', 'amazon brand',
    'wholesale to amazon', 'retail arbitrage', 'online arbitrage'
  ];
  const text = `${listing.name || ''} ${listing.description || ''}`.toLowerCase();
  return keywords.some(keyword => text.includes(keyword)) || listing.industry === 'Amazon FBA';
}

async function saveToDatabase(listings) {
  if (listings.length === 0) return 0;
  
  try {
    // Filter for Amazon FBA businesses only
    const amazonFBAListings = listings.filter(listing => isAmazonFBABusiness(listing));
    console.log(`🔍 Filtered to ${amazonFBAListings.length} Amazon FBA listings out of ${listings.length} total`);
    
    if (amazonFBAListings.length === 0) {
      console.log('⚠️ No Amazon FBA listings found to save');
      return 0;
    }
    
    console.log(`💾 Saving ${amazonFBAListings.length} Amazon FBA listings to database...`);
    
    // Check for existing listings to avoid duplicates
    const uniqueListings = [];
    for (const listing of amazonFBAListings) {
      const { data: existing } = await supabase
        .from('business_listings')
        .select('id')
        .eq('original_url', listing.original_url)
        .single();
      
      if (!existing) {
        uniqueListings.push(listing);
      }
    }
    
    if (uniqueListings.length === 0) {
      console.log('⚠️ All Amazon FBA listings already exist in database');
      return 0;
    }
    
    const { data, error } = await supabase
      .from('business_listings')
      .insert(uniqueListings)
      .select();
    
    if (error) {
      console.error('❌ Database error:', error);
      return 0;
    }
    
    const savedCount = data?.length || 0;
    console.log(`✅ Saved ${savedCount} new Amazon FBA listings`);
    return savedCount;
    
  } catch (error) {
    console.error('❌ Save error:', error);
    return 0;
  }
}

async function main() {
  console.log('🚀 Enhanced multi-site scraping with ScraperAPI...');
  
  if (!SCRAPER_API_KEY) {
    console.error('❌ SCRAPER_API_KEY not found');
    return;
  }
  
  const allListings = [];
  
  // Run all scrapers
  const scrapers = [
    { name: 'QuietLight', func: scrapeQuietLight },
    { name: 'Flippa', func: scrapeFlippa },
    { name: 'Acquire', func: scrapeAcquire },
    { name: 'MicroAcquire', func: scrapeMicroAcquire }
  ];
  
  for (const scraper of scrapers) {
    try {
      const listings = await scraper.func();
      if (listings.length > 0) {
        allListings.push(...listings);
        console.log(`📋 ${scraper.name}: ${listings.length} listings`);
        
        // Show first listing as example
        const sample = listings[0];
        console.log(`   Sample: ${sample.name} - $${sample.asking_price.toLocaleString()}`);
        console.log(`   URL: ${sample.original_url}`);
      }
      
      // Wait between scrapers
      console.log('⏱️ Waiting 15 seconds...');
      await new Promise(resolve => setTimeout(resolve, 15000));
      
    } catch (error) {
      console.error(`❌ ${scraper.name} failed: ${error.message}`);
    }
  }
  
  // Save all listings
  const savedCount = await saveToDatabase(allListings);
  
  console.log('\n📊 Final Results:');
  console.log(`Total found: ${allListings.length}`);
  console.log(`New saved: ${savedCount}`);
  
  // Show final database stats
  try {
    const { data: stats } = await supabase
      .from('business_listings')
      .select('source')
      .not('source', 'is', null);
    
    const sourceStats = {};
    stats?.forEach(item => {
      sourceStats[item.source] = (sourceStats[item.source] || 0) + 1;
    });
    
    console.log('\n📈 Database totals:');
    Object.entries(sourceStats).forEach(([source, count]) => {
      console.log(`   ${source}: ${count} listings`);
    });
    
  } catch (error) {
    console.error('Error getting stats:', error);
  }
}

main().catch(console.error);