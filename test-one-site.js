#!/usr/bin/env node

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testOneSite() {
  console.log('🧪 TESTING ONE FBA SITE');
  
  // Use a site that might not block us as much
  const testUrl = 'https://empireflippers.com/marketplace/?industry=amazon-fba';
  
  try {
    // Direct fetch first
    console.log('Testing direct fetch:', testUrl);
    const response = await fetch(testUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const content = await response.text();
    console.log(`✅ Fetched ${content.length} characters`);
    
    const $ = cheerio.load(content);
    
    // Test Empire Flippers specific selectors
    const selectors = [
      '.listing-card',
      '.marketplace-listing', 
      '.business-listing',
      'article',
      '.result-item',
      '[data-listing]',
      '[class*="listing"]'
    ];
    
    let foundListings = [];
    
    for (const selector of selectors) {
      const found = $(selector);
      console.log(`Selector "${selector}": ${found.length} elements`);
      
      if (found.length > 0) {
        found.each((i, el) => {
          if (i >= 5) return false; // Limit for testing
          
          const $el = $(el);
          const text = $el.text().trim();
          
          if (text.length > 50) {
            // Look for business name
            const titleEl = $el.find('h1, h2, h3, .title, a').first();
            let title = titleEl.text().trim();
            
            if (!title) {
              // Try to extract title from text
              const lines = text.split('\n').filter(l => l.trim().length > 10);
              title = lines[0]?.trim() || '';
            }
            
            if (title && title.length > 5) {
              // Look for price
              const priceMatch = text.match(/\$[\d,]+[kmKM]?/);
              const price = priceMatch ? priceMatch[0] : 'N/A';
              
              foundListings.push({
                title: title.substring(0, 100),
                price: price,
                hasPrice: !!priceMatch,
                textLength: text.length
              });
            }
          }
        });
        
        if (foundListings.length > 0) {
          console.log(`\n✅ Found ${foundListings.length} potential listings with: ${selector}`);
          break;
        }
      }
    }
    
    if (foundListings.length === 0) {
      console.log('\n❌ No listings found with structural selectors');
      
      // Try text-based extraction
      console.log('Trying text-based extraction...');
      const allText = $.text();
      const lines = allText.split('\n').filter(l => l.trim().length > 30);
      
      console.log(`Found ${lines.length} substantial text lines`);
      
      let textListings = [];
      for (let i = 0; i < Math.min(lines.length - 1, 50); i++) {
        const line = lines[i].trim();
        const nextLine = lines[i + 1]?.trim() || '';
        
        // Look for business-like content
        if (line.length > 15 && line.length < 150 && !line.includes('$')) {
          const context = `${line} ${nextLine}`;
          const priceMatch = context.match(/\$[\d,]+[kmKM]?/);
          
          if (priceMatch) {
            textListings.push({
              title: line,
              price: priceMatch[0],
              method: 'text-extraction'
            });
          }
        }
      }
      
      if (textListings.length > 0) {
        console.log(`✅ Text extraction found ${textListings.length} listings`);
        foundListings = textListings;
      }
    }
    
    if (foundListings.length > 0) {
      console.log('\n📋 Sample listings:');
      foundListings.slice(0, 3).forEach((listing, i) => {
        console.log(`${i + 1}. ${listing.title} - ${listing.price}`);
      });
      
      // Try to save one
      const bestListing = foundListings.find(l => l.hasPrice) || foundListings[0];
      if (bestListing) {
        const priceNum = parseInt(bestListing.price.replace(/[^\d]/g, '')) || 0;
        
        const testListing = {
          name: bestListing.title,
          asking_price: priceNum,
          annual_revenue: 0,
          industry: 'Amazon FBA',
          source: 'EmpireFlippers',
          status: 'active',
          location: 'Online'
        };
        
        console.log('\n💾 Testing save to database...');
        const { data, error } = await supabase
          .from('business_listings')
          .insert(testListing)
          .select();
        
        if (error) {
          console.error('❌ Database error:', error.message);
        } else {
          console.log('✅ Successfully saved test listing');
          
          // Clean up
          await supabase
            .from('business_listings')
            .delete()
            .eq('id', data[0].id);
          console.log('🧹 Cleaned up test listing');
        }
      }
    } else {
      console.log('\n❌ No usable listings found');
      
      // Show some sample content for debugging
      console.log('\nSample page content:');
      const sampleText = $.text().substring(0, 500);
      console.log(sampleText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testOneSite();