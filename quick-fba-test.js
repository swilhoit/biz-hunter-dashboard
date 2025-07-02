#!/usr/bin/env node

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function quickTest() {
  console.log('🧪 QUICK FBA SCRAPER TEST');
  
  const testUrl = 'https://quietlight.com/amazon-fba-businesses-for-sale/';
  const scraperAPIKey = process.env.SCRAPER_API_KEY;
  
  try {
    console.log('Fetching via ScraperAPI:', testUrl);
    const scraperUrl = `http://api.scraperapi.com?api_key=${scraperAPIKey}&url=${encodeURIComponent(testUrl)}&render=true&country_code=us`;
    
    const response = await fetch(scraperUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const content = await response.text();
    console.log(`✅ Fetched ${content.length} characters`);
    
    const $ = cheerio.load(content);
    
    // Test different selectors
    const selectors = [
      '.listing-card',
      '.business-card', 
      'article',
      '.result-item',
      '[class*="listing"]',
      '[class*="business"]'
    ];
    
    let listings = [];
    
    for (const selector of selectors) {
      const found = $(selector);
      console.log(`Selector "${selector}": ${found.length} elements`);
      
      if (found.length > 0) {
        found.each((i, el) => {
          if (i >= 5) return false; // Limit for testing
          
          const $el = $(el);
          const text = $el.text();
          
          if (text.length > 50 && text.includes('$')) {
            const titleEl = $el.find('h1, h2, h3, .title, a').first();
            const title = titleEl.text().trim();
            
            if (title && title.length > 10) {
              const priceMatch = text.match(/\$[\d,]+[kmKM]?/);
              const price = priceMatch ? priceMatch[0] : 'N/A';
              
              listings.push({
                title: title.substring(0, 100),
                price: price,
                source: 'QuietLight',
                rawText: text.substring(0, 200)
              });
            }
          }
        });
        
        if (listings.length > 0) {
          console.log(`\n✅ Found ${listings.length} listings with selector: ${selector}`);
          break;
        }
      }
    }
    
    if (listings.length === 0) {
      console.log('\n❌ No listings found with any selector');
      
      // Try text-based extraction
      const allText = $.text();
      const lines = allText.split('\n').filter(l => l.trim().length > 20);
      console.log(`Total lines: ${lines.length}`);
      
      for (let i = 0; i < Math.min(lines.length, 10); i++) {
        const line = lines[i].trim();
        if (line.includes('$') && line.length < 200) {
          console.log(`Sample line ${i}: ${line}`);
        }
      }
    } else {
      console.log('\n📋 Sample listings found:');
      listings.slice(0, 3).forEach((listing, i) => {
        console.log(`${i + 1}. ${listing.title} - ${listing.price}`);
      });
      
      // Test saving one listing
      const testListing = {
        name: listings[0].title,
        asking_price: parseInt(listings[0].price.replace(/[^\d]/g, '')) || 0,
        annual_revenue: 0, // Required field - default to 0
        industry: 'Amazon FBA',
        source: 'QuietLight',
        status: 'active',
        location: 'Online'
      };
      
      console.log('\n💾 Testing database save...');
      const { data, error } = await supabase
        .from('business_listings')
        .insert(testListing)
        .select();
      
      if (error) {
        console.error('❌ Database error:', error.message);
      } else {
        console.log('✅ Successfully saved test listing');
        
        // Clean up - delete the test listing
        await supabase
          .from('business_listings')
          .delete()
          .eq('id', data[0].id);
        console.log('🧹 Cleaned up test listing');
      }
    }
    
    // Check current FBA count
    const { data: fbaCount } = await supabase
      .from('business_listings')
      .select('count')
      .eq('industry', 'Amazon FBA');
    
    console.log(`\n📊 Current FBA listings in database: ${fbaCount?.[0]?.count || 0}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

quickTest();