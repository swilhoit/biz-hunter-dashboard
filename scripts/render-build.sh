#!/bin/bash
set -e

echo "=== Render Build Script Starting ==="
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

echo ""
echo "=== Removing bun.lockb if exists ==="
rm -f bun.lockb

echo ""
echo "=== Running npm install ==="
npm install

echo ""
echo "=== Running npm run build ==="
npm run build

echo ""
echo "=== Build complete, checking dist directory ==="
if [ -d "dist" ]; then
    echo "✓ dist directory exists at $(pwd)/dist"
    echo "dist contents:"
    ls -la dist/
else
    echo "✗ ERROR: dist directory not found!"
    echo "Checking all directories:"
    find . -name "dist" -type d
fi

echo ""
echo "=== Build script complete ==="