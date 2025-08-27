# Firebase Storage CORS Setup Instructions

## Current Issues Fixed
1. ✅ Fixed missing `fetchDealTasks` function in `src/lib/database-adapter.js`
2. ✅ Fixed missing `fetchDealFiles` function in `src/lib/database-adapter.js`  
3. ⚠️ Firebase Storage needs initial setup

## Important: Billing Required
**Firebase Storage requires a billing account to be enabled.** The project currently has billing disabled.

### Enable Billing First
1. Go to https://console.cloud.google.com/billing/linkedaccount?project=bizhunter-945a4
2. Link a billing account to the project
3. Once billing is enabled, proceed with the storage setup

## Steps to Complete Firebase Storage Setup

### 1. Enable Firebase Storage
1. Go to https://console.firebase.google.com/project/bizhunter-945a4/storage
2. Click "Get Started"
3. Choose your preferred location (us-central1 recommended)
4. Click "Done"

### 2. Deploy Storage Rules
Once storage is enabled, run:
```bash
firebase deploy --only storage:rules
```

### 3. Apply CORS Configuration
After storage is deployed, run:
```bash
./set-cors.sh
```

This will allow the following origins:
- https://www.bizhunter.ai
- https://bizhunter.ai  
- http://localhost:3000
- http://localhost:5173

## Alternative: Manual CORS Setup

If the script fails, you can manually apply CORS:

```bash
# Make sure you're on the correct project
gcloud config set project bizhunter-945a4

# Apply CORS configuration
gsutil cors set cors.json gs://bizhunter-945a4.appspot.com
```

## Testing

After setup, test file uploads from your application at https://www.bizhunter.ai

## Troubleshooting

If you still see CORS errors:
1. Check that Firebase Storage is enabled
2. Verify the bucket name matches your configuration
3. Ensure storage rules are deployed
4. Check that CORS configuration was applied successfully