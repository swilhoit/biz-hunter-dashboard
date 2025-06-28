import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const SCRAPER_API_KEY = '054d8cdaa4e8453e3afa7e5e9316c72f';

async function fetchWithScraperAPI(url, options = {}) {
  const params = new URLSearchParams({
    api_key: SCRAPER_API_KEY,
    url: url,
    render: 'true',
    ...options
  });

  const apiUrl = `https://api.scraperapi.com/?${params.toString()}`;
  
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`ScraperAPI request failed: ${response.status} ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
    throw error;
  }
}

async function investigateMicroAcquire() {
  console.log('🔍 INVESTIGATING MICROACQUIRE THOROUGHLY\n');
  
  // First, let's check if the site still exists
  const potentialUrls = [
    'https://microacquire.com/',
    'https://www.microacquire.com/',
    'https://microacquire.io/',
    'https://micro-acquire.com/',
    'https://microacquire.com/browse',
    'https://microacquire.com/companies',
    'https://microacquire.com/deals',
    'https://microacquire.com/directory'
  ];
  
  for (const url of potentialUrls) {
    try {
      console.log(`\n📡 Testing: ${url}`);
      const html = await fetchWithScraperAPI(url, { premium: 'true' });
      const $ = cheerio.load(html);
      
      console.log(`✅ SUCCESS!`);
      console.log(`   Title: "${$('title').text()}"`);
      console.log(`   H1: "${$('h1').first().text()}"`);
      console.log(`   Content length: ${html.length} chars`);
      
      // Look for business/startup related content
      if (html.toLowerCase().includes('startup') || 
          html.toLowerCase().includes('acquisition') || 
          html.toLowerCase().includes('business') ||
          html.toLowerCase().includes('company')) {
        console.log(`   🎯 Contains relevant keywords`);
        
        // Check for navigation or links to listings
        const navLinks = [];
        $('nav a, .nav a, header a').each((i, el) => {
          const href = $(el).attr('href');
          const text = $(el).text().trim();
          if (href && text) {
            navLinks.push({ href, text });
          }
        });
        
        console.log(`   🔗 Navigation links found:`, navLinks.slice(0, 5));
        
        // Look for any listing-like structures
        const listingSelectors = [
          '.startup', '.company', '.business', '.listing', '.card',
          '[class*="startup"]', '[class*="company"]', '[class*="business"]', '[class*="listing"]'
        ];
        
        for (const selector of listingSelectors) {
          const count = $(selector).length;
          if (count > 0) {
            console.log(`   📋 Found ${count} "${selector}" elements`);
          }
        }
      }
      
      // If we found the main site, let's look for the actual listings page
      if (url === 'https://microacquire.com/' && html.includes('startup')) {
        console.log('\n🎯 Found main site, looking for listings page...');
        
        // Look for links that might lead to listings
        const potentialListingLinks = [];
        $('a').each((i, el) => {
          const href = $(el).attr('href');
          const text = $(el).text().trim().toLowerCase();
          
          if (href && (text.includes('browse') || text.includes('startup') || text.includes('company') || text.includes('acquisition') || text.includes('marketplace'))) {
            potentialListingLinks.push({ href, text });
          }
        });
        
        console.log('   🔍 Potential listing links:', potentialListingLinks);
      }
      
      break; // Found working URL, stop searching
      
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
  }
  
  console.log('\n🎉 Investigation completed!');
}

investigateMicroAcquire().catch(console.error);