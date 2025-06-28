#!/usr/bin/env node

// Targeted QuietLight fix based on actual data patterns

import { chromium } from 'playwright';

async function analyzeQuietLightStructure() {
  console.log('🔍 Analyzing QuietLight website structure...\n');
  
  let browser;
  try {
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    console.log('📍 Loading QuietLight...');
    await page.goto('https://quietlight.com/businesses-for-sale/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    // Wait for content to load
    await page.waitForTimeout(3000);
    
    console.log('🔍 Analyzing page structure...');
    
    const analysis = await page.evaluate(() => {
      // Let's find all text that contains revenue/price patterns
      const text = document.body.innerText;
      
      // Extract financial patterns from the text
      const revenuePatterns = [
        /\$[\d,]+(?:\.\d+)?[km]?\s*(?:revenue|sde|profit|mrr|arr)/gi,
        /(?:revenue|sde|profit|mrr|arr)[:\s]*\$[\d,]+(?:\.\d+)?[km]?/gi,
        /\$[\d,]+(?:\.\d+)?[km]/gi
      ];
      
      const foundFinancials = [];
      revenuePatterns.forEach(pattern => {
        const matches = text.match(pattern) || [];
        foundFinancials.push(...matches);
      });
      
      // Get unique matches
      const uniqueFinancials = [...new Set(foundFinancials)].slice(0, 10);
      
      // Try to find actual listing containers
      const possibleSelectors = [
        'article',
        '.post',
        '.listing',
        '.business',
        '[class*="card"]',
        '[class*="item"]',
        '[class*="business"]',
        '[class*="listing"]',
        'div'
      ];
      
      const selectorResults = {};
      
      possibleSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          selectorResults[selector] = elements.length;
          
          // For first few elements, get sample content
          if (elements.length > 0 && elements.length < 50) {
            const samples = [];
            for (let i = 0; i < Math.min(3, elements.length); i++) {
              const elem = elements[i];
              const text = elem.textContent?.trim();
              if (text && text.length > 50 && text.length < 300) {
                samples.push(text.substring(0, 100));
              }
            }
            if (samples.length > 0) {
              selectorResults[`${selector}_samples`] = samples;
            }
          }
        } catch (e) {
          selectorResults[selector] = `Error: ${e.message}`;
        }
      });
      
      // Try to find elements that contain financial data
      const elementsWithMoney = [];
      const allElements = document.querySelectorAll('*');
      
      for (let i = 0; i < Math.min(allElements.length, 100); i++) {
        const elem = allElements[i];
        const text = elem.textContent?.trim() || '';
        
        if (text.length > 20 && text.length < 200 && 
            (text.includes('$') || text.toLowerCase().includes('revenue') || 
             text.toLowerCase().includes('sde') || text.toLowerCase().includes('profit'))) {
          
          elementsWithMoney.push({
            tagName: elem.tagName,
            className: elem.className,
            text: text.substring(0, 100),
            hasFinancial: /\$[\d,]+/g.test(text)
          });
          
          if (elementsWithMoney.length >= 10) break;
        }
      }
      
      return {
        url: window.location.href,
        title: document.title,
        uniqueFinancials,
        selectorResults,
        elementsWithMoney
      };
    });
    
    console.log('📊 Analysis Results:');
    console.log('URL:', analysis.url);
    console.log('Title:', analysis.title);
    
    console.log('\n💰 Financial data found in text:');
    analysis.uniqueFinancials.forEach((financial, i) => {
      console.log(`  ${i + 1}. ${financial}`);
    });
    
    console.log('\n🎯 Selector Results:');
    Object.entries(analysis.selectorResults).forEach(([selector, result]) => {
      if (!selector.includes('_samples')) {
        console.log(`  ${selector}: ${result} elements`);
      }
    });
    
    console.log('\n📝 Sample content from selectors:');
    Object.entries(analysis.selectorResults).forEach(([selector, samples]) => {
      if (selector.includes('_samples') && Array.isArray(samples)) {
        console.log(`  ${selector.replace('_samples', '')}:`);
        samples.forEach((sample, i) => {
          console.log(`    ${i + 1}. ${sample}...`);
        });
      }
    });
    
    console.log('\n💵 Elements containing financial data:');
    analysis.elementsWithMoney.forEach((elem, i) => {
      console.log(`  ${i + 1}. <${elem.tagName}> class="${elem.className}"`);
      console.log(`     Text: ${elem.text}...`);
      console.log(`     Has $: ${elem.hasFinancial}`);
    });
    
    // Keep browser open for manual inspection
    console.log('\n🔍 Browser staying open for manual inspection...');
    console.log('Press Ctrl+C when done inspecting');
    
    // Wait indefinitely
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

analyzeQuietLightStructure();