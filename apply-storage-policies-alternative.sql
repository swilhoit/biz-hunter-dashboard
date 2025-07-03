-- Alternative Storage Policies Script (Safe Conditional Creation)
-- This version uses DO blocks to check for existing policies before creating

-- =============================================================================
-- STORAGE POLICIES FOR deal-documents BUCKET
-- =============================================================================

-- Policy 1: Allow authenticated users to upload files to deal-documents bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow authenticated uploads to deal-documents'
  ) THEN
    CREATE POLICY "Allow authenticated uploads to deal-documents" ON storage.objects
    FOR INSERT WITH CHECK (
      auth.role() = 'authenticated' AND 
      bucket_id = 'deal-documents'
    );
  END IF;
END $$;

-- Policy 2: Allow authenticated users to view/download files from deal-documents bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow authenticated downloads from deal-documents'
  ) THEN
    CREATE POLICY "Allow authenticated downloads from deal-documents" ON storage.objects
    FOR SELECT USING (
      auth.role() = 'authenticated' AND 
      bucket_id = 'deal-documents'
    );
  END IF;
END $$;

-- Policy 3: Allow authenticated users to update files in deal-documents bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow authenticated updates to deal-documents'
  ) THEN
    CREATE POLICY "Allow authenticated updates to deal-documents" ON storage.objects
    FOR UPDATE USING (
      auth.role() = 'authenticated' AND 
      bucket_id = 'deal-documents'
    ) WITH CHECK (
      auth.role() = 'authenticated' AND 
      bucket_id = 'deal-documents'
    );
  END IF;
END $$;

-- Policy 4: Allow authenticated users to delete files from deal-documents bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow authenticated deletes from deal-documents'
  ) THEN
    CREATE POLICY "Allow authenticated deletes from deal-documents" ON storage.objects
    FOR DELETE USING (
      auth.role() = 'authenticated' AND 
      bucket_id = 'deal-documents'
    );
  END IF;
END $$;

-- Policy 5: Allow authenticated users to view the deal-documents bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'buckets' 
    AND policyname = 'Allow authenticated bucket access'
  ) THEN
    CREATE POLICY "Allow authenticated bucket access" ON storage.buckets
    FOR SELECT USING (
      auth.role() = 'authenticated' AND 
      id = 'deal-documents'
    );
  END IF;
END $$;

-- =============================================================================
-- DEAL DOCUMENTS TABLE POLICIES
-- =============================================================================

-- Add DELETE policy for deal_documents table
DO $$
BEGIN
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
END $$;

-- Add UPDATE policy for deal_documents table
DO $$
BEGIN
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
-- VERIFICATION QUERIES
-- =============================================================================

-- Check current storage policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename IN ('objects', 'buckets')
ORDER BY tablename, policyname;

-- Check deal_documents policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'deal_documents'
ORDER BY policyname;