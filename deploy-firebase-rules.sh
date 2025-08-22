#!/bin/bash

echo "================================"
echo "Firebase Rules Deployment Script"
echo "================================"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed."
    echo "Please install it first: npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
echo "Checking Firebase authentication..."
firebase projects:list > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ You are not logged into Firebase."
    echo "Please run: firebase login"
    exit 1
fi

echo "✅ Firebase CLI is installed and authenticated"
echo ""

# Select or use existing project
echo "Current Firebase project configuration:"
if [ -f ".firebaserc" ]; then
    cat .firebaserc
    echo ""
    read -p "Use existing project configuration? (y/n): " use_existing
    if [ "$use_existing" != "y" ]; then
        echo "Running firebase init to select a different project..."
        firebase use --add
    fi
else
    echo "No Firebase project configured."
    echo "Please select your Firebase project:"
    firebase use --add
fi

echo ""
echo "Starting deployment..."
echo ""

# Deploy Firestore rules
echo "1. Deploying Firestore security rules..."
firebase deploy --only firestore:rules
if [ $? -eq 0 ]; then
    echo "✅ Firestore rules deployed successfully"
else
    echo "❌ Failed to deploy Firestore rules"
    exit 1
fi

echo ""

# Deploy Firestore indexes
echo "2. Deploying Firestore indexes..."
firebase deploy --only firestore:indexes
if [ $? -eq 0 ]; then
    echo "✅ Firestore indexes deployed successfully"
    echo "Note: Index building may take several minutes in the background"
else
    echo "❌ Failed to deploy Firestore indexes"
    exit 1
fi

echo ""

# Deploy Storage rules
echo "3. Deploying Storage security rules..."
firebase deploy --only storage:rules
if [ $? -eq 0 ]; then
    echo "✅ Storage rules deployed successfully"
else
    echo "❌ Failed to deploy Storage rules"
    exit 1
fi

echo ""
echo "================================"
echo "✅ All Firebase rules and indexes deployed successfully!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Verify the rules in Firebase Console > Firestore Database > Rules"
echo "2. Check index status in Firebase Console > Firestore Database > Indexes"
echo "3. Test your application with the new security rules"
echo ""
echo "To test locally with emulators, run:"
echo "  firebase emulators:start"
echo ""