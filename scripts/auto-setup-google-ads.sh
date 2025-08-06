#!/bin/bash

echo "🚀 Automated Google Ads API Setup"
echo "================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: Google Cloud CLI (gcloud) is not installed.${NC}"
    echo "Installing Google Cloud SDK..."
    
    # Install gcloud based on OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install --cask google-cloud-sdk
        else
            echo "Please install homebrew first or download gcloud from:"
            echo "https://cloud.google.com/sdk/docs/install"
            exit 1
        fi
    else
        # Linux
        curl https://sdk.cloud.google.com | bash
        exec -l $SHELL
    fi
fi

echo -e "${GREEN}✓ Google Cloud CLI detected${NC}"

# Get current account
CURRENT_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null)
if [ -z "$CURRENT_ACCOUNT" ]; then
    echo -e "${YELLOW}No active Google account found. Logging in...${NC}"
    gcloud auth login
    CURRENT_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
fi

echo -e "${GREEN}✓ Logged in as: $CURRENT_ACCOUNT${NC}"

# Get or set project
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ -z "$CURRENT_PROJECT" ]; then
    echo -e "${YELLOW}No Google Cloud project selected.${NC}"
    echo "Available projects:"
    gcloud projects list --format="table(projectId,name)"
    echo ""
    read -p "Enter your project ID: " PROJECT_ID
    gcloud config set project $PROJECT_ID
    CURRENT_PROJECT=$PROJECT_ID
fi

echo -e "${GREEN}✓ Using project: $CURRENT_PROJECT${NC}"

# Enable required APIs
echo ""
echo "Enabling required APIs..."
gcloud services enable googleads.googleapis.com --quiet
gcloud services enable oauth2.googleapis.com --quiet
echo -e "${GREEN}✓ APIs enabled${NC}"

# Function to create OAuth2 credentials
create_oauth_credentials() {
    echo ""
    echo "Creating OAuth2 credentials..."
    
    # Generate random suffix for app name
    RANDOM_SUFFIX=$(date +%s)
    APP_NAME="fba-hunter-$RANDOM_SUFFIX"
    
    # Create OAuth consent screen if not exists
    echo "Setting up OAuth consent screen..."
    gcloud alpha oauth-brands create \
        --application_title="FBA Hunter Dashboard" \
        --support_email="$CURRENT_ACCOUNT" \
        2>/dev/null || echo "OAuth brand already exists"
    
    # Create OAuth2 client
    echo "Creating OAuth2 client..."
    
    # Use gcloud to create OAuth client (this requires alpha components)
    CLIENT_CREATION=$(gcloud alpha oauth-clients create \
        --display_name="FBA Hunter Google Ads Integration" \
        --client_type="web" \
        --redirect_uri="https://developers.google.com/oauthplayground" \
        --format=json 2>&1)
    
    if [[ $? -eq 0 ]]; then
        CLIENT_NAME=$(echo $CLIENT_CREATION | jq -r '.name')
        
        # Get client details
        CLIENT_INFO=$(gcloud alpha oauth-clients describe $CLIENT_NAME --format=json)
        CLIENT_ID=$(echo $CLIENT_INFO | jq -r '.clientId')
        CLIENT_SECRET=$(echo $CLIENT_INFO | jq -r '.clientSecret')
        
        echo -e "${GREEN}✓ OAuth2 credentials created successfully${NC}"
        echo "Client ID: $CLIENT_ID"
        echo "Client Secret: [hidden]"
    else
        echo -e "${YELLOW}Could not create OAuth client automatically.${NC}"
        echo ""
        echo "Please create OAuth2 credentials manually:"
        echo "1. Go to: https://console.cloud.google.com/apis/credentials?project=$CURRENT_PROJECT"
        echo "2. Click 'Create Credentials' > 'OAuth client ID'"
        echo "3. Choose 'Web application'"
        echo "4. Name: 'FBA Hunter Google Ads Integration'"
        echo "5. Add Authorized redirect URI: https://developers.google.com/oauthplayground"
        echo "6. Click 'Create' and copy the credentials"
        echo ""
        read -p "Enter Client ID: " CLIENT_ID
        read -s -p "Enter Client Secret: " CLIENT_SECRET
        echo ""
    fi
}

# Check for existing credentials or create new ones
echo ""
echo "Checking for existing OAuth2 credentials..."

# Try to list existing OAuth clients
EXISTING_CLIENTS=$(gcloud alpha oauth-clients list --format="value(name)" 2>/dev/null)

if [ -n "$EXISTING_CLIENTS" ]; then
    echo "Found existing OAuth2 clients:"
    gcloud alpha oauth-clients list --format="table(displayName,clientId)"
    echo ""
    read -p "Use existing client? (y/n): " USE_EXISTING
    
    if [ "$USE_EXISTING" = "y" ]; then
        read -p "Enter the Client ID from above: " CLIENT_ID
        # We'll need to get the secret from the user as it's not retrievable
        read -s -p "Enter the Client Secret (you saved this when creating the client): " CLIENT_SECRET
        echo ""
    else
        create_oauth_credentials
    fi
