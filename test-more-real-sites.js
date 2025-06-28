#!/usr/bin/env node

// Test more business broker sites for real data

import { chromium } from 'playwright';

async function testMoreRealSites() {
  console.log('🔍 Testing More Business Broker Sites for Real Data\n');
  
  const additionalSites = [
    {
      name: 'Website Properties',
      url: 'https://www.websiteproperties.com/listings/',
      description: 'Website and digital business broker'
    },
    {
      name: 'Digital Exits',
      url: 'https://digitalexits.com/businesses-for-sale/',
      description: 'Digital business marketplace'
    },
    {
      name: 'Investors Club',
      url: 'https://theinvestorsclub.com/businesses-for-sale/',
      description: 'Business investment platform'
    },
    {
      name: 'Latona\'s',
      url: 'https://www.latonas.com/buy-a-business/',
      description: 'Business broker marketplace'
    },
    {
      name: 'BizBen',
      url: 'https://www.bizben.com/businesses-for-sale',
      description: 'California business broker'
    },
    {
      name: 'Motion Invest',
      url: 'https://motioninvest.com/marketplace/',
      description: 'Content site marketplace'
    }
  ];

  let workingSites = [];
  
  let browser;
  try {
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    for (const site of additionalSites) {
      console.log(`\n📍 Testing ${site.name}`);
      console.log(`   URL: ${site.url}`);
      console.log(`   Type: ${site.description}`);
      
      const page = await browser.newPage({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      });
      
      try {
        await page.goto(site.url, { 
          waitUntil: 'domcontentloaded', 
          timeout: 20000 
        });
        
        await page.waitForTimeout(3000);
        
        const result = await page.evaluate(() => {
          const title = document.title;
          const bodyLength = document.body ? document.body.innerText.length : 0;
          const bodyText = document.body ? document.body.innerText.toLowerCase() : '';
          
          // Check for errors
          const hasErrors = bodyText.includes('502') || bodyText.includes('error') || 
                           bodyText.includes('blocked') || bodyText.includes('access denied') ||
                           title.toLowerCase().includes('error');
          
          // Check for business content
          const hasBusinessContent = bodyText.includes('business') || bodyText.includes('sale') ||
                                    bodyText.includes('revenue') || bodyText.includes('profit') ||
                                    bodyText.includes('listing') || bodyText.includes('opportunity');
          
          // Check for price data
          const hasPriceData = /\$[\d,]+/.test(bodyText) || bodyText.includes('asking') ||
                              bodyText.includes('price') || bodyText.includes('valuation');
          
          // Count potential listing elements
          const possibleElements = [
            document.querySelectorAll('.listing').length,
            document.querySelectorAll('.business').length,
            document.querySelectorAll('.property').length,
            document.querySelectorAll('article').length,
            document.querySelectorAll('.card').length
          ];
          
          const maxElements = Math.max(...possibleElements);
          
          return {
            title,
            bodyLength,
            hasErrors,
            hasBusinessContent,
            hasPriceData,
            maxElements,
            isWorking: !hasErrors && hasBusinessContent && bodyLength > 2000
          };
        });
        
        console.log(`   📄 Title: ${result.title.substring(0, 60)}...`);
        console.log(`   📊 Content: ${result.bodyLength} chars`);
        console.log(`   🚫 Has Errors: ${result.hasErrors ? 'YES' : 'NO'}`);
        console.log(`   🏢 Has Business Content: ${result.hasBusinessContent ? 'YES' : 'NO'}`);
        console.log(`   💰 Has Price Data: ${result.hasPriceData ? 'YES' : 'NO'}`);
        console.log(`   🎯 Potential Elements: ${result.maxElements}`);
        
        if (result.isWorking) {
          console.log(`   ✅ WORKING! This site has real data`);
          workingSites.push({
            name: site.name,
            url: site.url,
            description: site.description,
            contentLength: result.bodyLength,
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
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
  } catch (error) {
    console.error('❌ Browser test failed:', error.message);
  } finally {
    if (browser) await browser.close();
  }
  
  console.log('\n\n🎯 ADDITIONAL WORKING SITES:');
  console.log('============================');
  
  if (workingSites.length === 0) {
    console.log('❌ No additional working sites found');
  } else {
    workingSites.forEach((site, i) => {
      console.log(`${i + 1}. ${site.name}`);
      console.log(`   URL: ${site.url}`);
      console.log(`   Content: ${site.contentLength} chars`);
      console.log(`   Elements: ${site.elements}`);
      console.log(`   Description: ${site.description}`);
      console.log('');
    });
    
    console.log('🚀 These sites can be scraped for more real data!');
  }
  
  return workingSites;
}

testMoreRealSites().catch(console.error);