import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, Trash2, Download, Save, Loader2, Brain, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface FavoriteFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

interface FavoriteNotesAndFilesProps {
  favoriteId: string;
  initialNotes?: string;
  files?: FavoriteFile[];
  onUpdate?: () => void;
  businessListing?: {
    id: string;
    name: string;
    description: string;
    asking_price: number;
    annual_revenue: number;
    industry: string;
    location: string;
  };
}

export const FavoriteNotesAndFiles: React.FC<FavoriteNotesAndFilesProps> = ({
  favoriteId,
  initialNotes = '',
  files = [],
  onUpdate,
  businessListing
}) => {
  const [notes, setNotes] = useState(initialNotes);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FavoriteFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load files from localStorage on component mount
  useEffect(() => {
    const storageKey = `favorite_files_${favoriteId}`;
    const storedFiles = JSON.parse(localStorage.getItem(storageKey) || '[]');
    setUploadedFiles(prev => {
      // Only update if the files have actually changed
      const newFiles = [...files, ...storedFiles];
      if (JSON.stringify(prev) !== JSON.stringify(newFiles)) {
        return newFiles;
      }
      return prev;
    });
  }, [favoriteId]); // Removed 'files' from dependency array to prevent infinite loops

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('favorites')
        .update({ notes })
        .eq('id', favoriteId);

      if (error) throw error;

      toast({
        title: 'Notes saved',
        description: 'Your notes have been saved successfully.',
      });

      if (onUpdate) onUpdate();
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to save notes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 50MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if storage bucket exists, create if needed
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.id === 'favorite-files');
      
      if (!bucketExists) {
        console.log('Creating favorite-files bucket...');
        const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('favorite-files', {
          public: true,
          allowedMimeTypes: [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 
            'application/pdf', 
            'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'text/csv'
          ],
          fileSizeLimit: '50MB'
        });
        
        if (bucketError) {
          console.error('Error creating bucket:', bucketError);
          throw new Error(`Failed to create storage bucket: ${bucketError.message}`);
        }
        console.log('Bucket created successfully:', bucketData);
      }

      // Upload file to storage with user-specific path for better organization
      const fileExt = file.name.split('.').pop();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${user.id}/${favoriteId}/${Date.now()}_${sanitizedFileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('favorite-files')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        console.error('Upload error details:', JSON.stringify(uploadError, null, 2));
        console.error('File path attempted:', fileName);
        console.error('User ID:', user.id);
        
        // If it's an RLS error, provide more helpful information
        if (uploadError.message?.includes('RLS') || uploadError.message?.includes('policy')) {
          throw new Error(`File upload permissions not configured. Please run this SQL command in your Supabase SQL Editor:

CREATE POLICY "Allow authenticated uploads to favorite-files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'favorite-files'
);

CREATE POLICY "Allow authenticated downloads from favorite-files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'favorite-files'
);

CREATE POLICY "Allow authenticated deletes from favorite-files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'favorite-files'
);`);
        }
        
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // For now, store file info in localStorage since we can't create database tables
      // In production, this would be stored in a proper database table
      const fileRecord = {
        id: crypto.randomUUID(),
        favorite_id: favoriteId,
        file_name: file.name,
        file_path: uploadData.path,
        file_size: file.size,
        mime_type: file.type,
        uploaded_at: new Date().toISOString(),
        uploaded_by: user.id,
      };

      // Store in localStorage
      const storageKey = `favorite_files_${favoriteId}`;
      const existingFiles = JSON.parse(localStorage.getItem(storageKey) || '[]');
      existingFiles.push(fileRecord);
      localStorage.setItem(storageKey, JSON.stringify(existingFiles));

      setUploadedFiles([...uploadedFiles, fileRecord]);
      
      toast({
        title: 'File uploaded',
        description: `${file.name} has been uploaded successfully.`,
      });

      if (onUpdate) onUpdate();
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    } catch (error) {
      console.error('Error uploading file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file. Please try again.';
      toast({
        title: 'Upload failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteFile = async (fileId: string, filePath: string) => {
    setIsLoading(true);
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('favorite-files')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from localStorage
      const storageKey = `favorite_files_${favoriteId}`;
      const existingFiles = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const updatedFiles = existingFiles.filter((f: any) => f.id !== fileId);
      localStorage.setItem(storageKey, JSON.stringify(updatedFiles));

      setUploadedFiles(uploadedFiles.filter(f => f.id !== fileId));
      
      toast({
        title: 'File deleted',
        description: 'The file has been deleted successfully.',
      });

      if (onUpdate) onUpdate();
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('favorite-files')
        .download(filePath);

      if (error) throw error;

      // Create a download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Download failed',
        description: 'Failed to download file. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleAnalyzeFiles = async () => {
    if (!businessListing || uploadedFiles.length === 0) {
      toast({
        title: 'No files to analyze',
        description: 'Please upload some files before running analysis.',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      // Create analysis record and navigate to report page
      const analysisId = crypto.randomUUID();
      
      // Store analysis request in localStorage for now (could be moved to database later)
      const analysisData = {
        id: analysisId,
        favoriteId,
        businessListing,
        files: uploadedFiles,
        notes,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };
      
      localStorage.setItem(`analysis_${analysisId}`, JSON.stringify(analysisData));
      
      // Open analysis report in new tab
      const url = `/dashboard/analysis/${analysisId}`;
      window.open(url, '_blank');
      
      toast({
        title: 'Analysis started',
        description: 'AI analysis is running. Check the new tab for results.',
      });
      
    } catch (error) {
      console.error('Error starting analysis:', error);
      toast({
        title: 'Analysis failed',
        description: 'Failed to start analysis. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Notes Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add your notes about this listing..."
            className="min-h-[100px] mb-3"
          />
          <Button
            onClick={handleSaveNotes}
            disabled={isSaving || notes === initialNotes}
            size="sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Notes
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Files Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* File Upload */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Document
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Max 50MB. Supported: PDF, Word, Excel, Images, Text, CSV
              </p>
            </div>

            {/* Analyze Files Button */}
            {uploadedFiles.length > 0 && (
              <Button
                onClick={handleAnalyzeFiles}
                disabled={isAnalyzing || !businessListing}
                className="w-full"
                variant="default"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Files...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Generate AI Business Analysis
                  </>
                )}
              </Button>
            )}

            {/* File List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2 rounded-lg border bg-muted/50"
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{file.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.file_size)} • {new Date(file.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <Button
                        onClick={() => handleDownloadFile(file.file_path, file.file_name)}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteFile(file.id, file.file_path)}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};