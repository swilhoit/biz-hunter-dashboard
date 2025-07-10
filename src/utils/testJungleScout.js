import { fetchDataForKeywords, testJungleScoutAPI } from './explorer/junglescout';

// Test function to diagnose JungleScout API issues
export async function diagnoseJungleScoutAPI() {
  console.log('=== JUNGLESCOUT API DIAGNOSTIC TEST ===');
  
  // Test 1: Check API credentials
  console.log('\n1. Testing API credentials...');
  const credentialsValid = await testJungleScoutAPI();
  console.log('API credentials valid:', credentialsValid);
  
  if (!credentialsValid) {
    console.error('API credentials test failed. Check VITE_JUNGLE_SCOUT_API_KEY and VITE_JUNGLE_SCOUT_KEY_NAME in .env');
    return;
  }
  
  // Test 2: Test with various keyword formats
  console.log('\n2. Testing keyword search with different formats...');
  
  const testKeywords = [
    // Exact product-related terms
    'water bottle',
    'stainless steel water bottle',
    'reusable water bottle',
    'sports water bottle',
    'insulated water bottle',
    // Generic terms
    'bottle',
    'drink',
    'hydration',
    // Brand-related
    'hydro flask',
    'yeti bottle',
    // Long-tail keywords
    'water bottle for kids',
    'water bottle with straw',
    'water bottle 32 oz'
  ];
  
  for (const keyword of testKeywords.slice(0, 5)) { // Test first 5
    console.log(`\n--- Testing keyword: "${keyword}" ---`);
    
    try {
      const results = await fetchDataForKeywords([keyword]);
      
      if (results.length > 0) {
        console.log(`✅ Found ${results.length} results`);
        console.log('Sample result:', {
          keyword: results[0].keyword,
          search_volume: results[0].search_volume,
          ppc_bid_exact: results[0].ppc_bid_exact,
          organic_product_count: results[0].organic_product_count
        });
      } else {
        console.log(`❌ No results found for "${keyword}"`);
      }
    } catch (error) {
      console.error(`❌ Error testing "${keyword}":`, error.message);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n=== DIAGNOSTIC TEST COMPLETE ===');
}

// Run the diagnostic on load
if (typeof window !== 'undefined') {
  window.diagnoseJungleScoutAPI = diagnoseJungleScoutAPI;
  console.log('JungleScout diagnostic available. Run diagnoseJungleScoutAPI() in console.');
}