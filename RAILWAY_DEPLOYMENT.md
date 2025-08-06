# Railway Deployment Guide

## Environment Variables Required

Set these environment variables in your Railway project:

### Critical API Keys
- `SCRAPER_API_KEY` - Your ScraperAPI key (get from https://scraperapi.com)
- `VITE_OPENAI_API_KEY` - Your OpenAI API key (get from https://platform.openai.com)
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### Optional (Railway sets automatically)
- `PORT` - Railway will set this automatically
- `NODE_ENV` - Set to "production" automatically

## Troubleshooting API Issues

### 1. Check Environment Variables
Visit: `https://your-app.railway.app/api/test-env`

This will show which environment variables are set.

### 2. Run Diagnostics
Visit: `https://your-app.railway.app/api/diagnostics`

This will test:
- Environment detection
- API key presence
- Basic network connectivity

### 3. Common Issues and Solutions

#### ScraperAPI Not Working
- **Issue**: Getting 403 or authentication errors
- **Solution**: 
  1. Verify `SCRAPER_API_KEY` is set in Railway environment variables
  2. Check your ScraperAPI account has credits remaining
  3. Ensure the API key is active (not expired)

#### OpenAI API Not Working
- **Issue**: Getting 401 or "API key not found" errors
- **Solution**:
  1. Verify `VITE_OPENAI_API_KEY` is set in Railway environment variables
  2. Ensure your OpenAI account has credits
  3. Check that the API key has proper permissions

#### Both APIs Failing
- **Issue**: Both ScraperAPI and OpenAI failing
- **Possible Causes**:
  1. Environment variables not properly set in Railway
  2. Network connectivity issues from Railway servers
  3. API keys not being passed to the client properly

### 4. Enhanced Error Handling

The application now includes:
- Railway-specific API wrapper with retry logic
- Better error messages indicating exact issues
- Diagnostic endpoints for testing
- Automatic environment detection

### 5. Setting Environment Variables in Railway

1. Go to your Railway project dashboard
2. Click on your service
3. Go to "Variables" tab
4. Add each environment variable:
   ```
   SCRAPER_API_KEY=your_actual_key_here
   VITE_OPENAI_API_KEY=sk-your_actual_openai_key
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
5. Railway will automatically redeploy when you save

### 6. Testing After Deployment

1. Check server logs in Railway dashboard for startup messages
2. Visit `/api/test-env` to verify environment variables
3. Visit `/api/diagnostics` for comprehensive testing
4. Try the scraping functionality in the app
5. Test the OpenAI features (product segmentation)

### 7. Using the Diagnostic Component

In development, you can add the RailwayDiagnostics component to test APIs:

```tsx
import { RailwayDiagnostics } from './components/RailwayDiagnostics';

// Add to your app
<RailwayDiagnostics />
```

This provides a UI for testing both APIs and seeing detailed error messages.