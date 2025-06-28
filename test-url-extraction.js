import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const CONFIG = {
  scraperApiKey: process.env.SCRAPER_API_KEY,
  baseUrl: 'https://www.bizbuysell.com/businesses-for-sale/'
};

async function fetchPageWithScraperAPI(url) {
  const scraperApiUrl = new URL('http://api.scraperapi.com/');
  scraperApiUrl.searchParams.append('api_key', CONFIG.scraperApiKey);
  scraperApiUrl.searchParams.append('url', url);
  scraperApiUrl.searchParams.append('country_code', 'us');
  
  console.log(`🌐 Fetching: ${url}`);
  
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
    console.log(`✅ Successfully fetched ${html.length} characters`);
    return html;
    
  } catch (error) {
    console.log(`❌ ScraperAPI error: ${error.message}`);
    return null;
  }
}

// Generate a default fallback URL based on source and listing ID
function createDefaultUrl(source, id) {
  const sourceMap = {
    'BizBuySell': 'https://www.bizbuysell.com/businesses/',
    'EmpireFlippers': 'https://empireflippers.com/marketplace/',
    'Flippa': 'https://flippa.com/businesses/',
    'MicroAcquire': 'https://microacquire.com/marketplace/',
    'QuietLight': 'https://quietlight.com/listings/',
    'ExitAdviser': 'https://exitadviser.com/businesses-for-sale/',
    'BizQuest': 'https://www.bizquest.com/business-for-sale/',
    'Acquire': 'https://acquire.com/startups/'
  };
  
  const baseUrl = sourceMap[source] || 'https://bizbuysell.com/businesses/';
  return `${baseUrl}${id || 'unknown-' + Date.now()}`;
}

