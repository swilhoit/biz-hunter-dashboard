#!/bin/bash

# Set Firebase Storage CORS configuration
echo "Setting Firebase Storage CORS configuration..."

# Install gsutil if not present
if ! command -v gsutil &> /dev/null; then
    echo "gsutil not found. Please install Google Cloud SDK first:"
    echo "https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Apply CORS configuration  
gsutil cors set cors.json gs://bizhunter-945a4.firebasestorage.app

echo "CORS configuration has been applied successfully!"
echo ""
echo "The following origins are now allowed:"
echo "- https://www.bizhunter.ai"
echo "- https://bizhunter.ai"
echo "- http://localhost:3000"
echo "- http://localhost:5173"