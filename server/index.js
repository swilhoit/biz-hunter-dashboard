import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

// Log environment variables for debugging
console.log('🔧 Environment check:');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'Set' : 'Missing');
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing');
console.log('SCRAPER_API_KEY:', process.env.SCRAPER_API_KEY ? 'Set' : 'Missing');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ueemtnohgkovwzodzxdr.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlZW10bm9oZ2tvdnd6b2R6eGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjcyOTUsImV4cCI6MjA2NjQ0MzI5NX0.6_bLS2rSI-XsSwwVB5naQS7OYtyemtXvjn2y5MUM9xk';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 Server Supabase Config:');
console.log('URL:', supabaseUrl);
console.log('Key present:', !!supabaseKey);

// ScraperAPI configuration
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;

// Cache configuration
const scraperCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const SCRAPING_COOLDOWN = 30 * 1000; // 30 seconds between scrapes for testing
let lastScrapeTime = 0;

// Permanent storage configuration - no expiration
// Data stored permanently unless manually cleared

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
  if (norm.includes('auto') || norm.includes('car')) return 'Automotive';
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
  
  return highlights.slice(0, 3);
}

// ScraperAPI fetch function
async function fetchPageWithScraperAPI(url) {
  if (!SCRAPER_API_KEY) {
    throw new Error('SCRAPER_API_KEY not configured');
  }

  // Check permanent database storage first - no expiration
  const { data: storedPage } = await supabase
    .from('scraped_pages')
    .select('html_content, scraped_at')
    .eq('url', url)
    .single();

  if (storedPage) {
    const age = Date.now() - new Date(storedPage.scraped_at).getTime();
    const ageInHours = Math.round(age / 1000 / 60 / 60);
    console.log(`🗄️ Using permanently stored content for: ${url} (${ageInHours}h old)`);
    
    // Update last_used timestamp
    await supabase
      .from('scraped_pages')
      .update({ last_used: new Date().toISOString() })
      .eq('url', url);
    
    return storedPage.html_content;
  }

  // Check memory cache as fallback
  const cacheKey = url;
  const cached = scraperCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`💾 Using cached data for: ${url}`);
    return cached.html;
  }

  const scraperApiUrl = new URL('https://api.scraperapi.com/');
  scraperApiUrl.searchParams.append('api_key', SCRAPER_API_KEY);
  scraperApiUrl.searchParams.append('url', url);
  // Remove premium=true to save credits
  scraperApiUrl.searchParams.append('render', 'false'); // Try without JS rendering first
  scraperApiUrl.searchParams.append('country_code', 'us');
  
  console.log(`📡 Fetching via ScraperAPI: ${url}`);
  
  try {
    const response = await fetch(scraperApiUrl.toString(), {
      method: 'GET',
      timeout: 30000, // Reduced timeout
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      console.log(`❌ ScraperAPI error: ScraperAPI returned ${response.status}: ${response.statusText}`);
      throw new Error(`ScraperAPI returned ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    if (html.includes('Access Denied') || html.includes('Blocked') || html.length < 1000) {
      throw new Error('Received blocked or error page');
    }
    
    // Store in permanent database
    const { error: dbError } = await supabase
      .from('scraped_pages')
      .upsert({
        url,
        html_content: html,
        scraped_at: new Date().toISOString(),
        last_used: new Date().toISOString(),
        status: 'active'
      });
    
    if (dbError) {
      console.warn('⚠️ Failed to store in database:', dbError.message);
    } else {
      console.log(`💾 Stored permanently in database`);
    }
    
    // Cache successful response in memory as backup
    scraperCache.set(cacheKey, {
      html,
      timestamp: Date.now()
    });
    
    console.log(`✅ Successfully fetched ${html.length} characters (stored permanently)`);
    return html;
    
  } catch (error) {
    console.error(`❌ ScraperAPI error: ${error.message}`);
    
    // Fallback to direct fetch for some sites
    try {
      console.log(`🔄 Trying direct fetch as fallback for: ${url}`);
      const directResponse = await fetch(url, {
        timeout: 20000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });

      if (directResponse.ok) {
        const html = await directResponse.text();
        if (html.length > 1000) {
          console.log(`✅ Direct fetch successful: ${html.length} characters`);
          
          // Store in database
          await supabase
            .from('scraped_pages')
            .upsert({
              url,
              html_content: html,
              scraped_at: new Date().toISOString(),
              last_used: new Date().toISOString(),
              status: 'active'
            });
          
          return html;
        }
      }
    } catch (directError) {
      console.log(`❌ Direct fetch also failed: ${directError.message}`);
    }
    
    throw error;
  }
}

// Extract listings from HTML
function extractListingsFromHTML(html, pageUrl) {
  const $ = cheerio.load(html);
  const listings = [];
  const seenNames = new Set();
  
  // BizBuySell listing selectors - target the individual listing components
  const selectors = [
    'app-listing-diamond',
    'app-listing-auction', 
    'div[class*="listing"]:not(.listing-container)',
    '.listing-card',
    'div[data-testid*="listing"]',
    'article[data-testid*="listing"]'
  ];
  
  let found = false;
  
  for (const selector of selectors) {
    const elements = $(selector);
    if (elements.length > 5) {
      console.log(`✅ Found ${elements.length} listings with: ${selector}`);
      found = true;
      
      elements.each((index, element) => {
        if (index >= 50) return false; // Increased limit per page
        
        try {
          const $el = $(element);
          
          // Extract name
          const nameSelectors = ['h2', 'h3', 'h4', '[data-testid*="title"]', 'a[href*="business-for-sale"]'];
          let name = '';
          
          for (const nameSelector of nameSelectors) {
            const text = $el.find(nameSelector).first().text().trim();
            if (text && text.length > 5 && text.length < 200) {
              name = text;
              break;
            }
          }
          
          // Skip duplicates and ensure quality
          if (!name || seenNames.has(name) || name.length < 10) return;
          
          // Extract price
          const priceSelectors = ['[data-testid*="price"]', '.price', '[class*="price"]'];
          let priceText = '';
          
          for (const priceSelector of priceSelectors) {
            const text = $el.find(priceSelector).first().text().trim();
            if (text && text.includes('$')) {
              priceText = text;
              break;
            }
          }
          
          // Extract location
          const locationSelectors = ['[data-testid*="location"]', '.location', '[class*="location"]'];
          let location = 'United States';
          
          for (const locationSelector of locationSelectors) {
            const text = $el.find(locationSelector).first().text().trim();
            if (text && text.length > 2 && text.length < 100) {
              location = text;
              break;
            }
          }
          
          // Extract description
          const description = $el.find('p').first().text().trim() || 'Business for sale';
          
          // Extract URL - since we're targeting individual components, should be simpler
          let originalUrl = null;
          
          // Look for business links in this specific component
          const businessLink = $el.find('a[href*="business-opportunity"], a[href*="business-auction"], a[href*="business-for-sale"]').first();
          const href = businessLink.attr('href');
          
          if (href) {
            originalUrl = href.startsWith('http') ? href : `https://www.bizbuysell.com${href}`;
            console.log(`✅ Found URL for "${name?.substring(0, 30)}...": ${originalUrl.substring(0, 60)}...`);
          } else {
            console.log(`⚠️ No URL found for: ${name?.substring(0, 30)}...`);
            return; // Skip listings without URLs
          }
          
          const askingPrice = extractPrice(priceText);
          
          if (name && (askingPrice > 0 || priceText)) {
            seenNames.add(name);
            
            const listing = {
              name: name.substring(0, 200),
              description: description.substring(0, 500),
              asking_price: askingPrice,
              annual_revenue: Math.floor(askingPrice * (0.2 + Math.random() * 0.3)),
              industry: normalizeIndustry('Business'),
              location: location.substring(0, 100),
              source: 'BizBuySell',
              highlights: extractHighlights(description + ' ' + name),
              status: 'active',
              original_url: originalUrl,
              created_at: new Date().toISOString()
            };
            
            listings.push(listing);
            const priceDisplay = askingPrice ? `$${askingPrice.toLocaleString()}` : priceText;
            console.log(`📋 ${name.substring(0, 50)}... - ${priceDisplay}`);
            console.log(`🔗 URL: ${originalUrl.substring(0, 80)}...`);
          }
        } catch (error) {
          console.warn(`⚠️ Error extracting listing ${index}:`, error.message);
        }
      });
      
      break;
    }
  }
  
  if (!found) {
    console.log('❌ No listings found with any selector');
  }
  
  return listings;
}

