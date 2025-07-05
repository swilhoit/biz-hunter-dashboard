# Google Ads API Setup Guide

Follow these steps in order:

## Step 1: Create OAuth2 Credentials (Google Cloud Console is open)

1. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
2. Application type: **Web application**
3. Name: **FBA Hunter Google Ads Integration**
4. Under "Authorized redirect URIs", click **"+ ADD URI"**
5. Add: `https://developers.google.com/oauthplayground`
6. Click **"CREATE"**
7. **COPY** the Client ID and Client Secret (save them temporarily)

## Step 2: Get Refresh Token

1. Go to: https://developers.google.com/oauthplayground
2. Click the **gear icon** (top right)
3. Check **"Use your own OAuth credentials"**
4. Paste your Client ID and Client Secret
5. Close settings
6. In the left panel, **manually type**: `https://www.googleapis.com/auth/adwords`
7. Click **"Authorize APIs"**
8. Sign in and allow access
9. Click **"Exchange authorization code for tokens"**
10. **COPY** the Refresh token

## Step 3: Get Google Ads Developer Token

1. Go to: https://ads.google.com/aw/apicenter
2. If you see a developer token, **COPY** it
3. If not, click **"APPLY FOR BASIC ACCESS"**
   - Purpose: SEO/SEM tool
   - Fill the form and submit
   - You'll get a test token immediately

## Step 4: Get Customer ID

1. In Google Ads (top right), find your Customer ID (e.g., 123-456-7890)
2. **COPY** it WITHOUT the dashes (e.g., 1234567890)

## Step 5: Update Your Credentials

Run this command with your values:

```bash
cat >> .env.local << EOF

# Google Ads API Configuration
GOOGLE_ADS_CLIENT_ID=YOUR_CLIENT_ID_HERE
GOOGLE_ADS_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
GOOGLE_ADS_DEVELOPER_TOKEN=YOUR_DEVELOPER_TOKEN_HERE
GOOGLE_ADS_REFRESH_TOKEN=YOUR_REFRESH_TOKEN_HERE
GOOGLE_ADS_CUSTOMER_ID=YOUR_CUSTOMER_ID_HERE
EOF
```

## Step 6: Test

```bash
npm run dev
```

Then go to Product Explorer → Keyword Research and search for keywords!