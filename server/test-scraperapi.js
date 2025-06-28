import fetch from 'node-fetch';

const API_KEY = '054d8cdaa4e8453e3afa7e5e9316c72f';

async function testScraperAPI() {
  console.log('Testing ScraperAPI...\n');
  
  // Test 1: Simple website
  console.log('Test 1: Scraping example.com');
  const testUrl = `https://api.scraperapi.com/?api_key=${API_KEY}&url=https://example.com`;
  
  try {
    const response = await fetch(testUrl);
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const html = await response.text();
      console.log(`✅ Success! Retrieved ${html.length} characters`);
      console.log('First 200 chars:', html.substring(0, 200));
    } else {
      console.log('❌ Failed:', await response.text());
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  // Test 2: Check account status
  console.log('\n\nTest 2: Checking account status');
  const accountUrl = `https://api.scraperapi.com/account?api_key=${API_KEY}`;
  
  try {
    const response = await fetch(accountUrl);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Account Status:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Failed to get account status');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testScraperAPI();