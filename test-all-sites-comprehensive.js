#!/usr/bin/env node

// Test all business listing sites comprehensively to find working URLs

import { chromium } from 'playwright';

async function testAllSitesComprehensive() {
  console.log('🔍 Comprehensive Site Testing for Dashboard Population\n');
  
  const sitesToTest = [
    {
      name: 'QuietLight',
      urls: [
        'https://quietlight.com/listings/',
        'https://quietlight.com/businesses-for-sale/',
        'https://quietlight.com/listings/page/1/'
      ]
    },
    {
      name: 'BizBuySell',
      urls: [
        'https://www.bizbuysell.com/businesses-for-sale/',
        'https://www.bizbuysell.com/businesses-for-sale?sort=newest',
        'https://www.bizbuysell.com/business-opportunity/',
        'https://www.bizbuysell.com/search/'
      ]
    },
    {
      name: 'Acquire',
      urls: [
        'https://acquire.com/search?type=startup&status=for-sale',
        'https://acquire.com/startups',
        'https://acquire.com/browse',
        'https://acquire.com/'
      ]
    },
    {
      name: 'BizQuest',
      urls: [
        'https://www.bizquest.com/businesses-for-sale/',
        'https://www.bizquest.com/search/',
        'https://www.bizquest.com/'
      ]
    },
    {
      name: 'MicroAcquire',
      urls: [
        'https://microacquire.com/browse',
        'https://microacquire.com/startups',
        'https://microacquire.com/'
      ]
    },
    {
      name: 'Flippa',
      urls: [
        'https://flippa.com/browse/websites',
        'https://flippa.com/websites-for-sale',
        'https://flippa.com/'
      ]
    }
  ];

  const workingUrls = [];
  
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
    
    for (const site of sitesToTest) {
      console.log(`\n📍 Testing ${site.name.toUpperCase()}`);
      console.log('='.repeat(site.name.length + 10));
      
      for (const url of site.urls) {
        const page = await browser.newPage({
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        });
        
        try {
          console.log(`\n🌐 Testing: ${url}`);
          
          await page.goto(url, { 
            waitUntil: 'domcontentloaded', 
            timeout: 20000 
          });
          
          await page.waitForTimeout(3000);
          
          const result = await page.evaluate(() => {
            const title = document.title;
            const bodyLength = document.body ? document.body.innerText.length : 0;
            const text = document.body ? document.body.innerText.toLowerCase() : '';
            
            // Check for errors/blocks
            const hasErrors = text.includes('error') || text.includes('502') || text.includes('503') || 
                             text.includes('blocked') || text.includes('access denied') || 
                             text.includes('cloudflare') || title.toLowerCase().includes('error');
            
            // Check for business content
            const hasBusinessContent = text.includes('business') || text.includes('sale') || 
                                      text.includes('opportunity') || text.includes('listing') ||
                                      text.includes('revenue') || text.includes('startup');
            
            // Check for actual listings/data
            const hasListings = text.includes('asking') || text.includes('price') || 
                               text.includes('million') || text.includes('thousand') ||
                               /\$[\d,]+/.test(text);
            
            // Count potential listing elements
            const listingElements = [
              document.querySelectorAll('article').length,
              document.querySelectorAll('.listing').length,
              document.querySelectorAll('.business').length,
              document.querySelectorAll('.startup').length,
              document.querySelectorAll('.card').length,
              document.querySelectorAll('div[class*="listing"]').length,
              document.querySelectorAll('div[class*="business"]').length
            ];
            
            const maxElements = Math.max(...listingElements);
            
            return {
              title,
              bodyLength,
              hasErrors,
              hasBusinessContent,
              hasListings,
              maxElements,
              accessible: !hasErrors && hasBusinessContent && bodyLength > 1000
            };
          });
          
          console.log(`   📄 Title: ${result.title}`);
          console.log(`   📊 Body: ${result.bodyLength} chars`);
          console.log(`   🚫 Has Errors: ${result.hasErrors ? 'YES' : 'NO'}`);
          console.log(`   🏢 Has Business Content: ${result.hasBusinessContent ? 'YES' : 'NO'}`);
          console.log(`   📋 Has Listings Data: ${result.hasListings ? 'YES' : 'NO'}`);
          console.log(`   🎯 Max Elements Found: ${result.maxElements}`);
          
          if (result.accessible) {
            console.log(`   ✅ WORKING! This URL is accessible for scraping`);
            workingUrls.push({
              site: site.name,
              url: url,
              elements: result.maxElements,
              title: result.title
            });
          } else {
            console.log(`   ❌ Not suitable for scraping`);
          }
          
        } catch (error) {
          console.log(`   ❌ Failed: ${error.message}`);
        }
        
        await page.close();
        await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limiting
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  console.log('\n\n🎯 WORKING URLS SUMMARY');
  console.log('======================');
  
  if (workingUrls.length === 0) {
    console.log('❌ No working URLs found - all sites are blocking access');
  } else {
    console.log(`✅ Found ${workingUrls.length} working URLs:\n`);
    
    workingUrls.forEach((working, i) => {
      console.log(`${i + 1}. ${working.site}: ${working.url}`);
      console.log(`   Elements: ${working.elements}, Title: ${working.title.substring(0, 60)}...`);
      console.log('');
    });
    
    console.log('🚀 NEXT STEPS:');
    console.log('1. Update scrapers to use these working URLs');
    console.log('2. Run comprehensive data population');
    console.log('3. Verify complete data in dashboard');
  }
  
  return workingUrls;
}

testAllSitesComprehensive().catch(console.error);