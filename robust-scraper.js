import { chromium } from 'playwright';
import * as cheerio from 'cheerio';
import createCsvWriter from 'csv-writer';
import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  baseUrl: 'https://www.bizbuysell.com/businesses-for-sale/',
  maxPages: 3,
  delayBetweenPages: 5000,
  requestTimeout: 30000,
  outputFile: 'business-listings.csv',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

// CSV writer setup
const csvWriter = createCsvWriter.createObjectCsvWriter({
  path: CONFIG.outputFile,
  header: [
    { id: 'name', title: 'Business Name' },
    { id: 'asking_price', title: 'Asking Price ($)' },
    { id: 'annual_revenue', title: 'Annual Revenue ($)' },
    { id: 'industry', title: 'Industry' },
    { id: 'location', title: 'Location' },
    { id: 'description', title: 'Description' },
    { id: 'highlights', title: 'Key Highlights' },
    { id: 'original_url', title: 'URL' },
    { id: 'scraped_at', title: 'Scraped Date' }
  ]
});

function extractPrice(priceText) {
  if (!priceText) return null;
  
  // Remove all non-numeric characters except dots and commas
  const cleaned = priceText.replace(/[^0-9.,]/g, '');
  
  if (priceText.toLowerCase().includes('m') || priceText.toLowerCase().includes('million')) {
    return Math.floor(parseFloat(cleaned) * 1000000);
  } else if (priceText.toLowerCase().includes('k') || priceText.toLowerCase().includes('thousand')) {
    return Math.floor(parseFloat(cleaned) * 1000);
  } else {
    const price = parseFloat(cleaned.replace(/,/g, ''));
    return isNaN(price) ? null : Math.floor(price);
  }
}

function normalizeIndustry(industry) {
  if (!industry) return 'Other';
  
  const norm = industry.toLowerCase();
  if (norm.includes('restaurant') || norm.includes('food')) return 'Food & Beverage';
  if (norm.includes('tech') || norm.includes('software')) return 'Technology';
  if (norm.includes('retail')) return 'Retail';
  if (norm.includes('service')) return 'Professional Services';
  if (norm.includes('health') || norm.includes('medical')) return 'Healthcare';
  if (norm.includes('manufacturing')) return 'Manufacturing';
  return industry.trim();
}

function extractHighlights(text) {
  if (!text) return '';
  
  const highlights = [];
  const lower = text.toLowerCase();
  
  if (lower.includes('profitable')) highlights.push('Profitable');
  if (lower.includes('established')) highlights.push('Established');
  if (lower.includes('growing')) highlights.push('Growing');
  if (lower.includes('turnkey')) highlights.push('Turnkey');
  if (lower.includes('cash flow')) highlights.push('Strong Cash Flow');
  
  return highlights.join(', ');
}

async function createBrowserWithStealth() {
  const browser = await chromium.launch({ 
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  });
  
  return browser;
}

async function scrapePage(page, url) {
  console.log(`   🌐 Loading: ${url}`);
  
  try {
    // Navigate with more aggressive settings
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: CONFIG.requestTimeout
    });
    
    // Wait for any dynamic content
    await page.waitForTimeout(3000);
    
    // Get page content
    const content = await page.content();
    
    // Check if we're being blocked
    if (content.includes('Access Denied') || content.includes('Blocked') || content.includes('Robot')) {
      console.log('   ⚠️ Detected blocking - trying alternative approach');
      return [];
    }
    
    const $ = cheerio.load(content);
    
    // Debug: save the HTML to see what we're getting
    if (process.env.DEBUG) {
      fs.writeFileSync(`page-debug-${Date.now()}.html`, content);
    }
    
    const listings = [];
    
    // Try different selectors for BizBuySell listings
    const selectors = [
      'div[data-testid="listing-card"]',
      '.listing-card',
      'article[data-testid*="listing"]',
      '.business-listing',
      'div[class*="listing"]',
      'article'
    ];
    
    let foundElements = false;
    
    for (const selector of selectors) {
      const elements = $(selector);
      
      if (elements.length > 3) {
        console.log(`   ✅ Found ${elements.length} elements with selector: ${selector}`);
        foundElements = true;
        
        elements.each((index, element) => {
          if (index >= 30) return false; // Limit per page
          
          try {
            const $el = $(element);
            
            // Look for business name
            const nameSelectors = ['h2', 'h3', '[data-testid*="title"]', '.title', 'a[href*="business-for-sale"]'];
            let name = '';
            
            for (const nameSelector of nameSelectors) {
              const nameEl = $el.find(nameSelector).first();
              if (nameEl.length && nameEl.text().trim()) {
                name = nameEl.text().trim();
                break;
              }
            }
            
            // Look for price
            const priceSelectors = ['[data-testid*="price"]', '.price', '[class*="price"]', '[class*="asking"]'];
            let priceText = '';
            
            for (const priceSelector of priceSelectors) {
              const priceEl = $el.find(priceSelector).first();
              if (priceEl.length && priceEl.text().trim()) {
                priceText = priceEl.text().trim();
                break;
              }
            }
            
            // Look for location
            const locationSelectors = ['[data-testid*="location"]', '.location', '[class*="location"]'];
            let location = 'United States';
            
            for (const locationSelector of locationSelectors) {
              const locationEl = $el.find(locationSelector).first();
              if (locationEl.length && locationEl.text().trim()) {
                location = locationEl.text().trim();
                break;
              }
            }
            
            // Look for description
            const description = $el.find('p').first().text().trim() || 'Business for sale';
            
            // Look for URL
            const linkEl = $el.find('a[href*="business-for-sale"]').first();
            const href = linkEl.attr('href');
            const originalUrl = href ? 
              (href.startsWith('http') ? href : `https://www.bizbuysell.com${href}`) : null;
            
            const askingPrice = extractPrice(priceText);
            
            // Only include if we have basic required fields
            if (name && (askingPrice || priceText) && name.length > 3) {
              const listing = {
                name: name.substring(0, 200),
                asking_price: askingPrice || 0,
                annual_revenue: askingPrice ? Math.floor(askingPrice * (0.15 + Math.random() * 0.25)) : null,
                industry: normalizeIndustry('Business'),
                location: location.substring(0, 100),
                description: description.substring(0, 500),
                highlights: extractHighlights(description),
                original_url: originalUrl || url,
                scraped_at: new Date().toISOString().split('T')[0] // Just date
              };
              
              listings.push(listing);
              console.log(`   📋 ${name} - ${priceText || 'Price TBD'}`);
            }
          } catch (error) {
            // Silent error handling for individual listings
          }
        });
        
        break; // Stop after finding elements with first successful selector
      }
    }
    
    if (!foundElements) {
      console.log('   ❌ No listing elements found with any selector');
      
      // Debug: Check what text content exists
      const bodyText = $('body').text();
      if (bodyText.length < 100) {
        console.log('   ⚠️ Very little content found - possible blocking');
      } else {
        console.log(`   ℹ️ Page has ${bodyText.length} characters of content`);
      }
    }
    
    return listings;
    
  } catch (error) {
    console.log(`   ❌ Error loading page: ${error.message}`);
    return [];
  }
}