// Validate if a URL is properly formed
function isValidUrl(urlString) {
  if (!urlString) return false;
  
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

function testUrlExtraction(html) {
  const $ = cheerio.load(html);
  const listings = [];
  
  // Try different selectors to find listing containers
  const selectors = [
    'div[data-testid="listing-card"]',
    'article[data-testid*="listing"]',
    '.listing-card',
    '.business-card',
    'div[class*="listing"]',
    'div[class*="business"]'
  ];
  
  let foundElements = false;
  
  for (const selector of selectors) {
    const elements = $(selector);
    
    if (elements.length > 2) {
      console.log(`🎯 Found ${elements.length} elements with: ${selector}`);
      foundElements = true;
      
      elements.each((index, element) => {
        if (index >= 5) return false; // Only test first 5
        
        try {
          const $el = $(element);
          
          // Extract business name
          const nameSelectors = ['h1', 'h2', 'h3', 'h4', '.title', '.name', '.business-name'];
          let name = '';
          for (const nameSelector of nameSelectors) {
            const nameEl = $el.find(nameSelector).first();
            const text = nameEl.text().trim();
            if (text && text.length > 3 && text.length < 200) {
              name = text;
              break;
            }
          }
          
          if (!name) return;
          
          // Extract URL - find the link that matches this specific business
          let originalUrl = null;
          
          // Look for a link that wraps the business name
          const nameElement = $el.find('h1, h2, h3, h4, .title, .name, .business-name').first();
          
          // Enhanced link extraction with multiple strategies
          // Strategy 1: Try to find a link that wraps or is near the business name
          let targetLink = nameElement.closest('a');
          if (!targetLink.length) {
            targetLink = nameElement.find('a').first();
          }
          if (!targetLink.length) {
            targetLink = nameElement.siblings('a').first();
          }
          if (!targetLink.length) {
            targetLink = nameElement.parent().find('a').first();
          }
          
          // Strategy 2: Try to find links with certain keywords in their href
          if (!targetLink.length) {
            targetLink = $el.find('a[href*="listing"], a[href*="business"], a[href*="opportunity"]').first();
          }
          
          // Get the href from the target link
          if (targetLink.length) {
            const href = targetLink.attr('href');
            if (href && (
              href.includes('/business-for-sale/') || 
              href.includes('/business-opportunity/') ||
              href.includes('/business-auction/') ||
              href.match(/\/\d+\/$/)
            )) {
              originalUrl = href.startsWith('http') ? href : `https://www.bizbuysell.com${href}`;
            }
          }
          
          // If still no URL, look for any business-related link in this element
          if (!originalUrl) {
            const allLinks = $el.find('a');
            allLinks.each((i, link) => {
              const href = $(link).attr('href');
              if (href && (
                href.includes('/business-for-sale/') || 
                href.includes('/business-opportunity/') ||
                href.includes('/business-auction/') ||
                href.includes('/listing/') ||
                href.match(/\/\d+\/$/) 
              )) {
                originalUrl = href.startsWith('http') ? href : `https://www.bizbuysell.com${href}`;
                return false;
              }
            });
          }
          
          // Create a unique ID for this listing for fallback URL generation
          const listingId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          
          // Fallback mechanism - if we still don't have a URL, create one
          if (!originalUrl) {
            originalUrl = createDefaultUrl('BizBuySell', listingId);
            console.log(`⚠️ Generated fallback URL: ${originalUrl}`);
          }
          
          console.log(`📋 ${name}`);
          console.log(`🔗 ${originalUrl || 'NO URL FOUND'}`);
          console.log('---');
          
          listings.push({ name, originalUrl });
          
        } catch (error) {
          console.log(`❌ Error processing listing: ${error.message}`);
        }
      });
      
      break;
    }
  }
  
  if (!foundElements) {
    console.log('❌ No listing elements found');
  }
  
  return listings;
}

async function main() {
  console.log('🔍 Testing URL Extraction from BizBuySell');
  console.log('==========================================');
  
  const html = await fetchPageWithScraperAPI(CONFIG.baseUrl);
  
  if (!html) {
    console.log('❌ Failed to fetch page');
    return;
  }
  
  const listings = testUrlExtraction(html);
  
  console.log(`\n✅ Extracted ${listings.length} listings`);
  
  // Validate all extracted URLs
  console.log('\n🧪 Validating URLs:');
  const urlResults = {
    valid: 0,
    invalid: 0,
    fallback: 0
  };
  
  for (const listing of listings) {
    const url = listing.originalUrl;
    const isValidFormat = isValidUrl(url);
    const isFallback = url && url.includes('unknown-');
    
    if (isValidFormat && !isFallback) {
      urlResults.valid++;
    } else if (isValidFormat && isFallback) {
      urlResults.fallback++;
    } else {
      urlResults.invalid++;
    }
  }
  
  console.log(`✅ Valid URLs: ${urlResults.valid}`);
  console.log(`⚠️ Fallback URLs: ${urlResults.fallback}`);
  console.log(`❌ Invalid URLs: ${urlResults.invalid}`);
  
  // Test first URL
  if (listings.length > 0 && listings[0].originalUrl) {
    console.log(`\n🧪 Testing first URL: ${listings[0].originalUrl}`);
    
    try {
      const testResponse = await fetch(listings[0].originalUrl, {
        method: 'HEAD',
        timeout: 10000
      });
      console.log(`✅ URL test result: ${testResponse.status} ${testResponse.statusText}`);
    } catch (error) {
      console.log(`❌ URL test failed: ${error.message}`);
    }
  }
  
  // Save results to file
  const resultsDir = path.join(process.cwd(), 'url-test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir);
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.writeFileSync(
    path.join(resultsDir, `url-extraction-test-${timestamp}.json`),
    JSON.stringify({
      listings,
      stats: {
        total: listings.length,
        ...urlResults
      }
    }, null, 2)
  );
  
  console.log(`\n✅ Results saved to url-test-results/url-extraction-test-${timestamp}.json`);
}

main().catch(console.error);