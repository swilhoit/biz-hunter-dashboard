#!/usr/bin/env node

// Test specific URLs that are known to actually work for real scraping

import { chromium } from 'playwright';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function testRealWorkingUrls() {
  console.log('🔍 Testing REAL Working URLs for Actual Data\n');
  
  // Test individual QuietLight listings we know exist
  const realUrls = [
    {
      site: 'QuietLight',
      type: 'Individual Listing',
      url: 'https://quietlight.com/listings/17339742/', // $28M Footwear
      expected: 'Should contain $28M'
    },
    {
      site: 'QuietLight', 
      type: 'Individual Listing',
      url: 'https://quietlight.com/listings/16065383/', // $17.4M Electrolyte
      expected: 'Should contain $17.4M'
    },
    {
      site: 'QuietLight',
      type: 'Main Listings',
      url: 'https://quietlight.com/listings/',
      expected: 'Should contain business listings'
    },
    {
      site: 'BizBuySell',
      type: 'Alternative URL',
      url: 'https://www.bizbuysell.com/business-opportunity/',
      expected: 'Business opportunities'
    },
    {
      site: 'BizBuySell',
      type: 'Search Page',
      url: 'https://www.bizbuysell.com/search',
      expected: 'Search results'
    },
    {
      site: 'Empire Flippers',
      type: 'Listings Page',
      url: 'https://empireflippers.com/marketplace/',
      expected: 'Digital businesses'
    },
    {
      site: 'FE International',
      type: 'Listings',
      url: 'https://feinternational.com/businesses-for-sale/',
      expected: 'SaaS and tech businesses'
    }
  ];

  let workingUrls = [];
  
  let browser;
  try {
    browser = await chromium.launch({ 
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
    
    for (const test of realUrls) {
      console.log(`\n📍 Testing ${test.site} - ${test.type}`);
      console.log(`   URL: ${test.url}`);
      
      const page = await browser.newPage({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });
      
      try {
        await page.goto(test.url, { 
          waitUntil: 'domcontentloaded', 
          timeout: 20000 
        });
        
        await page.waitForTimeout(3000);
        
        const result = await page.evaluate(() => {
          return {
            title: document.title,
            bodyLength: document.body ? document.body.innerText.length : 0,
            bodyText: document.body ? document.body.innerText.substring(0, 1000) : '',
            hasErrors: document.body ? 
              (document.body.innerText.toLowerCase().includes('502') ||
               document.body.innerText.toLowerCase().includes('error') ||
               document.body.innerText.toLowerCase().includes('blocked')) : true,
            url: window.location.href
          };
        });
        
        console.log(`   📄 Title: ${result.title}`);
        console.log(`   📊 Content: ${result.bodyLength} chars`);
        console.log(`   🚫 Has Errors: ${result.hasErrors ? 'YES' : 'NO'}`);
        
        // Check if it contains expected content
        const hasExpectedContent = result.bodyText.toLowerCase().includes(test.expected.toLowerCase()) ||
                                  result.bodyText.toLowerCase().includes('business') ||
                                  result.bodyText.toLowerCase().includes('sale') ||
                                  result.bodyText.toLowerCase().includes('revenue');
        
        console.log(`   ✅ Has Business Content: ${hasExpectedContent ? 'YES' : 'NO'}`);
        
        if (!result.hasErrors && hasExpectedContent && result.bodyLength > 1000) {
          console.log(`   🎯 WORKING! This URL has real data`);
          workingUrls.push({
            site: test.site,
            url: test.url,
            type: test.type,
            title: result.title,
            contentLength: result.bodyLength
          });
        } else {
          console.log(`   ❌ Not suitable for scraping`);
        }
        
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
      }
      
      await page.close();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
  } catch (error) {
    console.error('❌ Browser test failed:', error.message);
  } finally {
    if (browser) await browser.close();
  }
  
  console.log('\n\n🎯 WORKING URLS WITH REAL DATA:');
  console.log('==============================');
  
  if (workingUrls.length === 0) {
    console.log('❌ No working URLs found for real data scraping');
  } else {
    workingUrls.forEach((working, i) => {
      console.log(`${i + 1}. ${working.site} (${working.type})`);
      console.log(`   URL: ${working.url}`);
      console.log(`   Content: ${working.contentLength} chars`);
      console.log(`   Title: ${working.title.substring(0, 80)}...`);
      console.log('');
    });
  }
  
  // Also test with ScraperAPI for comparison
  console.log('\n🌐 Testing ScraperAPI Access:');
  console.log('============================');
  
  const API_KEY = process.env.SCRAPER_API_KEY;
  if (API_KEY && workingUrls.length > 0) {
    // Test the first working URL with ScraperAPI
    const testUrl = workingUrls[0];
    console.log(`\n🧪 Testing ${testUrl.site} via ScraperAPI...`);
    
    try {
      const scraperUrl = `http://api.scraperapi.com?api_key=${API_KEY}&url=${encodeURIComponent(testUrl.url)}&render=true`;
      
      const response = await fetch(scraperUrl, { timeout: 30000 });
      
      if (response.ok) {
        const html = await response.text();
        console.log(`   ✅ ScraperAPI Success: ${html.length} chars`);
        
        const hasBusinessContent = /business|sale|revenue|listing/i.test(html);
        console.log(`   🏢 Has Business Content: ${hasBusinessContent ? 'YES' : 'NO'}`);
        
        if (hasBusinessContent) {
          console.log(`   🎯 ScraperAPI can access real data!`);
        }
      } else {
        console.log(`   ❌ ScraperAPI failed: HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ ScraperAPI error: ${error.message}`);
    }
  } else {
    console.log('⏭️ No API key or working URLs to test');
  }
  
  return workingUrls;
}

testRealWorkingUrls().catch(console.error);