#!/bin/bash

echo "🔥 Starting BizHunter with AUTO-SCRAPING"
echo "========================================"

# Copy environment variables
echo "📋 Copying environment variables..."
cp .env server/.env

# Install server dependencies
echo "📦 Installing scraper dependencies..."
cd server
npm install

# Start the scraper API in background
echo "🚀 Starting scraper API with AUTO-SCRAPING..."
npm run dev &
SERVER_PID=$!

# Wait for API to start
sleep 3

# Go back to root and start frontend
cd ..
echo "💻 Starting dashboard..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ SYSTEM STARTED WITH AUTO-SCRAPING!"
echo "📊 Dashboard: http://localhost:8080"
echo "🤖 Scraper API: http://localhost:3001"
echo ""
echo "🔥 Dashboard will populate with REAL data automatically!"
echo "📈 Auto-scraping runs on startup if no recent data exists"
echo "💡 Visit dashboard to see live business listings"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for Ctrl+C
trap "echo '🛑 Stopping services...'; kill $SERVER_PID $FRONTEND_PID; exit" INT
wait