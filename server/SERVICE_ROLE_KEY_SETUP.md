# Service Role Key Setup Instructions

The file upload functionality is currently failing due to RLS (Row Level Security) policies. The server is using the anon key which doesn't have authentication context, causing the RLS policy to reject insertions.

## The Problem

The current RLS policy for `deal_documents` table requires:
1. `auth.uid() = uploaded_by` 
2. The deal must belong to the authenticated user

Since the server uses the anon key, `auth.uid()` returns null, making uploads fail.

## Solution: Configure Service Role Key

To fix this issue, you need to add the Supabase Service Role Key to your server's `.env` file:

1. **Get your Service Role Key**:
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Find the "Service Role Key" (keep this secret!)
   - Copy the key

2. **Add to .env file**:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

3. **Restart the server**:
   ```bash
   npm run dev
   ```

## Why Service Role Key?

The Service Role Key bypasses RLS policies entirely, allowing the server to perform database operations on behalf of users. This is necessary for server-side file uploads where the server needs to insert records that "belong" to specific users.

## Security Considerations

- **NEVER expose the Service Role Key to the client/frontend**
- Keep it only in server-side environment variables
- Don't commit it to version control
- Use it only for trusted server operations

## Alternative Solution (if Service Role Key is not available)

If you cannot access the Service Role Key, you would need to modify the RLS policy to allow server uploads. However, this requires database owner permissions which may not be available in your current setup.

The migration file for this alternative approach is available at:
`/supabase/migrations/20250706_fix_server_file_uploads.sql`

But it requires executing with appropriate permissions in the Supabase SQL editor.