# Storage Setup for File Upload Feature

## Overview
The file upload feature requires Supabase Storage with proper RLS (Row Level Security) policies to function correctly.

## Required Setup Steps

### 1. RLS Policies for Storage
Run the following SQL commands in your Supabase SQL Editor to enable file uploads:

```sql
-- Allow authenticated users to upload files to favorite-files bucket
CREATE POLICY "Allow authenticated uploads to favorite-files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'favorite-files'
);

-- Allow authenticated users to view/download their files
CREATE POLICY "Allow authenticated downloads from favorite-files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'favorite-files'
);

-- Allow authenticated users to delete their files
CREATE POLICY "Allow authenticated deletes from favorite-files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'favorite-files'
);
```

### 2. Enhanced Security (Optional)
For better security, you can restrict uploads to user-specific folders:

```sql
-- More secure: Only allow users to upload to their own folder
DROP POLICY IF EXISTS "Allow authenticated uploads to favorite-files" ON storage.objects;

CREATE POLICY "Allow user-specific uploads to favorite-files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'favorite-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- More secure: Only allow users to access their own files
DROP POLICY IF EXISTS "Allow authenticated downloads from favorite-files" ON storage.objects;

CREATE POLICY "Allow user-specific downloads from favorite-files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'favorite-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- More secure: Only allow users to delete their own files
DROP POLICY IF EXISTS "Allow authenticated deletes from favorite-files" ON storage.objects;

CREATE POLICY "Allow user-specific deletes from favorite-files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'favorite-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

## How It Works

1. **Bucket Creation**: The app automatically creates the `favorite-files` bucket when a user first uploads a file
2. **File Organization**: Files are stored in paths like `{user_id}/{favorite_id}/{timestamp}_{filename}`
3. **RLS Security**: Policies ensure users can only access their own files
4. **File Types**: Supports PDF, Word, Excel, images, text, and CSV files up to 50MB

## Troubleshooting

### "violates RLS policy" Error
This means the RLS policies haven't been set up yet. Run the SQL commands above in your Supabase SQL Editor.

### Bucket Creation Fails
If the bucket creation fails, you can manually create it in the Supabase Dashboard:
1. Go to Storage > Create Bucket
2. Name: `favorite-files`
3. Public: No (keep it private)
4. Add file type restrictions for security

## File Analysis Feature

Once files are uploaded:
1. Users see an "Generate AI Business Analysis" button
2. Clicking it opens a comprehensive business analysis report in a new tab
3. The analysis includes financial metrics, market analysis, SWOT, valuation, and investment recommendations

## Future Enhancements

- **Database Storage**: Currently file metadata is stored in localStorage. In production, this should be moved to a proper database table
- **PDF Parsing**: Add actual PDF text extraction for better analysis
- **OCR Support**: Add image text recognition for scanned documents
- **Batch Analysis**: Allow analyzing multiple saved listings at once