import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;

async function testUrlExtraction() {
  console.log('🔍 Testing URL extraction logic...');
  
  const url = 'https://www.bizbuysell.com/businesses-for-sale/';
  
  const scraperApiUrl = new URL('https://api.scraperapi.com/');
  scraperApiUrl.searchParams.append('api_key', SCRAPER_API_KEY);
  scraperApiUrl.searchParams.append('url', url);
  scraperApiUrl.searchParams.append('render', 'false');
  
  try {
    const response = await fetch(scraperApiUrl.toString());
    const html = await response.text();
    const $ = cheerio.load(html);
    
    console.log('📋 Testing on first few listings...');
    
    const elements = $('div[class*="listing"]');
    console.log(`Found ${elements.length} listing elements`);
    
    elements.slice(0, 3).each((index, element) => {
      const $el = $(element);
      
      // Extract name (same logic as server)
      const nameSelectors = ['h2', 'h3', 'h4', '[data-testid*="title"]', 'a[href*="business-for-sale"]'];
      let name = '';
      
      for (const nameSelector of nameSelectors) {
        const text = $el.find(nameSelector).first().text().trim();
        if (text && text.length > 5 && text.length < 200) {
          name = text;
          break;
        }
      }
      
      console.log(`\n${index + 1}. Business Name: "${name}"`);
      
      if (!name) {
        console.log('   ❌ No name found, skipping URL extraction');
        return;
      }
      
      // URL extraction logic (same as server)
      let originalUrl = null;
      
      // First try to find a link in the title/heading area
      const titleLink = $el.find('h2 a, h3 a, h4 a, [data-testid*="title"] a').first();
      let titleHref = titleLink.attr('href');
      
      console.log(`   🔍 Title link: ${titleHref || 'none'}`);
      
      if (titleHref && (titleHref.includes('business-opportunity') || titleHref.includes('business-auction') || titleHref.includes('business-for-sale'))) {
        originalUrl = titleHref.startsWith('http') ? titleHref : `https://www.bizbuysell.com${titleHref}`;
        console.log(`   ✅ Found title URL: ${originalUrl}`);
      } else {
        console.log('   🔍 No title URL, trying fuzzy match...');
        
        // Fallback: look for any link that might contain the business name (fuzzy match)
        const allLinks = $el.find('a[href*="business-opportunity"], a[href*="business-auction"], a[href*="business-for-sale"]');
        console.log(`   🔗 Found ${allLinks.length} business links to check`);
        
        const nameWords = name.toLowerCase().split(' ').filter(word => word.length > 3);
        console.log(`   📝 Key words from name: [${nameWords.join(', ')}]`);
        
        allLinks.each((i, link) => {
          const href = $(link).attr('href');
          const linkText = $(link).text().toLowerCase();
          
          if (i < 5) { // Only log first 5 for debugging
            console.log(`     ${i+1}. Link: ${href}`);
            console.log(`        Text: "${linkText.substring(0, 50)}..."`);
          }
          
          // Check if the link text or href contains key words from the business name
          const matches = nameWords.some(word => 
            href.toLowerCase().includes(word) || linkText.includes(word)
          );
          
          if (matches && href) {
            originalUrl = href.startsWith('http') ? href : `https://www.bizbuysell.com${href}`;
            console.log(`     ✅ MATCH FOUND: ${originalUrl}`);
            return false; // Break the each loop
          }
        });
        
        if (!originalUrl) {
          console.log('   ❌ No matching URL found');
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testUrlExtraction();