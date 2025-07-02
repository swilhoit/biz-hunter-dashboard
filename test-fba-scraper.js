#!/usr/bin/env node

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

class TestFBAScraper {
  constructor() {
    this.supabaseUrl = process.env.VITE_SUPABASE_URL;
    this.supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    this.scraperAPIKey = process.env.SCRAPER_API_KEY;
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }

  async testFBAUrls() {
    console.log('🧪 Testing FBA-Specific URLs\n');
    
    const fbaUrls = [
      { url: 'https://quietlight.com/amazon-fba-businesses-for-sale/', site: 'QuietLight' },
      { url: 'https://flippa.com/buy/monetization/amazon-fba', site: 'Flippa' },
      { url: 'https://empireflippers.com/marketplace/?industry=amazon-fba', site: 'EmpireFlippers' }
    ];
    
    let totalListings = 0;
    
    for (const test of fbaUrls) {
      console.log(`🔍 Testing ${test.site}: ${test.url}`);
      
      try {
        const scraperUrl = `http://api.scraperapi.com?api_key=${this.scraperAPIKey}&url=${encodeURIComponent(test.url)}&render=true&premium=true`;
        const response = await fetch(scraperUrl, { timeout: 30000 });
        
        if (response.ok) {
          const content = await response.text();
          const $ = cheerio.load(content);
          
          console.log(`   ✅ Content retrieved: ${content.length} characters`);
          
          // Count potential listings
          const listingSelectors = [
            'a[href*="/listing/"]', 'a[href*="/business/"]', 'a[href*="/auction/"]',
            '.listing-card', '.business-card', '.flip-card', '.result-item'
          ];
          
          let listingCount = 0;
          listingSelectors.forEach(selector => {
            const found = $(selector).length;
            if (found > listingCount) listingCount = found;
          });
          
          console.log(`   📋 Potential listings found: ${listingCount}`);
          
          // Check for FBA-specific content
          const fbaKeywords = ['amazon fba', 'fulfillment by amazon', 'fba business', 'amazon seller'];
          const hasRelevantContent = fbaKeywords.some(keyword => 
            content.toLowerCase().includes(keyword)
          );
          
          console.log(`   🎯 Contains FBA content: ${hasRelevantContent ? 'Yes' : 'No'}`);
          
          if (hasRelevantContent && listingCount > 0) {
            console.log(`   ✅ Good FBA source: ${listingCount} listings with relevant content`);
            totalListings += listingCount;
          }
          
        } else {
          console.log(`   ❌ Failed to fetch: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
      
      console.log(''); // Add spacing
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    console.log(`🎯 Total potential FBA listings across all sources: ${totalListings}`);
    
    // Test individual listing extraction
    console.log('\n🔍 Testing individual listing URL extraction...');
    
    // Check current database for comparison
    try {
      const { data: currentListings } = await this.supabase
        .from('business_listings')
        .select('source, count(*)')
        .eq('industry', 'Amazon FBA');
      
      if (currentListings) {
        console.log('\n📊 Current Amazon FBA listings in database:');
        currentListings.forEach(item => {
          console.log(`   ${item.source}: ${item.count} listings`);
        });
      }
    } catch (error) {
      console.log('Error checking database:', error.message);
    }
    
    return totalListings;
  }
  
  async testDetailedScraping() {
    console.log('\n🔍 Testing Detailed Listing Scraping...');
    
    // Try scraping a specific listing page for testing
    const testListingUrl = 'https://quietlight.com/listing/amazon-fba-private-label-supplements-brand/';
    
    try {
      const scraperUrl = `http://api.scraperapi.com?api_key=${this.scraperAPIKey}&url=${encodeURIComponent(testListingUrl)}&render=true&premium=true&wait=5000`;
      const response = await fetch(scraperUrl, { timeout: 45000 });
      
      if (response.ok) {
        const content = await response.text();
        const $ = cheerio.load(content);
        
        console.log(`✅ Retrieved listing page: ${content.length} characters`);
        
        // Extract key elements
        const title = $('h1').first().text().trim();
        const price = $('.asking-price, .price, .list-price').first().text();
        const revenue = $('.annual-revenue, .revenue').first().text();
        const description = $('.description, .listing-description').first().text().substring(0, 200);
        
        console.log(`   📝 Title: ${title || 'Not found'}`);
        console.log(`   💰 Price: ${price || 'Not found'}`);
        console.log(`   📊 Revenue: ${revenue || 'Not found'}`);
        console.log(`   📄 Description: ${description || 'Not found'}`);
        
        if (title && (price || revenue)) {
          console.log('   ✅ Successfully extracted listing details');
          return true;
        } else {
          console.log('   ⚠️ Partial extraction - may need selector adjustments');
          return false;
        }
      } else {
        console.log(`❌ Failed to fetch listing: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ Error testing detailed scraping: ${error.message}`);
      return false;
    }
  }
}

async function runTests() {
  const scraper = new TestFBAScraper();
  
  const listingCount = await scraper.testFBAUrls();
  const detailSuccess = await scraper.testDetailedScraping();
  
  console.log('\n🎯 Test Results Summary:');
  console.log(`📋 Total potential listings: ${listingCount}`);
  console.log(`🔍 Detailed scraping: ${detailSuccess ? 'Working' : 'Needs adjustment'}`);
  
  if (listingCount > 20 && detailSuccess) {
    console.log('\n✅ FBA scraper ready for production!');
  } else {
    console.log('\n⚠️ May need further optimization before full deployment');
  }
}

runTests().catch(console.error);