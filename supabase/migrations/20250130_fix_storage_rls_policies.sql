-- Fix Storage RLS Policies for Development
-- This migration addresses the "new row violates row-level security policy" error

-- Drop any existing restrictive storage policies
DROP POLICY IF EXISTS "Users can upload documents to deals they have access to" ON storage.objects;
DROP POLICY IF EXISTS "Users can view documents for deals they have access to" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete documents they uploaded" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to deal-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated downloads from deal-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to deal-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from deal-documents" ON storage.objects;

-- Create more permissive storage policies for development
-- Allow authenticated users to upload to deal-documents bucket
CREATE POLICY "Allow uploads to deal-documents bucket" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'deal-documents');

-- Allow authenticated users to view/download from deal-documents bucket
CREATE POLICY "Allow downloads from deal-documents bucket" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'deal-documents');

-- Allow authenticated users to update files in deal-documents bucket
CREATE POLICY "Allow updates to deal-documents bucket" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'deal-documents')
WITH CHECK (bucket_id = 'deal-documents');

-- Allow authenticated users to delete from deal-documents bucket
CREATE POLICY "Allow deletes from deal-documents bucket" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'deal-documents');

-- Also ensure the bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('deal-documents', 'deal-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Grant necessary permissions to authenticated users
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated; 