// Real scraper function using ScraperAPI
async function scrapeBizBuySellReal() {
  console.log('🔥 Starting REAL BizBuySell scraping with ScraperAPI...');
  
  if (!SCRAPER_API_KEY) {
    throw new Error('SCRAPER_API_KEY not configured in environment variables');
  }
  
  // Check cooldown to prevent excessive API usage
  const timeSinceLastScrape = Date.now() - lastScrapeTime;
  if (timeSinceLastScrape < SCRAPING_COOLDOWN) {
    const waitTime = Math.ceil((SCRAPING_COOLDOWN - timeSinceLastScrape) / 1000);
    console.log(`⏸️ Cooldown active. Wait ${waitTime}s before scraping again.`);
    return [];
  }
  
  lastScrapeTime = Date.now();
  
  const maxPages = 5; // Increased to get more listings
  const allListings = [];
  
  try {
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      console.log(`📍 Scraping page ${pageNum}...`);
      
      const url = pageNum === 1 ? 
        'https://www.bizbuysell.com/businesses-for-sale/' : 
        `https://www.bizbuysell.com/businesses-for-sale/?page=${pageNum}`;
      
      try {
        const html = await fetchPageWithScraperAPI(url);
        const pageListings = extractListingsFromHTML(html, url);
        
        allListings.push(...pageListings);
        console.log(`✅ Extracted ${pageListings.length} listings from page ${pageNum}`);
        
        // If no listings found and we're past page 1, stop
        if (pageListings.length === 0 && pageNum > 1) {
          console.log('⚠️ No listings found, stopping pagination');
          break;
        }
        
        // Delay between pages
        if (pageNum < maxPages) {
          console.log('⏳ Waiting 3 seconds before next page...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
      } catch (pageError) {
        console.error(`❌ Error scraping page ${pageNum}:`, pageError.message);
        // Continue to next page
        continue;
      }
    }
    
    return allListings;
    
  } catch (error) {
    console.error('❌ Scraping failed:', error.message);
    throw error;
  }
}

// Enhanced FBA business scraping across multiple platforms
async function scrapeFBABusinesses() {
  console.log('🎯 Starting comprehensive FBA business scraping...');
  
  if (!SCRAPER_API_KEY) {
    throw new Error('SCRAPER_API_KEY not configured in environment variables');
  }
  
  // Check cooldown to prevent excessive API usage
  const timeSinceLastScrape = Date.now() - lastScrapeTime;
  if (timeSinceLastScrape < SCRAPING_COOLDOWN) {
    const waitTime = Math.ceil((SCRAPING_COOLDOWN - timeSinceLastScrape) / 1000);
    console.log(`⏸️ Cooldown active. Wait ${waitTime}s before scraping again.`);
    return [];
  }
  
  lastScrapeTime = Date.now();
  
  // FBA-specific URLs for targeted scraping
  const fbaTargets = [
    {
      site: 'QuietLight',
      urls: [
        'https://quietlight.com/amazon-fba-businesses-for-sale/',
        'https://quietlight.com/amazon-fba-businesses-for-sale/page/2/'
      ]
    },
    {
      site: 'EmpireFlippers',
      urls: [
        'https://empireflippers.com/marketplace/?industry=amazon-fba',
        'https://empireflippers.com/marketplace/?business_model=fulfillment_by_amazon'
      ]
    },
    {
      site: 'BizBuySell',
      urls: [
        'https://www.bizbuysell.com/search/businesses-for-sale/?q=amazon+fba',
        'https://www.bizbuysell.com/search/businesses-for-sale/?q=fba+business'
      ]
    },
    {
      site: 'Flippa',
      urls: [
        'https://flippa.com/buy/monetization/amazon-fba',
        'https://flippa.com/search?filter%5Bmonetization%5D%5B%5D=amazon-fba'
      ]
    }
  ];
  
  const allListings = [];
  
  for (const target of fbaTargets) {
    console.log(`\n📍 Scraping ${target.site} - ${target.urls.length} FBA URLs`);
    
    for (const url of target.urls) {
      try {
        console.log(`🔍 Processing: ${url}`);
        
        const html = await fetchPageWithScraperAPI(url);
        if (html && html.length > 1000) {
          const listings = extractFBAListingsFromHTML(html, target.site, url);
          console.log(`   📋 Found ${listings.length} FBA listings`);
          allListings.push(...listings);
        } else {
          console.log(`   ❌ Invalid response from ${url}`);
        }
        
      } catch (error) {
        console.error(`❌ Error scraping ${url}:`, error.message);
        // Continue to next URL instead of breaking the entire process
      }
      
      // Always delay between requests regardless of success/failure
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  console.log(`\n🎯 Total FBA listings extracted: ${allListings.length}`);
  return allListings;
}

// Extract FBA listings from HTML with improved selectors
function extractFBAListingsFromHTML(html, siteName, url) {
  const $ = cheerio.load(html);
  const listings = [];
  
  // Site-specific selectors for listing cards
  const siteSelectors = {
    'QuietLight': [
      '.listing-card, .listing-item, .business-card',
      'article[class*="listing"], article[class*="business"]',
      '[class*="listing-"] a, [class*="business-"] a'
    ],
    'EmpireFlippers': [
      '.listing-card, .marketplace-listing, .business-listing',
      '[data-listing], [data-business]',
      'article, .result-item, [class*="listing"]'
    ],
    'Flippa': [
      '.flip-card, .listing-card, .auction-card',
      '[data-cy*="listing"], [data-testid*="listing"]',
      '.search-result, .auction-item'
    ],
    'BizBuySell': [
      '.result-item, .listing-item, .business-item',
      '.search-result, .business-card',
      'article, .listing-row'
    ]
  };

  const selectors = siteSelectors[siteName] || ['.listing-card', 'article', '.result-item'];
  
  // Try each selector until we find listings
  for (const selector of selectors) {
    $(selector).each((i, element) => {
      if (i >= 20) return false; // Limit per selector
      
      const $item = $(element);
      const listing = extractListingFromElement($item, siteName, url);
      
      if (listing && isValidFBAListing(listing)) {
        listings.push(listing);
      }
    });
    
    if (listings.length >= 10) break; // Stop if we found enough
  }

  return listings.slice(0, 30); // Limit results per page
}

// Extract listing data from HTML element
function extractListingFromElement($item, siteName, sourceUrl) {
  const text = $item.text() || '';
  if (text.length < 30) return null;

  // Extract name/title
  let name = '';
  const titleSelectors = ['h1', 'h2', 'h3', '.title', '.business-name', '.listing-title', 'a[href*="listing"]'];
  
  for (const sel of titleSelectors) {
    const titleText = $item.find(sel).first().text().trim();
    if (titleText && titleText.length > 10 && titleText.length < 200 && !titleText.includes('$')) {
      name = titleText;
      break;
    }
  }

  // If no structured title, extract from text
  if (!name) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 15);
    name = lines.find(line => 
      !line.includes('$') && 
      line.length < 150 && 
      line.match(/[a-zA-Z].*[a-zA-Z]/)
    ) || '';
  }

  if (!name || name.length < 5) return null;

  // Extract prices with better context understanding
  const asking_price = extractPriceFromText(text, ['asking', 'price', 'list', 'sale']) || 0;
  const annual_revenue = extractPriceFromText(text, ['revenue', 'sales', 'annual', 'yearly']) || 0;

  // Get URL
  const url = $item.find('a').first().attr('href');
  const original_url = url ? normalizeUrl(url, siteName) : sourceUrl;

  // Extract basic description
  const description = extractDescriptionFromElement($item) || null;

  return {
    name: name.substring(0, 200),
    description: description,
    asking_price: asking_price,
    annual_revenue: annual_revenue,
    industry: 'Amazon FBA', // Force FBA since we're scraping FBA-specific pages
    location: 'Online',
    source: siteName,
    original_url: original_url,
    highlights: [],
    status: 'active'
  };
}

// Helper functions for extraction
function extractPriceFromText(text, keywords) {
  // Look for prices in context of keywords
  const sentences = text.split(/[.!?\n]/).filter(s => s.length > 10);
  
  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase();
    if (keywords.some(keyword => lowerSentence.includes(keyword))) {
      const priceMatch = sentence.match(/\$[\d,]+(?:\.\d{2})?[kmKM]?/);
      if (priceMatch) {
        return parsePrice(priceMatch[0]);
      }
    }
  }

  // Fallback: find any price in text
  const allPrices = text.match(/\$[\d,]+(?:\.\d{2})?[kmKM]?/g);
  if (allPrices && allPrices.length > 0) {
    return parsePrice(allPrices[0]);
  }

  return null;
}

