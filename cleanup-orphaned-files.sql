-- Cleanup orphaned file records (files in database but not in storage)
-- Run this AFTER fixing the storage policies

-- Check orphaned records first
SELECT 
  dd.id,
  dd.document_name,
  dd.file_path,
  dd.uploaded_at,
  'File exists in database but not in storage' as status
FROM deal_documents dd
WHERE NOT EXISTS (
  SELECT 1 FROM storage.objects so 
  WHERE so.name = dd.file_path 
  AND so.bucket_id = 'deal-documents'
);

-- Optional: Delete orphaned records (uncomment to execute)
/*
DELETE FROM deal_documents 
WHERE id IN (
  SELECT dd.id
  FROM deal_documents dd
  WHERE NOT EXISTS (
    SELECT 1 FROM storage.objects so 
    WHERE so.name = dd.file_path 
    AND so.bucket_id = 'deal-documents'
  )
);
*/

-- Check what files actually exist in storage
SELECT 
  so.name as file_path,
  so.created_at,
  so.metadata,
  CASE 
    WHEN dd.id IS NOT NULL THEN 'Has database record'
    ELSE 'Storage only - no database record'
  END as status
FROM storage.objects so
LEFT JOIN deal_documents dd ON dd.file_path = so.name
WHERE so.bucket_id = 'deal-documents'
ORDER BY so.created_at DESC;