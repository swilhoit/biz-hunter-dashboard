#!/bin/bash

echo "Google Ads API Setup Helper"
echo "=========================="
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "Error: Google Cloud CLI (gcloud) is not installed."
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

echo "✓ Google Cloud CLI detected"
echo ""

# Get current project
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ -z "$CURRENT_PROJECT" ]; then
    echo "No Google Cloud project is currently set."
    echo "Please run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "Current Google Cloud Project: $CURRENT_PROJECT"
echo ""

# Function to get or create OAuth2 credentials
setup_oauth_credentials() {
    echo "Setting up OAuth2 credentials for Google Ads API..."
    echo ""
    
    # List existing OAuth2 credentials
    echo "Checking for existing OAuth2 credentials..."
    EXISTING_CREDS=$(gcloud alpha oauth-clients list --format="value(name)" 2>/dev/null | head -1)
    
    if [ -n "$EXISTING_CREDS" ]; then
        echo "Found existing OAuth2 credentials"
        CLIENT_INFO=$(gcloud alpha oauth-clients describe $EXISTING_CREDS --format=json 2>/dev/null)
        CLIENT_ID=$(echo $CLIENT_INFO | jq -r '.clientId')
        CLIENT_SECRET=$(echo $CLIENT_INFO | jq -r '.clientSecret')
    else
        echo "No existing credentials found. You'll need to create them in the Google Cloud Console."
        echo ""
        echo "Instructions:"
        echo "1. Go to: https://console.cloud.google.com/apis/credentials"
        echo "2. Click 'Create Credentials' > 'OAuth client ID'"
        echo "3. Choose 'Web application'"
        echo "4. Add 'https://developers.google.com/oauthplayground' to Authorized redirect URIs"
        echo "5. Save and copy the Client ID and Client Secret"
        echo ""
        read -p "Enter your Client ID: " CLIENT_ID
        read -p "Enter your Client Secret: " CLIENT_SECRET
    fi
}

# Function to get refresh token
get_refresh_token() {
    echo ""
    echo "Getting refresh token..."
    echo ""
    echo "To get a refresh token:"
    echo "1. Go to: https://developers.google.com/oauthplayground"
    echo "2. Click the gear icon (settings) in the top right"
    echo "3. Check 'Use your own OAuth credentials'"
    echo "4. Enter these credentials:"
    echo "   Client ID: $CLIENT_ID"
    echo "   Client Secret: $CLIENT_SECRET"
    echo "5. In Step 1, manually enter this scope: https://www.googleapis.com/auth/adwords"
    echo "6. Click 'Authorize APIs' and complete the authorization"
    echo "7. In Step 2, click 'Exchange authorization code for tokens'"
    echo "8. Copy the 'Refresh token' value"
    echo ""
    read -p "Enter your Refresh Token: " REFRESH_TOKEN
}

# Function to get Google Ads info
get_google_ads_info() {
    echo ""
    echo "Google Ads Account Information"
    echo "=============================="
    echo ""
    echo "To get your Google Ads Developer Token:"
    echo "1. Go to: https://ads.google.com"
    echo "2. Click Tools & Settings (top right) > Setup > API Center"
    echo "3. Apply for or copy your developer token"
    echo ""
    read -p "Enter your Developer Token: " DEVELOPER_TOKEN
    
    echo ""
    echo "To get your Customer ID:"
    echo "1. In Google Ads, look at the top right corner"
    echo "2. Copy the number (e.g., 123-456-7890)"
    echo "3. Remove the dashes when entering it here"
    echo ""
    read -p "Enter your Customer ID (without dashes): " CUSTOMER_ID
}

# Main setup flow
setup_oauth_credentials
get_refresh_token
get_google_ads_info

# Create or update .env.local
echo ""
echo "Updating .env.local with Google Ads credentials..."

# Backup existing .env.local
if [ -f ".env.local" ]; then
    cp .env.local .env.local.backup
    echo "✓ Backed up existing .env.local to .env.local.backup"
fi

# Append Google Ads credentials to .env.local
cat >> .env.local << EOF

# Google Ads API Configuration
GOOGLE_ADS_CLIENT_ID=$CLIENT_ID
GOOGLE_ADS_CLIENT_SECRET=$CLIENT_SECRET
GOOGLE_ADS_DEVELOPER_TOKEN=$DEVELOPER_TOKEN
GOOGLE_ADS_REFRESH_TOKEN=$REFRESH_TOKEN
GOOGLE_ADS_CUSTOMER_ID=$CUSTOMER_ID
EOF

echo "✓ Google Ads credentials added to .env.local"
echo ""
echo "Setup complete! Your Google Ads API integration is ready."
echo "Restart your development server to apply the changes."
echo ""
echo "Test the integration by:"
echo "1. Starting your dev server: npm run dev"
echo "2. Going to Product Explorer > Keyword Research"
echo "3. Searching for some keywords"
echo "4. You should see data from both JungleScout and Google Ads"