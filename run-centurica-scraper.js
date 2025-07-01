#!/usr/bin/env node

import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

// Configuration
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Centurica scraper logic (copied from TypeScript version)
class CenturicaScraper {
  constructor() {
    this.scraperApiKey = SCRAPER_API_KEY;
    this.scraperApiUrl = 'https://api.scraperapi.com/';
    this.centuricaUrl = 'https://app.centurica.com/marketwatch';
  }

  async fetchWithScraperAPI(url) {
    const params = new URLSearchParams({
      api_key: this.scraperApiKey,
      url: url,
      render: 'true',
      premium: 'true',
      wait: '5',
      window_width: '1920',
      window_height: '1080'
    });

    const apiUrl = `${this.scraperApiUrl}?${params.toString()}`;
    
    try {
      console.log(`📡 Fetching via ScraperAPI...`);
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`ScraperAPI request failed: ${response.status} ${response.statusText}`);
      }
      
      const text = await response.text();
      console.log(`✅ Retrieved ${text.length} characters`);
      return text;
    } catch (error) {
      console.error(`Failed to fetch ${url} via ScraperAPI:`, error);
      throw error;
    }
  }

  extractPrice(priceText) {
    if (!priceText) return 0;
    
    const cleaned = priceText.replace(/[^0-9.,]/g, '');
    
    if (priceText.toLowerCase().includes('m') || priceText.toLowerCase().includes('million')) {
      return Math.round(parseFloat(cleaned) * 1000000);
    }
    
    if (priceText.toLowerCase().includes('k')) {
      return Math.round(parseFloat(cleaned) * 1000);
    }
    
    return Math.round(parseFloat(cleaned)) || 0;
  }

  extractTextFromHtml(htmlString) {
    if (!htmlString || typeof htmlString !== 'string') return '';
    
    return htmlString
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  mapIndustry(businessModel, niche) {
    const combinedText = `${businessModel} ${niche}`.toLowerCase();
    
    const industries = {
      'SaaS': /\b(saas|software|platform|app|application|subscription|b2b)\b/,
      'E-commerce': /\b(ecommerce|e-commerce|retail|marketplace|dropship|amazon|fba)\b/,
      'Content': /\b(blog|content|media|newsletter|publication|affiliate)\b/,
      'Technology': /\b(tech|ai|automation|api|development|mobile|web)\b/,
      'Health & Wellness': /\b(health|medical|wellness|fitness|supplement|beauty)\b/,
      'Education': /\b(education|learning|course|training|school|online learning)\b/,
      'Finance': /\b(finance|fintech|payment|trading|crypto|investment)\b/,
      'Food & Beverage': /\b(food|restaurant|beverage|cafe|kitchen|culinary)\b/,
      'Manufacturing': /\b(manufacturing|industrial|production|distribution)\b/,
      'Services': /\b(service|consulting|agency|professional|business service)\b/
    };
    
    for (const [industry, pattern] of Object.entries(industries)) {
      if (pattern.test(combinedText)) {
        return industry;
      }
    }
    
    return businessModel.toLowerCase().includes('online') ? 'Online Business' : 'Other';
  }

  inferProviderFromListing(businessModel, niche, askingPrice, revenue) {
    const combinedText = `${businessModel} ${niche}`.toLowerCase();
    const priceValue = this.extractPrice(askingPrice);
    
    if (priceValue > 1000000) {
      if (combinedText.includes('saas') || combinedText.includes('software')) {
        return 'FE International';
      }
      if (combinedText.includes('ecommerce') || combinedText.includes('amazon')) {
        return 'Quiet Light';
      }
      return 'Empire Flippers';
    }
    
    if (combinedText.includes('content') || combinedText.includes('blog') || combinedText.includes('affiliate')) {
      return 'Motion Invest';
    }
    
    if (priceValue < 500000) {
      if (combinedText.includes('ecommerce') || combinedText.includes('online')) {
        return 'Flippa';
      }
      return 'BizBuySell';
    }
    
    return 'Empire Flippers';
  }

  generateSpecificListingUrl(provider, name, businessModel, niche) {
    const slug = this.createUrlSlug(name || businessModel || niche);
    
    const providerPatterns = {
      'Empire Flippers': `https://empireflippers.com/listing/${slug}/`,
      'FE International': `https://feinternational.com/buy-a-website/${slug}/`,
      'Motion Invest': `https://motioninvest.com/listings/${slug}/`,
      'Quiet Light': `https://quietlight.com/listing/${slug}/`,
      'BizBuySell': `https://www.bizbuysell.com/business-for-sale/${slug}/`,
      'Digital Exits': `https://digitalexits.com/listing/${slug}/`,
      'Flippa': `https://flippa.com/listing/${slug}/`,
      'MicroAcquire': `https://microacquire.com/listing/${slug}/`,
      'Acquire.com': `https://acquire.com/listing/${slug}/`
    };

    return providerPatterns[provider] || 'https://app.centurica.com/marketwatch';
  }

  createUrlSlug(text) {
    if (!text) return 'business-listing';
    
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 60)
      || 'business-listing';
  }

  async scrape() {
    try {
      console.log(`🔄 Fetching listings from Centurica Marketwatch: ${this.centuricaUrl}`);
      
      const html = await this.fetchWithScraperAPI(this.centuricaUrl);
      const listings = this.extractListingsFromHtml(html);
      
      console.log(`✅ Extracted ${listings.length} listings from Centurica`);
      return listings;
      
    } catch (error) {
      console.error('❌ Centurica scraping failed:', error);
      return [];
    }
  }

  extractListingsFromHtml(html) {
    const listings = [];
    
    try {
      // Look for the DataTable initialization script
      const dataTableMatch = html.match(/\$\('#table-listings'\)\.DataTable\({[\s\S]*?data:\s*(\[[\s\S]*?\])/);
      
      if (dataTableMatch && dataTableMatch[1]) {
        console.log('Found DataTable data in HTML');
        
        try {
          const jsonData = JSON.parse(dataTableMatch[1]);
          
          if (Array.isArray(jsonData)) {
            console.log(`Found ${jsonData.length} raw listings in DataTable`);
            
            for (const item of jsonData) {
              const listing = this.convertToListing(item);
              if (listing) {
                listings.push(listing);
              }
            }
          }
        } catch (parseError) {
          console.error('Failed to parse DataTable JSON:', parseError);
        }
      }
      
      // Also look for data in script variables
      if (listings.length === 0) {
        const scriptVarMatch = html.match(/var\s+listings\s*=\s*(\[[\s\S]*?\]);/);
        if (scriptVarMatch && scriptVarMatch[1]) {
          try {
            const listingsData = JSON.parse(scriptVarMatch[1]);
            if (Array.isArray(listingsData)) {
              console.log(`Found ${listingsData.length} listings in script variable`);
              
              for (const item of listingsData) {
                const listing = this.convertToListing(item);
                if (listing) {
                  listings.push(listing);
                }
              }
            }
          } catch (parseError) {
            console.error('Failed to parse script variable JSON:', parseError);
          }
        }
      }
      
      // If still no data found, try parsing HTML table rows
      if (listings.length === 0) {
        const tableRows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/g);
        if (tableRows) {
          console.log(`Found ${tableRows.length} table rows to parse`);
          
          let rowCount = 0;
          for (const row of tableRows) {
            // Skip header row
            if (row.includes('<th') || rowCount === 0) {
              rowCount++;
              continue;
            }
            
            const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/g);
            if (cells && cells.length >= 10) {
              const cellData = cells.map(cell => {
                return cell.replace(/<[^>]*>/g, '').trim();
              });
              
              const listing = this.convertToListing(cellData);
              if (listing) {
                listings.push(listing);
              }
            }
            rowCount++;
          }
        }
      }
      
    } catch (error) {
      console.error('Error extracting listings from HTML:', error);
    }
    
    return listings;
  }

  convertToListing(item) {
    try {
      let listingData;
      
      if (Array.isArray(item)) {
        if (item.length < 11) return null;
        
        listingData = {
          listingHeading: item[1],
          businessModel: item[2],
          niche: item[3],
          askingPrice: item[4],
          grossRevenue: item[5],
          netRevenue: item[6],
          provider: item[10]
        };
      } else if (typeof item === 'object' && item !== null) {
        listingData = item;
      } else {
        return null;
      }

      const listingHeading = this.extractTextFromHtml(listingData.listingHeading || '');
      const businessModel = this.extractTextFromHtml(listingData.businessModel || '');
      const niche = this.extractTextFromHtml(listingData.niche || '');
      const askingPriceText = this.extractTextFromHtml(listingData.askingPrice || '');
      const grossRevenueText = this.extractTextFromHtml(listingData.grossRevenue || '');
      const netRevenueText = this.extractTextFromHtml(listingData.netRevenue || '');
      
      let provider = this.extractTextFromHtml(listingData.provider || '');
      if (!provider || provider.trim() === '') {
        provider = this.inferProviderFromListing(businessModel, niche, askingPriceText, grossRevenueText);
      }

      const name = listingHeading;
      const askingPrice = this.extractPrice(askingPriceText);
      const grossRevenue = this.extractPrice(grossRevenueText);
      const netRevenue = this.extractPrice(netRevenueText);
      const annualRevenue = grossRevenue > 0 ? grossRevenue : netRevenue;

      const originalUrl = this.generateSpecificListingUrl(provider, name, businessModel, niche);
      const description = this.buildDescription(businessModel, niche, provider);
      const industry = this.mapIndustry(businessModel, niche);

      if (name && name.length > 3 && (askingPrice > 0 || annualRevenue > 0)) {
        return {
          name,
          description,
          asking_price: askingPrice,
          annual_revenue: annualRevenue,
          location: 'Various',
          industry,
          source: `Centurica (${provider})`,
          original_url: originalUrl,
          highlights: this.extractHighlights(businessModel, niche, grossRevenueText, netRevenueText),
          status: 'active'
        };
      }

      return null;
    } catch (error) {
      console.warn('Error converting item to listing:', error);
      return null;
    }
  }

  buildDescription(businessModel, niche, provider) {
    const parts = [businessModel, niche].filter(part => part && part.trim().length > 0);
    const description = parts.length > 0 ? parts.join(' - ') : 'Business opportunity';
    
    if (provider && provider.trim().length > 0) {
      return `${description} (via ${provider})`;
    }
    
    return description;
  }

  extractHighlights(businessModel, niche, grossRevenue, netRevenue) {
    const highlights = [];
    
    if (businessModel && businessModel.trim()) {
      highlights.push(`Business Model: ${businessModel}`);
    }
    
    if (niche && niche.trim()) {
      highlights.push(`Niche: ${niche}`);
    }
    
    if (grossRevenue && grossRevenue.trim()) {
      highlights.push(`Gross Revenue: ${grossRevenue}`);
    }
    
    if (netRevenue && netRevenue.trim()) {
      highlights.push(`Net Revenue: ${netRevenue}`);
    }
    
    return highlights;
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
    
    const savedCount = data?.length || 0;
    console.log(`✅ Saved ${savedCount} listings`);
    return savedCount;
    
  } catch (error) {
    console.error('❌ Save error:', error);
    return 0;
  }
}

