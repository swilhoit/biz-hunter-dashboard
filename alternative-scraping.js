#!/usr/bin/env node

// Try alternative scraping approaches to get new listings

import { chromium } from 'playwright';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function tryAlternativeApproaches() {
  console.log('🔍 Trying Alternative Scraping Approaches\n');
  
  // Try different QuietLight URLs
  const alternativeURLs = [
    {
      name: 'QuietLight - Alternative Path',
      url: 'https://quietlight.com/listings/',
    },
    {
      name: 'QuietLight - Direct Page',
      url: 'https://quietlight.com/listings/page/1/',
    },
    {
      name: 'QuietLight - Search',
      url: 'https://quietlight.com/search/?keywords=business',
    },
    {
      name: 'BizBuySell - Different Sort',
      url: 'https://www.bizbuysell.com/businesses-for-sale/?sort=price_desc',
    },
    {
      name: 'BizBuySell - No Params',
      url: 'https://www.bizbuysell.com/businesses-for-sale',
    }
  ];
  
  let browser;
  try {
    browser = await chromium.launch({ 
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      ]
    });
    
    for (const testUrl of alternativeURLs) {
      console.log(`\n📍 Testing: ${testUrl.name}`);
      console.log(`   URL: ${testUrl.url}`);
      
      const page = await browser.newPage({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });
      
      try {
        await page.goto(testUrl.url, { 
          waitUntil: 'domcontentloaded', 
          timeout: 20000 
        });
        
        await page.waitForTimeout(3000);
        
        const result = await page.evaluate(() => {
          const title = document.title;
          const bodyLength = document.body ? document.body.innerText.length : 0;
          const text = document.body ? document.body.innerText.toLowerCase() : '';
          
          // Check for various content indicators
          const hasBusinessContent = text.includes('business') || text.includes('sale') || text.includes('opportunity');
          const hasListings = text.includes('listing') || text.includes('revenue') || text.includes('profit');
          const hasErrors = text.includes('error') || text.includes('502') || text.includes('503') || 
                           text.includes('blocked') || text.includes('access denied');
          
          // Count potential elements
          const divCount = document.querySelectorAll('div').length;
          const articleCount = document.querySelectorAll('article').length;
          const linkCount = document.querySelectorAll('a').length;
          
          // Look for specific business-related content
          const businessLinks = document.querySelectorAll('a[href*="business"], a[href*="listing"], a[href*="opportunity"]').length;
          const priceElements = Array.from(document.querySelectorAll('*')).filter(el => 
            el.textContent && /\$[\d,]+/.test(el.textContent)
          ).length;
          
          return {
            title,
            bodyLength,
            hasBusinessContent,
            hasListings,
            hasErrors,
            divCount,
            articleCount,
            linkCount,
            businessLinks,
            priceElements
          };
        });
        
        console.log(`   📄 Title: ${result.title}`);
        console.log(`   📊 Body Length: ${result.bodyLength} chars`);
        console.log(`   🏢 Has Business Content: ${result.hasBusinessContent ? '✅' : '❌'}`);
        console.log(`   📋 Has Listings: ${result.hasListings ? '✅' : '❌'}`);
        console.log(`   🚫 Has Errors: ${result.hasErrors ? '❌' : '✅'}`);
        console.log(`   🔗 Business Links: ${result.businessLinks}`);
        console.log(`   💰 Price Elements: ${result.priceElements}`);
        
        if (result.bodyLength > 1000 && result.hasBusinessContent && !result.hasErrors) {
          console.log(`   🎯 POTENTIAL SUCCESS! This URL might work for scraping`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      } finally {
        await page.close();
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  console.log('\n🎯 Alternative approach test complete!');
}

async function tryScraperAPIAlternatives() {
  console.log('\n🌐 Testing ScraperAPI with Different Parameters\n');
  
  const API_KEY = process.env.SCRAPER_API_KEY;
  if (!API_KEY) {
    console.log('❌ No ScraperAPI key found');
    return;
  }
  
  const testConfigs = [
    {
      name: 'QuietLight - Basic',
      url: 'https://quietlight.com/businesses-for-sale/',
      params: { render: 'true' }
    },
    {
      name: 'QuietLight - Premium',
      url: 'https://quietlight.com/businesses-for-sale/',
      params: { render: 'true', premium: 'true', country_code: 'US' }
    },
    {
      name: 'QuietLight - Residential',
      url: 'https://quietlight.com/businesses-for-sale/',
      params: { render: 'true', session_number: '1', residential: 'true' }
    }
  ];
  
  for (const config of testConfigs) {
    console.log(`📍 Testing: ${config.name}`);
    
    try {
      const params = new URLSearchParams({
        api_key: API_KEY,
        url: config.url,
        ...config.params
      });
      
      const scraperUrl = `http://api.scraperapi.com?${params}`;
      
      const response = await fetch(scraperUrl, { timeout: 30000 });
      
      if (response.ok) {
        const html = await response.text();
        const hasBusinessContent = /business|sale|opportunity|listing|revenue/i.test(html);
        const hasErrors = /502|503|error|blocked|access denied/i.test(html);
        
        console.log(`   ✅ Success! ${html.length} chars`);
        console.log(`   🏢 Has Business Content: ${hasBusinessContent ? '✅' : '❌'}`);
        console.log(`   🚫 Has Errors: ${hasErrors ? '❌' : '✅'}`);
        
        if (hasBusinessContent && !hasErrors) {
          console.log(`   🎯 WORKING CONFIG! This might extract listings`);
        }
      } else {
        console.log(`   ❌ HTTP ${response.status}: ${response.statusText}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

async function main() {
  await tryAlternativeApproaches();
  await tryScraperAPIAlternatives();
  
  console.log('\n💡 Next Steps:');
  console.log('1. If any URLs show as working, update scrapers to use them');
  console.log('2. Focus on sites that are accessible');
  console.log('3. Consider RSS feeds or API alternatives');
  console.log('4. Use current data while monitoring for access');
}

main().catch(console.error);