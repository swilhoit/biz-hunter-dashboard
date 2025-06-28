import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const SCRAPER_API_KEY = '054d8cdaa4e8453e3afa7e5e9316c72f';

async function fetchWithScraperAPI(url) {
  const params = new URLSearchParams({
    api_key: SCRAPER_API_KEY,
    url: url,
    render: 'true'
  });

  const apiUrl = `https://api.scraperapi.com/?${params.toString()}`;
  
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`ScraperAPI request failed: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error.message);
    throw error;
  }
}

async function studyBizBuySell() {
  console.log('=== STUDYING BIZBUYSELL ===\n');
  
  // Study listings page
  console.log('1. Studying listings page...');
  const listingsUrl = 'https://www.bizbuysell.com/businesses-for-sale/';
  const listingsHtml = await fetchWithScraperAPI(listingsUrl);
  const $ = cheerio.load(listingsHtml);
  
  console.log(`Page title: ${$('title').text()}`);
  console.log(`Content length: ${listingsHtml.length} chars`);
  
  // Find listing containers
  const possibleSelectors = [
    '.result-list-item',
    '.listing-item', 
    '.business-listing-item',
    '.search-result',
    '[class*="listing"]',
    '[class*="business"]',
    '[class*="result"]'
  ];
  
  for (const selector of possibleSelectors) {
    const elements = $(selector);
    if (elements.length > 0) {
      console.log(`Found ${elements.length} elements with selector: ${selector}`);
      
      // Study first element structure
      const firstEl = elements.first();
      console.log('\nFirst listing structure:');
      console.log('- HTML classes:', firstEl.attr('class'));
      console.log('- Child elements:', firstEl.children().length);
      
      // Look for key data fields
      const nameSelectors = ['.listing-title', '.business-name', 'h3 a', 'h2 a', '.title'];
      const priceSelectors = ['.price', '.asking-price', '[class*="price"]'];
      const revenueSelectors = ['.revenue', '.annual-revenue', '[class*="revenue"]'];
      
      nameSelectors.forEach(sel => {
        const nameEl = firstEl.find(sel);
        if (nameEl.length > 0) {
          console.log(`- Name found with "${sel}": "${nameEl.text().trim().substring(0, 50)}"`);
        }
      });
      
      priceSelectors.forEach(sel => {
        const priceEl = firstEl.find(sel);
        if (priceEl.length > 0) {
          console.log(`- Price found with "${sel}": "${priceEl.text().trim()}"`);
        }
      });
      
      break;
    }
  }
  
  // Find a specific listing URL to study detail page
  const linkEl = $('a[href*="/business-for-sale/"]').first();
  if (linkEl.length > 0) {
    const detailUrl = linkEl.attr('href');
    if (detailUrl) {
      const fullDetailUrl = detailUrl.startsWith('http') ? detailUrl : `https://www.bizbuysell.com${detailUrl}`;
      console.log(`\n2. Studying detail page: ${fullDetailUrl}`);
      
      try {
        const detailHtml = await fetchWithScraperAPI(fullDetailUrl);
        const detail$ = cheerio.load(detailHtml);
        
        console.log(`Detail page title: ${detail$('title').text()}`);
        
        // Look for detailed information
        const detailSelectors = [
          '.business-details',
          '.listing-details', 
          '.property-details',
          '[class*="detail"]',
          '.asking-price',
          '.annual-revenue',
          '.cash-flow'
        ];
        
        detailSelectors.forEach(sel => {
          const el = detail$(sel);
          if (el.length > 0) {
            console.log(`- Found detail section "${sel}": ${el.text().trim().substring(0, 100)}`);
          }
        });
        
      } catch (error) {
        console.log(`Error fetching detail page: ${error.message}`);
      }
    }
  }
}

async function studyEmpireFlippers() {
  console.log('\n=== STUDYING EMPIRE FLIPPERS ===\n');
  
  const listingsUrl = 'https://empireflippers.com/marketplace';
  const listingsHtml = await fetchWithScraperAPI(listingsUrl);
  const $ = cheerio.load(listingsHtml);
  
  console.log(`Page title: ${$('title').text()}`);
  console.log(`Content length: ${listingsHtml.length} chars`);
  
  // Study structure
  const possibleSelectors = [
    '.listing',
    '.ef-marketplace-listing',
    '.business-card',
    'article',
    '[class*="listing"]',
    '[class*="business"]'
  ];
  
  for (const selector of possibleSelectors) {
    const elements = $(selector);
    if (elements.length > 0) {
      console.log(`Found ${elements.length} elements with selector: ${selector}`);
      
      const firstEl = elements.first();
      console.log('\nFirst listing structure:');
      console.log('- HTML classes:', firstEl.attr('class'));
      console.log('- Text preview:', firstEl.text().trim().substring(0, 200));
      
      break;
    }
  }
}

async function studyFlippa() {
  console.log('\n=== STUDYING FLIPPA ===\n');
  
  const listingsUrl = 'https://flippa.com/buy/monetization/amazon-fba';
  const listingsHtml = await fetchWithScraperAPI(listingsUrl);
  const $ = cheerio.load(listingsHtml);
  
  console.log(`Page title: ${$('title').text()}`);
  console.log(`Content length: ${listingsHtml.length} chars`);
  
  // Study structure
  const possibleSelectors = [
    '.listing-card',
    '.auction-card',
    '[class*="listing"]',
    '[class*="auction"]',
    '[class*="card"]'
  ];
  
  for (const selector of possibleSelectors) {
    const elements = $(selector);
    if (elements.length > 0) {
      console.log(`Found ${elements.length} elements with selector: ${selector}`);
      break;
    }
  }
}

async function studyQuietLight() {
  console.log('\n=== STUDYING QUIET LIGHT ===\n');
  
  const listingsUrl = 'https://quietlight.com/businesses-for-sale/';
  const listingsHtml = await fetchWithScraperAPI(listingsUrl);
  const $ = cheerio.load(listingsHtml);
  
  console.log(`Page title: ${$('title').text()}`);
  console.log(`Content length: ${listingsHtml.length} chars`);
  
  // Study structure
  const possibleSelectors = [
    '.business-listing',
    '.listing-card',
    '.opportunity',
    '[class*="listing"]',
    '[class*="business"]'
  ];
  
  for (const selector of possibleSelectors) {
    const elements = $(selector);
    if (elements.length > 0) {
      console.log(`Found ${elements.length} elements with selector: ${selector}`);
      break;
    }
  }
}

async function main() {
  try {
    await studyBizBuySell();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Delay between sites
    
    await studyEmpireFlippers();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await studyFlippa();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await studyQuietLight();
    
    console.log('\n✅ Site structure study completed!');
    
  } catch (error) {
    console.error('Error during study:', error);
  }
}

main();