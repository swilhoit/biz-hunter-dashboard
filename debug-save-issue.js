// Debug script - run this in browser console to test save functionality
// Make sure you're signed in first

console.log('🔍 Debugging Save Functionality...');

// Test 1: Check if user is authenticated
(async function debugAuth() {
  try {
    const response = await fetch('/src/integrations/supabase/client.ts');
    console.log('✅ Can access client file');
  } catch (e) {
    console.log('❌ Client access issue:', e);
  }
})();

// Test 2: Check Supabase connection
(async function debugSupabase() {
  try {
    // Check if we can access the window object with supabase
    if (window.supabase) {
      console.log('✅ Supabase available on window');
      
      const { data: { user } } = await window.supabase.auth.getUser();
      console.log('👤 Current user:', user ? user.email : 'Not logged in');
      
      if (user) {
        // Test favorites query
        const { data: favorites, error } = await window.supabase
          .from('favorites')
          .select('*')
          .eq('user_id', user.id);
          
        console.log('❤️ Current favorites:', favorites?.length || 0, error ? `Error: ${error.message}` : '');
        
        // Test getting a listing
        const { data: listings } = await window.supabase
          .from('business_listings')
          .select('id, name')
          .limit(1);
          
        if (listings && listings.length > 0) {
          console.log('📋 Test listing available:', listings[0].name.substring(0, 30) + '...');
          
          // Test adding favorite
          const { data: addResult, error: addError } = await window.supabase
            .from('favorites')
            .insert({ listing_id: listings[0].id, user_id: user.id });
            
          if (addError) {
            console.log('❌ Add favorite error:', addError.message);
          } else {
            console.log('✅ Add favorite success');
            
            // Test removing favorite
            const { error: removeError } = await window.supabase
              .from('favorites')
              .delete()
              .eq('listing_id', listings[0].id)
              .eq('user_id', user.id);
              
            if (removeError) {
              console.log('❌ Remove favorite error:', removeError.message);
            } else {
              console.log('✅ Remove favorite success');
            }
          }
        }
      }
    } else {
      console.log('❌ Supabase not available on window');
    }
  } catch (error) {
    console.log('❌ Debug error:', error);
  }
})();