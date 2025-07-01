-- Add notes and file upload support to favorites table
ALTER TABLE favorites 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create a table for storing file references for favorites
CREATE TABLE IF NOT EXISTS favorite_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  favorite_id UUID NOT NULL REFERENCES favorites(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id),
  
  -- Index for faster lookups
  CONSTRAINT unique_file_path UNIQUE(file_path)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_favorite_files_favorite_id ON favorite_files(favorite_id);
CREATE INDEX IF NOT EXISTS idx_favorite_files_uploaded_by ON favorite_files(uploaded_by);

-- Update trigger for favorites updated_at
CREATE OR REPLACE FUNCTION update_favorites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_favorites_updated_at_trigger
BEFORE UPDATE ON favorites
FOR EACH ROW
EXECUTE FUNCTION update_favorites_updated_at();

-- RLS policies for favorite_files
ALTER TABLE favorite_files ENABLE ROW LEVEL SECURITY;

-- Users can view files for their own favorites
CREATE POLICY "Users can view their favorite files" ON favorite_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM favorites 
      WHERE favorites.id = favorite_files.favorite_id 
      AND favorites.user_id = auth.uid()
    )
  );

-- Users can upload files to their own favorites
CREATE POLICY "Users can upload files to their favorites" ON favorite_files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM favorites 
      WHERE favorites.id = favorite_files.favorite_id 
      AND favorites.user_id = auth.uid()
    )
  );

-- Users can delete their own favorite files
CREATE POLICY "Users can delete their favorite files" ON favorite_files
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM favorites 
      WHERE favorites.id = favorite_files.favorite_id 
      AND favorites.user_id = auth.uid()
    )
  );

-- Create storage bucket for favorite files if it doesn't exist
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'favorite-files',
  'favorite-files',
  false,
  false,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain', 'text/csv']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for favorite files
CREATE POLICY "Users can upload their favorite files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'favorite-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their favorite files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'favorite-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their favorite files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'favorite-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Add comments for documentation
COMMENT ON COLUMN favorites.notes IS 'User notes about the saved listing';
COMMENT ON TABLE favorite_files IS 'File attachments for saved business listings';
COMMENT ON COLUMN favorite_files.file_path IS 'Path in Supabase storage bucket';