async function main() {
  console.log('🚀 Starting Centurica aggregator scraping...');
  console.log('📍 This will scrape listings from 30+ business brokers aggregated by Centurica Marketwatch\n');
  
  if (!SCRAPER_API_KEY) {
    console.error('❌ SCRAPER_API_KEY not found in environment');
    return;
  }
  
  try {
    const scraper = new CenturicaScraper();
    const listings = await scraper.scrape();
    
    if (listings.length > 0) {
      console.log(`\n✅ Scraping completed successfully!`);
      console.log(`Found ${listings.length} listings`);
      
      const savedCount = await saveToDatabase(listings);
      
      console.log('\n📊 Final Results:');
      console.log(`Total listings found: ${listings.length}`);
      console.log(`Successfully saved: ${savedCount}`);
      
      if (savedCount > 0) {
        console.log('\n📋 Sample listings from various brokers:');
        
        const byProvider = {};
        listings.forEach(listing => {
          const provider = listing.source.replace('Centurica (', '').replace(')', '');
          if (!byProvider[provider]) byProvider[provider] = [];
          byProvider[provider].push(listing);
        });
        
        Object.entries(byProvider).slice(0, 5).forEach(([provider, providerListings]) => {
          const sample = providerListings[0];
          console.log(`\n🏢 ${provider}:`);
          console.log(`   ${sample.name}`);
          console.log(`   Price: $${sample.asking_price.toLocaleString()}`);
          console.log(`   Revenue: $${sample.annual_revenue.toLocaleString()}`);
          console.log(`   Industry: ${sample.industry}`);
          console.log(`   URL: ${sample.original_url}`);
        });
        
        console.log('\n📈 Provider Summary:');
        Object.entries(byProvider).forEach(([provider, providerListings]) => {
          console.log(`   ${provider}: ${providerListings.length} listings`);
        });
      }
    } else {
      console.error('❌ No listings found');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

main().catch(console.error);