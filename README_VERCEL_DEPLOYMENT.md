# Vercel Deployment Guide for Business Listings App

This app is configured to deploy on Vercel with BigQuery integration.

## Prerequisites

1. A Vercel account
2. Google Cloud Project with BigQuery access
3. Service Account credentials for BigQuery

## Setup Instructions

### 1. Create Google Cloud Service Account

```bash
# Create a service account for BigQuery access
gcloud iam service-accounts create bigquery-vercel \
  --display-name="BigQuery Vercel Access"

# Grant BigQuery permissions
gcloud projects add-iam-policy-binding tetrahedron-366117 \
  --member="serviceAccount:bigquery-vercel@tetrahedron-366117.iam.gserviceaccount.com" \
  --role="roles/bigquery.dataViewer"

gcloud projects add-iam-policy-binding tetrahedron-366117 \
  --member="serviceAccount:bigquery-vercel@tetrahedron-366117.iam.gserviceaccount.com" \
  --role="roles/bigquery.jobUser"

# Create and download credentials
gcloud iam service-accounts keys create bigquery-credentials.json \
  --iam-account=bigquery-vercel@tetrahedron-366117.iam.gserviceaccount.com
```

### 2. Configure Vercel Environment Variables

In your Vercel project settings, add these environment variables:

1. `BIGQUERY_PROJECT_ID`: `tetrahedron-366117`
2. `GOOGLE_APPLICATION_CREDENTIALS`: Copy the entire contents of `bigquery-credentials.json` as a single-line JSON string

To convert the credentials to a single line:
```bash
cat bigquery-credentials.json | jq -c '.' | pbcopy
```

### 3. Deploy to Vercel

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy
vercel

# Or deploy to production
vercel --prod
```

## Project Structure

```
/
├── api/                    # Vercel Serverless Functions
│   ├── listings.js        # Get all listings
│   ├── listings/
│   │   └── [id].js       # Get single listing
│   └── stats.js          # Get statistics
├── src/                   # React application
│   ├── services/
│   │   └── BigQueryService.ts  # BigQuery API client
│   └── ...
└── vercel.json           # Vercel configuration
```

## API Endpoints

When deployed on Vercel, the following endpoints are available:

- `GET /api/bigquery/listings` - Get filtered business listings
- `GET /api/bigquery/listings/:id` - Get single listing by ID
- `GET /api/bigquery/stats` - Get aggregated statistics

## Local Development

For local development with the Vercel functions:

```bash
# Install Vercel CLI
npm i -g vercel

# Run locally with Vercel dev server
vercel dev
```

Or use the standalone Express server:

```bash
# Start the Express server
node server.js

# In another terminal, start Vite
npm run dev
```

## Troubleshooting

### BigQuery Authentication Issues

If you get authentication errors:

1. Ensure the service account has the correct permissions
2. Verify the `GOOGLE_APPLICATION_CREDENTIALS` environment variable contains valid JSON
3. Check that the project ID matches your Google Cloud project

### CORS Issues

The API functions include CORS headers. If you still face issues:

1. Check that your frontend URL is correct
2. Verify the API endpoints are using the correct domain

### Function Timeouts

Vercel functions have a default timeout of 10 seconds (30 seconds for Pro accounts). 
If queries are timing out:

1. Optimize your BigQuery queries
2. Add appropriate indexes in BigQuery
3. Consider pagination for large datasets

## Production Considerations

1. **API Keys**: Never expose sensitive keys in frontend code
2. **Rate Limiting**: Consider implementing rate limiting for API endpoints
3. **Caching**: Add caching headers for frequently accessed data
4. **Monitoring**: Set up monitoring for API errors and performance
5. **Query Optimization**: Ensure BigQuery queries are optimized for performance