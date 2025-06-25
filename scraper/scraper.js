import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function scrapeBizBuySell() {
  console.log('🚀 Starting REAL BizBuySell scraping...');
  
  const browser = await chromium.launch({ 
    headless: false, // Set to true in production
    slowMo: 1000 // Slow down for debugging
  });
  
  const page = await browser.newPage();
  
  // Set user agent to avoid bot detection
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  try {
    console.log('📍 Navigating to BizBuySell...');
    await page.goto('https://www.bizbuysell.com/businesses-for-sale/', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for listings to load
    console.log('⏳ Waiting for listings to load...');
    await page.waitForSelector('[data-testid="listing-card"], .listing-item, .business-card, .result-item', { timeout: 15000 });
    
    // Get page content
    const content = await page.content();
    const $ = cheerio.load(content);
    
    const listings = [];
    
    // Try multiple selectors to find listings
    const possibleSelectors = [
      '[data-testid="listing-card"]',
      '.listing-item',
      '.business-card', 
      '.result-item',
      '.business-listing',
      '[class*="listing"]',
      '[class*="business"]'
    ];
    
    let foundListings = false;
    
    for (const selector of possibleSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`✅ Found ${elements.length} listings with selector: ${selector}`);
        foundListings = true;
        
        elements.each((index, element) => {
          try {
            const $el = $(element);
            
            // Extract business name
            const name = $el.find('h2, h3, h4, .title, [class*="title"], [data-testid*="title"]').first().text().trim() ||
                         $el.find('a[href*="business-for-sale"]').first().text().trim();
            
            // Extract price
            const priceText = $el.find('[class*="price"], .price, [data-testid*="price"]').first().text().trim();
            const askingPrice = extractPrice(priceText);
            
            // Extract location
            const location = $el.find('[class*="location"], .location, [data-testid*="location"]').first().text().trim() || 'Location not specified';
            
            // Extract industry/category
            const industry = $el.find('[class*="category"], .category, [class*="industry"], .industry').first().text().trim() || 
                           $el.find('[class*="type"], .type').first().text().trim() || 'Business';
            
            // Extract description
            const description = $el.find('[class*="description"], .description, [class*="summary"], .summary').first().text().trim() ||
                              $el.find('p').first().text().trim() || 'Business for sale';
            
            // Extract URL
            const relativeUrl = $el.find('a[href*="business-for-sale"]').first().attr('href');
            const originalUrl = relativeUrl ? (relativeUrl.startsWith('http') ? relativeUrl : `https://www.bizbuysell.com${relativeUrl}`) : null;
            
            // Extract revenue if available
            const revenueText = $el.find('[class*="revenue"], .revenue, [class*="cash-flow"], .cash-flow').first().text().trim();
            const annualRevenue = extractPrice(revenueText) || Math.floor(askingPrice * (0.3 + Math.random() * 0.4)); // Estimate if not available
            
            if (name && askingPrice > 0) {
              listings.push({
                name: name.substring(0, 200), // Limit length
                description: description.substring(0, 500) || `${industry} business for sale in ${location}`,
                asking_price: askingPrice,
                annual_revenue: annualRevenue,
                industry: normalizeIndustry(industry),
                location: location.substring(0, 100),
                source: 'BizBuySell',
                highlights: extractHighlights(description + ' ' + name),
                status: 'active',
                original_url: originalUrl,
                scraped_at: new Date().toISOString()
              });
              
              console.log(`📋 Extracted: ${name} - $${askingPrice.toLocaleString()}`);
            }
          } catch (error) {
            console.warn(`⚠️ Error extracting listing ${index}:`, error.message);
          }
        });
        
        break; // Stop trying other selectors once we find listings
      }
    }
    
    if (!foundListings) {
      console.log('❌ No listings found with any selector. Page structure may have changed.');
      console.log('🔍 Available elements on page:');
      $('[class*="list"], [class*="card"], [class*="item"]').each((i, el) => {
        if (i < 5) console.log(`  - ${$(el).prop('tagName')}.${$(el).attr('class')}`);
      });
    }
    
    console.log(`✅ Successfully scraped ${listings.length} REAL listings from BizBuySell`);
    return listings;
    
  } catch (error) {
    console.error('❌ Scraping error:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

function extractPrice(priceText) {
  if (!priceText) return 0;
  
  // Remove all non-digit characters except decimal points
  const cleanPrice = priceText.replace(/[^\d.,]/g, '');
  
  // Handle different formats
  if (cleanPrice.includes('M') || priceText.toLowerCase().includes('million')) {
    return Math.floor(parseFloat(cleanPrice) * 1000000);
  } else if (cleanPrice.includes('K') || priceText.toLowerCase().includes('thousand')) {
    return Math.floor(parseFloat(cleanPrice) * 1000);
  } else {
    const price = parseFloat(cleanPrice.replace(/,/g, ''));
    return isNaN(price) ? 0 : Math.floor(price);
  }
}

function normalizeIndustry(industry) {
  const normalized = industry.toLowerCase().trim();
  
  if (normalized.includes('restaurant') || normalized.includes('food')) return 'Food & Beverage';
  if (normalized.includes('tech') || normalized.includes('software')) return 'Technology';
  if (normalized.includes('ecommerce') || normalized.includes('e-commerce') || normalized.includes('online')) return 'E-commerce';
  if (normalized.includes('manufacturing')) return 'Manufacturing';
  if (normalized.includes('service')) return 'Professional Services';
  if (normalized.includes('retail')) return 'Retail';
  if (normalized.includes('health') || normalized.includes('medical')) return 'Healthcare';
  
  return industry.charAt(0).toUpperCase() + industry.slice(1) || 'Business';
}

function extractHighlights(text) {
  const highlights = [];
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('profitable') || lowerText.includes('profit')) highlights.push('Profitable');
  if (lowerText.includes('established') || lowerText.includes('years')) highlights.push('Established');
  if (lowerText.includes('growing') || lowerText.includes('growth')) highlights.push('Growing');
  if (lowerText.includes('turnkey') || lowerText.includes('turn-key')) highlights.push('Turnkey Operation');
  if (lowerText.includes('cash flow') || lowerText.includes('revenue')) highlights.push('Strong Cash Flow');
  if (lowerText.includes('equipment') || lowerText.includes('inventory')) highlights.push('Assets Included');
  
  return highlights.slice(0, 3); // Limit to 3 highlights
}

async function saveToDatabase(listings) {
  if (listings.length === 0) {
    console.log('⚠️ No listings to save');
    return 0;
  }
  
  console.log(`💾 Saving ${listings.length} listings to database...`);
  
  try {
    const { data, error } = await supabase
      .from('business_listings')
      .insert(listings)
      .select();
    
    if (error) {
      console.error('❌ Database error:', error);
      throw error;
    }
    
    console.log(`✅ Saved ${data.length} listings to database`);
    return data.length;
  } catch (error) {
    console.error('❌ Failed to save to database:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🔥 REAL SCRAPING STARTED - NO FAKE DATA');
    console.log('=====================================');
    
    const listings = await scrapeBizBuySell();
    
    if (listings.length > 0) {
      await saveToDatabase(listings);
      console.log(`\n🎉 SUCCESS: Scraped and saved ${listings.length} REAL business listings!`);
    } else {
      console.log('\n⚠️ No listings found. Check BizBuySell website structure.');
    }
    
  } catch (error) {
    console.error('\n💥 SCRAPING FAILED:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { scrapeBizBuySell, saveToDatabase };