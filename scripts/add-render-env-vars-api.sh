#!/bin/bash

# Script to add JungleScout environment variables to Render using API

echo "==================================="
echo "Add JungleScout API Keys to Render"
echo "==================================="
echo ""
echo "To add these environment variables to your Render deployment:"
echo ""
echo "1. Go to https://dashboard.render.com"
echo "2. Click on your biz-hunter-dashboard service"
echo "3. Click on the 'Environment' tab"
echo "4. Click 'Add Environment Variable' and add:"
echo ""
echo "   Key: VITE_JUNGLE_SCOUT_API_KEY"
echo "   Value: aan2h8EZUrypQcpS4gUa5F0zQQUlnN-htt5qa6Ki9Z4"
echo ""
echo "   Key: VITE_JUNGLE_SCOUT_KEY_NAME"
echo "   Value: cursor"
echo ""
echo "5. Click 'Save Changes'"
echo ""
echo "Your service will automatically redeploy with the new variables."
echo ""
echo "==================================="
echo ""
echo "Alternatively, if you have your Render API key, you can run:"
echo ""
echo "export RENDER_API_KEY='your-api-key'"
echo "export SERVICE_ID='your-service-id'"
echo ""
echo "Then run these commands:"
echo ""
echo 'curl -X PATCH "https://api.render.com/v1/services/$SERVICE_ID/env-vars" \'
echo '  -H "Authorization: Bearer $RENDER_API_KEY" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '\''[
    {
      "key": "VITE_JUNGLE_SCOUT_API_KEY",
      "value": "aan2h8EZUrypQcpS4gUa5F0zQQUlnN-htt5qa6Ki9Z4"
    },
    {
      "key": "VITE_JUNGLE_SCOUT_KEY_NAME",
      "value": "cursor"
    }
  ]'\'''
echo ""