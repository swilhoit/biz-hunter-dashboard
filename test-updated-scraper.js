#!/usr/bin/env node

// Quick test to verify the updated QuietLight scraper revenue extraction

import { chromium } from 'playwright';

async function testUpdatedScraper() {
  console.log('🧪 Testing Updated QuietLight Scraper Logic\n');
  
  let browser;
  try {
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    });
    
    console.log('📍 Loading QuietLight...');
    await page.goto('https://quietlight.com/businesses-for-sale/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    await page.waitForTimeout(3000);
    
    console.log('🔍 Testing extraction logic...');
    
    const results = await page.evaluate(() => {
      const listings = [];
      
      // Try to find listing elements
      const listingSelectors = [
        'article.business-card',
        '.business-listing',
        'article',
        '.post',
        'div[class*="card"]'
      ];
      
      let listingElements = null;
      for (const selector of listingSelectors) {
        listingElements = document.querySelectorAll(selector);
        if (listingElements.length > 0) {
          console.log(`Found ${listingElements.length} elements with: ${selector}`);
          break;
        }
      }
      
      if (!listingElements || listingElements.length === 0) {
        return { error: 'No listing elements found' };
      }
      
      // Process first few listings
      for (let i = 0; i < Math.min(3, listingElements.length); i++) {
        const element = listingElements[i];
        
        // Extract name
        const nameSelectors = ['.listing-title', 'h1', 'h2', 'h3', 'h4', '.title', 'a[title]'];
        let name = '';
        for (const selector of nameSelectors) {
          const nameEl = element.querySelector(selector);
          if (nameEl) {
            name = nameEl.textContent?.trim() || nameEl.getAttribute('title') || '';
            if (name.length > 3) break;
          }
        }
        
        if (!name) continue;
        
        // CRITICAL: Extract financial data from the title
        const titleText = name.toLowerCase();
        let priceText = '';
        let revenueText = '';
        
        const financialPatterns = [
          // Revenue patterns
          /\$?([\d.]+[km]?)\s*revenue/i,
          /revenue[:\s|\|]+\$?([\d.]+[km]?)/i,
          
          // SDE patterns
          /\$?([\d.]+[km]?)\s*sde/i,
          /sde[:\s|\|]+\$?([\d.]+[km]?)/i,
          
          // General money patterns
          /\$(\d+(?:\.\d+)?[km])\b/i
        ];
        
        for (const pattern of financialPatterns) {
          const match = titleText.match(pattern);
          if (match && match[1]) {
            const value = match[1];
            const patternSource = pattern.source;
            
            if (patternSource.includes('revenue') || patternSource.includes('sde')) {
              if (!revenueText) revenueText = value;
            } else {
              if (!revenueText) revenueText = value;
            }
          }
        }
        
        // Parse the values
        function parseValue(text) {
          if (!text) return 0;
          const cleanText = text.toLowerCase();
          if (cleanText.includes('m')) {
            return parseFloat(cleanText.replace('m', '')) * 1000000;
          }
          if (cleanText.includes('k')) {
            return parseFloat(cleanText.replace('k', '')) * 1000;
          }
          return parseFloat(cleanText) || 0;
        }
        
        const parsedRevenue = parseValue(revenueText);
        
        listings.push({
          name: name.substring(0, 80),
          revenueText,
          parsedRevenue,
          hasFinancialData: !!revenueText
        });
      }
      
      return { listings };
    });
    
    if (results.error) {
      console.log('❌ Error:', results.error);
      return;
    }
    
    console.log('\\n📊 Extraction Results:');
    results.listings.forEach((listing, i) => {
      console.log(`\\n${i + 1}. "${listing.name}"`);
      console.log(`   Revenue Text: "${listing.revenueText}"`);
      console.log(`   Parsed Revenue: $${listing.parsedRevenue.toLocaleString()}`);
      console.log(`   Has Financial Data: ${listing.hasFinancialData ? '✅' : '❌'}`);
    });
    
    const withFinancialData = results.listings.filter(l => l.hasFinancialData).length;
    console.log(`\\n🎯 Summary: ${withFinancialData}/${results.listings.length} listings have financial data extracted`);
    
    if (withFinancialData > 0) {
      console.log('✅ SUCCESS: Revenue extraction is working!');
    } else {
      console.log('❌ ISSUE: No revenue data extracted');
    }
    
    // Keep browser open for inspection
    console.log('\\n🔍 Browser staying open for inspection. Press Ctrl+C when done.');
    await new Promise(() => {}); // Keep running
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testUpdatedScraper();