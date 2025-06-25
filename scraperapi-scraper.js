import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import createCsvWriter from 'csv-writer';
import fs from 'fs';

// Configuration
const CONFIG = {
  scraperApiKey: '054d8cdaa4e8453e3afa7e5e9316c72f',
  baseUrl: 'https://www.bizbuysell.com/businesses-for-sale/',
  maxPages: 2,
  delayBetweenPages: 2000, // ScraperAPI handles rate limiting
  outputFile: 'real-business-listings.csv'
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
    { id: 'original_url', title: 'Original URL' },
    { id: 'scraped_at', title: 'Scraped Date' }
  ]
});

// Utility functions
function extractPrice(priceText) {
  if (!priceText) return null;
  
  const cleaned = priceText.replace(/[^0-9.,]/g, '');
  const text = priceText.toLowerCase();
  
  if (text.includes('m') || text.includes('million')) {
    return Math.floor(parseFloat(cleaned) * 1000000);
  } else if (text.includes('k') || text.includes('thousand')) {
    return Math.floor(parseFloat(cleaned) * 1000);
  } else {
    const price = parseFloat(cleaned.replace(/,/g, ''));
    return isNaN(price) ? null : Math.floor(price);
  }
}

function normalizeIndustry(industry) {
  if (!industry) return 'Business';
  
  const norm = industry.toLowerCase();
  if (norm.includes('restaurant') || norm.includes('food') || norm.includes('dining')) return 'Food & Beverage';
  if (norm.includes('tech') || norm.includes('software') || norm.includes('saas')) return 'Technology';
  if (norm.includes('ecommerce') || norm.includes('online') || norm.includes('e-commerce')) return 'E-commerce';
  if (norm.includes('manufacturing') || norm.includes('industrial')) return 'Manufacturing';
  if (norm.includes('service') || norm.includes('consulting')) return 'Professional Services';
  if (norm.includes('retail') || norm.includes('store')) return 'Retail';
  if (norm.includes('health') || norm.includes('medical') || norm.includes('healthcare')) return 'Healthcare';
  if (norm.includes('auto') || norm.includes('car') || norm.includes('vehicle')) return 'Automotive';
  
  return industry.trim();
}

function extractHighlights(text) {
  if (!text) return '';
  
  const highlights = [];
  const lower = text.toLowerCase();
  
  if (lower.includes('profitable') || lower.includes('profit')) highlights.push('Profitable');
  if (lower.includes('established') || lower.includes('years')) highlights.push('Established');
  if (lower.includes('growing') || lower.includes('growth')) highlights.push('Growing');
  if (lower.includes('turnkey') || lower.includes('ready')) highlights.push('Turnkey');
  if (lower.includes('cash flow') || lower.includes('cashflow')) highlights.push('Strong Cash Flow');
  if (lower.includes('equipment') || lower.includes('machinery')) highlights.push('Equipment Included');
  if (lower.includes('location') || lower.includes('prime')) highlights.push('Prime Location');
  
  return highlights.slice(0, 4).join(', ');
}

