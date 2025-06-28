// Simple ScraperAPI demo - exactly as shown in your example
import fetch from 'node-fetch';

async function demoScraperAPI() {
  console.log('ScraperAPI Demo - Fetching Flippa marketplace...\n');
  
  try {
    const response = await fetch('https://api.scraperapi.com/?api_key=054d8cdaa4e8453e3afa7e5e9316c72f&url=https%3A%2F%2Fflippa.com%2Fbuy%2Fmonetization%2Famazon-fba');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    console.log(`Successfully fetched ${html.length} characters from Flippa`);
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Content type: ${response.headers.get('content-type')}`);
    
    // Extract page title as a simple test
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      console.log(`Page title: ${titleMatch[1].trim()}`);
    }
    
    console.log('\n✅ ScraperAPI is working perfectly!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

demoScraperAPI();