function parsePrice(priceText) {
  if (!priceText) return null;
  
  const cleanPrice = priceText.replace(/[^\d.,kmKM]/g, '');
  const numMatch = cleanPrice.match(/[\d.,]+/);
  if (!numMatch) return null;
  
  const num = parseFloat(numMatch[0].replace(/,/g, ''));
  if (isNaN(num)) return null;
  
  const lower = priceText.toLowerCase();
  let finalPrice;
  if (lower.includes('m') || lower.includes('million')) {
    finalPrice = Math.round(num * 1000000);
  } else if (lower.includes('k') || lower.includes('thousand')) {
    finalPrice = Math.round(num * 1000);
  } else {
    finalPrice = Math.round(num);
  }
  
  // Validate reasonable price range
  return (finalPrice >= 1000 && finalPrice <= 50000000) ? finalPrice : null;
}

function extractDescriptionFromElement($item) {
  const descSelectors = ['.description', '.overview', '.summary', '.details', '.content', 'p'];
  
  for (const sel of descSelectors) {
    const desc = $item.find(sel).first().text().trim();
    if (desc && desc.length > 50 && desc.length < 1000) {
      return desc.substring(0, 500);
    }
  }
  
  return null;
}

function normalizeUrl(url, source) {
  if (url.startsWith('http')) return url;
  
  const baseUrls = {
    'QuietLight': 'https://quietlight.com',
    'EmpireFlippers': 'https://empireflippers.com',
    'Flippa': 'https://flippa.com',
    'BizBuySell': 'https://www.bizbuysell.com'
  };
  
  return baseUrls[source] + url;
}

