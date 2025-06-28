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
    console.log(`🔍 Fetching: ${url}`);
    console.log(`📡 ScraperAPI URL: ${apiUrl.substring(0, 100)}...`);
    
    const response = await fetch(apiUrl);
    console.log(`📊 Response: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      throw new Error(`ScraperAPI request failed: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    console.log(`📄 Content length: ${html.length} chars`);
    
    return html;
  } catch (error) {
    console.error(`❌ Error fetching ${url}:`, error.message);
    throw error;
  }
}

async function troubleshootEmpireFlippers() {
  console.log('\n=== TROUBLESHOOTING EMPIRE FLIPPERS ===\n');
  
  try {
    const url = 'https://empireflippers.com/marketplace';
    const html = await fetchWithScraperAPI(url, { premium: 'true' });
    const $ = cheerio.load(html);
    
    console.log(`📋 Page title: "${$('title').text()}"`);
    console.log(`🔤 H1 content: "${$('h1').first().text()}"`);
    
    // Check if we're getting blocked
    if (html.includes('blocked') || html.includes('captcha') || html.includes('cloudflare')) {
      console.log('🚫 Appears to be blocked or has protection');
    }
    
    // Analyze structure
    console.log('\n🔍 Structure Analysis:');
    const selectors = [
      '.listing',
      '.marketplace-listing',
      '.ef-marketplace-listing', 
      '.business-card',
      'article',
      '[class*="listing"]',
      '[class*="card"]',
      '[data-testid]'
    ];
    
    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`✅ Found ${elements.length} elements with "${selector}"`);
        
        // Analyze first element
        const firstEl = elements.first();
        console.log(`   Classes: ${firstEl.attr('class')}`);
        console.log(`   Data attrs: ${Object.keys(firstEl.get(0)?.attribs || {}).filter(k => k.startsWith('data-')).join(', ')}`);
        console.log(`   Text preview: "${firstEl.text().trim().substring(0, 100)}"`);
        
        // Look for names/titles
        const nameSelectors = ['h1', 'h2', 'h3', 'h4', '.title', '.name', '[class*="title"]', '[class*="name"]'];
        nameSelectors.forEach(nameSel => {
          const nameEl = firstEl.find(nameSel);
          if (nameEl.length > 0 && nameEl.text().trim()) {
            console.log(`   📝 Name found with "${nameSel}": "${nameEl.text().trim()}"`);
          }
        });
        
        break;
      }
    }
    
    // Check for specific Empire Flippers patterns
    console.log('\n🎯 Empire Flippers Specific Checks:');
    console.log(`- .ef- classes: ${$('[class*="ef-"]').length} elements`);
    console.log(`- .marketplace classes: ${$('[class*="marketplace"]').length} elements`);
    console.log(`- data-listing: ${$('[data-listing]').length} elements`);
    console.log(`- React components: ${$('[data-reactid], [data-react-]').length} elements`);
    
  } catch (error) {
    console.error('💥 Empire Flippers error:', error.message);
  }
}

async function troubleshootQuietLight() {
  console.log('\n=== TROUBLESHOOTING QUIET LIGHT ===\n');
  
  try {
    // Try different URL variations
    const urls = [
      'https://quietlight.com/businesses-for-sale/',
      'https://quietlight.com/listings/',
      'https://quietlight.com/opportunities/',
      'https://www.quietlight.com/businesses-for-sale/'
    ];
    
    for (const url of urls) {
      try {
        console.log(`\n🔄 Trying: ${url}`);
        const html = await fetchWithScraperAPI(url, { 
          premium: 'true',
          country_code: 'us'
        });
        
        const $ = cheerio.load(html);
        console.log(`✅ Success! Title: "${$('title').text()}"`);
        
        // Quick structure check
        const listingSelectors = ['.business-listing', '.listing', '.opportunity', '[class*="listing"]'];
        for (const selector of listingSelectors) {
          const count = $(selector).length;
          if (count > 0) {
            console.log(`📋 Found ${count} "${selector}" elements`);
          }
        }
        
        break; // Success, exit loop
        
      } catch (urlError) {
        console.log(`❌ Failed: ${urlError.message}`);
      }
    }
    
  } catch (error) {
    console.error('💥 Quiet Light error:', error.message);
  }
}

