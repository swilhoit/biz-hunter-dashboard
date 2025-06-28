#!/usr/bin/env node

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

// Configuration
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ScraperAPI fetch function
async function fetchPageWithScraperAPI(url) {
  if (!SCRAPER_API_KEY) {
    throw new Error('SCRAPER_API_KEY not configured');
  }

  const scraperApiUrl = new URL('https://api.scraperapi.com/');
  scraperApiUrl.searchParams.append('api_key', SCRAPER_API_KEY);
  scraperApiUrl.searchParams.append('url', url);
  scraperApiUrl.searchParams.append('render', 'true'); // Enable JS rendering for modern sites
  scraperApiUrl.searchParams.append('country_code', 'us');
  scraperApiUrl.searchParams.append('premium', 'true'); // Use premium for better success rate
  
  console.log(`📡 Fetching via ScraperAPI: ${url}`);
  
  try {
    const response = await fetch(scraperApiUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    console.log(`✅ Successfully fetched ${html.length} characters`);
    return html;
    
  } catch (error) {
    console.error(`❌ ScraperAPI error: ${error.message}`);
    throw error;
  }
}

// Utility functions
function extractPrice(priceText) {
  if (!priceText) return 0;
  
  const cleaned = priceText.replace(/[^0-9.,]/g, '');
  
  if (priceText.toLowerCase().includes('m') || priceText.toLowerCase().includes('million')) {
    return Math.round(parseFloat(cleaned) * 1000000);
  }
  
  if (priceText.toLowerCase().includes('k')) {
    return Math.round(parseFloat(cleaned) * 1000);
  }
  
  return Math.round(parseFloat(cleaned)) || 0;
}

function cleanText(text) {
  return text ? text.trim().replace(/\s+/g, ' ') : '';
}

// QuietLight Scraper
async function scrapeQuietLight() {
  console.log('\n🔄 Scraping QuietLight...');
  
  try {
    const url = 'https://quietlight.com/listings/';
    const html = await fetchPageWithScraperAPI(url);
    const $ = cheerio.load(html);
    const listings = [];
    
    // QuietLight uses listing-card class
    $('.listing-card').each((i, element) => {
      const $el = $(element);
      
      const name = cleanText($el.find('.listing-card__title').text());
      const priceText = cleanText($el.find('.listing-card__price, .price').text());
      const description = cleanText($el.find('.listing-card__description, .description').text()) || name;
      const link = $el.find('a').attr('href');
      
      if (name && link) {
        const fullUrl = link.startsWith('http') ? link : `https://quietlight.com${link}`;
        
        listings.push({
          name,
          description,
          asking_price: extractPrice(priceText),
          annual_revenue: 0, // Would need individual listing pages
          industry: 'Online Business',
          location: 'United States',
          source: 'QuietLight',
          original_url: fullUrl
        });
      }
    });
    
    console.log(`✅ Found ${listings.length} listings from QuietLight`);
    return listings;
    
  } catch (error) {
    console.error(`❌ QuietLight scraper error: ${error.message}`);
    return [];
  }
}

// Flippa Scraper
async function scrapeFlippa() {
  console.log('\n🔄 Scraping Flippa...');
  
  try {
    const url = 'https://flippa.com/search?filter%5Btype%5D=business';
    const html = await fetchPageWithScraperAPI(url);
    const $ = cheerio.load(html);
    const listings = [];
    
    // Flippa uses various selectors - try multiple approaches
    const selectors = [
      '[data-testid*="listing"]',
      '.listing-card',
      '[class*="Listing__"]',
      '.search-result'
    ];
    
    for (const selector of selectors) {
      $(selector).each((i, element) => {
        const $el = $(element);
        
        const name = cleanText($el.find('h3, h4, .title, [class*="title"]').first().text());
        const priceText = cleanText($el.find('[class*="price"], .price').text());
        const revenueText = cleanText($el.find('[class*="revenue"], .revenue').text());
        const link = $el.find('a').attr('href') || $el.closest('a').attr('href');
        
        if (name && link && !listings.find(l => l.name === name)) {
          const fullUrl = link.startsWith('http') ? link : `https://flippa.com${link}`;
          
          listings.push({
            name,
            description: name,
            asking_price: extractPrice(priceText),
            annual_revenue: extractPrice(revenueText),
            industry: 'Digital Asset',
            location: 'Remote',
            source: 'Flippa',
            original_url: fullUrl
          });
        }
      });
      
      if (listings.length > 0) break; // Stop when we find listings
    }
    
    console.log(`✅ Found ${listings.length} listings from Flippa`);
    return listings;
    
  } catch (error) {
    console.error(`❌ Flippa scraper error: ${error.message}`);
    return [];
  }
}

// Acquire Scraper
async function scrapeAcquire() {
  console.log('\n🔄 Scraping Acquire...');
  
  try {
    const url = 'https://acquire.com/startups';
    const html = await fetchPageWithScraperAPI(url);
    const $ = cheerio.load(html);
    const listings = [];
    
    // Acquire uses card-based layout
    const selectors = [
      '.startup-card',
      '.company-card',
      '[class*="card"]',
      '.listing'
    ];
    
    for (const selector of selectors) {
      $(selector).each((i, element) => {
        const $el = $(element);
        
        const name = cleanText($el.find('h3, h4, .name, .title').first().text());
        const priceText = cleanText($el.find('.price, .valuation, [class*="price"]').text());
        const revenueText = cleanText($el.find('.revenue, .mrr, [class*="revenue"]').text());
        const description = cleanText($el.find('.description, .summary').text()) || name;
        const link = $el.find('a').attr('href') || $el.closest('a').attr('href');
        
        if (name && link && !listings.find(l => l.name === name)) {
          const fullUrl = link.startsWith('http') ? link : `https://acquire.com${link}`;
          
          listings.push({
            name,
            description,
            asking_price: extractPrice(priceText),
            annual_revenue: extractPrice(revenueText),
            industry: 'Startup',
            location: 'Remote',
            source: 'Acquire',
            original_url: fullUrl
          });
        }
      });
      
      if (listings.length > 0) break;
    }
    
    console.log(`✅ Found ${listings.length} listings from Acquire`);
    return listings;
    
  } catch (error) {
    console.error(`❌ Acquire scraper error: ${error.message}`);
    return [];
  }
}

// BizQuest Scraper
async function scrapeBizQuest() {
  console.log('\n🔄 Scraping BizQuest...');
  
  try {
    const url = 'https://www.bizquest.com/buy-a-business/';
    const html = await fetchPageWithScraperAPI(url);
    const $ = cheerio.load(html);
    const listings = [];
    
    // BizQuest uses result-based classes
    const selectors = [
      '.bizResult',
      '.result-item',
      '.listing-item',
      '[class*="result"]'
    ];
    
    for (const selector of selectors) {
      $(selector).each((i, element) => {
        const $el = $(element);
        
        const name = cleanText($el.find('h3, .title, .name').first().text());
        const priceText = cleanText($el.find('.price, [class*="price"]').text());
        const location = cleanText($el.find('.location, [class*="location"]').text());
        const description = cleanText($el.find('.description').text()) || name;
        const link = $el.find('a').attr('href');
        
        if (name && link && !listings.find(l => l.name === name)) {
          const fullUrl = link.startsWith('http') ? link : `https://www.bizquest.com${link}`;
          
          listings.push({
            name,
            description,
            asking_price: extractPrice(priceText),
            annual_revenue: 0, // BizQuest doesn't show revenue upfront
            industry: 'Business',
            location: location || 'United States',
            source: 'BizQuest',
            original_url: fullUrl
          });
        }
      });
      
      if (listings.length > 0) break;
    }
    
    console.log(`✅ Found ${listings.length} listings from BizQuest`);
    return listings;
    
  } catch (error) {
    console.error(`❌ BizQuest scraper error: ${error.message}`);
    return [];
  }
}

// MicroAcquire Scraper
async function scrapeMicroAcquire() {
  console.log('\n🔄 Scraping MicroAcquire...');
  
  try {
    const url = 'https://microacquire.com/startups';
    const html = await fetchPageWithScraperAPI(url);
    const $ = cheerio.load(html);
    const listings = [];
    
    // MicroAcquire uses startup-card or similar
    const selectors = [
      '.startup-card',
      '.project-card',
      '[class*="card"]',
      '.listing'
    ];
    
    for (const selector of selectors) {
      $(selector).each((i, element) => {
        const $el = $(element);
        
        const name = cleanText($el.find('h3, h4, .name, .title').first().text());
        const priceText = cleanText($el.find('.price, .asking, [class*="price"]').text());
        const revenueText = cleanText($el.find('.revenue, .mrr, [class*="revenue"]').text());
        const description = cleanText($el.find('.description, .summary').text()) || name;
        const link = $el.find('a').attr('href') || $el.closest('a').attr('href');
        
        if (name && link && !listings.find(l => l.name === name)) {
          const fullUrl = link.startsWith('http') ? link : `https://microacquire.com${link}`;
          
          listings.push({
            name,
            description,
            asking_price: extractPrice(priceText),
            annual_revenue: extractPrice(revenueText),
            industry: 'Micro SaaS',
            location: 'Remote',
            source: 'MicroAcquire',
            original_url: fullUrl
          });
        }
      });
      
      if (listings.length > 0) break;
    }
    
    console.log(`✅ Found ${listings.length} listings from MicroAcquire`);
    return listings;
    
  } catch (error) {
    console.error(`❌ MicroAcquire scraper error: ${error.message}`);
    return [];
  }
}

// Save listings to database
async function saveListingsToDatabase(listings) {
  if (listings.length === 0) {
    console.log('⚠️ No listings to save');
    return 0;
  }
  
  try {
    console.log(`💾 Saving ${listings.length} listings to database...`);
    
    const { data, error } = await supabase
      .from('business_listings')
      .insert(listings)
      .select();
    
    if (error) {
      console.error('❌ Database error:', error);
      return 0;
    }
    
    const savedCount = data?.length || 0;
    console.log(`✅ Successfully saved ${savedCount} listings`);
    return savedCount;
    
  } catch (error) {
    console.error('❌ Error saving to database:', error);
    return 0;
  }
}

// Main function
async function scrapeAllSites() {
  console.log('🚀 Starting ScraperAPI-based scraping for all sites...');
  
  if (!SCRAPER_API_KEY) {
    console.error('❌ SCRAPER_API_KEY not found in environment variables');
    return;
  }
  
  const allListings = [];
  
  // Run all scrapers
  const scrapers = [
    { name: 'QuietLight', func: scrapeQuietLight },
    { name: 'Flippa', func: scrapeFlippa },
    { name: 'Acquire', func: scrapeAcquire },
    { name: 'BizQuest', func: scrapeBizQuest },
    { name: 'MicroAcquire', func: scrapeMicroAcquire }
  ];
  
  for (const scraper of scrapers) {
    try {
      const listings = await scraper.func();
      allListings.push(...listings);
      
      // Add delay between scrapers to be respectful
      console.log('⏱️ Waiting 5 seconds before next scraper...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } catch (error) {
      console.error(`❌ Failed to scrape ${scraper.name}: ${error.message}`);
    }
  }
  
  // Save all listings
  const savedCount = await saveListingsToDatabase(allListings);
  
  // Show results
  console.log('\n📊 Scraping Summary:');
  console.log(`Total listings found: ${allListings.length}`);
  console.log(`Successfully saved: ${savedCount}`);
  
  if (savedCount > 0) {
    console.log('\n📋 Sample listings:');
    allListings.slice(0, 3).forEach((listing, i) => {
      console.log(`\n${i + 1}. ${listing.name}`);
      console.log(`   Source: ${listing.source}`);
      console.log(`   Price: $${listing.asking_price.toLocaleString()}`);
      console.log(`   URL: ${listing.original_url}`);
    });
  }
}

// Run the scraper
scrapeAllSites().catch(console.error);