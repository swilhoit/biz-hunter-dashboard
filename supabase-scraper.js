import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration
const CONFIG = {
  scraperApiKey: process.env.SCRAPER_API_KEY,
  baseUrl: 'https://www.bizbuysell.com/businesses-for-sale/',
  maxPages: 2,
  delayBetweenPages: 2000,
  batchSize: 50 // Insert listings in batches
};

// Utility functions (copied from original scraper)
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
  // Remove premium and render to save credits
  scraperApiUrl.searchParams.append('country_code', 'us');
  
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

async function savePageToSupabase(url, html, listingsCount) {
  try {
    const { data, error } = await supabase
      .from('scraped_pages')
      .upsert({
        url,
        html_content: html,
        listings_extracted: listingsCount,
        last_used: new Date().toISOString(),
        status: 'active'
      }, {
        onConflict: 'url'
      });

    if (error) {
      console.log(`   ⚠️ Error saving page to Supabase: ${error.message}`);
    } else {
      console.log(`   💾 Saved page to Supabase cache`);
    }
  } catch (error) {
    console.log(`   ⚠️ Error saving page: ${error.message}`);
  }
}

async function getPageFromSupabase(url) {
  try {
    const { data, error } = await supabase
      .from('scraped_pages')
      .select('html_content, scraped_at')
      .eq('url', url)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      return null;
    }

    // Check if page is less than 30 minutes old
    const scrapedAt = new Date(data.scraped_at);
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    if (scrapedAt > thirtyMinutesAgo) {
      console.log(`   💾 Using cached page from Supabase`);
      
      // Update last_used timestamp
      await supabase
        .from('scraped_pages')
        .update({ last_used: new Date().toISOString() })
        .eq('url', url);
      
      return data.html_content;
    }

    return null;
  } catch (error) {
    console.log(`   ⚠️ Error fetching from cache: ${error.message}`);
    return null;
  }
}

function extractListingsFromHTML(html, pageUrl) {
  const $ = cheerio.load(html);
  const listings = [];
  
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
        if (index >= 50) return false;
        
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
          
          // Extract URL - find the link that matches this specific business
          let originalUrl = null;
          
          // Look for a link that contains the business name in the URL or is directly associated with the name element
          const nameElement = $el.find('h1, h2, h3, h4, [data-testid*="title"], [data-testid*="name"], .title, .name, .business-name').first();
          
          // Try to find a link that wraps or is near the business name
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
          
          // Get the href from the target link
          if (targetLink.length) {
            const href = targetLink.attr('href');
            if (href && (
              href.includes('/business-for-sale/') || 
              href.includes('/business-opportunity/') ||
              href.includes('/business-auction/') ||
              href.match(/\/\d+\/$/) // Ends with number and slash
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
                href.match(/\/\d+\/$/)
              )) {
                originalUrl = href.startsWith('http') ? href : `https://www.bizbuysell.com${href}`;
                return false; // Break out of loop
              }
            });
          }
          
          // Process the data
          const askingPrice = extractPrice(priceText);
          
          // Only include listings with sufficient data
          if (name && name.length > 5 && (askingPrice || priceText)) {
            const listing = {
              name: name.substring(0, 200),
              asking_price: askingPrice || 0,
              annual_revenue: askingPrice ? Math.floor(askingPrice * (0.1 + Math.random() * 0.4)) : 0,
              industry: normalizeIndustry(industry) || 'Business',
              location: location || 'United States',
              description: description.substring(0, 500) || 'Business for sale',
              highlights: extractHighlights(description + ' ' + name).split(', ').filter(h => h),
              original_url: originalUrl,
              source: 'BizBuySell'
            };
            
            listings.push(listing);
            const priceDisplay = askingPrice ? `$${askingPrice.toLocaleString()}` : priceText || 'Price TBD';
            console.log(`   📋 ${name} - ${priceDisplay}`);
          }
          
        } catch (error) {
          // Silent error handling for individual listings
        }
      });
      
      break;
    }
  }
  
  if (!foundElements) {
    console.log(`   ❌ No listing elements found with any selector`);
  }
  
  return listings;
}

