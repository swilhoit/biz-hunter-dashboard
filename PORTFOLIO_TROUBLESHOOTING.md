# Portfolio System Troubleshooting Guide

## Current Issues and Solutions

### 1. API 404 Errors (Brand endpoints not found)

**Error**: `Failed to load resource: the server responded with a status of 404 (Not Found)`

**Cause**: The server hasn't loaded the new brand API endpoints.

**Solution**:
1. Stop the backend server (Ctrl+C in the terminal running `node index.js`)
2. Restart the backend server:
   ```bash
   cd server
   node index.js
   ```
3. Verify the server started without errors and shows the endpoints being loaded

### 2. Database Tables Don't Exist

**Error**: Various database errors when trying to create/fetch brands

**Solution**:
1. Run the migration in Supabase:
   - Go to Supabase Dashboard > SQL Editor
   - Create a new query
   - Copy contents from `./supabase/migrations/20250107_create_brand_portfolio_system.sql`
   - Run the query
   
2. Verify tables were created:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('brands', 'user_portfolios', 'user_asins');
   ```

### 3. React DevTools Warning

**Warning**: `Download the React DevTools for a better development experience`

**Solution**: This is just a development warning. You can install React DevTools browser extension if desired, but it's not required.

### 4. React Router Warnings

**Warning**: `React Router Future Flag Warning`

**Solution**: These are warnings about upcoming React Router v7 changes. They don't affect functionality. To remove them, you can add future flags to your router configuration, but it's not necessary for now.

### 5. Browser Extension Errors

**Error**: `A listener indicated an asynchronous response by returning true...`

**Solution**: These errors are from browser extensions (likely ad blockers or password managers). They don't affect your application. You can ignore them or disable extensions while developing.

## Quick Checklist

Before using the Portfolio system, ensure:

- [ ] Database migration has been run successfully
- [ ] Backend server is running (`cd server && node index.js`)
- [ ] Frontend server is running (`npm run dev`)
- [ ] You're logged in (authenticated user)
- [ ] The Portfolio link appears in the sidebar

## Testing the System

1. **Test API Connection**:
   ```bash
   # In browser console or using curl:
   curl http://localhost:3001/api/health
   ```

2. **Test Brand Creation**:
   - Go to http://localhost:5173/portfolio
   - Click "Add Brand"
   - Fill in the form and save
   - Check browser console for any errors

3. **Check Database**:
   In Supabase SQL Editor:
   ```sql
   -- Check if brands table exists and has data
   SELECT * FROM brands WHERE user_id = 'your-user-id';
   
   -- Check brand metrics view
   SELECT * FROM brand_metrics WHERE user_id = 'your-user-id';
   ```

## Common Fixes

### Reset and Start Fresh
```bash
# 1. Stop all servers
# 2. Clear browser cache/localStorage
# 3. Run in Supabase (BE CAREFUL - this deletes data):
DROP TABLE IF EXISTS brands CASCADE;
DROP TABLE IF EXISTS user_portfolios CASCADE;
DROP TABLE IF EXISTS user_asins CASCADE;
DROP TABLE IF EXISTS brand_categories CASCADE;
DROP TABLE IF EXISTS brand_performance_history CASCADE;
DROP TABLE IF EXISTS user_asin_metrics CASCADE;

# 4. Re-run the migration
# 5. Restart servers
```

### Update API Endpoints
If the server file was modified after starting, you need to restart:
```bash
# Kill the node process (Ctrl+C)
cd server
node index.js
```

### Check Server Logs
The server should show:
```
🔧 Environment check:
✅ Real scrapers initialized - NO MOCK DATA
🚀 Server is running on port 3001
```

## Still Having Issues?

1. Check the full error in browser DevTools Console
2. Check the Network tab for failed requests
3. Look at the server terminal for error logs
4. Verify your Supabase connection is working
5. Ensure you have the latest code changes

## Contact for Help

If you're still experiencing issues:
1. Note the exact error message
2. Check which step in the setup process failed
3. Verify your environment (Node version, npm version)
4. Check if other parts of the application work correctly