async function troubleshootFlippa() {
  console.log('\n=== TROUBLESHOOTING FLIPPA ===\n');
  
  try {
    // Try different Flippa URLs
    const urls = [
      'https://flippa.com/browse/websites',
      'https://flippa.com/search?filter_category=website',
      'https://flippa.com/buy',
      'https://flippa.com/buy/monetization/ecommerce'
    ];
    
    for (const url of urls) {
      try {
        console.log(`\n🔄 Trying: ${url}`);
        const html = await fetchWithScraperAPI(url, { 
          premium: 'true',
          render: 'true',
          wait: '3'
        });
        
        const $ = cheerio.load(html);
        console.log(`✅ Success! Title: "${$('title').text()}"`);
        
        // Look for listing patterns
        const selectors = [
          '.listing-card',
          '.auction-card', 
          '.business-card',
          '[class*="card"]',
          '[class*="listing"]',
          '[class*="auction"]',
          '[data-testid*="listing"]'
        ];
        
        for (const selector of selectors) {
          const elements = $(selector);
          if (elements.length > 0) {
            console.log(`📋 Found ${elements.length} "${selector}" elements`);
            
            // Check first element for data
            const firstEl = elements.first();
            console.log(`   Text preview: "${firstEl.text().trim().substring(0, 150)}"`);
            
            // Look for price indicators
            const priceSelectors = ['.price', '.bid', '.current-bid', '[class*="price"]', '[class*="bid"]'];
            priceSelectors.forEach(priceSel => {
              const priceEl = firstEl.find(priceSel);
              if (priceEl.length > 0 && priceEl.text().trim()) {
                console.log(`   💰 Price found with "${priceSel}": "${priceEl.text().trim()}"`);
              }
            });
          }
        }
        
        break; // Success, exit loop
        
      } catch (urlError) {
        console.log(`❌ Failed: ${urlError.message}`);
      }
    }
    
  } catch (error) {
    console.error('💥 Flippa error:', error.message);
  }
}

async function troubleshootMicroAcquire() {
  console.log('\n=== TROUBLESHOOTING MICROACQUIRE ===\n');
  
  try {
    // Try different MicroAcquire URLs
    const urls = [
      'https://microacquire.com/startups',
      'https://microacquire.com/marketplace',
      'https://microacquire.com/acquisitions',
      'https://microacquire.com/browse',
      'https://microacquire.com/',
      'https://www.microacquire.com/startups'
    ];
    
    for (const url of urls) {
      try {
        console.log(`\n🔄 Trying: ${url}`);
        const html = await fetchWithScraperAPI(url, { 
          premium: 'true',
          render: 'true',
          wait: '5'
        });
        
        const $ = cheerio.load(html);
        console.log(`✅ Success! Title: "${$('title').text()}"`);
        
        // Look for startup/business listings
        const selectors = [
          '.startup-card',
          '.company-card',
          '.business-card',
          '.listing-card',
          '[class*="startup"]',
          '[class*="company"]',
          '[class*="business"]',
          '[class*="card"]'
        ];
        
        for (const selector of selectors) {
          const elements = $(selector);
          if (elements.length > 0) {
            console.log(`📋 Found ${elements.length} "${selector}" elements`);
            
            const firstEl = elements.first();
            console.log(`   Text preview: "${firstEl.text().trim().substring(0, 150)}"`);
          }
        }
        
        // Check page content for clues
        if (html.includes('startup') || html.includes('acquisition') || html.includes('business')) {
          console.log('🎯 Contains relevant keywords');
        }
        
        break; // Success, exit loop
        
      } catch (urlError) {
        console.log(`❌ Failed: ${urlError.message}`);
      }
    }
    
  } catch (error) {
    console.error('💥 MicroAcquire error:', error.message);
  }
}

async function main() {
  console.log('🔧 SCRAPER TROUBLESHOOTING TOOLKIT');
  console.log('='.repeat(50));
  
  await troubleshootEmpireFlippers();
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  await troubleshootQuietLight();
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  await troubleshootFlippa();
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  await troubleshootMicroAcquire();
  
  console.log('\n🎉 Troubleshooting completed!');
}

main().catch(console.error);