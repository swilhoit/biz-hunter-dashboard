#!/usr/bin/env node

// Test the fixed QuietLight scraper with working URL

import { chromium } from 'playwright';

async function testFixedQuietLight() {
  console.log('🧪 Testing Fixed QuietLight Scraper\n');
  
  let browser;
  try {
    browser = await chromium.launch({ headless: false }); // Visible for debugging
    const page = await browser.newPage({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    });
    
    console.log('📍 Loading WORKING QuietLight URL...');
    await page.goto('https://quietlight.com/listings/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    await page.waitForTimeout(3000);
    
    console.log('🔍 Extracting listings...');
    
    const results = await page.evaluate(() => {
      const listings = [];
      
      // Try multiple selectors
      const selectors = [
        'article',
        '.listing-card',
        '.business-card', 
        '.post',
        'div[class*="listing"]',
        'div[class*="business"]'
      ];
      
      let foundElements = null;
      let usedSelector = '';
      
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          foundElements = elements;
          usedSelector = selector;
          console.log(`Found ${elements.length} elements with: ${selector}`);
          break;
        }
      }
      
      if (!foundElements) {
        return { error: 'No listing elements found', selectors: selectors.map(s => ({ selector: s, count: document.querySelectorAll(s).length })) };
      }
      
      // Extract data from first few listings
      for (let i = 0; i < Math.min(5, foundElements.length); i++) {
        const element = foundElements[i];
        
        // Extract name/title
        const titleSelectors = ['h1', 'h2', 'h3', '.title', '.listing-title', 'a[title]'];
        let name = '';
        for (const sel of titleSelectors) {
          const titleEl = element.querySelector(sel);
          if (titleEl) {
            name = titleEl.textContent?.trim() || titleEl.getAttribute('title') || '';
            if (name.length > 3) break;
          }
        }
        
        // Extract financial data from title (our fixed logic)
        let revenueFromTitle = '';
        if (name) {
          const titleText = name.toLowerCase();
          const patterns = [
            /\$?([\d.]+[km]?)\s*revenue/i,
            /\$?([\d.]+[km]?)\s*sde/i,
            /\$(\d+(?:\.\d+)?[km])\b/i
          ];
          
          for (const pattern of patterns) {
            const match = titleText.match(pattern);
            if (match && match[1]) {
              revenueFromTitle = match[1];
              break;
            }
          }
        }
        
        // Extract URL
        const linkEl = element.querySelector('a[href]');
        const url = linkEl ? linkEl.getAttribute('href') : '';
        
        if (name && name.length > 3) {
          listings.push({
            name: name.substring(0, 100),
            revenueFromTitle,
            url: url.startsWith('http') ? url : `https://quietlight.com${url}`,
            foundWith: usedSelector
          });
        }
      }
      
      return { 
        success: true, 
        listings, 
        totalElements: foundElements.length,
        usedSelector 
      };
    });
    
    if (results.error) {
      console.log('❌ Error:', results.error);
      console.log('Selector counts:', results.selectors);
    } else {
      console.log(`✅ SUCCESS! Found ${results.totalElements} elements with "${results.usedSelector}"`);
      console.log(`📋 Extracted ${results.listings.length} listings:\n`);
      
      results.listings.forEach((listing, i) => {
        console.log(`${i + 1}. "${listing.name}"`);
        console.log(`   Revenue: ${listing.revenueFromTitle || 'None detected'}`);
        console.log(`   URL: ${listing.url}`);
        console.log('');
      });
      
      const withRevenue = results.listings.filter(l => l.revenueFromTitle).length;
      console.log(`🎯 SUMMARY: ${withRevenue}/${results.listings.length} listings have revenue data!`);
    }
    
    console.log('\n🔍 Browser staying open for inspection. Press Ctrl+C when done.');
    await new Promise(() => {}); // Keep running
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testFixedQuietLight();