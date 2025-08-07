import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ueemtnohgkovwzodzxdr.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlZW10bm9oZ2tvdnd6b2R6eGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjcyOTUsImV4cCI6MjA2NjQ0MzI5NX0.6_bLS2rSI-XsSwwVB5naQS7OYtyemtXvjn2y5MUM9xk';
const supabase = createClient(supabaseUrl, supabaseKey);

// ScraperAPI configuration
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;

class ImprovedBizBuySellScraper {
  constructor() {
    this.totalFound = 0;
    this.totalSaved = 0;
    this.totalSkipped = 0;
  }

  // Keywords that indicate e-commerce businesses
  isEcommerceBusiness(title, description, industry) {
    const searchText = `${title || ''} ${description || ''} ${industry || ''}`.toLowerCase();
    
    // E-commerce indicators (must have at least one)
    const ecommerceKeywords = [
      'ecommerce', 'e-commerce', 'online', 'internet', 'amazon', 'fba',
      'shopify', 'dropship', 'digital', 'web store', 'marketplace',
      'etsy', 'ebay', 'subscription box', 'saas', 'software',
      'website', 'app', 'mobile app', 'online store', 'online business',
      'digital marketing', 'affiliate', 'online course', 'membership site'
    ];
    
    // Non-ecommerce indicators (exclude if found)
    const nonEcommerceKeywords = [
      'restaurant', 'bar', 'cafe', 'coffee shop', 'pizza', 'bakery',
      'salon', 'spa', 'barbershop', 'hair', 'nail',
      'daycare', 'childcare', 'preschool',
      'laundromat', 'dry cleaning', 'car wash', 'auto repair',
      'gas station', 'convenience store', 'liquor store',
      'gym', 'fitness center', 'yoga studio',
      'hotel', 'motel', 'bed and breakfast',
      'medical', 'dental', 'clinic', 'pharmacy',
      'plumbing', 'hvac', 'electrical', 'construction',
      'landscaping', 'lawn care', 'pool service',
      'real estate office', 'property management',
      'manufacturing', 'wholesale', 'distribution center',
      'trucking', 'logistics', 'freight',
      'franchise location', 'brick and mortar only', 'physical location only'
    ];
    
    const hasEcommerceKeywords = ecommerceKeywords.some(keyword => searchText.includes(keyword));
    const hasNonEcommerceKeywords = nonEcommerceKeywords.some(keyword => searchText.includes(keyword));
    
    // Only include if it has ecommerce keywords AND doesn't have non-ecommerce keywords
    return hasEcommerceKeywords && !hasNonEcommerceKeywords;
  }

