#!/usr/bin/env node

// Quick test to check what's happening with website selectors

import { chromium } from 'playwright';

async function testSiteSelectors() {
  console.log('🔍 Testing Website Selectors\n');
  
  const sites = [
    {
      name: 'QuietLight',
      url: 'https://quietlight.com/businesses-for-sale/',
      selectors: [
        'article.business-card',
        '.business-listing',
        'article',
        '.post',
        'div[class*="card"]',
        'div[class*="business"]'
      ]
    },
    {
      name: 'Acquire',
      url: 'https://acquire.com/search?type=startup&status=for-sale',
      selectors: [
        '.startup-card',
        '.listing-card',
        'article',
        '.card',
        'div[class*="startup"]',
        'div[class*="listing"]'
      ]
    },
    {
      name: 'BizQuest',
      url: 'https://www.bizquest.com/businesses-for-sale/',
      selectors: [
        '.listing-item',
        '.business-card',
        'article',
        '.property-card',
        'div[class*="listing"]',
        'div[class*="business"]'
      ]
    }
  ];

  let browser;
  try {
    browser = await chromium.launch({ 
      headless: true,
      args: ['--disable-blink-features=AutomationControlled']
    });
    
    for (const site of sites) {
      console.log(`\n📍 Testing ${site.name}: ${site.url}`);
      
      const page = await browser.newPage({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });
      
      try {
        await page.goto(site.url, { 
          waitUntil: 'domcontentloaded', 
          timeout: 30000 
        });
        
        // Wait for content
        await page.waitForTimeout(3000);
        
        const results = await page.evaluate((selectors) => {
          const analysis = {
            title: document.title,
            url: window.location.href,
            bodyLength: document.body ? document.body.innerText.length : 0,
            selectorResults: {}
          };
          
          selectors.forEach(selector => {
            try {
              const elements = document.querySelectorAll(selector);
              analysis.selectorResults[selector] = elements.length;
              
              // Get sample content if found
              if (elements.length > 0 && elements.length < 20) {
                const samples = [];
                for (let i = 0; i < Math.min(3, elements.length); i++) {
                  const text = elements[i].textContent?.trim();
                  if (text && text.length > 20) {
                    samples.push(text.substring(0, 100));
                  }
                }
                if (samples.length > 0) {
                  analysis.selectorResults[`${selector}_samples`] = samples;
                }
              }
            } catch (e) {
              analysis.selectorResults[selector] = `Error: ${e.message}`;
            }
          });
          
          // Check for common content indicators
          const text = document.body.innerText.toLowerCase();
          analysis.hasListings = text.includes('business') || text.includes('sale') || text.includes('opportunity');
          analysis.hasNumbers = /\$[\d,]+/.test(text);
          analysis.blocked = text.includes('blocked') || text.includes('captcha') || text.includes('access denied');
          
          return analysis;
        }, site.selectors);
        
        console.log(`   Title: ${results.title}`);
        console.log(`   Body Length: ${results.bodyLength} chars`);
        console.log(`   Has Business Content: ${results.hasListings ? '✅' : '❌'}`);
        console.log(`   Has Price Numbers: ${results.hasNumbers ? '✅' : '❌'}`);
        console.log(`   Appears Blocked: ${results.blocked ? '🚫' : '✅'}`);
        
        console.log('   Selector Results:');
        Object.entries(results.selectorResults).forEach(([selector, count]) => {
          if (!selector.includes('_samples')) {
            console.log(`     ${selector}: ${count} elements`);
          }
        });
        
        // Show samples if found
        const samplesFound = Object.keys(results.selectorResults).filter(k => k.includes('_samples'));
        if (samplesFound.length > 0) {
          console.log('   Sample Content:');
          samplesFound.forEach(key => {
            const selector = key.replace('_samples', '');
            const samples = results.selectorResults[key];
            console.log(`     ${selector}:`);
            samples.forEach((sample, i) => {
              console.log(`       ${i + 1}. "${sample}..."`);
            });
          });
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      } finally {
        await page.close();
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  console.log('\n🎯 Analysis complete!');
}

testSiteSelectors();