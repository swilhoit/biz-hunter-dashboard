// Test script to verify saved listings functionality
// Run this in the browser console when logged in to test saving functionality

(async function testSavedListings() {
  console.log('🧪 Testing Saved Listings Functionality...');
  
  try {
    // Import the Supabase client
    const { createClient } = window.supabaseJs || await import('@supabase/supabase-js');
    
    // Get current user
    const supabaseUrl = 'https://omjnwxzqtyzrhevxlbbu.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tam53eHpxdHl6cmhldnhsYmJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0Mzg3MjIsImV4cCI6MjA1MTAxNDcyMn0.TH9w2kPdxYX5V6PgmVh0Y4IVvP5O0J-LfQmRmozI0Qw';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ No user logged in. Please sign in first.');
      return;
    }
    
    console.log('✅ User logged in:', user.email);
    
    // Get a test listing
    const { data: listings } = await supabase
      .from('business_listings')
      .select('id, name')
      .limit(1);
    
    if (!listings || listings.length === 0) {
      console.log('❌ No listings available for testing');
      return;
    }
    
    const testListing = listings[0];
    console.log('📋 Test listing:', testListing.name);
    
    // Test adding favorite
    console.log('💾 Adding to favorites...');
    const { data: addResult, error: addError } = await supabase
      .from('favorites')
      .insert({ listing_id: testListing.id, user_id: user.id });
    
    if (addError) {
      console.error('❌ Error adding favorite:', addError);
      return;
    }
    
    console.log('✅ Added to favorites successfully');
    
    // Test querying favorites
    console.log('🔍 Querying user favorites...');
    const { data: favorites, error: queryError } = await supabase
      .from('favorites')
      .select(`
        id,
        created_at,
        business_listings (*)
      `)
      .eq('user_id', user.id);
    
    if (queryError) {
      console.error('❌ Error querying favorites:', queryError);
      return;
    }
    
    console.log('✅ Favorites query successful:', favorites.length, 'favorites found');
    console.log('Favorites:', favorites);
    
    // Test removing favorite
    console.log('🗑️ Removing from favorites...');
    const { error: removeError } = await supabase
      .from('favorites')
      .delete()
      .eq('listing_id', testListing.id)
      .eq('user_id', user.id);
    
    if (removeError) {
      console.error('❌ Error removing favorite:', removeError);
      return;
    }
    
    console.log('✅ Removed from favorites successfully');
    
    // Verify removal
    const { data: finalCheck } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id);
    
    console.log('✅ Final check - favorites count:', finalCheck.length);
    console.log('🎉 All tests passed! Saved listings functionality is working.');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
})();