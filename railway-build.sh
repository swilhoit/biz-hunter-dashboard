#!/bin/bash
set -e

echo "🚀 Railway Build Script Starting..."
echo "📦 Node version: $(node --version)"
echo "📦 NPM version: $(npm --version)"

echo "🔍 Checking environment variables..."
env | grep VITE_ | sed 's/=.*/=***/' || echo "No VITE_ variables found"

echo "📥 Installing dependencies..."
npm ci

echo "🔨 Building application..."
npm run build

echo "✅ Build completed successfully!"