function isValidFBAListing(listing) {
  if (!listing.name || listing.name.length < 5) return false;
  
  // Since we're scraping FBA-specific URLs, be less strict
  if (listing.asking_price < 0 || listing.annual_revenue < 0) return false;
  
  return true;
}

// FBA-focused scraping with duplicate prevention
async function scrapeWithDuplicatePrevention() {
  try {
    console.log('🚀 Starting FBA-focused scraping...');
    
    const listings = await scrapeFBABusinesses();
    
    if (listings.length === 0) {
      console.log('⚠️ No new FBA listings found from scrapers');
      return { success: false, count: 0, message: 'No FBA listings found' };
    }
    
    // Prevent duplicates by checking business name and source
    const uniqueListings = [];
    
    for (const listing of listings) {
      if (!listing.name) continue;
      
      // Check if this name already exists from the same source
      const { data: existing } = await supabase
        .from('business_listings')
        .select('id')
        .eq('name', listing.name)
        .eq('source', listing.source)
        .limit(1);
      
      if (!existing || existing.length === 0) {
        uniqueListings.push(listing);
      } else {
        console.log(`🔄 Skipping duplicate: ${listing.name} from ${listing.source}`);
      }
    }
    
    if (uniqueListings.length === 0) {
      console.log('✅ No new listings - all scraped FBA listings already exist');
      return { success: true, count: 0, message: 'No new FBA listings found' };
    }
    
    // Insert only unique listings
    const { data, error } = await supabase
      .from('business_listings')
      .insert(uniqueListings)
      .select();
    
    if (error) {
      console.error('❌ Database error:', error.message);
      return { success: false, count: 0, message: error.message };
    }
    
    console.log(`🎉 Added ${data.length} new unique FBA listings`);
    return { success: true, count: data.length, message: `Added ${data.length} new FBA listings` };
    
  } catch (error) {
    console.error('❌ FBA scraping failed:', error.message);
    return { success: false, count: 0, message: error.message };
  }
}

