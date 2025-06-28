# How to Test Save Listings Functionality

## Current Status
✅ **Database Setup**: 343 business listings, 0 favorites, 1 user  
✅ **RLS Policies**: Correctly configured on favorites table  
✅ **CORS Issues**: Fixed (removed problematic external API calls)  
✅ **Code Improvements**: SaveButton optimistic updates, better error handling  

## Testing Steps

### 1. Open the Application
- Navigate to `http://localhost:8081/` (or whatever port is shown)
- The app should load without CORS errors now

### 2. Sign In
- Use the navigation to sign in to your account
- Verify you see your email in the user menu

### 3. Test with Debug Tool
- Click the "Admin" button to expand the admin panel
- You should see a yellow "🔧 Save Listing Debug Tool" section
- The debug tool shows:
  - ✅ User logged in status
  - 📋 Number of listings available (should be 343)
  - ❤️ Current favorites count (should start at 0)
- Click "Test Save Function" button
- Watch for success/error messages

### 4. Test with UI Heart Icons
- Scroll down to the business listings
- Click any heart icon ❤️ on a business card
- The heart should:
  - Turn red/filled when saved
  - Show toast notification "Listing saved!"
  - Update immediately (optimistic update)
- Click the same heart again to unsave
  - Heart should become empty/gray
  - Show toast "Listing removed from saved"

### 5. Verify Persistence
- Save a few listings by clicking heart icons
- Refresh the page
- The saved listings should remain saved (hearts should be red/filled)

### 6. Check Saved Listings Page
- Navigate to saved listings (if available in navigation)
- Should show the listings you saved

## Troubleshooting

### If "Test Save Function" Shows Errors:

1. **"No user logged in"**
   - Make sure you're signed in
   - Check the browser console for auth errors

2. **"Save operation failed"**
   - Check browser console for detailed error
   - Possible Supabase connection issue
   - Possible RLS policy issue

3. **Heart icons don't work**
   - Check browser console for JavaScript errors
   - Verify the SaveButton component is being rendered

### Browser Console Commands for Manual Testing:

```javascript
// Test 1: Check authentication
await window.supabase?.auth.getUser()

// Test 2: Manual save test (replace with actual IDs)
const user = await window.supabase?.auth.getUser()
const listings = await window.supabase?.from('business_listings').select('id').limit(1)
await window.supabase?.from('favorites').insert({
  listing_id: listings.data[0].id,
  user_id: user.data.user.id
})

// Test 3: Check favorites
await window.supabase?.from('favorites').select('*')
```

## Expected Results
- ✅ Heart icons should work immediately
- ✅ Toast notifications should appear
- ✅ State should persist across page refreshes
- ✅ Debug tool should show successful operations
- ✅ No CORS errors in console

## Database Schema (FYI)
The verification fields (is_active, last_verified_at, verification_status) are optional and won't prevent saving from working. The core saving functionality only requires:
- `favorites` table with user_id and listing_id
- Proper RLS policies (✅ already set up)
- User authentication (✅ working)