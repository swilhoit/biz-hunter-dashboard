# Firebase Setup Guide

## Prerequisites

Before starting, you need a Firebase project. If you don't have one:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Follow the setup wizard

## Step 1: Get Your Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. If you haven't added a web app yet:
   - Click the `</>` icon to add a web app
   - Register your app with a nickname (e.g., "biz-hunter-dashboard")
   - You'll see your Firebase configuration object
4. Copy the configuration values

Your config will look like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

## Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication** (left sidebar)
2. Click **Get started**
3. Go to **Sign-in method** tab
4. Enable **Email/Password** authentication
5. Click **Enable** and **Save**

## Step 3: Set Up Firestore Database

1. In Firebase Console, go to **Firestore Database** (left sidebar)
2. Click **Create database**
3. Choose **Start in production mode** (we'll add rules later)
4. Select your preferred location
5. Click **Enable**

### Add Firestore Security Rules

After creation, go to the **Rules** tab and add these basic rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Authenticated users can create deals
    match /deals/{dealId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Add more rules as needed
  }
}
```

## Step 4: Set Up Storage (Optional)

If you plan to use file uploads:

1. In Firebase Console, go to **Storage** (left sidebar)
2. Click **Get started**
3. Accept the default security rules for now
4. Choose your storage location
5. Click **Done**

## Step 5: Configure Local Development

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Edit `.env.local` and add your Firebase configuration:
```
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

3. Test locally:
```bash
npm run dev
```

## Step 6: Deploy to Vercel

### Option A: Using the Setup Script (Recommended)

Run the provided setup script:
```bash
./setup-firebase-vercel.sh
```

This script will:
- Remove old Supabase variables
- Add your Firebase configuration to Vercel
- Trigger a new deployment

### Option B: Manual Setup

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each Firebase variable:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
5. Trigger a new deployment

## Step 7: Test Your Deployment

After deployment:
1. Visit your site
2. Try signing up with a new account
3. Check Firebase Console → Authentication → Users to see the new user
4. Test sign in/sign out functionality

## Troubleshooting

### Authentication Not Working
- Verify Email/Password authentication is enabled in Firebase Console
- Check that all environment variables are correctly set in Vercel
- Look at browser console for error messages

### Firestore Permissions Errors
- Review your Firestore security rules
- Make sure the user is properly authenticated
- Check that the data structure matches what the rules expect

### Build Errors on Vercel
- Ensure all Firebase environment variables are set
- Check the build logs in Vercel dashboard
- Try removing `package-lock.json` and rebuilding

## Migration Notes

This project has been migrated from Supabase to Firebase. Key changes:
- Authentication now uses Firebase Auth instead of Supabase Auth
- Data storage uses Firestore instead of Supabase PostgreSQL
- File storage uses Firebase Storage instead of Supabase Storage
- All environment variables have been updated from `VITE_SUPABASE_*` to `VITE_FIREBASE_*`

## Support

For Firebase-specific issues, consult the [Firebase Documentation](https://firebase.google.com/docs).
For project-specific questions, check the main README or open an issue.