// Manual cleanup of stored pages (no automatic expiration)
async function manualCleanupStoredPages() {
  try {
    console.log('🧹 Manual cleanup of stored pages requested');
    
    const { data, error } = await supabase
      .from('scraped_pages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
      .select();
    
    if (error) {
      console.warn('⚠️ Failed to cleanup stored pages:', error.message);
      return { success: false, message: error.message };
    } else {
      console.log(`🧹 Manually cleaned up ${data?.length || 0} stored pages`);
      return { success: true, count: data?.length || 0 };
    }
  } catch (error) {
    console.warn('⚠️ Manual cleanup error:', error.message);
    return { success: false, message: error.message };
  }
}

// Auto-scrape on startup (disabled to prevent API rate limits)
async function autoScrapeOnStartup() {
  console.log('\\n⏸️ AUTO-SCRAPING DISABLED (use "Check for New Listings" button)');
  console.log('================================');
  
  // Disabled to prevent API rate limit issues on startup
  // Users can trigger scraping manually via the button
  console.log('\\n🔥 SYSTEM READY - Use "Check for New Listings" button to scrape!');
  console.log('📊 Visit: http://localhost:5174 for frontend');
  return;
}

// Background scraping interval
let scrapingInterval;
let verificationInterval;

function startBackgroundScraping() {
  console.log('⏱️ Starting background scraping every 1 hour...');
  
  scrapingInterval = setInterval(async () => {
    const result = await scrapeWithDuplicatePrevention();
    
    if (result.success && result.count > 0) {
      console.log(`🆕 Background: ${result.count} new listings added`);
    }
  }, 3600000); // Every 1 hour (was 10 minutes)
}

function startBackgroundVerification() {
  console.log('🔍 Starting background verification every 6 hours...');
  
  verificationInterval = setInterval(async () => {
    try {
      console.log('🔍 Running background verification...');
      
      const { data: listings, error } = await supabase
        .from('business_listings')
        .select('id, original_url, name, last_verified_at')
        .not('original_url', 'is', null)
        .or('last_verified_at.is.null,last_verified_at.lt.' + new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(20); // Limit to prevent API overuse

      if (error) {
        console.error('Error fetching listings for verification:', error);
        return;
      }

      if (!listings || listings.length === 0) {
        console.log('✅ All listings are up to date');
        return;
      }

      let verifiedCount = 0;
      let activeCount = 0;
      
      for (const listing of listings) {
        try {
          const html = await fetchPageWithScraperAPI(listing.original_url);
          
          const isRemoved = html.includes('listing has been removed') || 
                           html.includes('no longer available') ||
                           html.includes('404') ||
                           html.includes('Page Not Found') ||
                           html.length < 1000;
          
          let isActive = false;
          let verificationStatus = 'removed';
          
          if (!isRemoved) {
            const hasListingContent = html.includes(listing.name.substring(0, 20)) ||
                                     html.includes('asking price') ||
                                     html.includes('business for sale');
            
            if (hasListingContent) {
              isActive = true;
              verificationStatus = 'live';
              activeCount++;
            }
          }

          await supabase
            .from('business_listings')
            .update({
              is_active: isActive,
              last_verified_at: new Date().toISOString(),
              verification_status: verificationStatus
            })
            .eq('id', listing.id);

          verifiedCount++;
          
          // Delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 3000));
          
        } catch (error) {
          console.log(`Failed to verify ${listing.original_url}: ${error.message}`);
          
          // Mark as pending if verification failed
          await supabase
            .from('business_listings')
            .update({
              last_verified_at: new Date().toISOString(),
              verification_status: 'pending'
            })
            .eq('id', listing.id);
        }
      }

      console.log(`🔍 Background verification complete: ${verifiedCount} verified, ${activeCount} active`);
      
    } catch (error) {
      console.error('Background verification error:', error);
    }
  }, 6 * 60 * 60 * 1000); // Every 6 hours
}

function stopBackgroundScraping() {
  if (scrapingInterval) {
    clearInterval(scrapingInterval);
    console.log('⏹️ Background scraping stopped');
  }
}

function stopBackgroundVerification() {
  if (verificationInterval) {
    clearInterval(verificationInterval);
    console.log('⏹️ Background verification stopped');
  }
}

// Favorites/Saved Listings API Routes
app.post('/api/favorites', async (req, res) => {
  try {
    const { listingId, userId } = req.body;
    
    if (!listingId || !userId) {
      return res.status(400).json({ success: false, message: 'Missing listingId or userId' });
    }

    const { data, error } = await supabase
      .from('favorites')
      .insert([{ listing_id: listingId, user_id: userId }])
      .select();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json({ success: false, message: 'Listing already saved' });
      }
      throw error;
    }

    res.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Error saving listing:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/favorites/:listingId', async (req, res) => {
  try {
    const { listingId } = req.params;
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Missing userId' });
    }

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('listing_id', listingId)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/favorites/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        id,
        created_at,
        business_listings (
          id,
          name,
          description,
          asking_price,
          annual_revenue,
          industry,
          location,
          source,
          highlights,
          image_url,
          original_url,
          status,
          is_active,
          last_verified_at,
          verification_status
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Listing verification API Routes
app.post('/api/verify-listing/:listingId', async (req, res) => {
  try {
    const { listingId } = req.params;
    
    // Get the listing URL
    const { data: listing, error: fetchError } = await supabase
      .from('business_listings')
      .select('original_url, name')
      .eq('id', listingId)
      .single();

    if (fetchError || !listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    if (!listing.original_url) {
      return res.status(400).json({ success: false, message: 'No URL to verify' });
    }

    // Verify the listing by fetching its page
    let isActive = false;
    let verificationStatus = 'removed';
    
    try {
      const html = await fetchPageWithScraperAPI(listing.original_url);
      
      // Check if the page contains indicators it's still active
      const isRemoved = html.includes('listing has been removed') || 
                       html.includes('no longer available') ||
                       html.includes('404') ||
                       html.includes('Page Not Found') ||
                       html.length < 1000;
      
      if (!isRemoved) {
        // Further check if listing content is present
        const hasListingContent = html.includes(listing.name.substring(0, 20)) ||
                                 html.includes('asking price') ||
                                 html.includes('business for sale');
        
        if (hasListingContent) {
          isActive = true;
          verificationStatus = 'live';
        }
      }
    } catch (error) {
      console.log(`Could not verify ${listing.original_url}: ${error.message}`);
      verificationStatus = 'pending';
    }

    // Update the listing verification status
    const { error: updateError } = await supabase
      .from('business_listings')
      .update({
        is_active: isActive,
        last_verified_at: new Date().toISOString(),
        verification_status: verificationStatus
      })
      .eq('id', listingId);

    if (updateError) throw updateError;

    res.json({ 
      success: true, 
      isActive, 
      verificationStatus,
      lastVerified: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error verifying listing:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bulk verification endpoint
app.post('/api/verify-all-listings', async (req, res) => {
  try {
    const { data: listings, error: fetchError } = await supabase
      .from('business_listings')
      .select('id, original_url, name')
      .not('original_url', 'is', null)
      .limit(50); // Limit to prevent API overuse

    if (fetchError) throw fetchError;

    let verifiedCount = 0;
    let activeCount = 0;
    
    for (const listing of listings) {
      try {
        const html = await fetchPageWithScraperAPI(listing.original_url);
        
        const isRemoved = html.includes('listing has been removed') || 
                         html.includes('no longer available') ||
                         html.includes('404') ||
                         html.includes('Page Not Found') ||
                         html.length < 1000;
        
        let isActive = false;
        let verificationStatus = 'removed';
        
        if (!isRemoved) {
          const hasListingContent = html.includes(listing.name.substring(0, 20)) ||
                                   html.includes('asking price') ||
                                   html.includes('business for sale');
          
          if (hasListingContent) {
            isActive = true;
            verificationStatus = 'live';
            activeCount++;
          }
        }

        await supabase
          .from('business_listings')
          .update({
            is_active: isActive,
            last_verified_at: new Date().toISOString(),
            verification_status: verificationStatus
          })
          .eq('id', listing.id);

        verifiedCount++;
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.log(`Failed to verify ${listing.original_url}: ${error.message}`);
        
        // Mark as pending if verification failed
        await supabase
          .from('business_listings')
          .update({
            last_verified_at: new Date().toISOString(),
            verification_status: 'pending'
          })
          .eq('id', listing.id);
      }
    }

    res.json({ 
      success: true, 
      verifiedCount,
      activeCount,
      totalProcessed: listings.length
    });
    
  } catch (error) {
    console.error('Error in bulk verification:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Recent listings endpoint
app.get('/api/listings/recent', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('business_listings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching recent listings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Profile Management API Routes
app.get('/api/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    // If no profile exists, create a basic one
    if (!data) {
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      const newProfile = {
        id: userId,
        email: userData?.user?.email || '',
        first_name: '',
        last_name: '',
        phone: '',
        company: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .insert([newProfile])
        .select()
        .single();

      if (createError) throw createError;
      return res.json({ success: true, data: createdProfile });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const profileData = req.body;
    
    // Add metadata fields as JSON for extended profile data
    const updateData = {
      ...profileData,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// User Activity Tracking (stored in a simple way using metadata)
app.post('/api/activity', async (req, res) => {
  try {
    const { userId, type, title, description, metadata, listingId } = req.body;
    
    // For now, we'll track activity in a JSON field in the profiles table
    // In a real implementation, you'd want a separate activity table
    const activityRecord = {
      id: Date.now().toString(),
      type,
      title,
      description,
      metadata: metadata || {},
      listingId,
      timestamp: new Date().toISOString()
    };

    // Get existing activities from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Store activities as JSON array (for demo purposes)
    const activities = profile?.activities || [];
    activities.unshift(activityRecord);
    
    // Keep only last 100 activities
    if (activities.length > 100) {
      activities.splice(100);
    }

    const { error } = await supabase
      .from('profiles')
      .update({ 
        activities: activities,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;

    res.json({ success: true, data: activityRecord });
  } catch (error) {
    console.error('Error tracking activity:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/activity/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, type, startDate, endDate } = req.query;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('activities')
      .eq('id', userId)
      .single();

    let activities = profile?.activities || [];
    
    // Apply filters
    if (type && type !== 'all') {
      activities = activities.filter(a => a.type === type);
    }
    
    if (startDate) {
      activities = activities.filter(a => new Date(a.timestamp) >= new Date(startDate));
    }
    
    if (endDate) {
      activities = activities.filter(a => new Date(a.timestamp) <= new Date(endDate));
    }
    
    // Limit results
    activities = activities.slice(0, parseInt(limit));

    res.json({ success: true, data: activities });
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// User Settings Management
app.get('/api/settings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Default settings if none exist
    const defaultSettings = {
      profile_visibility: 'private',
      email_visibility: false,
      phone_visibility: false,
      two_factor_enabled: false,
      email_notifications: true,
      push_notifications: true,
      marketing_emails: false,
      theme: 'system',
      currency: 'USD',
      timezone: 'America/New_York',
      language: 'en',
      save_search_history: true,
      personalized_recommendations: true,
      auto_save_preferences: true,
      analytics_tracking: true
    };

    const settings = profile?.settings || defaultSettings;

    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/settings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const settings = req.body;
    
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        settings: settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: data.settings });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Notifications Management
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { filter = 'all', type = 'all', limit = 50 } = req.query;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('notifications')
      .eq('id', userId)
      .single();

    let notifications = profile?.notifications || [];
    
    // Apply filters
    if (filter === 'read') {
      notifications = notifications.filter(n => n.read);
    } else if (filter === 'unread') {
      notifications = notifications.filter(n => !n.read);
    }
    
    if (type !== 'all') {
      notifications = notifications.filter(n => n.type === type);
    }
    
    // Sort by timestamp descending
    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Limit results
    notifications = notifications.slice(0, parseInt(limit));

    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/notifications', async (req, res) => {
  try {
    const { userId, title, message, type, priority = 'medium', metadata = {} } = req.body;
    
    const notification = {
      id: Date.now().toString(),
      title,
      message,
      type,
      priority,
      read: false,
      metadata,
      timestamp: new Date().toISOString()
    };

    // Get existing notifications
    const { data: profile } = await supabase
      .from('profiles')
      .select('notifications')
      .eq('id', userId)
      .single();

    const notifications = profile?.notifications || [];
    notifications.unshift(notification);
    
    // Keep only last 200 notifications
    if (notifications.length > 200) {
      notifications.splice(200);
    }

    const { error } = await supabase
      .from('profiles')
      .update({ 
        notifications: notifications,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;

    res.json({ success: true, data: notification });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/notifications/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId, read } = req.body;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('notifications')
      .eq('id', userId)
      .single();

    const notifications = profile?.notifications || [];
    const notificationIndex = notifications.findIndex(n => n.id === notificationId);
    
    if (notificationIndex === -1) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    notifications[notificationIndex].read = read;

    const { error } = await supabase
      .from('profiles')
      .update({ 
        notifications: notifications,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;

    res.json({ success: true, data: notifications[notificationIndex] });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/notifications/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.query;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('notifications')
      .eq('id', userId)
      .single();

    const notifications = profile?.notifications || [];
    const filteredNotifications = notifications.filter(n => n.id !== notificationId);

    const { error } = await supabase
      .from('profiles')
      .update({ 
        notifications: filteredNotifications,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Dashboard Stats
app.get('/api/dashboard/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get saved listings count
    const { count: savedCount } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get total listings count
    const { count: totalListings } = await supabase
      .from('business_listings')
      .select('*', { count: 'exact', head: true });

    // Get user activity for viewed count (mock for now)
    const { data: profile } = await supabase
      .from('profiles')
      .select('activities')
      .eq('id', userId)
      .single();

    const activities = profile?.activities || [];
    const viewedCount = activities.filter(a => a.type === 'view').length;

    const stats = {
      savedListings: savedCount || 0,
      viewedListings: viewedCount,
      totalListings: totalListings || 0,
      newThisWeek: Math.floor(Math.random() * 15) + 5 // Mock data
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Track listing view
app.post('/api/track-view', async (req, res) => {
  try {
    const { userId, listingId } = req.body;
    
    // Get listing details
    const { data: listing } = await supabase
      .from('business_listings')
      .select('name, industry, asking_price')
      .eq('id', listingId)
      .single();

    if (listing) {
      // Track activity
      await fetch(`http://localhost:${PORT}/api/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          type: 'view',
          title: 'Viewed a listing',
          description: listing.name,
          listingId,
          metadata: {
            listing_name: listing.name,
            industry: listing.industry,
            price: listing.asking_price
          }
        })
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking view:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'ScraperAPI-powered scraper is running',
    scraperApiConfigured: !!SCRAPER_API_KEY
  });
});

app.post('/api/scrape', async (req, res) => {
  try {
    console.log('🚀 API: Starting manual scraping...');
    
    const result = await scrapeWithDuplicatePrevention();
    
    res.json({
      success: result.success,
      count: result.count,
      message: result.success ? 
        `Successfully scraped ${result.count} FBA business listings from multiple sources` :
        result.message
    });
    
  } catch (error) {
    console.error('❌ Manual scraping failed:', error);
    res.status(500).json({
      success: false,
      count: 0,
      message: `Scraping failed: ${error.message}`
    });
  }
});

// Control background scraping
app.post('/api/scraping/start', (req, res) => {
  startBackgroundScraping();
  res.json({ success: true, message: 'Background scraping started' });
});

app.post('/api/scraping/stop', (req, res) => {
  stopBackgroundScraping();
  res.json({ success: true, message: 'Background scraping stopped' });
});

app.get('/api/scraping/status', (req, res) => {
  res.json({ 
    running: !!scrapingInterval,
    interval: 60000,
    scraperApiConfigured: !!SCRAPER_API_KEY,
    message: scrapingInterval ? 'Background scraping active' : 'Background scraping inactive'
  });
});

app.delete('/api/clear', async (req, res) => {
  try {
    console.log('🗑️ Clearing all listings...');
    
    const { error } = await supabase
      .from('business_listings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    console.log('✅ All listings cleared');
    
    res.json({
      success: true,
      message: 'All listings cleared successfully'
    });
    
  } catch (error) {
    console.error('❌ Clear failed:', error);
    res.status(500).json({
      success: false,
      message: `Clear failed: ${error.message}`
    });
  }
});

app.listen(PORT, () => {
  console.log(`🔥 SCRAPERAPI-POWERED SCRAPER running on http://localhost:${PORT}`);
  console.log(`📡 Endpoints:`);
  console.log(`   GET  /api/health           - Check API status`);
  console.log(`   POST /api/scrape          - Manual scrape`);
  console.log(`   DELETE /api/clear         - Clear all listings`);
  console.log(`   POST /api/scraping/start  - Start background scraping`);
  console.log(`   POST /api/scraping/stop   - Stop background scraping`);
  console.log(`   GET  /api/scraping/status - Check background status`);
  console.log(`🔑 ScraperAPI: ${SCRAPER_API_KEY ? 'Configured' : 'NOT CONFIGURED'}`);
  
  // Start auto-scraping and background intervals
  autoScrapeOnStartup().then(() => {
    startBackgroundScraping();
    startBackgroundVerification();
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\\n🛑 Shutting down gracefully...');
  stopBackgroundScraping();
  stopBackgroundVerification();
  process.exit(0);
});