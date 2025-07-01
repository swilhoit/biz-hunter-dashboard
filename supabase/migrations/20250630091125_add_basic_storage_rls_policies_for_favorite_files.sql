-- Basic policies for file upload functionality
CREATE POLICY "Allow authenticated uploads to favorite-files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'favorite-files');

CREATE POLICY "Allow authenticated downloads from favorite-files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'favorite-files');

CREATE POLICY "Allow authenticated deletes from favorite-files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'favorite-files');