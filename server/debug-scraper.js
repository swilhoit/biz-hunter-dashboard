import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;

async function debugScraping() {
  console.log('🔍 Debug: Testing BizBuySell scraping...');
  
  const url = 'https://www.bizbuysell.com/businesses-for-sale/';
  
  const scraperApiUrl = new URL('https://api.scraperapi.com/');
  scraperApiUrl.searchParams.append('api_key', SCRAPER_API_KEY);
  scraperApiUrl.searchParams.append('url', url);
  scraperApiUrl.searchParams.append('render', 'false');
  scraperApiUrl.searchParams.append('country_code', 'us');
  
  try {
    console.log('📡 Fetching page...');
    const response = await fetch(scraperApiUrl.toString());
    const html = await response.text();
    
    console.log(`✅ Got HTML (${html.length} chars)`);
    
    const $ = cheerio.load(html);
    
    // Test different selectors
    const testSelectors = [
      'div[class*="listing"]',
      '.listing-card',
      'article',
      'div[data-testid*="listing"]',
      'div[class*="business"]'
    ];
    
    for (const selector of testSelectors) {
      const elements = $(selector);
      console.log(`🔍 Selector "${selector}": Found ${elements.length} elements`);
      
      if (elements.length > 0) {
        console.log('📋 First 3 elements:');
        elements.slice(0, 3).each((i, el) => {
          const $el = $(el);
          
          // Try to find name
          const nameSelectors = ['h2', 'h3', 'h4', '[data-testid*="title"]'];
          let name = '';
          for (const nameSelector of nameSelectors) {
            const text = $el.find(nameSelector).first().text().trim();
            if (text && text.length > 5) {
              name = text;
              break;
            }
          }
          
          // Try to find URL
          const links = $el.find('a');
          console.log(`   ${i+1}. Name: "${name}"`);
          console.log(`      Links found: ${links.length}`);
          
          links.each((j, link) => {
            const href = $(link).attr('href');
            if (href) {
              console.log(`         ${j+1}. ${href}`);
            }
          });
          
          console.log('---');
        });
        
        break; // Use first working selector
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugScraping();