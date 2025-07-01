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

async function fetchPageWithScraperAPI(url) {
  const params = new URLSearchParams({
    api_key: SCRAPER_API_KEY,
    url: url,
    render: 'true',
    premium: 'true',
    wait: '10',
    window_width: '1920',
    window_height: '1080',
    country_code: 'us',
    session_number: '1'
  });

  const apiUrl = `https://api.scraperapi.com/?${params.toString()}`;
  
  console.log(`📡 Fetching: ${url}`);
  const response = await fetch(apiUrl);
  
  if (!response.ok) {
    throw new Error(`ScraperAPI request failed: ${response.status} ${response.statusText}`);
  }
  
  const text = await response.text();
  console.log(`✅ Retrieved ${text.length} characters`);
  return text;
}

function extractPrice(priceText) {
  if (!priceText) return 0;
  
  // Split on common delimiters to find the price part
  // Example: "$775,0002.55x" should become "$775,000"
  const parts = priceText.split(/[x\s]+/);
  const pricePart = parts[0] || priceText;
  
  // Extract the first valid price from the text
  const priceMatch = pricePart.match(/\$?([\d,]+\.?\d*)/);
  if (!priceMatch) return 0;
  
  let numString = priceMatch[1];
  
  // Handle million format
  if (priceText.toLowerCase().includes('m') || priceText.toLowerCase().includes('million')) {
    const num = parseFloat(numString.replace(/,/g, ''));
    return Math.round(num * 1000000);
  }
  
  // Handle thousand format  
  if (priceText.toLowerCase().includes('k')) {
    const num = parseFloat(numString.replace(/,/g, ''));
    return Math.round(num * 1000);
  }
  
  // Handle regular numbers with commas
  const num = parseFloat(numString.replace(/,/g, ''));
  return Math.round(num) || 0;
}

function mapIndustry(businessModel, niche) {
  const combinedText = `${businessModel} ${niche}`.toLowerCase();
  
  if (combinedText.includes('saas') || combinedText.includes('software')) return 'SaaS';
  if (combinedText.includes('ecommerce') || combinedText.includes('e-commerce')) return 'E-commerce';
  if (combinedText.includes('content') || combinedText.includes('blog')) return 'Content';
  if (combinedText.includes('affiliate')) return 'Affiliate Marketing';
  if (combinedText.includes('marketplace')) return 'Marketplace';
  if (combinedText.includes('app') || combinedText.includes('mobile')) return 'Mobile App';
  if (combinedText.includes('service')) return 'Services';
  
  return 'Online Business';
}

function inferProvider(businessModel, niche, price) {
  const combinedText = `${businessModel} ${niche}`.toLowerCase();
  
  if (price > 1000000) {
    if (combinedText.includes('saas')) return 'FE International';
    if (combinedText.includes('ecommerce')) return 'Quiet Light';
    return 'Empire Flippers';
  }
  
  if (combinedText.includes('content') || combinedText.includes('affiliate')) {
    return 'Motion Invest';
  }
  
  if (price < 100000) return 'Flippa';
  if (price < 500000) return 'BizBuySell';
  
  return 'Empire Flippers';
}

function generateListingUrl(provider, name) {
  const slug = name.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
    
  const urls = {
    'Empire Flippers': `https://empireflippers.com/listing/${slug}/`,
    'FE International': `https://feinternational.com/buy-a-website/${slug}/`,
    'Motion Invest': `https://motioninvest.com/listings/${slug}/`,
    'Quiet Light': `https://quietlight.com/listing/${slug}/`,
    'Flippa': `https://flippa.com/listing/${slug}/`,
    'BizBuySell': `https://www.bizbuysell.com/business-for-sale/${slug}/`
  };
  
  return urls[provider] || 'https://app.centurica.com/marketwatch';
}

