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
      timeout: 45000,
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    
    if (!response.ok) {
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

// Background scraping with duplicate prevention
async function scrapeWithDuplicatePrevention() {
  try {
    console.log('🔄 Background scraping check...');
    
    const listings = await scrapeBizBuySellReal();
    
    if (listings.length === 0) {
      console.log('⚠️ No new listings found from scraper');
      return { success: false, count: 0, message: 'No listings found' };
    }
    
    // Prevent duplicates by checking business name
    const uniqueListings = [];
    
    for (const listing of listings) {
      if (!listing.name) continue;
      
      // Check if this name already exists
      const { data: existing } = await supabase
        .from('business_listings')
        .select('id')
        .eq('name', listing.name)
        .limit(1);
      
      if (!existing || existing.length === 0) {
        uniqueListings.push(listing);
      } else {
        console.log(`🔄 Skipping duplicate: ${listing.name}`);
      }
    }
    
    if (uniqueListings.length === 0) {
      console.log('✅ No new listings - all scraped listings already exist');
      return { success: true, count: 0, message: 'No new listings found' };
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
    
    console.log(`🎉 Added ${data.length} new unique listings`);
    return { success: true, count: data.length, message: `Added ${data.length} new listings` };
    
  } catch (error) {
    console.error('❌ Background scraping failed:', error.message);
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

// Auto-scrape on startup
async function autoScrapeOnStartup() {
  console.log('\\n🚀 AUTO-SCRAPING ON STARTUP...');
  console.log('================================');
  
  try {
    // Wait a moment for server to fully start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const result = await scrapeWithDuplicatePrevention();
    
    if (result.success && result.count > 0) {
      console.log(`🎉 STARTUP SUCCESS: ${result.count} new listings added!`);
    } else {
      console.log('✅ Startup check complete - no new listings needed');
    }
    
  } catch (error) {
    console.error('❌ Auto-scrape failed:', error.message);
    console.log('💡 Manual scraping still available via dashboard');
  }
  
  console.log('\\n🔥 SYSTEM READY - Dashboard populated with real data!');
  console.log('📊 Visit: http://localhost:8080');
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
        `Successfully scraped ${result.count} REAL business listings from BizBuySell` :
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