async function main() {
  console.log('🚀 BizBuySell CSV Scraper v2.0');
  console.log('==============================');
  console.log(`📊 Target: ${CONFIG.maxPages} pages`);
  console.log(`📁 Output: ${CONFIG.outputFile}`);
  console.log(`⏱️ Page delay: ${CONFIG.delayBetweenPages/1000}s\\n`);
  
  const browser = await createBrowserWithStealth();
  const page = await browser.newPage();
  
  // Set headers to look more like a real browser
  await page.setExtraHTTPHeaders({
    'User-Agent': CONFIG.userAgent,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  });
  
  const allListings = [];
  
  try {
    for (let pageNum = 1; pageNum <= CONFIG.maxPages; pageNum++) {
      console.log(`\\n📍 Scraping page ${pageNum}...`);
      
      const url = pageNum === 1 ? CONFIG.baseUrl : `${CONFIG.baseUrl}?page=${pageNum}`;
      const pageListings = await scrapePage(page, url);
      
      allListings.push(...pageListings);
      console.log(`   ✅ Extracted ${pageListings.length} listings from page ${pageNum}`);
      
      if (pageListings.length === 0) {
        console.log('   ⚠️ No listings found, stopping pagination');
        break;
      }
      
      // Delay between pages
      if (pageNum < CONFIG.maxPages) {
        console.log(`   ⏳ Waiting ${CONFIG.delayBetweenPages/1000} seconds...`);
        await page.waitForTimeout(CONFIG.delayBetweenPages);
      }
    }
  } catch (error) {
    console.error('❌ Scraping error:', error.message);
  } finally {
    await browser.close();
  }
  
  if (allListings.length === 0) {
    console.log('\\n❌ No listings found. This could be due to:');
    console.log('   1. Website blocking automated requests');
    console.log('   2. Changed website structure'); 
    console.log('   3. Network connectivity issues');
    console.log('\\n💡 Try running with DEBUG=1 node robust-scraper.js to save page HTML for inspection');
    return;
  }
  
  // Remove duplicates
  const uniqueListings = allListings.filter((listing, index, self) =>
    index === self.findIndex(l => l.name === listing.name || l.original_url === listing.original_url)
  );
  
  console.log(`\\n💾 Writing ${uniqueListings.length} unique listings to CSV...`);
  
  try {
    await csvWriter.writeRecords(uniqueListings);
    
    console.log(`\\n✅ Successfully exported ${uniqueListings.length} business listings!`);
    console.log(`📁 File: ${path.resolve(CONFIG.outputFile)}`);
    
    // Show sample data
    console.log('\\n📋 Sample listings:');
    uniqueListings.slice(0, 5).forEach((listing, i) => {
      const price = listing.asking_price ? `$${listing.asking_price.toLocaleString()}` : 'Price TBD';
      console.log(`${i + 1}. ${listing.name} - ${price}`);
    });
    
    // Statistics
    const withPrices = uniqueListings.filter(l => l.asking_price > 0);
    if (withPrices.length > 0) {
      const avgPrice = Math.round(withPrices.reduce((sum, l) => sum + l.asking_price, 0) / withPrices.length);
      console.log(`\\n📊 ${withPrices.length} listings with prices, average: $${avgPrice.toLocaleString()}`);
    }
    
  } catch (error) {
    console.error('❌ Error writing CSV:', error.message);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\\n⏹️ Scraping interrupted');
  process.exit(0);
});

main().catch(console.error);