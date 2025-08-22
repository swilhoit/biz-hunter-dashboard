#!/bin/bash

echo "Setting up Firebase environment variables in Vercel..."
echo ""

# Firebase configuration from our project
echo "AIzaSyAlX42_G14QzUUhiAjqmMQpyqQo6NU8MGw" | npx vercel env add VITE_FIREBASE_API_KEY production --force
echo "bizhunter-945a4.firebaseapp.com" | npx vercel env add VITE_FIREBASE_AUTH_DOMAIN production --force
echo "bizhunter-945a4" | npx vercel env add VITE_FIREBASE_PROJECT_ID production --force
echo "bizhunter-945a4.firebasestorage.app" | npx vercel env add VITE_FIREBASE_STORAGE_BUCKET production --force
echo "938315544017" | npx vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID production --force
echo "1:938315544017:web:22ded62a409dddfba69cf0" | npx vercel env add VITE_FIREBASE_APP_ID production --force

# Also add to preview and development
echo "AIzaSyAlX42_G14QzUUhiAjqmMQpyqQo6NU8MGw" | npx vercel env add VITE_FIREBASE_API_KEY preview --force
echo "bizhunter-945a4.firebaseapp.com" | npx vercel env add VITE_FIREBASE_AUTH_DOMAIN preview --force
echo "bizhunter-945a4" | npx vercel env add VITE_FIREBASE_PROJECT_ID preview --force
echo "bizhunter-945a4.firebasestorage.app" | npx vercel env add VITE_FIREBASE_STORAGE_BUCKET preview --force
echo "938315544017" | npx vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID preview --force
echo "1:938315544017:web:22ded62a409dddfba69cf0" | npx vercel env add VITE_FIREBASE_APP_ID preview --force

echo "AIzaSyAlX42_G14QzUUhiAjqmMQpyqQo6NU8MGw" | npx vercel env add VITE_FIREBASE_API_KEY development --force
echo "bizhunter-945a4.firebaseapp.com" | npx vercel env add VITE_FIREBASE_AUTH_DOMAIN development --force
echo "bizhunter-945a4" | npx vercel env add VITE_FIREBASE_PROJECT_ID development --force
echo "bizhunter-945a4.firebasestorage.app" | npx vercel env add VITE_FIREBASE_STORAGE_BUCKET development --force
echo "938315544017" | npx vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID development --force
echo "1:938315544017:web:22ded62a409dddfba69cf0" | npx vercel env add VITE_FIREBASE_APP_ID development --force

echo ""
echo "Environment variables added successfully!"
echo "Triggering a new deployment..."
npx vercel --prod --force

echo ""
echo "✅ Firebase configuration deployed to Vercel!"