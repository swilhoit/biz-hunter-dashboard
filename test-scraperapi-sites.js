#!/usr/bin/env node

// Test the same sites using ScraperAPI to bypass blocks

import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

async function testScraperAPISites() {
  console.log('🔍 Testing Sites with ScraperAPI\n');
  
  const API_KEY = process.env.SCRAPER_API_KEY;
  if (!API_KEY) {
    console.log('❌ SCRAPER_API_KEY not found in .env file');
    return;
  }
  
  const sites = [
    {
      name: 'QuietLight',
      url: 'https://quietlight.com/businesses-for-sale/'
    },
    {
      name: 'Acquire',
      url: 'https://acquire.com/search?type=startup&status=for-sale'
    },
    {
      name: 'BizQuest',
      url: 'https://www.bizquest.com/businesses-for-sale/'
    },
    {
      name: 'MicroAcquire',
      url: 'https://microacquire.com/browse'
    }
  ];
  
  for (const site of sites) {
    console.log(`\n📍 Testing ${site.name} via ScraperAPI...`);
    
    try {
      const scraperApiUrl = `http://api.scraperapi.com?api_key=${API_KEY}&url=${encodeURIComponent(site.url)}&render=true`;
      
      console.log(`   🌐 Fetching: ${site.url}`);
      const response = await fetch(scraperApiUrl, {
        timeout: 30000
      });
      
      if (!response.ok) {
        console.log(`   ❌ HTTP ${response.status}: ${response.statusText}`);
        continue;
      }
      
      const html = await response.text();
      console.log(`   ✅ Success! Retrieved ${html.length} characters`);
      
      // Analyze the HTML content
      const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || 'No title';
      const hasBusinessContent = /business|sale|opportunity|listing/i.test(html);
      const hasPriceContent = /\$[\d,]+/.test(html);
      const isBlocked = /blocked|captcha|access denied|502|503|cloudflare/i.test(html);
      
      console.log(`   📄 Title: ${title}`);
      console.log(`   📝 Has Business Content: ${hasBusinessContent ? '✅' : '❌'}`);
      console.log(`   💰 Has Price Data: ${hasPriceContent ? '✅' : '❌'}`);
      console.log(`   🚫 Appears Blocked: ${isBlocked ? '❌' : '✅'}`);
      
      // Count potential listing elements
      const divMatches = (html.match(/<div[^>]*class[^>]*>/gi) || []).length;
      const articleMatches = (html.match(/<article[^>]*>/gi) || []).length;
      const cardMatches = (html.match(/class[^>]*card[^>]*/gi) || []).length;
      const listingMatches = (html.match(/class[^>]*listing[^>]*/gi) || []).length;
      
      console.log(`   🔧 Element Analysis:`);
      console.log(`      DIVs: ${divMatches}`);
      console.log(`      Articles: ${articleMatches}`);
      console.log(`      Card classes: ${cardMatches}`);
      console.log(`      Listing classes: ${listingMatches}`);
      
      // Save first 1000 chars for manual inspection
      if (html.length > 1000) {
        console.log(`   📋 First 200 chars: "${html.substring(0, 200).replace(/\\s+/g, ' ')}..."`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n🎯 ScraperAPI test complete!');
  console.log('💡 If sites work with ScraperAPI, update scrapers to use it instead of direct Playwright.');
}

testScraperAPISites();