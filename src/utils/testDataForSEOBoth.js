// Test function to verify DataForSEO Amazon + Google keyword API integration
export async function testDataForSEOBothAPIs() {
  console.log('=== DATAFORSEO AMAZON + GOOGLE KEYWORD API TEST ===');
  
  const username = import.meta.env.VITE_DATAFORSEO_USERNAME;
  const password = import.meta.env.VITE_DATAFORSEO_PASSWORD;
  
  if (!username || !password) {
    console.error('DataForSEO credentials not configured. Please set VITE_DATAFORSEO_USERNAME and VITE_DATAFORSEO_PASSWORD in .env');
    return;
  }
  
  console.log('DataForSEO credentials found');
  
  const testKeyword = 'water bottle';
  const credentials = btoa(`${username}:${password}`);
  
  console.log(`\n--- Testing keyword: "${testKeyword}" ---`);
  
  // Test Amazon API
  console.log('\n1. Testing Amazon Bulk Search Volume API:');
  try {
    const amazonEndpoint = 'https://api.dataforseo.com/v3/dataforseo_labs/amazon/bulk_search_volume/live';
    const amazonPayload = [{
      keywords: [testKeyword, 'stainless steel water bottle', 'kids water bottle'],
      location_code: 2840, // USA
      language_code: 'en'
    }];
    
    const amazonResponse = await fetch(amazonEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(amazonPayload)
    });
    
    const amazonData = await amazonResponse.json();
    
    if (amazonResponse.ok && amazonData.status_code === 20000 && amazonData.tasks?.[0]?.result?.[0]?.items) {
      const items = amazonData.tasks[0].result[0].items;
      console.log(`✅ Amazon API Success! Found ${items.length} results`);
      
      items.forEach(item => {
        console.log(`  Keyword: "${item.keyword}" - Search Volume: ${item.search_volume || 'N/A'}`);
      });
    } else {
      console.log(`❌ Amazon API Failed`);
      console.log('Response:', JSON.stringify(amazonData, null, 2));
    }
  } catch (error) {
    console.error(`❌ Amazon API Error:`, error.message);
  }
  
  // Test Google API
  console.log('\n2. Testing Google Keywords API:');
  try {
    const googleEndpoint = 'https://api.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/live';
    const googlePayload = [{
      keywords: [testKeyword],
      location_code: 2840, // USA
      language_code: 'en'
    }];
    
    const googleResponse = await fetch(googleEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(googlePayload)
    });
    
    const googleData = await googleResponse.json();
    
    if (googleResponse.ok && googleData.status_code === 20000 && googleData.tasks?.[0]?.result?.[0]) {
      const result = googleData.tasks[0].result[0];
      console.log(`✅ Google API Success!`);
      console.log(`  Keyword: ${result.keyword}`);
      console.log(`  Search Volume: ${result.search_volume || 'N/A'}`);
      console.log(`  CPC: $${result.cpc || 0}`);
      console.log(`  Competition: ${result.competition || 'N/A'}`);
    } else {
      console.log(`❌ Google API Failed`);
      console.log('Response:', JSON.stringify(googleData, null, 2));
    }
  } catch (error) {
    console.error(`❌ Google API Error:`, error.message);
  }
  
  console.log('\n=== TEST COMPLETE ===');
  console.log('If both APIs returned data, the integration is working correctly!');
}

// Make it available in the browser console
if (typeof window !== 'undefined') {
  window.testDataForSEOBothAPIs = testDataForSEOBothAPIs;
  console.log('DataForSEO Amazon+Google test available. Run testDataForSEOBothAPIs() in console.');
}