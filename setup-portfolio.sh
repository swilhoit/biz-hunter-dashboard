#!/bin/bash

echo "🚀 Setting up Brand Portfolio System"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Database Setup${NC}"
echo "Please run the following in your Supabase SQL Editor:"
echo ""
echo "1. Go to your Supabase dashboard"
echo "2. Navigate to SQL Editor"
echo "3. Copy and run the migration from:"
echo "   ./supabase/migrations/20250107_create_brand_portfolio_system.sql"
echo ""
read -p "Press enter when you've completed the database setup..."

echo ""
echo -e "${YELLOW}Step 2: Verify Database Setup${NC}"
echo "Run the verification script in Supabase SQL Editor:"
echo "   ./supabase/verify_portfolio_setup.sql"
echo ""
read -p "Press enter when verification is complete..."

echo ""
echo -e "${YELLOW}Step 3: Restart the Development Server${NC}"
echo "The server needs to be restarted to load the new API endpoints."
echo ""
echo "In one terminal, run:"
echo -e "${GREEN}npm run dev${NC}"
echo ""
echo "In another terminal, run:"
echo -e "${GREEN}cd server && node index.js${NC}"
echo ""
echo "Or use the combined command:"
echo -e "${GREEN}npm run dev:all${NC}"
echo ""

echo -e "${YELLOW}Step 4: Test the Portfolio Page${NC}"
echo "1. Navigate to http://localhost:5173/portfolio"
echo "2. Create your first brand"
echo "3. Add products to the brand"
echo ""

echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "If you encounter any issues:"
echo "1. Check the browser console for errors"
echo "2. Verify the database tables were created"
echo "3. Ensure both frontend and backend servers are running"
echo "4. Check server logs for API errors"
echo ""
echo "Documentation: ./docs/BRAND_PORTFOLIO_SETUP.md"