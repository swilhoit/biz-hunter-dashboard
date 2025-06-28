#!/usr/bin/env node

// Test different QuietLight access patterns to understand what's blocked vs accessible

import { chromium } from 'playwright';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function testQuietLightAccessPatterns() {
  console.log('🔍 Testing QuietLight Access Patterns\n');
  
  // URLs from the database
  const testUrls = [
    {
      type: 'Main Listings Page',
      url: 'https://quietlight.com/businesses-for-sale/'
    },
    {
      type: 'Alternative Listings',  
      url: 'https://quietlight.com/listings/'
    },
    {
      type: 'Individual Listing 1',
      url: 'https://quietlight.com/listings/17339742/' // $28M Footwear
    },
    {
      type: 'Individual Listing 2', 
      url: 'https://quietlight.com/listings/16065383/' // $17.4M Electrolyte
    },
    {
      type: 'Individual Listing 3',
      url: 'https://quietlight.com/listings/15960930/' // $5.7M Health
    },
    {
      type: 'Home Page',
      url: 'https://quietlight.com/'
    }
  ];
  
  console.log('🎭 Testing with Playwright (Direct Access)');
  console.log('==========================================');
  
  let browser;
  try {
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    for (const test of testUrls) {
      const page = await browser.newPage({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      });
      
      try {
        console.log(`\n📍 ${test.type}:`);
        console.log(`   URL: ${test.url}`);
        
        await page.goto(test.url, { 
          waitUntil: 'domcontentloaded', 
          timeout: 15000 
        });
        
        await page.waitForTimeout(2000);
        
        const result = await page.evaluate(() => {
          return {
            title: document.title,
            bodyLength: document.body ? document.body.innerText.length : 0,
            hasError: document.body ? document.body.innerText.toLowerCase().includes('502') || 
                                     document.body.innerText.toLowerCase().includes('error') ||
                                     document.body.innerText.toLowerCase().includes('blocked') : true,
            hasBusinessContent: document.body ? document.body.innerText.toLowerCase().includes('business') ||
                                               document.body.innerText.toLowerCase().includes('revenue') ||
                                               document.body.innerText.toLowerCase().includes('sale') : false
          };
        });
        
        console.log(`   ✅ Success! Title: ${result.title}`);
        console.log(`   📊 Body: ${result.bodyLength} chars`);
        console.log(`   🚫 Has Error: ${result.hasError ? 'YES' : 'NO'}`);
        console.log(`   🏢 Has Business Content: ${result.hasBusinessContent ? 'YES' : 'NO'}`);
        
        if (!result.hasError && result.hasBusinessContent && result.bodyLength > 1000) {
          console.log(`   🎯 ACCESSIBLE! This URL works`);
        }
        
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
      }
      
      await page.close();
      await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limiting
    }
    
  } catch (error) {
    console.error('❌ Browser test failed:', error.message);
  } finally {
    if (browser) await browser.close();
  }
  
  console.log('\n\n🌐 Testing with ScraperAPI');
  console.log('==========================');
  
  const API_KEY = process.env.SCRAPER_API_KEY;
  if (!API_KEY) {
    console.log('❌ No ScraperAPI key found');
    return;
  }
  
  // Test a couple URLs with ScraperAPI
  const scrapingTests = [
    testUrls[0], // Main listings
    testUrls[2], // Individual listing
    testUrls[5]  // Home page
  ];
  
  for (const test of scrapingTests) {
    console.log(`\n📍 ${test.type}:`);
    
    try {
      const scraperUrl = `http://api.scraperapi.com?api_key=${API_KEY}&url=${encodeURIComponent(test.url)}&render=true`;
      
      const response = await fetch(scraperUrl, { timeout: 20000 });
      
      if (response.ok) {
        const html = await response.text();
        const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || 'No title';
        const hasError = /502|503|error|blocked/i.test(html);
        const hasContent = /business|sale|revenue|opportunity/i.test(html);
        
        console.log(`   ✅ Success! ${html.length} chars`);
        console.log(`   📄 Title: ${title}`);
        console.log(`   🚫 Has Error: ${hasError ? 'YES' : 'NO'}`);
        console.log(`   🏢 Has Content: ${hasContent ? 'YES' : 'NO'}`);
        
        if (!hasError && hasContent) {
          console.log(`   🎯 WORKING! ScraperAPI can access this`);
        }
      } else {
        console.log(`   ❌ HTTP ${response.status}: ${response.statusText}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 3000)); // Rate limiting
  }
  
  console.log('\n🎯 ANALYSIS:');
  console.log('============');
  console.log('• Check which access methods work vs fail');
  console.log('• Individual listings may be less protected than listing pages');
  console.log('• Timing suggests anti-bot measures may be intermittent');
  console.log('• Some URLs may have different protection levels');
}

testQuietLightAccessPatterns();