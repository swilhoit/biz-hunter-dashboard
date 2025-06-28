import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;

async function analyzeStructure() {
  console.log('🔍 Analyzing BizBuySell HTML structure...');
  
  const url = 'https://www.bizbuysell.com/businesses-for-sale/';
  
  const scraperApiUrl = new URL('https://api.scraperapi.com/');
  scraperApiUrl.searchParams.append('api_key', SCRAPER_API_KEY);
  scraperApiUrl.searchParams.append('url', url);
  scraperApiUrl.searchParams.append('render', 'false');
  
  try {
    const response = await fetch(scraperApiUrl.toString());
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const elements = $('div[class*="listing"]');
    console.log(`Found ${elements.length} listing elements`);
    
    // Analyze the first listing in detail
    const firstListing = elements.first();
    console.log('\n🔍 Analyzing first listing structure:');
    console.log('Class:', firstListing.attr('class'));
    
    // Look for the actual business name and URL
    const allLinks = firstListing.find('a');
    console.log(`\nFound ${allLinks.length} links in first listing:`);
    
    allLinks.each((i, link) => {
      const $link = $(link);
      const href = $link.attr('href');
      const text = $link.text().trim();
      const classes = $link.attr('class') || '';
      
      if (href && (href.includes('business-auction') || href.includes('business-opportunity'))) {
        console.log(`\n${i+1}. BUSINESS LINK:`);
        console.log(`   URL: ${href}`);
        console.log(`   Text: "${text}"`);
        console.log(`   Classes: "${classes}"`);
        console.log(`   Parent element:`, $link.parent().get(0).tagName);
        console.log(`   Parent classes:`, $link.parent().attr('class') || 'none');
      }
    });
    
    // Look for specific patterns in the first few listings
    console.log('\n🔍 Looking for the main link pattern in first 3 listings:');
    
    elements.slice(0, 3).each((index, element) => {
      const $el = $(element);
      
      // Try to find the main business link (not ads or unrelated links)
      const businessLinks = $el.find('a').filter((i, link) => {
        const href = $(link).attr('href');
        return href && (href.includes('business-auction') || href.includes('business-opportunity'));
      });
      
      console.log(`\nListing ${index + 1}:`);
      
      businessLinks.each((i, link) => {
        const $link = $(link);
        const href = $link.attr('href');
        const text = $link.text().trim();
        
        // Check if this link is in a title/header context
        const isInTitle = $link.closest('h1, h2, h3, h4, h5, h6').length > 0;
        const hasBusinessClass = $link.attr('class')?.includes('business') || false;
        
        if (text.length > 5 && text.length < 100) { // Reasonable title length
          console.log(`   ${i+1}. "${text}" -> ${href}`);
          console.log(`      In title: ${isInTitle}, Has business class: ${hasBusinessClass}`);
        }
      });
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

analyzeStructure();