#!/bin/bash

# Script to set up BigQuery credentials for Vercel deployment

echo "Setting up BigQuery credentials for Vercel..."

# Create service account if it doesn't exist
SERVICE_ACCOUNT="bigquery-vercel@tetrahedron-366117.iam.gserviceaccount.com"
echo "Checking if service account exists..."

if ! gcloud iam service-accounts describe $SERVICE_ACCOUNT --project=tetrahedron-366117 &>/dev/null; then
    echo "Creating service account..."
    gcloud iam service-accounts create bigquery-vercel \
        --display-name="BigQuery Vercel Access" \
        --project=tetrahedron-366117
else
    echo "Service account already exists"
fi

# Grant BigQuery permissions
echo "Granting BigQuery permissions..."
gcloud projects add-iam-policy-binding tetrahedron-366117 \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/bigquery.dataViewer" \
    --condition=None

gcloud projects add-iam-policy-binding tetrahedron-366117 \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/bigquery.jobUser" \
    --condition=None

# Create new key
echo "Creating service account key..."
gcloud iam service-accounts keys create bigquery-credentials.json \
    --iam-account=$SERVICE_ACCOUNT \
    --project=tetrahedron-366117

# Convert to single line for Vercel env var
echo "Converting credentials to single line..."
CREDENTIALS_ONELINE=$(cat bigquery-credentials.json | jq -c .)
echo "$CREDENTIALS_ONELINE" > bigquery-credentials-oneline.txt

echo ""
echo "✅ Setup complete!"
echo ""
echo "Now add this to Vercel:"
echo "1. Go to https://vercel.com/swilhoits-projects/biz-hunter-dashboard/settings/environment-variables"
echo "2. Add a new environment variable:"
echo "   - Name: GOOGLE_APPLICATION_CREDENTIALS"
echo "   - Value: Copy the content from bigquery-credentials-oneline.txt"
echo "   - Environment: Production"
echo ""
echo "3. Also ensure these are set:"
echo "   - BIGQUERY_PROJECT_ID = tetrahedron-366117"
echo ""
echo "4. Redeploy your project"

# Clean up the original JSON file for security
rm bigquery-credentials.json

echo ""
echo "⚠️  IMPORTANT: The credentials are in bigquery-credentials-oneline.txt"
echo "After adding to Vercel, delete this file for security!"