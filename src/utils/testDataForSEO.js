// Test function to verify DataForSEO keyword API integration
export async function testDataForSEOKeywords() {
  console.log('=== DATAFORSEO KEYWORD API TEST ===');
  
  const username = import.meta.env.VITE_DATAFORSEO_USERNAME;
  const password = import.meta.env.VITE_DATAFORSEO_PASSWORD;
  
  if (!username || !password) {
    console.error('DataForSEO credentials not configured. Please set VITE_DATAFORSEO_USERNAME and VITE_DATAFORSEO_PASSWORD in .env');
    return;
  }
  
  console.log('DataForSEO credentials found');
  
  const testKeywords = [
    'water bottle',
    'stainless steel water bottle',
    'kids water bottle'
  ];
  
  const credentials = btoa(`${username}:${password}`);
  const endpoint = 'https://api.dataforseo.com/v3/merchant/amazon/keywords/keywords_for_keyword/live';
  
  for (const keyword of testKeywords) {
    console.log(`\n--- Testing keyword: "${keyword}" ---`);
    
    try {
      const payload = [{
        keyword: keyword,
        location_code: 2840, // USA
        language_code: 'en',
        limit: 5
      }];
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error(`HTTP ${response.status}:`, data);
        continue;
      }
      
      if (data.status_code === 20000 && data.tasks?.[0]?.result?.[0]?.items) {
        const items = data.tasks[0].result[0].items;
        console.log(`✅ Found ${items.length} results`);
        
        items.slice(0, 3).forEach((item, index) => {
          console.log(`\nResult ${index + 1}:`);
          console.log(`  Keyword: ${item.keyword}`);
          console.log(`  Search Volume: ${item.search_volume || 'N/A'}`);
          console.log(`  Competition: ${item.competition_level || 'N/A'}`);
          console.log(`  CPC: $${item.cpc || 0}`);
        });
      } else {
        console.log(`❌ No results found`);
        console.log('Response:', JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.error(`❌ Error:`, error.message);
    }
  }
  
  console.log('\n=== TEST COMPLETE ===');
}

// Make it available in the browser console
if (typeof window !== 'undefined') {
  window.testDataForSEOKeywords = testDataForSEOKeywords;
  console.log('DataForSEO keyword test available. Run testDataForSEOKeywords() in console.');
}