  async fetchPage(url, retries = 2) {
    console.log(`Fetching: ${url}`);
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        if (SCRAPER_API_KEY) {
          const scraperUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}&render=true&country_code=us`;
          const response = await fetch(scraperUrl, { 
            timeout: 60000,
            headers: {
              'Accept': 'text/html,application/xhtml+xml',
              'Accept-Language': 'en-US,en;q=0.9'
            }
          });
          
          if (response.ok) {
            return await response.text();
          }
        } else {
          // Fallback to direct fetch
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'text/html,application/xhtml+xml',
              'Accept-Language': 'en-US,en;q=0.9'
            }
          });
          
          if (response.ok) {
            return await response.text();
          }
        }
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error.message);
        if (attempt === retries) throw error;
      }
    }
  }

  extractPrice(priceText) {
    if (!priceText) return null;
    const cleaned = priceText.replace(/[^0-9]/g, '');
    return cleaned ? parseInt(cleaned) : null;
  }

  async scrapeBizBuySell() {
    console.log('🚀 Starting Improved BizBuySell E-commerce Scraper\n');
    
    // Use more specific search URLs for e-commerce businesses
    const searchUrls = [
      'https://www.bizbuysell.com/businesses-for-sale/?q=ecommerce',
      'https://www.bizbuysell.com/businesses-for-sale/?q=amazon+fba',
      'https://www.bizbuysell.com/businesses-for-sale/?q=online+business',
      'https://www.bizbuysell.com/businesses-for-sale/?q=shopify',
      'https://www.bizbuysell.com/businesses-for-sale/?q=dropshipping',
      'https://www.bizbuysell.com/internet-businesses-for-sale/',
      'https://www.bizbuysell.com/online-businesses-for-sale/'
    ];
    
    const allListings = [];
    
    for (const searchUrl of searchUrls) {
      console.log(`\n📍 Searching: ${searchUrl}`);
      
      try {
        const html = await this.fetchPage(searchUrl);
        const $ = cheerio.load(html);
        
        // Find listing cards
        const listings = $('.listing, .result, [class*="listing-card"], [class*="business-card"]');
        console.log(`Found ${listings.length} listings on this page`);
        
        listings.each((index, element) => {
          const $listing = $(element);
          
          // Extract listing details
          const title = $listing.find('h2, h3, .title, .business-title').first().text().trim();
          const priceText = $listing.find('.price, .asking-price, [class*="price"]').first().text().trim();
          const location = $listing.find('.location, .address, [class*="location"]').first().text().trim();
          const description = $listing.find('.description, .summary, [class*="description"]').first().text().trim();
          const link = $listing.find('a').first().attr('href');
          
          // Build full URL
          const fullUrl = link ? (link.startsWith('http') ? link : `https://www.bizbuysell.com${link}`) : null;
          
          // Extract industry/type
          const industry = $listing.find('.industry, .category, [class*="category"]').first().text().trim() || 'E-commerce';
          
          // Check if this is an e-commerce business
          if (this.isEcommerceBusiness(title, description, industry)) {
            this.totalFound++;
            
            const listing = {
              business_name: title || 'E-commerce Business',
              description: description || `${title} - Online business for sale`,
              asking_price: this.extractPrice(priceText) || 0,
              annual_revenue: 0, // Will be updated from detail page
              annual_profit: 0,
              monthly_revenue: 0,
              monthly_profit: 0,
              industry: 'E-commerce',
              location: location || 'United States',
              source: 'bizbuysell',
              listing_url: fullUrl,
              listing_status: 'active',
              is_ecommerce: true
            };
            
            allListings.push(listing);
            console.log(`✅ Found e-commerce listing: ${title}`);
          } else {
            this.totalSkipped++;
            console.log(`⏭️  Skipped non-ecommerce: ${title}`);
          }
        });
        
        // Look for structured data as well
        $('script[type="application/ld+json"]').each((i, elem) => {
          try {
            const data = JSON.parse($(elem).html());
            if (data['@type'] === 'ItemList' && data.itemListElement) {
              data.itemListElement.forEach(item => {
                if (item.name && this.isEcommerceBusiness(item.name, item.description, '')) {
                  const listing = {
                    business_name: item.name,
                    description: item.description || `${item.name} - Online business for sale`,
                    asking_price: item.offers?.price ? parseInt(item.offers.price) : 0,
                    annual_revenue: 0,
                    annual_profit: 0,
                    monthly_revenue: 0,
                    monthly_profit: 0,
                    industry: 'E-commerce',
                    location: item.address?.addressLocality || 'United States',
                    source: 'bizbuysell',
                    listing_url: item.url,
                    listing_status: 'active',
                    is_ecommerce: true
                  };
                  
                  allListings.push(listing);
                  this.totalFound++;
                  console.log(`✅ Found e-commerce listing (structured): ${item.name}`);
                }
              });
            }
          } catch (e) {
            // Silent fail
          }
        });
        
      } catch (error) {
        console.error(`Error scraping ${searchUrl}:`, error.message);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Remove duplicates based on URL
    const uniqueListings = [];
    const seenUrls = new Set();
    
    for (const listing of allListings) {
      if (listing.listing_url && !seenUrls.has(listing.listing_url)) {
        seenUrls.add(listing.listing_url);
        uniqueListings.push(listing);
      }
    }
    
    console.log(`\n📊 Scraping Summary:`);
    console.log(`Total found: ${this.totalFound}`);
    console.log(`Skipped (non-ecommerce): ${this.totalSkipped}`);
    console.log(`Unique e-commerce listings: ${uniqueListings.length}`);
    
    // Save to database
    if (uniqueListings.length > 0) {
      console.log('\n💾 Saving to database...');
      
      for (const listing of uniqueListings) {
        try {
          // Check if listing already exists
          const { data: existing } = await supabase
            .from('deals')
            .select('id')
            .eq('listing_url', listing.listing_url)
            .single();
          
          if (!existing) {
            const { error } = await supabase
              .from('deals')
              .insert([listing]);
            
            if (error) {
              console.error(`Error saving ${listing.business_name}:`, error);
            } else {
              this.totalSaved++;
              console.log(`💾 Saved: ${listing.business_name}`);
            }
          } else {
            console.log(`⏭️  Already exists: ${listing.business_name}`);
          }
        } catch (error) {
          console.error(`Error processing ${listing.business_name}:`, error);
        }
      }
      
      console.log(`\n✅ Successfully saved ${this.totalSaved} new e-commerce listings`);
    }
  }
}

// Run the scraper
const scraper = new ImprovedBizBuySellScraper();
scraper.scrapeBizBuySell();