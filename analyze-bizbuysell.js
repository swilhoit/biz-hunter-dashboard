import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://ueemtnohgkovwzodzxdr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlZW10bm9oZ2tvdnd6b2R6eGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjcyOTUsImV4cCI6MjA2NjQ0MzI5NX0.6_bLS2rSI-XsSwwVB5naQS7OYtyemtXvjn2y5MUM9xk';

// Keywords that indicate NON-ecommerce businesses (to exclude)
const NON_ECOMMERCE_KEYWORDS = [
  'restaurant', 'bar', 'cafe', 'coffee shop', 'pizza', 'bakery',
  'salon', 'spa', 'barbershop', 'hair', 'nail',
  'daycare', 'childcare', 'preschool',
  'laundromat', 'dry cleaning', 'car wash', 'auto repair',
  'gas station', 'convenience store', 'liquor store',
  'gym', 'fitness', 'yoga studio',
  'hotel', 'motel', 'bed and breakfast',
  'medical', 'dental', 'clinic', 'pharmacy',
  'plumbing', 'hvac', 'electrical', 'construction',
  'landscaping', 'lawn care', 'pool service',
  'real estate', 'property management',
  'manufacturing', 'wholesale', 'distribution center',
  'trucking', 'logistics', 'freight',
  'franchise', 'brick and mortar', 'physical location'
];

// Keywords that indicate e-commerce businesses
const ECOMMERCE_KEYWORDS = [
  'ecommerce', 'e-commerce', 'online', 'internet', 'amazon', 'fba', 
  'shopify', 'dropship', 'digital', 'web store', 'marketplace',
  'etsy', 'ebay', 'subscription box', 'saas', 'software'
];

async function analyzeAndCleanup() {
  console.log('🔍 Analyzing BizBuySell listings...\n');
  
  try {
    // Fetch all BizBuySell listings
    const response = await axios.get(
      `${supabaseUrl}/rest/v1/deals`,
      {
        params: {
          source: 'eq.bizbuysell',
          select: 'id,business_name,industry,description,listing_url'
        },
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const listings = response.data;
    console.log(`Found ${listings.length} total BizBuySell listings\n`);
    
    if (listings.length === 0) {
      console.log('No BizBuySell listings found in the database.');
      return;
    }
    
    // Categorize listings
    const nonEcommerce = [];
    const ecommerce = [];
    const uncertain = [];
    
    for (const listing of listings) {
      const searchText = `${listing.business_name || ''} ${listing.industry || ''} ${listing.description || ''}`.toLowerCase();
      
      // Check for non-ecommerce keywords
      const hasNonEcommerceKeywords = NON_ECOMMERCE_KEYWORDS.some(keyword => 
        searchText.includes(keyword)
      );
      
      // Check for ecommerce keywords
      const hasEcommerceKeywords = ECOMMERCE_KEYWORDS.some(keyword => 
        searchText.includes(keyword)
      );
      
      if (hasNonEcommerceKeywords && !hasEcommerceKeywords) {
        nonEcommerce.push(listing);
      } else if (hasEcommerceKeywords) {
        ecommerce.push(listing);
      } else {
        uncertain.push(listing);
      }
    }
    
    // Display results
    console.log('📊 Analysis Results:');
    console.log(`✅ E-commerce businesses: ${ecommerce.length}`);
    console.log(`❌ Non-e-commerce businesses: ${nonEcommerce.length}`);
    console.log(`❓ Uncertain: ${uncertain.length}\n`);
    
    // Show examples of non-ecommerce businesses
    if (nonEcommerce.length > 0) {
      console.log('🚫 Non-E-commerce Businesses to Remove:');
      console.log('='.repeat(60));
      
      const idsToDelete = [];
      nonEcommerce.slice(0, 20).forEach((listing, index) => {
        console.log(`\n${index + 1}. ${listing.business_name || 'Unnamed'}`);
        console.log(`   Industry: ${listing.industry || 'N/A'}`);
        console.log(`   Description: ${(listing.description || '').substring(0, 100)}...`);
        console.log(`   ID: ${listing.id}`);
        idsToDelete.push(listing.id);
      });
      
      if (nonEcommerce.length > 20) {
        console.log(`\n... and ${nonEcommerce.length - 20} more non-ecommerce listings`);
      }
      
      // Delete the non-ecommerce listings
      console.log('\n⚠️  Ready to delete ' + nonEcommerce.length + ' non-ecommerce listings...');
      console.log('Proceeding with deletion in 3 seconds (Ctrl+C to cancel)...');
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Delete in batches
      const batchSize = 50;
      for (let i = 0; i < nonEcommerce.length; i += batchSize) {
        const batch = nonEcommerce.slice(i, i + batchSize);
        const batchIds = batch.map(l => l.id);
        
        try {
          const deleteResponse = await axios.delete(
            `${supabaseUrl}/rest/v1/deals`,
            {
              params: {
                id: `in.(${batchIds.join(',')})`
              },
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          console.log(`✅ Deleted batch ${Math.floor(i/batchSize) + 1}: ${batchIds.length} listings`);
        } catch (deleteError) {
          console.error(`❌ Failed to delete batch ${Math.floor(i/batchSize) + 1}:`, deleteError.message);
        }
      }
      
      console.log('\n✅ Deletion complete!');
    }
    
    // Show uncertain listings for manual review
    if (uncertain.length > 0) {
      console.log('\n⚠️  Uncertain Listings (manual review recommended):');
      console.log('='.repeat(60));
      
      uncertain.slice(0, 10).forEach((listing, index) => {
        console.log(`\n${index + 1}. ${listing.business_name || 'Unnamed'}`);
        console.log(`   Industry: ${listing.industry || 'N/A'}`);
        console.log(`   Description: ${(listing.description || '').substring(0, 100)}...`);
      });
      
      if (uncertain.length > 10) {
        console.log(`\n... and ${uncertain.length - 10} more uncertain listings`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the analysis
analyzeAndCleanup();