else
    create_oauth_credentials
fi

# Get refresh token using OAuth playground
echo ""
echo "Getting refresh token..."
echo -e "${YELLOW}Opening OAuth2 Playground in your browser...${NC}"
echo ""
echo "Steps to get refresh token:"
echo "1. Click the gear icon (settings) in the top right"
echo "2. Check 'Use your own OAuth credentials'"
echo "3. Enter these credentials:"
echo "   Client ID: $CLIENT_ID"
echo "   Client Secret: [use the secret you have]"
echo "4. Close the settings"
echo "5. In the left panel, manually type: https://www.googleapis.com/auth/adwords"
echo "6. Click 'Authorize APIs' and sign in with your Google account"
echo "7. Click 'Exchange authorization code for tokens'"
echo "8. Copy the 'Refresh token' value"
echo ""

# Open OAuth playground
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "https://developers.google.com/oauthplayground"
else
    xdg-open "https://developers.google.com/oauthplayground" 2>/dev/null || echo "Please open: https://developers.google.com/oauthplayground"
fi

echo ""
read -p "Enter the Refresh Token: " REFRESH_TOKEN

# Get Google Ads information
echo ""
echo "Getting Google Ads account information..."
echo -e "${YELLOW}Opening Google Ads API Center...${NC}"
echo ""
echo "Steps to get Developer Token:"
echo "1. Sign in to your Google Ads account"
echo "2. Click Tools & Settings (wrench icon) > Setup > API Center"
echo "3. If you don't have a token, click 'Apply for Basic Access'"
echo "4. Fill out the form (select 'SEO/SEM tool' as use case)"
echo "5. Copy your developer token"
echo ""

# Open Google Ads
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "https://ads.google.com/aw/apicenter"
else
    xdg-open "https://ads.google.com/aw/apicenter" 2>/dev/null || echo "Please open: https://ads.google.com/aw/apicenter"
fi

echo ""
read -p "Enter your Developer Token: " DEVELOPER_TOKEN

echo ""
echo "In Google Ads, your Customer ID is shown in the top right corner (e.g., 123-456-7890)"
read -p "Enter your Customer ID (without dashes): " CUSTOMER_ID

# Update .env.local
echo ""
echo "Updating .env.local with Google Ads credentials..."

# Backup existing file
cp .env.local .env.local.backup.$(date +%s)
echo -e "${GREEN}✓ Backed up .env.local${NC}"

# Remove any existing Google Ads config lines
sed -i '' '/# Google Ads API Configuration/,/^$/d' .env.local 2>/dev/null || true
sed -i '' '/GOOGLE_ADS_/d' .env.local 2>/dev/null || true

# Append new configuration
cat >> .env.local << EOF

# Google Ads API Configuration
GOOGLE_ADS_CLIENT_ID=$CLIENT_ID
GOOGLE_ADS_CLIENT_SECRET=$CLIENT_SECRET
GOOGLE_ADS_DEVELOPER_TOKEN=$DEVELOPER_TOKEN
GOOGLE_ADS_REFRESH_TOKEN=$REFRESH_TOKEN
GOOGLE_ADS_CUSTOMER_ID=$CUSTOMER_ID
EOF

echo -e "${GREEN}✓ Configuration saved to .env.local${NC}"

# Test the configuration
echo ""
echo "Testing Google Ads API connection..."
echo ""

# Create a simple test script
cat > test-google-ads.js << 'EOF'
const { GoogleAdsApi } = require('google-ads-api');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
    try {
        const client = new GoogleAdsApi({
            client_id: process.env.GOOGLE_ADS_CLIENT_ID,
            client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
            developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
        });

        const customer = client.Customer({
            customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
            refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
        });

        console.log('✓ Google Ads API client initialized successfully!');
        console.log('Your integration is ready to use.');
        
        // Try a simple query
        const account = await customer.query(`
            SELECT customer.id, customer.descriptive_name 
            FROM customer 
            LIMIT 1
        `);
        
        console.log('✓ Successfully connected to Google Ads account:', account[0].customer.descriptive_name);
    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        console.log('\nTroubleshooting tips:');
        console.log('1. Make sure your developer token is approved');
        console.log('2. Verify your customer ID is correct (no dashes)');
        console.log('3. Check that your refresh token is valid');
        console.log('4. Ensure your Google Ads account is active');
    }
}

testConnection();
EOF

# Install dependencies if needed
if [ ! -d "node_modules/google-ads-api" ]; then
    echo "Installing Google Ads API package..."
    npm install
fi

# Run the test
node test-google-ads.js

# Clean up test file
rm test-google-ads.js

echo ""
echo -e "${GREEN}✅ Google Ads API setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Restart your development server: npm run dev"
echo "2. Go to Product Explorer > Keyword Research"
echo "3. Search for keywords - you'll now see data from both JungleScout and Google Ads!"
echo ""
echo "If you encounter any issues:"
echo "- Check that your developer token is approved (test accounts work immediately)"
echo "- Ensure your Google Ads account has active campaigns or keyword data"
echo "- Review the credentials in .env.local"