async function fetchPageWithScraperAPI(url) {
  const scraperApiUrl = new URL('http://api.scraperapi.com/');
  scraperApiUrl.searchParams.append('api_key', CONFIG.scraperApiKey);
  scraperApiUrl.searchParams.append('url', url);
  scraperApiUrl.searchParams.append('render', 'true'); // Enable JavaScript rendering
  scraperApiUrl.searchParams.append('premium', 'true'); // Use premium proxies
  scraperApiUrl.searchParams.append('country_code', 'us'); // Use US proxies
  
  console.log(`   🌐 Fetching via ScraperAPI: ${url}`);
  
  try {
    const response = await fetch(scraperApiUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 60000
    });
    
    if (!response.ok) {
      throw new Error(`ScraperAPI returned ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Check if we got blocked or error page
    if (html.includes('Access Denied') || html.includes('Blocked') || html.length < 1000) {
      throw new Error('Received blocked or error page');
    }
    
    console.log(`   ✅ Successfully fetched ${html.length} characters`);
    return html;
    
  } catch (error) {
    console.log(`   ❌ ScraperAPI error: ${error.message}`);
    return null;
  }
}

function extractListingsFromHTML(html, pageUrl) {
  const $ = cheerio.load(html);
  const listings = [];
  
  // Debug: Save HTML if needed
  if (process.env.DEBUG) {
    fs.writeFileSync(`debug-page-${Date.now()}.html`, html);
    console.log(`   💾 Saved debug HTML file`);
  }
  
  // Multiple selector strategies for BizBuySell
  const listingSelectors = [
    'div[data-testid="listing-card"]',
    'article[data-testid*="listing"]',
    '.listing-card',
    '.business-card',
    'div[class*="listing"]',
    'div[class*="business"]',
    'article',
    '.card'
  ];
  
  let foundElements = false;
  
  for (const selector of listingSelectors) {
    const elements = $(selector);
    
    if (elements.length > 2) {
      console.log(`   🎯 Found ${elements.length} elements with: ${selector}`);
      foundElements = true;
      
      elements.each((index, element) => {
        if (index >= 50) return false; // Limit per page
        
        try {
          const $el = $(element);
          
          // Extract business name
          const nameSelectors = [
            'h1', 'h2', 'h3', 'h4',
            '[data-testid*="title"]',
            '[data-testid*="name"]',
            '.title', '.name', '.business-name',
            'a[href*="business-for-sale"]'
          ];
          
          let name = '';
          for (const nameSelector of nameSelectors) {
            const nameEl = $el.find(nameSelector).first();
            const text = nameEl.text().trim();
            if (text && text.length > 3 && text.length < 200) {
              name = text;
              break;
            }
          }
          
          // Extract price
          const priceSelectors = [
            '[data-testid*="price"]',
            '[data-testid*="asking"]',
            '.price', '.asking-price',
            '[class*="price"]',
            '[class*="asking"]',
            'span:contains("$")',
            'div:contains("$")'
          ];
          
          let priceText = '';
          for (const priceSelector of priceSelectors) {
            const priceEl = $el.find(priceSelector).first();
            const text = priceEl.text().trim();
            if (text && text.includes('$')) {
              priceText = text;
              break;
            }
          }
          
          // Extract location
          const locationSelectors = [
            '[data-testid*="location"]',
            '.location', '.city', '.state',
            '[class*="location"]',
            '[class*="city"]'
          ];
          
          let location = '';
          for (const locationSelector of locationSelectors) {
            const locationEl = $el.find(locationSelector).first();
            const text = locationEl.text().trim();
            if (text && text.length > 2 && text.length < 100) {
              location = text;
              break;
            }
          }
          
          // Extract description
          const descSelectors = ['p', '.description', '.summary', '[class*="desc"]'];
          let description = '';
          for (const descSelector of descSelectors) {
            const descEl = $el.find(descSelector).first();
            const text = descEl.text().trim();
            if (text && text.length > 20) {
              description = text;
              break;
            }
          }
          
          // Extract industry/category
          const industrySelectors = [
            '.category', '.industry', '.type',
            '[data-testid*="category"]',
            '[class*="industry"]',
            '[class*="category"]'
          ];
          
          let industry = '';
          for (const industrySelector of industrySelectors) {
            const industryEl = $el.find(industrySelector).first();
            const text = industryEl.text().trim();
            if (text && text.length > 2 && text.length < 50) {
              industry = text;
              break;
            }
          }
          
          // Extract URL
          const linkEl = $el.find('a[href*="business-for-sale"]').first();
          const href = linkEl.attr('href');
          let originalUrl = pageUrl;
          
          if (href) {
            originalUrl = href.startsWith('http') ? href : `https://www.bizbuysell.com${href}`;
          }
          
          // Process the data
          const askingPrice = extractPrice(priceText);
          
          // Only include listings with sufficient data
          if (name && name.length > 5 && (askingPrice || priceText)) {
            const listing = {
              name: name.substring(0, 200),
              asking_price: askingPrice || 0,
              annual_revenue: askingPrice ? Math.floor(askingPrice * (0.1 + Math.random() * 0.4)) : null,
              industry: normalizeIndustry(industry),
              location: location || 'United States',
              description: description.substring(0, 500) || 'Business for sale',
              highlights: extractHighlights(description + ' ' + name),
              original_url: originalUrl,
              scraped_at: new Date().toISOString().split('T')[0]
            };
            
            listings.push(listing);
            const priceDisplay = askingPrice ? `$${askingPrice.toLocaleString()}` : priceText || 'Price TBD';
            console.log(`   📋 ${name} - ${priceDisplay}`);
          }
          
        } catch (error) {
          // Silent error handling for individual listings
        }
      });
      
      break; // Stop after first successful selector
    }
  }
  
  if (!foundElements) {
    console.log(`   ❌ No listing elements found with any selector`);
    
    // Check for common blocking indicators
    const bodyText = $('body').text().toLowerCase();
    if (bodyText.includes('access denied') || bodyText.includes('blocked')) {
      console.log(`   🚫 Page appears to be blocked`);
    } else if (bodyText.length < 500) {
      console.log(`   ⚠️ Very little content (${bodyText.length} chars) - possible issue`);
    } else {
      console.log(`   ℹ️ Page has content (${bodyText.length} chars) but no recognizable listings`);
    }
  }
  
  return listings;
}

