#!/bin/bash

# Script to add JungleScout environment variables to Render

echo "Adding JungleScout environment variables to Render..."

# Check if render CLI is installed
if ! command -v render &> /dev/null; then
    echo "Render CLI is not installed. Please install it first:"
    echo "brew tap render-oss/render"
    echo "brew install render"
    exit 1
fi

# Get the service name or ID from user
echo "Please enter your Render service name or ID:"
read SERVICE_ID

# Add environment variables
echo "Adding VITE_JUNGLE_SCOUT_API_KEY..."
render env:set VITE_JUNGLE_SCOUT_API_KEY=aan2h8EZUrypQcpS4gUa5F0zQQUlnN-htt5qa6Ki9Z4 --service=$SERVICE_ID

echo "Adding VITE_JUNGLE_SCOUT_KEY_NAME..."
render env:set VITE_JUNGLE_SCOUT_KEY_NAME=cursor --service=$SERVICE_ID

echo "Environment variables added successfully!"
echo "Your service will automatically redeploy with the new variables."