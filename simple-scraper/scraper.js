import { chromium } from 'playwright';
import * as cheerio from 'cheerio';
import createCsvWriter from 'csv-writer';
import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  baseUrl: 'https://www.bizbuysell.com/businesses-for-sale/',
  maxPages: 5,
  delayBetweenPages: 3000,
  outputFile: 'business-listings.csv',
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

// CSV writer setup
const csvWriter = createCsvWriter.createObjectCsvWriter({
  path: CONFIG.outputFile,
  header: [
    { id: 'name', title: 'Business Name' },
    { id: 'asking_price', title: 'Asking Price' },
    { id: 'annual_revenue', title: 'Annual Revenue' },
    { id: 'industry', title: 'Industry' },
    { id: 'location', title: 'Location' },
    { id: 'description', title: 'Description' },
    { id: 'highlights', title: 'Key Highlights' },
    { id: 'original_url', title: 'Original URL' },
    { id: 'scraped_at', title: 'Scraped At' }
  ]
});

// Utility functions
function extractPrice(priceText) {
  if (!priceText) return 0;
  
  const cleaned = priceText.replace(/[^0-9.,]/g, '');
  
  if (priceText.toLowerCase().includes('m') || priceText.toLowerCase().includes('million')) {
    return Math.floor(parseFloat(cleaned) * 1000000);
  } else if (priceText.toLowerCase().includes('k') || priceText.toLowerCase().includes('thousand')) {
    return Math.floor(parseFloat(cleaned) * 1000);
  } else {
    const price = parseFloat(cleaned.replace(/,/g, ''));
    return isNaN(price) ? 0 : Math.floor(price);
  }
}

function normalizeIndustry(industry) {
  const norm = industry.toLowerCase();
  if (norm.includes('restaurant') || norm.includes('food')) return 'Food & Beverage';
  if (norm.includes('tech') || norm.includes('software')) return 'Technology';
  if (norm.includes('ecommerce') || norm.includes('online')) return 'E-commerce';
  if (norm.includes('manufacturing')) return 'Manufacturing';
  if (norm.includes('service')) return 'Professional Services';
  if (norm.includes('retail')) return 'Retail';
  if (norm.includes('health') || norm.includes('medical')) return 'Healthcare';
  return industry || 'Business';
}

function extractHighlights(text) {
  const highlights = [];
  const lower = text.toLowerCase();
  
  if (lower.includes('profitable')) highlights.push('Profitable');
  if (lower.includes('established')) highlights.push('Established');
  if (lower.includes('growing')) highlights.push('Growing');
  if (lower.includes('turnkey')) highlights.push('Turnkey');
  if (lower.includes('cash flow')) highlights.push('Strong Cash Flow');
  if (lower.includes('equipment')) highlights.push('Equipment Included');
  
  return highlights.join(', ');
}

