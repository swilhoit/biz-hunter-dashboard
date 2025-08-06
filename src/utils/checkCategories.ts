import { supabase } from '../lib/supabase';

// Debug function to check current category values
export async function checkCurrentCategories() {
  try {
    // Get a sample of listings
    const { data: listings, error } = await supabase
      .from('business_listings')
      .select('id, name, industry')
      .limit(20);
    
    if (error) {
      console.error('Error fetching listings:', error);
      return;
    }
    
    console.log('Current category values in business_listings:');
    listings?.forEach(listing => {
      console.log(`${listing.name}: "${listing.industry || 'NULL'}"`);
    });
    
    // Count by category
    const { data: categoryCounts, error: countError } = await supabase
      .from('business_listings')
      .select('industry')
      .limit(1000);
      
    if (!countError && categoryCounts) {
      const counts = categoryCounts.reduce((acc, item) => {
        const cat = item.industry || 'NULL/Empty';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log('\nCategory distribution:');
      Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .forEach(([category, count]) => {
          console.log(`  ${category}: ${count}`);
        });
    }
  } catch (error) {
    console.error('Error in checkCurrentCategories:', error);
  }
}

// Make it available globally for testing
if (typeof window !== 'undefined') {
  (window as any).checkCurrentCategories = checkCurrentCategories;
}