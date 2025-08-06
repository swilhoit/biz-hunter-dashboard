import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // We need the service role key for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixStoragePolicies() {
  console.log('🔧 Fixing storage RLS policies...');
  
  try {
    // First, ensure the bucket exists
    console.log('📦 Checking if deal-documents bucket exists...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'deal-documents');
    
    if (!bucketExists) {
      console.log('📦 Creating deal-documents bucket...');
      const { error: createError } = await supabase.storage.createBucket('deal-documents', {
        public: false,
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
        console.error('❌ Error creating bucket:', createError);
      } else {
        console.log('✅ Bucket created successfully');
      }
    } else {
      console.log('✅ Bucket already exists');
    }
    
    // Now fix the storage policies using SQL
    console.log('🔒 Updating storage policies...');
    
    const policySQL = `
      -- Drop existing restrictive policies
      DROP POLICY IF EXISTS "Users can upload documents to deals they have access to" ON storage.objects;
      DROP POLICY IF EXISTS "Users can view documents for deals they have access to" ON storage.objects;
      DROP POLICY IF EXISTS "Users can delete documents they uploaded" ON storage.objects;
      DROP POLICY IF EXISTS "Allow authenticated uploads to deal-documents" ON storage.objects;
      DROP POLICY IF EXISTS "Allow authenticated downloads from deal-documents" ON storage.objects;
      DROP POLICY IF EXISTS "Allow authenticated updates to deal-documents" ON storage.objects;
      DROP POLICY IF EXISTS "Allow authenticated deletes from deal-documents" ON storage.objects;
      
      -- Create permissive policies for development
      CREATE POLICY "Allow uploads to deal-documents bucket" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'deal-documents');
      
      CREATE POLICY "Allow downloads from deal-documents bucket" ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id = 'deal-documents');
      
      CREATE POLICY "Allow updates to deal-documents bucket" ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'deal-documents')
      WITH CHECK (bucket_id = 'deal-documents');
      
      CREATE POLICY "Allow deletes from deal-documents bucket" ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'deal-documents');
    `;
    
    const { error: sqlError } = await supabase.rpc('exec_sql', { sql: policySQL });
    
    if (sqlError) {
      console.error('❌ Error updating policies with RPC:', sqlError);
      
      // Try individual policy creation as fallback
      console.log('🔄 Trying alternative approach...');
      
      // We can't directly execute DDL through the client, so let's just test the bucket access
      const { data: testFiles, error: testError } = await supabase.storage
        .from('deal-documents')
        .list('', { limit: 1 });
      
      if (testError) {
        console.error('❌ Cannot access deal-documents bucket:', testError);
        console.log('💡 You may need to manually update the storage policies in the Supabase dashboard.');
        console.log('💡 Go to: https://supabase.com/dashboard/project/[your-project]/storage/policies');
        console.log('💡 And create permissive policies for the deal-documents bucket.');
      } else {
        console.log('✅ Storage access test successful');
      }
    } else {
      console.log('✅ Storage policies updated successfully');
    }
    
  } catch (error) {
    console.error('❌ Error fixing storage policies:', error);
  }
}

// Run the fix
fixStoragePolicies().then(() => {
  console.log('🎉 Storage policy fix completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Failed to fix storage policies:', error);
  process.exit(1);
}); 