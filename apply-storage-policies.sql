-- Consolidated Storage Policies Migration Script
-- Apply this in your Supabase SQL Editor Dashboard (run as postgres/service_role)
-- This consolidates all storage policies for deal-documents bucket

-- =============================================================================
-- SECTION 1: Use proper role for storage operations
-- =============================================================================

-- Switch to service_role context for storage operations
SET ROLE service_role;

-- =============================================================================
-- SECTION 2: Clean up any existing conflicting policies
-- =============================================================================

-- Drop any existing restrictive policies that might conflict
DROP POLICY IF EXISTS "Users can upload documents to deals they have access to" ON storage.objects;
DROP POLICY IF EXISTS "Users can view documents for deals they have access to" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete documents they uploaded" ON storage.objects;

-- Drop any existing permissive policies to avoid duplicates
DROP POLICY IF EXISTS "Allow authenticated uploads to deal-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated downloads from deal-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to deal-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from deal-documents" ON storage.objects;

-- Drop older policy variations
DROP POLICY IF EXISTS "Allow authenticated users to upload deal documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view deal documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update deal documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete deal documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view deal-documents bucket" ON storage.buckets;
DROP POLICY IF EXISTS "Allow authenticated bucket access" ON storage.buckets;

-- =============================================================================
-- SECTION 3: Enable Row Level Security
-- =============================================================================

-- Enable RLS on storage tables if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- SECTION 3: Create Storage Policies for deal-documents bucket
-- =============================================================================

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

-- Policy 5: Allow authenticated users to view the deal-documents bucket
CREATE POLICY "Allow authenticated bucket access" ON storage.buckets
FOR SELECT USING (
  auth.role() = 'authenticated' AND 
  id = 'deal-documents'
);

-- =============================================================================
-- SECTION 4: Deal Documents Table Policies (if not already applied)
-- =============================================================================

-- Check if deal_documents table policies exist, if not create them
DO $$
BEGIN
  -- Add DELETE policy for deal_documents table to allow file deletion
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'deal_documents' 
    AND policyname = 'Users can delete documents for deals they have access to'
  ) THEN
    CREATE POLICY "Users can delete documents for deals they have access to" 
    ON "public"."deal_documents"
    AS PERMISSIVE FOR DELETE
    TO public
    USING (
      EXISTS (
        SELECT 1
        FROM deals
        WHERE deals.id = deal_documents.deal_id
        AND (
          deals.created_by = auth.uid()
          OR deals.assigned_to = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM deal_team_members
            WHERE deal_team_members.deal_id = deals.id
            AND deal_team_members.user_id = auth.uid()
          )
        )
      )
    );
  END IF;

  -- Add UPDATE policy for deal_documents table
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'deal_documents' 
    AND policyname = 'Users can update documents for deals they have access to'
  ) THEN
    CREATE POLICY "Users can update documents for deals they have access to" 
    ON "public"."deal_documents"
    AS PERMISSIVE FOR UPDATE
    TO public
    USING (
      EXISTS (
        SELECT 1
        FROM deals
        WHERE deals.id = deal_documents.deal_id
        AND (
          deals.created_by = auth.uid()
          OR deals.assigned_to = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM deal_team_members
            WHERE deal_team_members.deal_id = deals.id
            AND deal_team_members.user_id = auth.uid()
          )
        )
      )
    );
  END IF;
END $$;

-- =============================================================================
-- SECTION 6: Reset role and verify
-- =============================================================================

-- Reset to authenticated role
RESET ROLE;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify storage policies are created
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename IN ('objects', 'buckets')
AND policyname LIKE '%deal-documents%'
ORDER BY tablename, policyname;

-- Verify deal_documents table policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'deal_documents'
ORDER BY policyname;

-- Check if deal-documents bucket exists
SELECT id, name, public, created_at 
FROM storage.buckets 
WHERE id = 'deal-documents';