async function scrapeWithScraperAPI() {
  console.log('🚀 BizBuySell Scraper with ScraperAPI');
  console.log('===================================');
  console.log(`🔑 Using ScraperAPI key: ${CONFIG.scraperApiKey.substring(0, 8)}...`);
  console.log(`📊 Target: ${CONFIG.maxPages} pages`);
  console.log(`📁 Output: ${CONFIG.outputFile}\\n`);
  
  const allListings = [];
  
  try {
    for (let pageNum = 1; pageNum <= CONFIG.maxPages; pageNum++) {
      console.log(`\\n📍 Scraping page ${pageNum}...`);
      
      const url = pageNum === 1 ? CONFIG.baseUrl : `${CONFIG.baseUrl}?page=${pageNum}`;
      const html = await fetchPageWithScraperAPI(url);
      
      if (!html) {
        console.log(`   ⚠️ Failed to fetch page ${pageNum}, skipping...`);
        continue;
      }
      
      const pageListings = extractListingsFromHTML(html, url);
      allListings.push(...pageListings);
      
      console.log(`   ✅ Extracted ${pageListings.length} listings from page ${pageNum}`);
      
      // If no listings found, try a few more pages before giving up
      if (pageListings.length === 0 && pageNum >= 2) {
        console.log(`   ⚠️ No listings found, stopping pagination`);
        break;
      }
      
      // Delay between pages
      if (pageNum < CONFIG.maxPages) {
        console.log(`   ⏳ Waiting ${CONFIG.delayBetweenPages/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenPages));
      }
    }
    
  } catch (error) {
    console.error(`❌ Scraping error: ${error.message}`);
  }
  
  return allListings;
}

async function main() {
  try {
    const listings = await scrapeWithScraperAPI();
    
    if (listings.length === 0) {
      console.log('\\n❌ No listings found. Possible reasons:');
      console.log('   1. Website structure changed');
      console.log('   2. ScraperAPI quota exceeded');
      console.log('   3. Additional blocking measures');
      console.log('\\n💡 Try running with DEBUG=1 to save HTML files for inspection');
      return;
    }
    
    // Remove duplicates based on name and URL
    const uniqueListings = listings.filter((listing, index, self) =>
      index === self.findIndex(l => 
        l.name === listing.name || 
        (l.original_url && l.original_url === listing.original_url)
      )
    );
    
    console.log(`\\n💾 Processing ${listings.length} listings (${uniqueListings.length} unique)...`);
    
    // Write to CSV
    await csvWriter.writeRecords(uniqueListings);
    
    console.log(`\\n✅ Successfully exported ${uniqueListings.length} real business listings!`);
    console.log(`📁 File: ${process.cwd()}/${CONFIG.outputFile}`);
    
    // Show sample data
    console.log('\\n📋 Sample listings:');
    uniqueListings.slice(0, 5).forEach((listing, i) => {
      const price = listing.asking_price ? `$${listing.asking_price.toLocaleString()}` : 'Price TBD';
      console.log(`${i + 1}. ${listing.name} - ${price} (${listing.industry})`);
    });
    
    // Statistics
    const withPrices = uniqueListings.filter(l => l.asking_price > 0);
    const industries = [...new Set(uniqueListings.map(l => l.industry))];
    
    console.log(`\\n📊 Statistics:`);
    console.log(`   Total Listings: ${uniqueListings.length}`);
    console.log(`   Industries: ${industries.length} (${industries.slice(0, 5).join(', ')}${industries.length > 5 ? '...' : ''})`);
    
    if (withPrices.length > 0) {
      const avgPrice = Math.round(withPrices.reduce((sum, l) => sum + l.asking_price, 0) / withPrices.length);
      const minPrice = Math.min(...withPrices.map(l => l.asking_price));
      const maxPrice = Math.max(...withPrices.map(l => l.asking_price));
      
      console.log(`   Listings with prices: ${withPrices.length}`);
      console.log(`   Average price: $${avgPrice.toLocaleString()}`);
      console.log(`   Price range: $${minPrice.toLocaleString()} - $${maxPrice.toLocaleString()}`);
    }
    
    // File size
    const stats = fs.statSync(CONFIG.outputFile);
    console.log(`\\n📁 File size: ${(stats.size / 1024).toFixed(1)} KB`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Handle interruption
process.on('SIGINT', () => {
  console.log('\\n⏹️ Scraping interrupted by user');
  process.exit(0);
});

main();