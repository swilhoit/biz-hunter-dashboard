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
    wait: '5',
    window_width: '1920',
    window_height: '1080',
    country_code: 'us'
  });

  const apiUrl = `https://api.scraperapi.com/?${params.toString()}`;
  
  console.log(`📡 Fetching via ScraperAPI...`);
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
  
  const cleaned = priceText.replace(/[^0-9.,]/g, '');
  
  if (priceText.toLowerCase().includes('m') || priceText.toLowerCase().includes('million')) {
    return Math.round(parseFloat(cleaned) * 1000000);
  }
  
  if (priceText.toLowerCase().includes('k')) {
    return Math.round(parseFloat(cleaned) * 1000);
  }
  
  return Math.round(parseFloat(cleaned)) || 0;
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
  if (combinedText.includes('health') || combinedText.includes('medical')) return 'Health & Wellness';
  if (combinedText.includes('education') || combinedText.includes('learning')) return 'Education';
  if (combinedText.includes('finance') || combinedText.includes('fintech')) return 'Finance';
  if (combinedText.includes('food') || combinedText.includes('restaurant')) return 'Food & Beverage';
  
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

async function scrapeCenturica() {
  console.log('🔄 Fetching Centurica Marketwatch...');
  
  try {
    const html = await fetchPageWithScraperAPI('https://app.centurica.com/marketwatch');
    const $ = cheerio.load(html);
    const listings = [];
    
    // Method 1: Look for table rows
    console.log('🔍 Parsing table data...');
    $('#table-listings tbody tr, table tbody tr').each((i, row) => {
      const cells = $(row).find('td').map((_, cell) => $(cell).text().trim()).get();
      
      if (cells.length >= 10) {
        const name = cells[1] || '';
        const businessModel = cells[2] || '';
        const niche = cells[3] || '';
        const askingPriceText = cells[4] || '';
        const grossRevenueText = cells[5] || '';
        const netRevenueText = cells[6] || '';
        const providerText = cells[10] || '';
        
        if (name && name.length > 5) {
          const askingPrice = extractPrice(askingPriceText);
          const grossRevenue = extractPrice(grossRevenueText);
          const netRevenue = extractPrice(netRevenueText);
          const annualRevenue = grossRevenue || netRevenue;
          
          const provider = providerText || inferProvider(businessModel, niche, askingPrice);
          const industry = mapIndustry(businessModel, niche);
          
          listings.push({
            name,
            description: `${businessModel} - ${niche}`.trim() || name,
            asking_price: askingPrice,
            annual_revenue: annualRevenue,
            industry,
            location: 'Various',
            source: `Centurica (${provider})`,
            original_url: generateListingUrl(provider, name),
            highlights: [
              businessModel && `Business Model: ${businessModel}`,
              niche && `Niche: ${niche}`,
              grossRevenueText && `Gross Revenue: ${grossRevenueText}`,
              netRevenueText && `Net Revenue: ${netRevenueText}`
            ].filter(Boolean),
            status: 'active'
          });
        }
      }
    });
    
    // Method 2: Look for JavaScript data
    if (listings.length === 0) {
      console.log('🔍 Looking for JavaScript data...');
      const scriptTags = $('script').map((_, script) => $(script).html()).get();
      
      for (const script of scriptTags) {
        // Look for DataTable initialization
        const dataTableMatch = script.match(/DataTable\s*\(\s*{[\s\S]*?data\s*:\s*(\[[\s\S]*?\])/);
        if (dataTableMatch && dataTableMatch[1]) {
          try {
            const data = JSON.parse(dataTableMatch[1]);
            console.log(`Found ${data.length} listings in DataTable`);
            
            for (const item of data) {
              if (Array.isArray(item) && item.length >= 10) {
                const name = item[1] || '';
                const businessModel = item[2] || '';
                const niche = item[3] || '';
                const askingPrice = extractPrice(item[4] || '');
                const grossRevenue = extractPrice(item[5] || '');
                const netRevenue = extractPrice(item[6] || '');
                const provider = item[10] || inferProvider(businessModel, niche, askingPrice);
                
                if (name && name.length > 5) {
                  listings.push({
                    name,
                    description: `${businessModel} - ${niche}`.trim() || name,
                    asking_price: askingPrice,
                    annual_revenue: grossRevenue || netRevenue,
                    industry: mapIndustry(businessModel, niche),
                    location: 'Various',
                    source: `Centurica (${provider})`,
                    original_url: generateListingUrl(provider, name),
                    highlights: [
                      businessModel && `Business Model: ${businessModel}`,
                      niche && `Niche: ${niche}`
                    ].filter(Boolean),
                    status: 'active'
                  });
                }
              }
            }
            break;
          } catch (e) {
            console.error('Failed to parse DataTable data:', e.message);
          }
        }
      }
    }
    
    // Method 3: Look for any listing-like content
    if (listings.length === 0) {
      console.log('🔍 Looking for listing elements...');
      $('.listing, .card, article, [class*="listing"]').each((i, el) => {
        const $el = $(el);
        const title = $el.find('h3, h4, .title').first().text().trim();
        const price = $el.find('.price, [class*="price"]').first().text().trim();
        
        if (title && title.length > 5) {
          listings.push({
            name: title,
            description: title,
            asking_price: extractPrice(price),
            annual_revenue: 0,
            industry: 'Online Business',
            location: 'Various',
            source: 'Centurica',
            original_url: 'https://app.centurica.com/marketwatch',
            highlights: [],
            status: 'active'
          });
        }
      });
    }
    
    console.log(`✅ Extracted ${listings.length} listings`);
    
    // Remove duplicates
    const uniqueListings = listings.filter((listing, index, self) =>
      index === self.findIndex((l) => l.name === listing.name)
    );
    
    return uniqueListings;
    
  } catch (error) {
    console.error('❌ Scraping error:', error);
    return [];
  }
}

async function saveToDatabase(listings) {
  if (listings.length === 0) return 0;
  
  try {
    console.log(`💾 Saving ${listings.length} listings to database...`);
    
    // Save in batches of 50
    let totalSaved = 0;
    for (let i = 0; i < listings.length; i += 50) {
      const batch = listings.slice(i, i + 50);
      
      const { data, error } = await supabase
        .from('business_listings')
        .insert(batch)
        .select();
      
      if (error) {
        console.error('❌ Database error:', error);
      } else {
        totalSaved += data?.length || 0;
        console.log(`✅ Saved batch ${Math.floor(i/50) + 1}: ${data?.length || 0} listings`);
      }
    }
    
    return totalSaved;
    
  } catch (error) {
    console.error('❌ Save error:', error);
    return 0;
  }
}

async function main() {
  console.log('🚀 Starting Centurica full scraping...');
  console.log('📍 Aggregating listings from 30+ business brokers\n');
  
  if (!SCRAPER_API_KEY) {
    console.error('❌ SCRAPER_API_KEY not found');
    return;
  }
  
  const listings = await scrapeCenturica();
  
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
  }
}

main().catch(console.error);