#!/bin/bash

# Start the integrated scraping API server

echo "🚀 Starting BizHunter Integrated Scraping API..."

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create server directory if it doesn't exist
mkdir -p server/api

# Set environment variables
export SCRAPING_API_PORT=3001

# Start the API server
echo "🔄 Starting API server on port $SCRAPING_API_PORT..."
cd server/api
node scraping.js

echo "✅ Scraping API started successfully!"
echo "📡 Available at: http://localhost:$SCRAPING_API_PORT"