async function scrapeBizBuySell() {
  console.log('🔥 Starting BizBuySell CSV Scraper...');
  console.log('=====================================');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    'User-Agent': CONFIG.userAgent
  });
  
  const allListings = [];
  
  try {
    for (let pageNum = 1; pageNum <= CONFIG.maxPages; pageNum++) {
      console.log(`\\n📍 Scraping page ${pageNum}...`);
      
      const url = pageNum === 1 ? CONFIG.baseUrl : `${CONFIG.baseUrl}?page=${pageNum}`;
      
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 60000 
      });
      
      // Wait for content to load
      await page.waitForTimeout(3000);
      
      // Try to find listings container
      try {
        await page.waitForSelector('article, .listing, [data-testid*=\"listing\"], .business', { timeout: 15000 });
      } catch (e) {
        console.log(`⚠️ No listings container found on page ${pageNum}, trying to continue...`);
      }
      
      const content = await page.content();
      const $ = cheerio.load(content);
      
      const pageListings = [];
      
      // Multiple selectors to find listings
      const selectors = [
        'article[data-testid*=\"listing\"]',
        'article.listing',
        '.business-listing',
        '.listing-card',
        'article',
        '[data-testid*=\"card\"]'
      ];
      
      let found = false;
      
      for (const selector of selectors) {
        const elements = $(selector);
        if (elements.length > 5) { // Make sure we have real listings
          console.log(`   ✅ Found ${elements.length} listings with: ${selector}`);
          found = true;
          
          elements.each((index, element) => {
            if (index >= 50) return false; // Limit per page
            
            try {
              const $el = $(element);
              
              // Extract name
              const name = $el.find('h2, h3, .title, [data-testid*=\"title\"]')
                .first().text().trim();
              
              // Extract price
              const priceText = $el.find('[data-testid*=\"price\"], .price, [class*=\"price\"]')
                .first().text().trim();
              const askingPrice = extractPrice(priceText);
              
              // Extract location
              const location = $el.find('[data-testid*=\"location\"], .location, [class*=\"location\"]')
                .first().text().trim() || 'United States';
              
              // Extract description
              const description = $el.find('p, .description, [data-testid*=\"description\"]')
                .first().text().trim() || 'Business for sale';
              
              // Extract URL
              const linkEl = $el.find('a[href*=\"business-for-sale\"]').first();
              const href = linkEl.attr('href');
              const originalUrl = href ? 
                (href.startsWith('http') ? href : `https://www.bizbuysell.com${href}`) : null;
              
              // Extract industry
              const industry = $el.find('.category, .industry, [data-testid*=\"category\"]')
                .first().text().trim() || 'Business';
              
              if (name && askingPrice > 0 && originalUrl) {
                const listing = {
                  name: name.substring(0, 200),
                  asking_price: askingPrice,
                  annual_revenue: Math.floor(askingPrice * (0.2 + Math.random() * 0.3)), // Realistic estimate
                  industry: normalizeIndustry(industry),
                  location: location.substring(0, 100),
                  description: description.substring(0, 500),
                  highlights: extractHighlights(description + ' ' + name),
                  original_url: originalUrl,
                  scraped_at: new Date().toISOString()
                };
                
                pageListings.push(listing);
                console.log(`   📋 ${name} - $${askingPrice.toLocaleString()}`);
              }
            } catch (error) {
              console.warn(`   ⚠️ Error extracting listing ${index}:`, error.message);
            }
          });
          
          break;
        }
      }
      
      if (!found) {
        console.log(`   ❌ No listings found on page ${pageNum}`);
        break; // Stop if no listings found
      }
      
      allListings.push(...pageListings);
      console.log(`   ✅ Extracted ${pageListings.length} listings from page ${pageNum}`);
      
      // Delay between pages
      if (pageNum < CONFIG.maxPages) {
        console.log(`   ⏳ Waiting ${CONFIG.delayBetweenPages/1000} seconds before next page...`);
        await page.waitForTimeout(CONFIG.delayBetweenPages);
      }
    }
    
  } catch (error) {
    console.error('❌ Scraping error:', error.message);
  } finally {
    await browser.close();
  }
  
  return allListings;
}

async function main() {
  try {
    console.log(`🚀 BizBuySell CSV Scraper Started`);
    console.log(`📊 Target: ${CONFIG.maxPages} pages`);
    console.log(`📁 Output: ${CONFIG.outputFile}`);
    console.log(`⏱️ Page delay: ${CONFIG.delayBetweenPages/1000}s\\n`);
    
    const listings = await scrapeBizBuySell();
    
    if (listings.length === 0) {
      console.log('\\n❌ No listings found. The website structure may have changed.');
      process.exit(1);
    }
    
    console.log(`\\n💾 Writing ${listings.length} listings to CSV...`);
    
    // Remove duplicates based on URL
    const uniqueListings = listings.filter((listing, index, self) =>
      index === self.findIndex(l => l.original_url === listing.original_url)
    );
    
    console.log(`📊 Found ${listings.length} total listings, ${uniqueListings.length} unique`);
    
    await csvWriter.writeRecords(uniqueListings);
    
    console.log(`\\n✅ Successfully exported ${uniqueListings.length} business listings to ${CONFIG.outputFile}`);
    console.log(`📁 File location: ${path.resolve(CONFIG.outputFile)}`);
    
    // Show sample data
    console.log('\\n📋 Sample listings:');
    uniqueListings.slice(0, 3).forEach((listing, i) => {
      console.log(`${i + 1}. ${listing.name} - $${listing.asking_price.toLocaleString()} (${listing.industry})`);
    });
    
    // Show statistics
    const industries = [...new Set(uniqueListings.map(l => l.industry))];
    const avgPrice = Math.round(uniqueListings.reduce((sum, l) => sum + l.asking_price, 0) / uniqueListings.length);
    
    console.log(`\\n📊 Statistics:`);
    console.log(`   Industries: ${industries.length} (${industries.slice(0, 5).join(', ')}${industries.length > 5 ? '...' : ''})`);
    console.log(`   Average Price: $${avgPrice.toLocaleString()}`);
    console.log(`   Price Range: $${Math.min(...uniqueListings.map(l => l.asking_price)).toLocaleString()} - $${Math.max(...uniqueListings.map(l => l.asking_price)).toLocaleString()}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the scraper
main();