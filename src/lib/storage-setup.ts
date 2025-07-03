import { supabase } from './supabase';

export async function ensureStorageBucketExists() {
  try {
    console.log('Checking if deal-documents storage bucket exists...');
    
    // List all buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return { success: false, error: listError.message };
    }
    
    console.log('Available buckets:', buckets?.map(b => b.name));
    
    // Check if deal-documents bucket exists
    const bucketExists = buckets?.some(bucket => bucket.name === 'deal-documents');
    
    if (bucketExists) {
      console.log('deal-documents bucket already exists');
      return { success: true, message: 'Bucket already exists' };
    }
    
    // Create the bucket if it doesn't exist
    console.log('Creating deal-documents bucket...');
    const { data: createData, error: createError } = await supabase.storage.createBucket('deal-documents', {
      public: false, // Private bucket
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'image/png',
        'image/jpeg',
        'image/jpg'
      ],
      fileSizeLimit: 52428800 // 50MB
    });
    
    if (createError) {
      console.error('Error creating bucket:', createError);
      return { success: false, error: createError.message };
    }
    
    console.log('deal-documents bucket created successfully:', createData);
    return { success: true, message: 'Bucket created successfully' };
    
  } catch (error: any) {
    console.error('Error in ensureStorageBucketExists:', error);
    return { success: false, error: error.message };
  }
}

export async function testStorageAccess() {
  try {
    console.log('Testing storage access...');
    
    // Try to list buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Cannot list buckets:', listError);
      return { canAccess: false, error: listError.message };
    }
    
    console.log('Can access storage. Buckets:', buckets?.map(b => b.name));
    
    // Try to list files in deal-documents bucket
    const { data: files, error: filesError } = await supabase.storage
      .from('deal-documents')
      .list('', { limit: 1 });
    
    if (filesError) {
      console.error('Cannot access deal-documents bucket:', filesError);
      return { canAccess: false, error: filesError.message };
    }
    
    console.log('Can access deal-documents bucket. File count:', files?.length || 0);
    
    return { canAccess: true, buckets: buckets?.map(b => b.name), fileCount: files?.length || 0 };
    
  } catch (error: any) {
    console.error('Error testing storage access:', error);
    return { canAccess: false, error: error.message };
  }
}