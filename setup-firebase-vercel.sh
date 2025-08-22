#!/bin/bash

echo "Setting up Firebase environment variables in Vercel..."
echo ""
echo "Please have your Firebase project configuration ready."
echo "You can find these values in:"
echo "Firebase Console > Project Settings > General > Your apps > SDK setup and configuration"
echo ""

# Remove old Supabase variables
echo "Removing old Supabase environment variables..."
npx vercel env rm VITE_SUPABASE_URL production 2>/dev/null
npx vercel env rm VITE_SUPABASE_ANON_KEY production 2>/dev/null

# Add Firebase variables
echo ""
echo "Adding Firebase environment variables..."
echo ""

read -p "Enter your Firebase API Key: " firebase_api_key
echo "$firebase_api_key" | npx vercel env add VITE_FIREBASE_API_KEY production

read -p "Enter your Firebase Auth Domain (e.g., your-project.firebaseapp.com): " firebase_auth_domain
echo "$firebase_auth_domain" | npx vercel env add VITE_FIREBASE_AUTH_DOMAIN production

read -p "Enter your Firebase Project ID: " firebase_project_id
echo "$firebase_project_id" | npx vercel env add VITE_FIREBASE_PROJECT_ID production

read -p "Enter your Firebase Storage Bucket (e.g., your-project.appspot.com): " firebase_storage_bucket
echo "$firebase_storage_bucket" | npx vercel env add VITE_FIREBASE_STORAGE_BUCKET production

read -p "Enter your Firebase Messaging Sender ID: " firebase_messaging_sender_id
echo "$firebase_messaging_sender_id" | npx vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID production

read -p "Enter your Firebase App ID: " firebase_app_id
echo "$firebase_app_id" | npx vercel env add VITE_FIREBASE_APP_ID production

echo ""
echo "Firebase environment variables have been added to Vercel!"
echo ""
echo "Triggering a new deployment..."
npx vercel --prod --force

echo ""
echo "Setup complete! Your Firebase migration should be deployed soon."