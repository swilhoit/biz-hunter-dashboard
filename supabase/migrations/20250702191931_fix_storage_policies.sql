-- Fix Storage Policies for deal-documents bucket
-- This migration applies more permissive storage policies for development

-- First, drop the existing restrictive policies
DROP POLICY IF EXISTS "Users can upload documents to deals they have access to" ON storage.objects;
DROP POLICY IF EXISTS "Users can view documents for deals they have access to" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete documents they uploaded" ON storage.objects;

-- Create simpler, more permissive policies for development
-- Policy 1: Allow authenticated users to upload files to deal-documents bucket
CREATE POLICY "Allow authenticated uploads to deal-documents" ON storage.objects
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND 
  bucket_id = 'deal-documents'
);

-- Policy 2: Allow authenticated users to view/download files from deal-documents bucket
CREATE POLICY "Allow authenticated downloads from deal-documents" ON storage.objects
FOR SELECT USING (
  auth.role() = 'authenticated' AND 
  bucket_id = 'deal-documents'
);

-- Policy 3: Allow authenticated users to update files in deal-documents bucket
CREATE POLICY "Allow authenticated updates to deal-documents" ON storage.objects
FOR UPDATE USING (
  auth.role() = 'authenticated' AND 
  bucket_id = 'deal-documents'
) WITH CHECK (
  auth.role() = 'authenticated' AND 
  bucket_id = 'deal-documents'
);

-- Policy 4: Allow authenticated users to delete files from deal-documents bucket
CREATE POLICY "Allow authenticated deletes from deal-documents" ON storage.objects
FOR DELETE USING (
  auth.role() = 'authenticated' AND 
  bucket_id = 'deal-documents'
);