// Test function to verify DataForSEO Amazon Ranked Keywords API integration
export async function testDataForSEOASINKeywords() {
  console.log('=== DATAFORSEO AMAZON RANKED KEYWORDS API TEST ===');
  
  const username = import.meta.env.VITE_DATAFORSEO_USERNAME;
  const password = import.meta.env.VITE_DATAFORSEO_PASSWORD;
  
  if (!username || !password) {
    console.error('DataForSEO credentials not configured. Please set VITE_DATAFORSEO_USERNAME and VITE_DATAFORSEO_PASSWORD in .env');
    return;
  }
  
  console.log('DataForSEO credentials found');
  
  // Test with a popular ASIN (example: Hydro Flask water bottle)
  const testASIN = 'B083GB54PY';
  const credentials = btoa(`${username}:${password}`);
  
  console.log(`\n--- Testing ASIN: "${testASIN}" ---`);
  
  try {
    const endpoint = 'https://api.dataforseo.com/v3/dataforseo_labs/amazon/ranked_keywords/live';
    const payload = [{
      asin: testASIN,
      location_code: 2840, // USA
      language_code: 'en',
      limit: 10 // Get top 10 keywords for testing
    }];
    
    console.log('\nFetching ranked keywords from DataForSEO...');
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (response.ok && data.status_code === 20000 && data.tasks?.[0]?.result?.[0]?.items) {
      const items = data.tasks[0].result[0].items;
      console.log(`✅ API Success! Found ${items.length} keywords for ASIN ${testASIN}`);
      
      console.log('\nTop Keywords:');
      items.slice(0, 5).forEach((item, index) => {
        console.log(`\n${index + 1}. Keyword: "${item.keyword_data?.keyword || item.keyword || 'N/A'}"`);
        console.log(`   - Search Volume: ${item.keyword_data?.search_volume || 'N/A'}`);
        console.log(`   - Organic Rank: ${item.ranked_serp_element?.rank_absolute || 'N/A'}`);
        console.log(`   - Keyword Difficulty: ${item.keyword_data?.keyword_difficulty || 'N/A'}`);
        console.log(`   - CPC: $${item.keyword_data?.cpc || '0'}`);
      });
      
      console.log('\n\nFull response structure for first keyword:');
      console.log(JSON.stringify(items[0], null, 2));
    } else {
      console.log(`❌ API Failed`);
      console.log('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error(`❌ API Error:`, error.message);
  }
  
  console.log('\n=== TEST COMPLETE ===');
  console.log('If the API returned keyword rankings, the integration is working correctly!');
}

// Make it available in the browser console
if (typeof window !== 'undefined') {
  window.testDataForSEOASINKeywords = testDataForSEOASINKeywords;
  console.log('DataForSEO ASIN Keywords test available. Run testDataForSEOASINKeywords() in console.');
}