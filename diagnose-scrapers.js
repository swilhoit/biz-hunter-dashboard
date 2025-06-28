#!/usr/bin/env node

// Quick diagnostic script to test scrapers and database connectivity

import { chromium } from 'playwright';

async function testQuietLight() {
  console.log('🔍 Testing QuietLight scraper directly...\n');
  
  let browser;
  try {
    browser = await chromium.launch({ headless: false }); // Visible for debugging
    const page = await browser.newPage();
    
    console.log('📍 Navigating to QuietLight...');
    await page.goto('https://quietlight.com/businesses-for-sale/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(5000);
    
    console.log('🔍 Checking page structure...');
    
    // Try to extract basic page info
    const pageInfo = await page.evaluate(() => {
      const title = document.title;
      const url = window.location.href;
      const bodyText = document.body ? document.body.innerText.substring(0, 200) : 'No body';
      
      // Try multiple selector strategies
      const selectors = [
        'article',
        '.business-card',
        '.listing-card',
        '.post',
        '[class*="business"]',
        '[class*="listing"]',
        '[class*="card"]',
        'div'
      ];
      
      const selectorResults = {};
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        selectorResults[selector] = elements.length;
      });
      
      // Try to find any potential listing elements
      const allDivs = document.querySelectorAll('div');
      const potentialListings = [];
      
      for (let i = 0; i < Math.min(10, allDivs.length); i++) {
        const div = allDivs[i];
        const text = div.textContent?.trim();
        if (text && text.length > 50 && text.length < 500) {
          potentialListings.push(text.substring(0, 100));
        }
      }
      
      return {
        title,
        url,
        bodyText,
        selectorResults,
        potentialListings
      };
    });
    
    console.log('📊 Page Analysis Results:');
    console.log('Title:', pageInfo.title);
    console.log('URL:', pageInfo.url);
    console.log('Body preview:', pageInfo.bodyText);
    console.log('\n🎯 Selector Results:');
    Object.entries(pageInfo.selectorResults).forEach(([selector, count]) => {
      console.log(`  ${selector}: ${count} elements`);
    });
    
    console.log('\n📝 Potential Listing Content:');
    pageInfo.potentialListings.slice(0, 3).forEach((content, i) => {
      console.log(`  ${i + 1}. ${content}...`);
    });
    
    // Try to extract specific data
    console.log('\n💰 Looking for price/revenue patterns...');
    const financialData = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      const patterns = [
        /\$[\d,]+/g,
        /revenue.*\$[\d,]+/g,
        /profit.*\$[\d,]+/g,
        /price.*\$[\d,]+/g,
        /mrr.*\$[\d,]+/g
      ];
      
      const matches = {};
      patterns.forEach((pattern, i) => {
        const found = text.match(pattern) || [];
        matches[`pattern_${i}`] = found.slice(0, 5); // First 5 matches
      });
      
      return matches;
    });
    
    console.log('Financial data found:', financialData);
    
  } catch (error) {
    console.error('❌ Error testing QuietLight:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function testDatabaseConnection() {
  console.log('\n🗄️ Testing database connection...');
  
  try {
    // Try to read environment variables
    const dotenv = await import('dotenv');
    dotenv.config();
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('Supabase URL:', supabaseUrl ? 'Found' : 'Missing');
    console.log('Supabase Key:', supabaseKey ? 'Found' : 'Missing');
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Supabase credentials missing in .env file');
      return;
    }
    
    // Try basic connection
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('📊 Testing database query...');
    const { data, error } = await supabase
      .from('business_listings')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Database error:', error.message);
    } else {
      console.log('✅ Database connection successful');
      
      // Get actual count
      const { count } = await supabase
        .from('business_listings')
        .select('*', { count: 'exact', head: true });
      
      console.log(`📈 Current listings in database: ${count}`);
      
      // Get recent listings
      const { data: recent } = await supabase
        .from('business_listings')
        .select('name, source, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      console.log('🕒 Recent listings:');
      recent?.forEach(listing => {
        console.log(`  • ${listing.name} (${listing.source}) - ${listing.created_at}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  }
}

async function testScrapingAPI() {
  console.log('\n🌐 Testing scraping API...');
  
  try {
    const response = await fetch('http://localhost:3001/api/health');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Scraping API is running:', data);
    } else {
      console.log('❌ Scraping API not responding');
    }
  } catch (error) {
    console.log('❌ Scraping API not available:', error.message);
    console.log('💡 Try running: npm run scraping-api:dev');
  }
}

async function main() {
  console.log('🚀 BizHunter Scraper Diagnostics\n');
  console.log('This will help identify why scrapers aren\'t finding new listings.\n');
  
  // Test 1: Direct website scraping
  await testQuietLight();
  
  // Test 2: Database connectivity
  await testDatabaseConnection();
  
  // Test 3: API availability
  await testScrapingAPI();
  
  console.log('\n🏁 Diagnostics complete!');
  console.log('\nNext steps based on results:');
  console.log('1. If selectors found 0 elements - website structure changed');
  console.log('2. If database failed - check .env configuration');
  console.log('3. If API not running - start with npm run scraping-api:dev');
}

main().catch(console.error);