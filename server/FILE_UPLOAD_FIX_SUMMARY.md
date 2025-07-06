# File Upload RLS Policy Fix Summary

## Current Issue
File uploads are failing with the error: "new row violates row-level security policy for table 'deal_documents'" (code 42501)

## Root Cause
1. The server uses Supabase's `anon` key for database operations
2. The RLS policy requires `auth.uid() = uploaded_by`
3. With the anon key, `auth.uid()` returns `null`
4. Even though we're passing the correct `userId`, the policy check fails because `null != userId`

## Implemented Changes

### 1. Server-side validation (✅ Completed)
Updated `/server/api/files.js` to:
- Validate that `userId` is provided in the request
- Ensure `userId` is a valid UUID format
- Add detailed logging for debugging

### 2. Frontend Integration (✅ Already Working)
The frontend correctly sends:
- `file`: The actual file
- `dealId`: The deal ID
- `userId`: The authenticated user's ID
- Other metadata as needed

## Required Solution: Service Role Key

To completely fix this issue, you need to configure the Supabase Service Role Key:

### Steps:
1. **Get the Service Role Key from Supabase**:
   - Go to: https://supabase.com/dashboard/project/ueemtnohgkovwzodzxdr/settings/api
   - Find "Service role secret" under "Project API keys"
   - Copy the key (keep it secret!)

2. **Add to `/server/.env`**:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your_full_key_here
   ```

3. **Restart the server**:
   ```bash
   cd server
   npm run dev
   ```

### How it works:
- The server already has code to use `supabaseAdmin` client when the service role key is available
- This client bypasses RLS policies, allowing the server to insert records on behalf of users
- The `uploaded_by` field will be correctly set to the user's ID

## Alternative Approaches (If Service Role Key Cannot Be Obtained)

### Option 1: Temporary Workaround
Use direct client uploads instead of server uploads:
- Modify the frontend to upload directly to Supabase Storage
- This would use the user's authentication context
- Requires refactoring the upload flow

### Option 2: Database Policy Change
Execute this SQL in Supabase SQL Editor (requires admin access):
```sql
-- Drop existing policy
DROP POLICY "Users can upload documents for their deals" ON deal_documents;

-- Create new policy allowing server uploads
CREATE POLICY "Users and servers can upload documents for deals"
ON deal_documents FOR INSERT
WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = uploaded_by AND EXISTS (
        SELECT 1 FROM deals 
        WHERE deals.id = deal_documents.deal_id 
        AND deals.user_id = auth.uid()
    ))
    OR
    (auth.uid() IS NULL AND uploaded_by IS NOT NULL AND EXISTS (
        SELECT 1 FROM deals 
        WHERE deals.id = deal_documents.deal_id 
        AND deals.user_id = uploaded_by::uuid
    ))
);
```

## Current Status
- ✅ Server validates userId format
- ✅ Frontend sends correct data
- ✅ Detailed error logging added
- ❌ Waiting for Service Role Key configuration

Once the Service Role Key is added to the `.env` file, file uploads will work correctly.