async function scrapeCenturicaUrls() {
  const urls = [
    'https://app.centurica.com/marketwatch',
    'https://app.centurica.com/api/marketwatch',
    'https://app.centurica.com/marketwatch/all',
    'https://app.centurica.com/marketwatch?page=1',
    'https://app.centurica.com/marketwatch?limit=100'
  ];
  
  let allListings = [];
  
  for (const url of urls) {
    try {
      console.log(`\n🔄 Trying URL: ${url}`);
      const html = await fetchPageWithScraperAPI(url);
      
      // Save the HTML to examine structure
      console.log('📝 Saving HTML for analysis...');
      
      // Parse with cheerio
      const $ = cheerio.load(html);
      
      // Look for data in various ways
      const listings = [];
      
      // Method 1: Table rows
      $('table tbody tr, #table-listings tbody tr').each((i, row) => {
        const cells = $(row).find('td').map((_, cell) => $(cell).text().trim()).get();
        
        if (cells.length >= 6) {
          console.log(`Row ${i}: ${cells.slice(0, 6).join(' | ')}`);
          
          const name = cells[1] || cells[0] || '';
          const businessModel = cells[2] || '';
          const niche = cells[3] || '';
          const priceText = cells[4] || '';
          const revenueText = cells[5] || '';
          
          if (name && name.length > 5 && !name.includes('Loading')) {
            const askingPrice = extractPrice(priceText);
            const annualRevenue = extractPrice(revenueText);
            const provider = inferProvider(businessModel, niche, askingPrice);
            
            console.log(`  Parsed: ${name} | $${askingPrice.toLocaleString()} | $${annualRevenue.toLocaleString()}`);
            
            listings.push({
              name: name.substring(0, 100),
              description: [businessModel, niche].filter(x => x).join(' - ') || name,
              asking_price: askingPrice,
              annual_revenue: annualRevenue,
              industry: mapIndustry(businessModel, niche),
              location: 'Various',
              source: `Centurica (${provider})`,
              original_url: generateListingUrl(provider, name),
              highlights: [
                businessModel && `Business Model: ${businessModel}`,
                niche && `Niche: ${niche}`,
                priceText && `Listed Price: ${priceText}`,
                revenueText && `Revenue: ${revenueText}`
              ].filter(Boolean),
              status: 'active'
            });
          }
        }
      });
      
      // Method 2: Look for JSON data in scripts
      $('script').each((_, script) => {
        const text = $(script).html() || '';
        
        // Look for various data patterns
        const patterns = [
          /data\s*:\s*(\[[\s\S]*?\])/g,
          /listings\s*:\s*(\[[\s\S]*?\])/g,
          /DataTable\s*\(\s*{\s*[\s\S]*?data\s*:\s*(\[[\s\S]*?\])/g
        ];
        
        for (const pattern of patterns) {
          let match;
          while ((match = pattern.exec(text)) !== null) {
            try {
              const data = JSON.parse(match[1]);
              if (Array.isArray(data) && data.length > 0) {
                console.log(`📊 Found ${data.length} items in script data`);
                
                for (const item of data.slice(0, 50)) { // Limit to first 50
                  if (Array.isArray(item) && item.length >= 4) {
                    const name = item[1] || item[0] || '';
                    if (name && name.length > 5) {
                      listings.push({
                        name: name.substring(0, 100),
                        description: (item[2] || '') + ' - ' + (item[3] || ''),
                        asking_price: extractPrice(item[4] || ''),
                        annual_revenue: extractPrice(item[5] || ''),
                        industry: mapIndustry(item[2] || '', item[3] || ''),
                        location: 'Various',
                        source: `Centurica (${inferProvider(item[2] || '', item[3] || '', extractPrice(item[4] || ''))})`,
                        original_url: generateListingUrl(inferProvider(item[2] || '', item[3] || '', extractPrice(item[4] || '')), name),
                        highlights: [],
                        status: 'active'
                      });
                    }
                  } else if (typeof item === 'object' && item.name) {
                    listings.push({
                      name: item.name.substring(0, 100),
                      description: item.description || item.name,
                      asking_price: extractPrice(item.price || item.asking_price || ''),
                      annual_revenue: extractPrice(item.revenue || item.annual_revenue || ''),
                      industry: mapIndustry(item.business_model || '', item.niche || ''),
                      location: 'Various',
                      source: `Centurica (${item.provider || 'Unknown'})`,
                      original_url: item.url || generateListingUrl(item.provider || 'Unknown', item.name),
                      highlights: [],
                      status: 'active'
                    });
                  }
                }
              }
            } catch (e) {
              // Continue to next pattern
            }
          }
        }
      });
      
      // Method 3: Look for any text that looks like listings
      if (listings.length === 0) {
        const text = $.text();
        const lines = text.split('\n').filter(line => line.trim().length > 10);
        
        for (const line of lines.slice(0, 20)) {
          if (line.includes('$') && (line.includes('K') || line.includes('M'))) {
            console.log(`📝 Potential listing line: ${line.trim()}`);
          }
        }
      }
      
      console.log(`✅ Found ${listings.length} listings from ${url}`);
      
      if (listings.length > 0) {
        allListings.push(...listings);
        break; // Use the first URL that works
      }
      
      // Wait between requests
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } catch (error) {
      console.error(`❌ Error with ${url}:`, error.message);
    }
  }
  
  // Remove duplicates
  const uniqueListings = allListings.filter((listing, index, self) =>
    index === self.findIndex((l) => l.name === listing.name)
  );
  
  return uniqueListings;
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
    
    return data?.length || 0;
    
  } catch (error) {
    console.error('❌ Save error:', error);
    return 0;
  }
}

async function main() {
  console.log('🚀 Starting enhanced Centurica scraping...');
  console.log('📍 Trying multiple URLs and extraction methods\n');
  
  if (!SCRAPER_API_KEY) {
    console.error('❌ SCRAPER_API_KEY not found');
    return;
  }
  
  const listings = await scrapeCenturicaUrls();
  
  if (listings.length > 0) {
    const savedCount = await saveToDatabase(listings);
    
    console.log('\n📊 Final Results:');
    console.log(`Total listings found: ${listings.length}`);
    console.log(`Successfully saved: ${savedCount}`);
    
    // Show provider breakdown
    const providers = {};
    listings.forEach(listing => {
      const provider = listing.source.replace('Centurica (', '').replace(')', '');
      providers[provider] = (providers[provider] || 0) + 1;
    });
    
    console.log('\n📈 Provider Breakdown:');
    Object.entries(providers)
      .sort(([,a], [,b]) => b - a)
      .forEach(([provider, count]) => {
        console.log(`   ${provider}: ${count} listings`);
      });
    
    // Show sample listings
    console.log('\n📋 Sample Listings:');
    listings.slice(0, 5).forEach((listing, i) => {
      console.log(`\n${i + 1}. ${listing.name}`);
      console.log(`   Price: $${listing.asking_price.toLocaleString()}`);
      console.log(`   Revenue: $${listing.annual_revenue.toLocaleString()}`);
      console.log(`   Industry: ${listing.industry}`);
      console.log(`   Source: ${listing.source}`);
    });
  } else {
    console.log('❌ No listings found');
  }
}

main().catch(console.error);