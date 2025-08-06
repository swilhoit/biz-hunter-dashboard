# Google Ads API Integration Guide

This guide explains how to set up and use the Google Ads API integration for keyword research in the FBA Hunter Dashboard.

## Features

The Google Ads API integration provides:
- **Search Volume Data**: Get accurate monthly search volumes from Google
- **Competition Metrics**: See competition levels (Low/Medium/High) and competition index
- **CPC Data**: Access average CPC, low and high top-of-page bid estimates
- **Historical Trends**: View monthly search volume trends
- **Data Merging**: Automatically combines data from JungleScout and Google Ads

## Setup Instructions

### 1. Get Google Ads API Credentials

1. **Create a Google Ads Account**
   - Go to https://ads.google.com
   - Create an account if you don't have one

2. **Get a Developer Token**
   - Navigate to Tools & Settings > Setup > API Center
   - Apply for a developer token
   - Note: Test accounts get immediate access, production accounts require approval

3. **Set up OAuth2 Credentials**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing
   - Enable the Google Ads API
   - Create OAuth2 credentials (Web application type)
   - Add `https://developers.google.com/oauthplayground` to authorized redirect URIs

4. **Get Refresh Token**
   - Go to [OAuth2 Playground](https://developers.google.com/oauthplayground)
   - Click settings (gear icon) and check "Use your own OAuth credentials"
   - Enter your Client ID and Client Secret
   - In the scope field, enter: `https://www.googleapis.com/auth/adwords`
   - Authorize and get your refresh token

5. **Get Customer ID**
   - In Google Ads, click on your account name
   - Copy the Customer ID (remove dashes)

### 2. Configure Environment Variables

Add these to your `.env` file:

```env
GOOGLE_ADS_CLIENT_ID=your_client_id_here
GOOGLE_ADS_CLIENT_SECRET=your_client_secret_here
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token_here
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token_here
GOOGLE_ADS_CUSTOMER_ID=1234567890  # Without dashes
```

### 3. Install Dependencies

The Google Ads API client is already added to package.json. Run:

```bash
npm install
```

## Usage

### In the UI

The Google Ads data is automatically integrated into the Keyword Research component:

1. Navigate to the Product Explorer
2. Go to the Keyword Research tab
3. Enter keywords to search
4. The results will show combined data from both JungleScout and Google Ads

### Understanding the Data

The keyword table displays:
- **Search Volume**: Combined average from both sources
- **Google Ads Volume**: Specific Google Ads search volume
- **Competition**: Google's competition level with index percentage
- **PPC Bid**: Recommended bid based on all available data
- **Google CPC**: Average CPC from Google Ads
- **Sources**: Badges showing which APIs provided data (JS = JungleScout, GA = Google Ads)

### API Endpoints

The integration provides these endpoints:

```javascript
// Get keyword ideas with full metrics
POST /api/google-ads/keywords/ideas
Body: {
  keywords: ["amazon fba", "private label"],
  locationId: "2840" // Optional, defaults to US
}

// Get search volume only (faster)
POST /api/google-ads/keywords/search-volume
Body: {
  keywords: ["amazon fba", "private label"]
}

// Get detailed metrics with historical data
POST /api/google-ads/keywords/metrics
Body: {
  keywords: ["amazon fba", "private label"],
  includeHistorical: true
}
```

## Troubleshooting

### "Google Ads API not configured" Error
- Ensure all environment variables are set correctly
- Restart the server after adding environment variables

### No Google Ads Data Showing
- Check if the API credentials have proper permissions
- Verify the developer token is approved (for production use)
- Check the browser console for any API errors

### Authentication Errors
- Refresh token may have expired - generate a new one
- Ensure OAuth2 credentials match the ones used to generate the refresh token

## Data Source Priority

When both JungleScout and Google Ads provide data:
- Search volume: 60% Google Ads, 40% JungleScout weighted average
- CPC/Bid: Average of all available bid estimates
- Competition: Google Ads data takes precedence
- Trends: JungleScout trends are shown (more Amazon-specific)

## Rate Limits

Google Ads API has rate limits:
- Basic access: 15,000 operations per day
- Standard access: Higher limits based on account spend

The integration handles rate limiting gracefully and will continue to show JungleScout data if Google Ads limits are reached.

## Best Practices

1. **Batch Requests**: Search for multiple keywords at once to minimize API calls
2. **Cache Results**: The app caches results for 30 minutes to reduce API usage
3. **Use Test Account**: During development, use a test account for unlimited API access
4. **Monitor Usage**: Check your API usage in the Google Ads API Center

## Support

For issues or questions:
1. Check the browser console for detailed error messages
2. Verify all credentials in the `.env` file
3. Ensure the Google Ads account has API access enabled
4. Check the server logs for API response details