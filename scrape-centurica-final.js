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
    country_code: 'us'
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
  if (!priceText || priceText === '-') return 0;
  
  // Handle Centurica format: "$775,0002.55x" or "$1,233,1632.50x"
  // We want to extract just the price part before the multiplier
  
  // Look for price pattern: $number,number followed by decimal multiplier
  const match = priceText.match(/\$?([\d,]+)(\d+\.\d+x)/);
  if (match) {
    const priceStr = match[1];
    const num = parseFloat(priceStr.replace(/,/g, ''));
    return Math.round(num) || 0;
  }
  
  // Fallback to simple extraction
  const cleaned = priceText.replace(/\$/, '').replace(/[^\d,.-]/g, '');
  if (cleaned.includes('M') || priceText.toLowerCase().includes('million')) {
    return Math.round(parseFloat(cleaned.replace(/,/g, '')) * 1000000);
  }
  if (cleaned.includes('K') || priceText.toLowerCase().includes('thousand')) {
    return Math.round(parseFloat(cleaned.replace(/,/g, '')) * 1000);
  }
  
  return Math.round(parseFloat(cleaned.replace(/,/g, ''))) || 0;
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
  if (combinedText.includes('ai') || combinedText.includes('automation')) return 'AI/Tech';
  if (combinedText.includes('health') || combinedText.includes('medical')) return 'Health & Wellness';
  if (combinedText.includes('education') || combinedText.includes('course')) return 'Education';
  if (combinedText.includes('finance') || combinedText.includes('fintech')) return 'Finance';
  if (combinedText.includes('food') || combinedText.includes('restaurant')) return 'Food & Beverage';
  
  return 'Online Business';
}

function inferProvider(businessModel, niche, price) {
  const combinedText = `${businessModel} ${niche}`.toLowerCase();
  
  if (price > 5000000) return 'FE International';
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
    
    console.log('🔍 Parsing table data...');
    
    // Find all table rows
    $('table tbody tr, #table-listings tbody tr').each((i, row) => {
      const cells = $(row).find('td').map((_, cell) => $(cell).text().trim()).get();
      
      if (cells.length >= 6) {
        const name = cells[1] || cells[0] || '';
        const businessModel = cells[2] || '';
        const niche = cells[3] || '';
        const priceText = cells[4] || '';
        const revenueText = cells[5] || '';
        
        console.log(`\nRow ${i}:`);
        console.log(`  Name: ${name}`);
        console.log(`  Business Model: ${businessModel}`);
        console.log(`  Niche: ${niche}`);
        console.log(`  Price Text: ${priceText}`);
        console.log(`  Revenue Text: ${revenueText}`);
        
        if (name && name.length > 5 && !name.includes('Loading')) {
          // For Centurica format, try multiple price extraction methods
          let askingPrice = 0;
          
          // Method 1: Look for specific patterns in the price text
          if (priceText.includes('$') && priceText.includes(',')) {
            // Extract first dollar amount
            const dollarMatch = priceText.match(/\$([0-9,]+)/);
            if (dollarMatch) {
              askingPrice = parseInt(dollarMatch[1].replace(/,/g, ''));
            }
          }
          
          let annualRevenue = 0;
          if (revenueText && revenueText !== '-') {
            const revenueMatch = revenueText.match(/\$([0-9,]+)/);
            if (revenueMatch) {
              annualRevenue = parseInt(revenueMatch[1].replace(/,/g, ''));
            }
          }
          
          const provider = inferProvider(businessModel, niche, askingPrice);
          
          console.log(`  Parsed Price: $${askingPrice.toLocaleString()}`);
          console.log(`  Parsed Revenue: $${annualRevenue.toLocaleString()}`);
          console.log(`  Provider: ${provider}`);
          
          const listing = {
            name: name.substring(0, 100),
            description: [businessModel, niche].filter(x => x && x !== 'Not Listed / Unchecked').join(' - ') || name,
            asking_price: askingPrice,
            annual_revenue: annualRevenue,
            industry: mapIndustry(businessModel, niche),
            location: 'Various',
            source: `Centurica (${provider})`,
            original_url: generateListingUrl(provider, name),
            highlights: [
              businessModel && businessModel !== 'Not Listed / Unchecked' && `Business Model: ${businessModel}`,
              niche && niche !== 'Not Listed / Unchecked' && `Niche: ${niche}`,
              priceText && priceText !== '-' && `Listed Price: ${priceText}`,
              revenueText && revenueText !== '-' && `Revenue: ${revenueText}`
            ].filter(Boolean),
            status: 'active'
          };
          
          listings.push(listing);
        }
      }
    });
    
    console.log(`\n✅ Extracted ${listings.length} listings`);
    return listings;
    
  } catch (error) {
    console.error('❌ Scraping error:', error);
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
    
    return data?.length || 0;
    
  } catch (error) {
    console.error('❌ Save error:', error);
    return 0;
  }
}

async function main() {
  console.log('🚀 Starting final Centurica scraping...');
  console.log('📍 Extracting quality listings from aggregated business brokers\n');
  
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
    const industries = {};
    
    listings.forEach(listing => {
      const provider = listing.source.replace('Centurica (', '').replace(')', '');
      providers[provider] = (providers[provider] || 0) + 1;
      industries[listing.industry] = (industries[listing.industry] || 0) + 1;
    });
    
    console.log('\n📈 Provider Breakdown:');
    Object.entries(providers)
      .sort(([,a], [,b]) => b - a)
      .forEach(([provider, count]) => {
        console.log(`   ${provider}: ${count} listings`);
      });
    
    console.log('\n🏭 Industry Breakdown:');
    Object.entries(industries)
      .sort(([,a], [,b]) => b - a)
      .forEach(([industry, count]) => {
        console.log(`   ${industry}: ${count} listings`);
      });
    
    // Show high-value listings
    const highValue = listings.filter(l => l.asking_price > 100000).sort((a, b) => b.asking_price - a.asking_price);
    if (highValue.length > 0) {
      console.log('\n💰 High-Value Listings:');
      highValue.slice(0, 3).forEach((listing, i) => {
        console.log(`\n${i + 1}. ${listing.name}`);
        console.log(`   Price: $${listing.asking_price.toLocaleString()}`);
        console.log(`   Revenue: $${listing.annual_revenue.toLocaleString()}`);
        console.log(`   Industry: ${listing.industry}`);
        console.log(`   Source: ${listing.source}`);
      });
    }
    
    console.log(`\n🎯 You now have ${savedCount} new Centurica listings in your dashboard!`);
    console.log('Visit your dashboard to explore these opportunities from 30+ business brokers.');
  }
}

main().catch(console.error);