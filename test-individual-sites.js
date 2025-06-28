#!/usr/bin/env node

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;

// Test URLs for each site
const testUrls = {
  'QuietLight': 'https://quietlight.com/listings/',
  'Flippa': 'https://flippa.com/browse/websites',
  'Acquire': 'https://acquire.com/directory',
  'BizQuest': 'https://www.bizquest.com/businesses-for-sale/',
  'MicroAcquire': 'https://microacquire.com/marketplace'
};

async function testSite(siteName, url) {
  console.log(`\n🔄 Testing ${siteName}: ${url}`);
  
  const scraperApiUrl = new URL('https://api.scraperapi.com/');
  scraperApiUrl.searchParams.append('api_key', SCRAPER_API_KEY);
  scraperApiUrl.searchParams.append('url', url);
  scraperApiUrl.searchParams.append('render', 'true');
  scraperApiUrl.searchParams.append('country_code', 'us');
  
  try {
    const response = await fetch(scraperApiUrl.toString());
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const html = await response.text();
      console.log(`✅ Success! Retrieved ${html.length} characters`);
      
      // Quick content check
      const $ = cheerio.load(html);
      const title = $('title').text();
      console.log(`Page title: ${title}`);
      
      // Check for business/listing content
      const keywords = ['business', 'listing', 'for sale', 'startup', 'company'];
      const bodyText = $('body').text().toLowerCase();
      const foundKeywords = keywords.filter(keyword => bodyText.includes(keyword));
      console.log(`Found keywords: ${foundKeywords.join(', ')}`);
      
      // Look for potential listing containers
      const commonSelectors = [
        '.listing', '.card', '.business', '.startup', '.item', '.result',
        '[class*="listing"]', '[class*="card"]', '[class*="business"]'
      ];
      
      for (const selector of commonSelectors) {
        const count = $(selector).length;
        if (count > 0) {
          console.log(`Found ${count} elements with selector: ${selector}`);
        }
      }
      
      return true;
    } else {
      const errorText = await response.text();
      console.log(`❌ Failed: ${errorText.substring(0, 200)}...`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function testAllSites() {
  console.log('🚀 Testing all sites with ScraperAPI...');
  
  if (!SCRAPER_API_KEY) {
    console.error('❌ SCRAPER_API_KEY not found');
    return;
  }
  
  const results = {};
  
  for (const [siteName, url] of Object.entries(testUrls)) {
    const success = await testSite(siteName, url);
    results[siteName] = success;
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log('\n📊 Test Results Summary:');
  Object.entries(results).forEach(([site, success]) => {
    console.log(`${success ? '✅' : '❌'} ${site}`);
  });
}

testAllSites().catch(console.error);