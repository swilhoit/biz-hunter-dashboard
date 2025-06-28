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

// Working URLs found through testing
const workingSites = {
  'QuietLight': 'https://quietlight.com/listings/',
  'Flippa': 'https://flippa.com/', // Try main page
  'BizQuest': 'https://www.bizquest.com/', // Try main page first
};

async function fetchPageWithScraperAPI(url, usePremium = false) {
  const scraperApiUrl = new URL('https://api.scraperapi.com/');
  scraperApiUrl.searchParams.append('api_key', SCRAPER_API_KEY);
  scraperApiUrl.searchParams.append('url', url);
  scraperApiUrl.searchParams.append('render', 'true');
  scraperApiUrl.searchParams.append('country_code', 'us');
  
  if (usePremium) {
    scraperApiUrl.searchParams.append('premium', 'true');
  }
  
  console.log(`📡 Fetching: ${url}`);
  
  const response = await fetch(scraperApiUrl.toString());
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const html = await response.text();
  console.log(`✅ Retrieved ${html.length} characters`);
  return html;
}

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

async function scrapeQuietLight() {
  console.log('\n🔄 Scraping QuietLight (confirmed working)...');
  
  try {
    const html = await fetchPageWithScraperAPI(workingSites.QuietLight);
    const $ = cheerio.load(html);
    const listings = [];
    
    // Based on our test, QuietLight has listing elements
    $('.listing-card').each((i, element) => {
      if (i >= 10) return false; // Limit to first 10 for now
      
      const $el = $(element);
      
      const titleEl = $el.find('.listing-card__title, h3, h4');
      const priceEl = $el.find('.listing-card__price, .price, [class*="price"]');
      const linkEl = $el.find('a');
      
      const name = cleanText(titleEl.first().text());
      const priceText = cleanText(priceEl.first().text());
      const href = linkEl.attr('href');
      
      if (name && href) {
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
        
        console.log(`Found: ${name} - ${priceText} - ${fullUrl}`);
      }
    });
    
    console.log(`✅ Extracted ${listings.length} listings from QuietLight`);
    return listings;
    
  } catch (error) {
    console.error(`❌ QuietLight error: ${error.message}`);
    return [];
  }
}

async function scrapeFlippa() {
  console.log('\n🔄 Scraping Flippa...');
  
  try {
    // Try multiple Flippa URLs
    const urls = [
      'https://flippa.com/',
      'https://flippa.com/websites',
      'https://flippa.com/businesses'
    ];
    
    for (const url of urls) {
      try {
        console.log(`Trying: ${url}`);
        const html = await fetchPageWithScraperAPI(url, true); // Use premium
        const $ = cheerio.load(html);
        const listings = [];
        
        // Look for any potential listing elements
        const selectors = [
          '[data-testid*="listing"]',
          '.listing-card',
          '[class*="Listing"]',
          '.card',
          'article'
        ];
        
        for (const selector of selectors) {
          $(selector).each((i, element) => {
            if (i >= 5) return false; // Limit
            
            const $el = $(element);
            const titleEl = $el.find('h3, h4, .title, [class*="title"]');
            const priceEl = $el.find('[class*="price"], .price');
            const linkEl = $el.find('a').first();
            
            const name = cleanText(titleEl.first().text());
            const priceText = cleanText(priceEl.first().text());
            const href = linkEl.attr('href');
            
            if (name && name.length > 10 && href) { // Filter out short/empty names
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
                
                console.log(`Found: ${name} - ${priceText} - ${fullUrl}`);
              }
            }
          });
          
          if (listings.length > 0) break;
        }
        
        if (listings.length > 0) {
          console.log(`✅ Extracted ${listings.length} listings from Flippa`);
          return listings;
        }
        
      } catch (error) {
        console.log(`Failed URL ${url}: ${error.message}`);
      }
    }
    
    console.log('❌ No working Flippa URLs found');
    return [];
    
  } catch (error) {
    console.error(`❌ Flippa error: ${error.message}`);
    return [];
  }
}

async function scrapeBizQuest() {
  console.log('\n🔄 Scraping BizQuest...');
  
  try {
    const html = await fetchPageWithScraperAPI(workingSites.BizQuest, true);
    const $ = cheerio.load(html);
    const listings = [];
    
    // Look for business listing patterns
    const selectors = [
      '.business-listing',
      '.listing-item',
      '.bizResult',
      '[class*="result"]',
      '.card'
    ];
    
    for (const selector of selectors) {
      $(selector).each((i, element) => {
        if (i >= 5) return false;
        
        const $el = $(element);
        const titleEl = $el.find('h3, h4, .title, .name');
        const priceEl = $el.find('.price, [class*="price"]');
        const locationEl = $el.find('.location, [class*="location"]');
        const linkEl = $el.find('a').first();
        
        const name = cleanText(titleEl.first().text());
        const priceText = cleanText(priceEl.first().text());
        const location = cleanText(locationEl.first().text());
        const href = linkEl.attr('href');
        
        if (name && name.length > 10 && href) {
          const fullUrl = href.startsWith('http') ? href : `https://www.bizquest.com${href}`;
          
          listings.push({
            name,
            description: name,
            asking_price: extractPrice(priceText),
            annual_revenue: 0,
            industry: 'Business',
            location: location || 'United States',
            source: 'BizQuest',
            original_url: fullUrl
          });
          
          console.log(`Found: ${name} - ${priceText} - ${fullUrl}`);
        }
      });
      
      if (listings.length > 0) break;
    }
    
    console.log(`✅ Extracted ${listings.length} listings from BizQuest`);
    return listings;
    
  } catch (error) {
    console.error(`❌ BizQuest error: ${error.message}`);
    return [];
  }
}

async function saveToDatabase(listings) {
  if (listings.length === 0) return 0;
  
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
    console.log(`✅ Saved ${savedCount} listings`);
    return savedCount;
    
  } catch (error) {
    console.error('❌ Save error:', error);
    return 0;
  }
}

async function main() {
  console.log('🚀 Scraping working sites with ScraperAPI...');
  
  if (!SCRAPER_API_KEY) {
    console.error('❌ SCRAPER_API_KEY not found');
    return;
  }
  
  const allListings = [];
  
  // Scrape each working site
  const scrapers = [
    { name: 'QuietLight', func: scrapeQuietLight },
    { name: 'Flippa', func: scrapeFlippa },
    { name: 'BizQuest', func: scrapeBizQuest }
  ];
  
  for (const scraper of scrapers) {
    try {
      const listings = await scraper.func();
      allListings.push(...listings);
      
      // Wait between scrapers
      if (listings.length > 0) {
        console.log('⏱️ Waiting 10 seconds before next scraper...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
      
    } catch (error) {
      console.error(`❌ ${scraper.name} failed: ${error.message}`);
    }
  }
  
  // Save all real listings
  const savedCount = await saveToDatabase(allListings);
  
  console.log('\n📊 Final Results:');
  console.log(`Total listings found: ${allListings.length}`);
  console.log(`Successfully saved: ${savedCount}`);
  
  if (savedCount > 0) {
    console.log('\n📋 Sample real listings:');
    allListings.slice(0, 3).forEach((listing, i) => {
      console.log(`\n${i + 1}. ${listing.name}`);
      console.log(`   Source: ${listing.source}`);
      console.log(`   Price: $${listing.asking_price.toLocaleString()}`);
      console.log(`   URL: ${listing.original_url}`);
    });
  }
}

main().catch(console.error);