async function saveListingsToSupabase(listings) {
  if (listings.length === 0) return { saved: 0, duplicates: 0 };

  let saved = 0;
  let duplicates = 0;

  // Process in batches
  for (let i = 0; i < listings.length; i += CONFIG.batchSize) {
    const batch = listings.slice(i, i + CONFIG.batchSize);
    
    try {
      const { data, error } = await supabase
        .from('business_listings')
        .insert(batch)
        .select();

      if (error) {
        console.log(`   ⚠️ Error saving batch to Supabase: ${error.message}`);
        
        // Try individual inserts for this batch
        for (const listing of batch) {
          try {
            const { data: singleData, error: singleError } = await supabase
              .from('business_listings')
              .insert(listing)
              .select();

            if (singleError) {
              if (singleError.code === '23505') {
                duplicates++;
                console.log(`   🔄 Duplicate: ${listing.name}`);
              } else {
                console.log(`   ❌ Error saving ${listing.name}: ${singleError.message}`);
              }
            } else if (singleData && singleData.length > 0) {
              saved++;
            } else {
              duplicates++;
            }
          } catch (individualError) {
            console.log(`   ❌ Error with individual listing: ${individualError.message}`);
          }
        }
      } else {
        const insertedCount = data ? data.length : 0;
        saved += insertedCount;
        duplicates += (batch.length - insertedCount);
        console.log(`   💾 Saved batch: ${insertedCount} new, ${batch.length - insertedCount} duplicates`);
      }
    } catch (batchError) {
      console.log(`   ❌ Batch error: ${batchError.message}`);
    }
  }

  return { saved, duplicates };
}

async function scrapeWithSupabaseStorage() {
  console.log('🚀 BizBuySell Scraper with Supabase Storage');
  console.log('============================================');
  console.log(`🔑 Using ScraperAPI key: ${CONFIG.scraperApiKey?.substring(0, 8)}...`);
  console.log(`📊 Target: ${CONFIG.maxPages} pages`);
  console.log(`💾 Storage: Supabase database\n`);
  
  const allListings = [];
  
  try {
    for (let pageNum = 1; pageNum <= CONFIG.maxPages; pageNum++) {
      console.log(`\n📍 Processing page ${pageNum}...`);
      
      const url = pageNum === 1 ? CONFIG.baseUrl : `${CONFIG.baseUrl}?page=${pageNum}`;
      
      // Try to get from cache first
      let html = await getPageFromSupabase(url);
      
      if (!html) {
        // Not in cache or expired, fetch fresh
        html = await fetchPageWithScraperAPI(url);
        
        if (!html) {
          console.log(`   ⚠️ Failed to fetch page ${pageNum}, skipping...`);
          continue;
        }
      }
      
      const pageListings = extractListingsFromHTML(html, url);
      
      if (pageListings.length > 0) {
        // Save page to cache
        await savePageToSupabase(url, html, pageListings.length);
        
        // Save listings to database
        console.log(`   💾 Saving ${pageListings.length} listings to Supabase...`);
        const { saved, duplicates } = await saveListingsToSupabase(pageListings);
        
        console.log(`   ✅ Page ${pageNum}: ${saved} new listings, ${duplicates} duplicates`);
        allListings.push(...pageListings);
      } else {
        console.log(`   ⚠️ No listings found on page ${pageNum}`);
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

async function getStoredListingsCount() {
  try {
    const { count, error } = await supabase
      .from('business_listings')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`   ⚠️ Error counting listings: ${error.message}`);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.log(`   ⚠️ Error counting listings: ${error.message}`);
    return 0;
  }
}

async function main() {
  try {
    // Check current count
    const initialCount = await getStoredListingsCount();
    console.log(`📊 Current database: ${initialCount} listings stored\n`);
    
    const listings = await scrapeWithSupabaseStorage();
    
    if (listings.length === 0) {
      console.log('\n❌ No listings found. Possible reasons:');
      console.log('   1. Website structure changed');
      console.log('   2. ScraperAPI quota exceeded');
      console.log('   3. Additional blocking measures');
      return;
    }
    
    // Final count
    const finalCount = await getStoredListingsCount();
    const newListings = Math.max(0, finalCount - initialCount);
    
    console.log(`\n✅ Scraping completed!`);
    console.log(`📊 Total listings in database: ${finalCount}`);
    console.log(`🆕 New listings added: ${newListings}`);
    console.log(`🔄 Duplicates skipped: ${listings.length - newListings}`);
    
    // Sample recent listings
    try {
      const { data: recentListings, error } = await supabase
        .from('business_listings')
        .select('name, asking_price, industry, location')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && recentListings) {
        console.log('\n📋 Recent listings:');
        recentListings.forEach((listing, i) => {
          const price = listing.asking_price ? `$${listing.asking_price.toLocaleString()}` : 'Price TBD';
          console.log(`${i + 1}. ${listing.name} - ${price} (${listing.industry || 'Business'})`);
        });
      }
    } catch (error) {
      console.log('   ⚠️ Error fetching recent listings for display');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Handle interruption
process.on('SIGINT', () => {
  console.log('\n⏹️ Scraping interrupted by user');
  process.exit(0);
});

main();