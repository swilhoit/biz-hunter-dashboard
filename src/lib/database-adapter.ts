/**
 * Database Adapter
 * Maps between mosaic-react expected structure and existing database structure
 */

import { supabase } from './supabase';
import { getBusinessImage } from '../utils/imageUtils';
import { ensureStorageBucketExists } from './storage-setup';

// Map deal status values
export const mapDealStatus = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'prospecting': 'prospecting',
    'qualified_leads': 'initial_contact',
    'first_contact': 'initial_contact',
    'analysis': 'analysis',
    'due_diligence': 'due_diligence',
    'loi': 'loi_submitted',
    'under_contract': 'under_contract',
    'closed_won': 'closed_won',
    'closed_lost': 'closed_lost',
    'negotiation': 'negotiation',
    'closing': 'closing',
    'on_hold': 'on_hold'
  };
  return statusMap[status] || status;
};

// Adapter functions to work with existing database structure
export const dealsAdapter = {
  // Fetch deals with proper mapping
  async fetchDeals() {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map the data to match mosaic-react expectations
    return data?.map(deal => ({
      ...deal,
      status: mapDealStatus(deal.stage || 'prospecting'),
      // Add any other field mappings needed
      valuation_multiple: deal.multiple,
      monthly_revenue: deal.monthly_revenue || (deal.annual_revenue ? deal.annual_revenue / 12 : null),
      monthly_profit: deal.monthly_profit || (deal.annual_profit ? deal.annual_profit / 12 : null),
      // Map broker fields from actual database columns
      broker_company: deal.source, // Use source as broker company fallback
      amazon_store_url: deal.amazon_store_link,
      seller_name: deal.seller_name || 'Unknown',
      seller_email: deal.seller_email || '',
      seller_phone: deal.seller_phone || '',
      fba_percentage: deal.fba_percentage || 0,
      amazon_subcategory: deal.sub_industry,
      first_contact_date: deal.created_at,
      due_diligence_start_date: deal.stage === 'due_diligence' ? deal.stage_updated_at : null,
      expected_close_date: deal.next_action_date,
      notes: deal.custom_fields?.notes || '',
      // Add placeholder image if none exists
      image_url: deal.image_url || getBusinessImage(deal.business_name)
    }));
  },

  // Fetch a single deal by ID
  async fetchDealById(dealId: string) {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .single();

    if (error) throw error;

    if (!data) return null;

    // Map the data to match mosaic-react expectations
    const mappedDeal = {
      ...data,
      status: mapDealStatus(data.stage || 'prospecting'),
      // Add any other field mappings needed
      valuation_multiple: data.multiple,
      monthly_revenue: data.monthly_revenue || (data.annual_revenue ? data.annual_revenue / 12 : null),
      monthly_profit: data.monthly_profit || (data.annual_profit ? data.annual_profit / 12 : null),
      // Map broker fields from actual database columns
      broker_company: data.source, // Use source as broker company fallback
      amazon_store_url: data.amazon_store_link,
      seller_name: data.seller_name || 'Unknown',
      seller_email: data.seller_email || '',
      seller_phone: data.seller_phone || '',
      fba_percentage: data.fba_percentage || 0,
      amazon_subcategory: data.sub_industry,
      first_contact_date: data.created_at,
      due_diligence_start_date: data.stage === 'due_diligence' ? data.stage_updated_at : null,
      expected_close_date: data.next_action_date,
      notes: data.custom_fields?.notes || '',
      // Add placeholder image if none exists
      image_url: data.image_url || getBusinessImage(data.business_name)
    };

    return mappedDeal;
  },

  // Create a new deal
  async createDeal(dealData: Record<string, any>) {
    const mappedData: Record<string, any> = {};
    
    // Map frontend fields to database fields
    Object.keys(dealData).forEach(key => {
      switch (key) {
        case 'status':
          mappedData.stage = mapDealStatus(dealData.status);
          break;
        case 'valuation_multiple':
          mappedData.multiple = dealData.valuation_multiple;
          break;
        case 'broker_company':
          mappedData.source = dealData.broker_company;
          break;
        case 'amazon_store_url':
          mappedData.amazon_store_link = dealData.amazon_store_url;
          break;
        case 'notes':
          if (!mappedData.custom_fields) mappedData.custom_fields = {};
          mappedData.custom_fields.notes = dealData.notes;
          break;
        case 'amazon_subcategory':
          mappedData.sub_industry = dealData.amazon_subcategory;
          break;
        case 'business_name':
        case 'asking_price':
        case 'annual_revenue':
        case 'annual_profit':
        case 'industry':
        case 'city':
        case 'state':
        case 'listing_url':
        case 'broker_name':
        case 'broker_email':
        case 'broker_phone':
        case 'amazon_category':
        case 'business_age':
        case 'tags':
        case 'original_listing_id':
        case 'date_listed':
        case 'description':
          mappedData[key] = dealData[key];
          break;
        case 'monthly_revenue':
        case 'monthly_profit':
        case 'fba_percentage':
        case 'seller_account_health':
        case 'image_url':
          // Store these fields in custom_fields since they don't exist as columns
          if (!mappedData.custom_fields) mappedData.custom_fields = {};
          mappedData.custom_fields[key] = dealData[key];
          break;
        default:
          // Skip unknown fields to prevent database errors
          console.warn(`Skipping unknown field: ${key}`);
          break;
      }
    });

    mappedData.created_by = (await supabase.auth.getUser()).data.user?.id;

    const { data, error } = await supabase
      .from('deals')
      .insert(mappedData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update a deal
  async updateDeal(dealId: string, updates: Record<string, any>) {
    const mappedUpdates: Record<string, any> = {};
    let needsCustomFieldsUpdate = false;
    const customFieldsUpdates: Record<string, any> = {};
    
    // Map frontend fields to database fields
    Object.keys(updates).forEach(key => {
      switch (key) {
        case 'status':
          mappedUpdates.stage = mapDealStatus(updates.status);
          break;
        case 'valuation_multiple':
          mappedUpdates.multiple = updates.valuation_multiple;
          break;
        case 'broker_company':
          mappedUpdates.source = updates.broker_company;
          break;
        case 'amazon_store_url':
          mappedUpdates.amazon_store_link = updates.amazon_store_url;
          break;
        case 'seller_name':
        case 'seller_email':
        case 'seller_phone':
        case 'business_name':
        case 'asking_price':
        case 'annual_revenue':
        case 'annual_profit':
        case 'amazon_category':
        case 'broker_name':
        case 'broker_email':
        case 'broker_phone':
        case 'priority':
          mappedUpdates[key] = updates[key];
          break;
        case 'notes':
          customFieldsUpdates.notes = updates.notes;
          needsCustomFieldsUpdate = true;
          break;
        case 'amazon_subcategory':
          mappedUpdates.sub_industry = updates.amazon_subcategory;
          break;
        default:
          console.warn(`Skipping unknown field in update: ${key}`);
          break;
      }
    });

    // Handle custom_fields update if needed
    if (needsCustomFieldsUpdate) {
      const { data: existingDeal } = await supabase.from('deals').select('custom_fields').eq('id', dealId).single();
      const existingCustomFields = existingDeal?.custom_fields || {};
      mappedUpdates.custom_fields = { ...existingCustomFields, ...customFieldsUpdates };
    }

    // Remove undefined values
    Object.keys(mappedUpdates).forEach(key => 
      mappedUpdates[key] === undefined && delete mappedUpdates[key]
    );

    // Always update the updated_at timestamp
    mappedUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('deals')
      .update(mappedUpdates)
      .eq('id', dealId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a deal
  async deleteDeal(dealId: string) {
    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('id', dealId);

    if (error) throw error;
    return true;
  },

  // Delete multiple deals (for cleanup)
  async deleteMultipleDeals(dealIds: string[]) {
    const { error } = await supabase
      .from('deals')
      .delete()
      .in('id', dealIds);

    if (error) throw error;
    return true;
  }
};

// Adapter for documents/files
export const filesAdapter = {
  async fetchDealFiles(dealId: string) {
    // Fetch from deal_documents table only
    const { data, error } = await supabase
      .from('deal_documents')
      .select('*')
      .eq('deal_id', dealId);

    if (error) throw error;

    // Map the results to expected format
    const allFiles = (data || []).map(doc => ({
      id: doc.id,
      file_name: doc.document_name,
      file_path: doc.file_path,
      category: doc.category,
      uploaded_at: doc.uploaded_at,
      file_size: doc.file_size,
      file_type: doc.file_type,
      subcategory: doc.subcategory,
      tags: doc.tags,
      is_confidential: doc.is_confidential,
      metadata: doc.metadata
    }));

    return allFiles;
  },

  async uploadFile(dealId: string, file: File, metadata: Record<string, any>) {
    const fileName = `${dealId}/${Date.now()}-${file.name}`;
    
    try {
      console.log('Starting file upload:', { dealId, fileName, fileSize: file.size, fileType: file.type });
      
      // Get user first to handle auth errors early
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw new Error(`Authentication failed: ${authError.message}`);
      if (!user) throw new Error('User not authenticated');

      console.log('User authenticated for upload:', user.id);

      // Ensure storage bucket exists
      const bucketResult = await ensureStorageBucketExists();
      console.log('Storage bucket check result:', bucketResult);
      
      if (!bucketResult.success) {
        throw new Error(`Storage setup failed: ${bucketResult.error}`);
      }

      // Upload to Supabase storage
      console.log('Uploading file to storage...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('deal-documents')
        .upload(fileName, file);

      console.log('Upload result:', { uploadData, uploadError });

      if (uploadError) {
        throw new Error(`File upload failed: ${uploadError.message}`);
      }

      console.log('File uploaded successfully, saving metadata to database...');

      // Save file metadata to deal_documents table
      const { data, error } = await supabase
        .from('deal_documents')
        .insert({
          deal_id: dealId,
          document_name: file.name,
          file_path: fileName,
          file_size: file.size,
          file_type: file.type,
          category: metadata.category || 'general',
          subcategory: metadata.subcategory,
          uploaded_by: user.id,
          tags: metadata.tags || [],
          is_confidential: metadata.is_confidential || false,
          metadata: {
            description: metadata.description,
            ...metadata
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);
        // If database insert fails, try to clean up the uploaded file
        await supabase.storage.from('deal-documents').remove([fileName]);
        throw new Error(`Database save failed: ${error.message}`);
      }
      
      console.log('File upload and database save completed successfully:', data);
      return data;
    } catch (error) {
      console.error('Upload error:', error);
      // Re-throw with more context
      throw error instanceof Error ? error : new Error('Upload failed');
    }
  },

  async deleteFile(fileId: string) {
    try {
      console.log('Starting file deletion process for fileId:', fileId);
      
      // Get user first to handle auth errors early
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Authentication error:', authError);
        throw new Error(`Authentication failed: ${authError.message}`);
      }
      if (!user) {
        console.error('No authenticated user found');
        throw new Error('User not authenticated');
      }
      
      console.log('User authenticated:', user.id);

      // Get file info first to get the file path for storage deletion
      const { data: fileInfo, error: fetchError } = await supabase
        .from('deal_documents')
        .select('file_path, document_name, deal_id, uploaded_by')
        .eq('id', fileId)
        .single();

      if (fetchError) {
        console.error('File fetch error:', fetchError);
        throw new Error(`File not found: ${fetchError.message}`);
      }
      
      if (!fileInfo) {
        throw new Error('File not found in database');
      }

      console.log('File info retrieved:', fileInfo);

      // Delete from storage first
      if (fileInfo.file_path) {
        console.log('Attempting to delete from storage:', fileInfo.file_path);
        const { error: storageError } = await supabase.storage
          .from('deal-documents')
          .remove([fileInfo.file_path]);

        if (storageError) {
          console.warn('Storage deletion warning:', storageError);
          // Continue with database deletion even if storage deletion fails
        } else {
          console.log('Successfully deleted from storage');
        }
      }

      // Delete from database
      console.log('Attempting to delete from database');
      const { error: dbError } = await supabase
        .from('deal_documents')
        .delete()
        .eq('id', fileId);

      if (dbError) {
        console.error('Database deletion error:', dbError);
        throw new Error(`Database deletion failed: ${dbError.message}`);
      }

      console.log('Successfully deleted from database');
      return { success: true, fileName: fileInfo.document_name };
    } catch (error) {
      console.error('File deletion failed:', error);
      throw error instanceof Error ? error : new Error('Delete failed');
    }
  },

  async getFileUrl(fileId: string) {
    try {
      // Get file info
      const { data: fileInfo, error: fetchError } = await supabase
        .from('deal_documents')
        .select('file_path, document_name')
        .eq('id', fileId)
        .single();

      if (fetchError || !fileInfo) {
        throw new Error('File not found');
      }

      // Create signed URL for private file access
      const { data, error } = await supabase.storage
        .from('deal-documents')
        .createSignedUrl(fileInfo.file_path, 3600); // 1 hour expiry

      if (error) {
        throw new Error(`Failed to generate download URL: ${error.message}`);
      }

      return {
        url: data.signedUrl,
        fileName: fileInfo.document_name
      };
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to get file URL');
    }
  },

  async getFileBlob(fileId: string) {
    try {
      console.log('Getting file blob for fileId:', fileId);
      
      // Get file info
      const { data: fileInfo, error: fetchError } = await supabase
        .from('deal_documents')
        .select('file_path, document_name, file_type')
        .eq('id', fileId)
        .single();

      if (fetchError || !fileInfo) {
        console.error('File info fetch error:', fetchError);
        throw new Error('File not found in database');
      }

      console.log('File info retrieved:', fileInfo);
      
      // Check if storage bucket exists and file exists
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      console.log('Available buckets:', buckets, 'Buckets error:', bucketsError);
      
      // Try to list files in the specific path to see if file exists
      const pathParts = fileInfo.file_path.split('/');
      const folder = pathParts.slice(0, -1).join('/');
      console.log('Checking if file exists in folder:', folder);
      
      const { data: files, error: listError } = await supabase.storage
        .from('deal-documents')
        .list(folder || '');
      
      console.log('Files in folder:', files, 'List error:', listError);

      // Download file as blob
      console.log('Attempting to download file from path:', fileInfo.file_path);
      const { data, error } = await supabase.storage
        .from('deal-documents')
        .download(fileInfo.file_path);

      if (error) {
        console.error('Download error details:', error);
        throw new Error(`Failed to download file: ${error.message || JSON.stringify(error)}`);
      }

      console.log('File downloaded successfully, blob size:', data?.size);

      return {
        blob: data,
        fileName: fileInfo.document_name,
        fileType: fileInfo.file_type
      };
    } catch (error) {
      console.error('getFileBlob error:', error);
      throw error instanceof Error ? error : new Error('Failed to get file blob');
    }
  }
};

// Adapter for communications
export const communicationsAdapter = {
  async fetchDealCommunications(dealId: string) {
    const { data, error } = await supabase
      .from('deal_communications')
      .select(`
        *,
        profiles:user_id(full_name, email)
      `)
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data?.map(comm => ({
      ...comm,
      user_name: comm.profiles?.full_name || 'Unknown User',
      user_email: comm.profiles?.email || ''
    }));
  },

  async createCommunication(dealId: string, communicationData: Record<string, any>) {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw new Error(`Authentication failed: ${authError.message}`);
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('deal_communications')
      .insert({
        deal_id: dealId,
        direction: communicationData.direction,
        channel: communicationData.channel,
        subject: communicationData.subject,
        body: communicationData.body,
        from_email: communicationData.from_email,
        to_emails: communicationData.to_emails,
        cc_emails: communicationData.cc_emails,
        phone_number: communicationData.phone_number,
        recording_url: communicationData.recording_url,
        scheduled_at: communicationData.scheduled_at,
        occurred_at: communicationData.occurred_at,
        duration_minutes: communicationData.duration_minutes,
        user_id: user.id,
        contact_id: communicationData.contact_id,
        thread_id: communicationData.thread_id,
        status: communicationData.status || 'active'
      })
      .select(`
        *,
        profiles:user_id(full_name, email)
      `)
      .single();

    if (error) throw error;
    
    return {
      ...data,
      user_name: data.profiles?.full_name || 'Unknown User',
      user_email: data.profiles?.email || ''
    };
  },

  async updateCommunication(communicationId: string, updates: Record<string, any>) {
    const { data, error } = await supabase
      .from('deal_communications')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', communicationId)
      .select(`
        *,
        profiles:user_id(full_name, email)
      `)
      .single();

    if (error) throw error;
    
    return {
      ...data,
      user_name: data.profiles?.full_name || 'Unknown User',
      user_email: data.profiles?.email || ''
    };
  },

  async deleteCommunication(communicationId: string) {
    const { error } = await supabase
      .from('deal_communications')
      .delete()
      .eq('id', communicationId);

    if (error) throw error;
    return true;
  }
};

// Adapter for ASINs
export const asinsAdapter = {
  async fetchDealASINs(dealId: string) {
    const { data, error } = await supabase
      .from('deal_asins')
      .select(`
        *,
        asins(*)
      `)
      .eq('deal_id', dealId);

    if (error) throw error;
    return data;
  },

  async addASINToDeal(dealId: string, asin: string, metrics: Record<string, any>) {
    // First, check if ASIN exists or create it
    let { data: asinData, error: asinError } = await supabase
      .from('asins')
      .select('*')
      .eq('asin', asin)
      .single();

    if (asinError && asinError.code === 'PGRST116') {
      // ASIN doesn't exist, create it
      const { data: newAsin, error: createError } = await supabase
        .from('asins')
        .insert({ asin, product_name: metrics.product_name })
        .select()
        .single();

      if (createError) throw createError;
      asinData = newAsin;
    }

    // Link ASIN to deal
    const { data, error } = await supabase
      .from('deal_asins')
      .insert({
        deal_id: dealId,
        asin_id: asinData!.id,
        ...metrics
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Adapter for tasks
export const tasksAdapter = {
  async fetchDealTasks(dealId: string) {
    try {
      const { data, error } = await supabase
        .from('deal_tasks')
        .select('*')
        .eq('deal_id', dealId)
        .order('sort_order', { ascending: true });

      if (error) {
        // If table doesn't exist, return empty array
        if (error.code === 'PGRST106' || error.message?.includes('does not exist')) {
          console.warn('deal_tasks table does not exist yet. Please apply the migration.');
          return [];
        }
        throw error;
      }
      return data || [];
    } catch (error) {
      console.warn('Error fetching tasks:', error);
      return [];
    }
  },

  async createTask(dealId: string, taskData: Record<string, any>) {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw new Error(`Authentication failed: ${authError.message}`);
      if (!user) throw new Error('User not authenticated');

      // Get the highest sort_order for the status column
      const { data: maxSortData } = await supabase
        .from('deal_tasks')
        .select('sort_order')
        .eq('deal_id', dealId)
        .eq('status', taskData.status || 'todo')
        .order('sort_order', { ascending: false })
        .limit(1);

      const maxSort = maxSortData?.[0]?.sort_order || 0;

      const { data, error } = await supabase
        .from('deal_tasks')
        .insert({
          deal_id: dealId,
          title: taskData.title,
          description: taskData.description,
          status: taskData.status || 'todo',
          priority: taskData.priority || 'medium',
          assigned_to: taskData.assigned_to,
          due_date: taskData.due_date,
          created_by: user.id,
          sort_order: maxSort + 1
        })
        .select('*')
        .single();

      if (error) {
        if (error.code === 'PGRST106' || error.message?.includes('does not exist')) {
          throw new Error('Tasks table not created yet. Please apply the database migration first.');
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },

  async updateTask(taskId: string, updates: Record<string, any>) {
    try {
      const { data, error } = await supabase
        .from('deal_tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select('*')
        .single();

      if (error) {
        if (error.code === 'PGRST106' || error.message?.includes('does not exist')) {
          throw new Error('Tasks table not created yet. Please apply the database migration first.');
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  async updateTaskStatus(taskId: string, newStatus: string, newSortOrder?: number) {
    const updates: Record<string, any> = { status: newStatus };
    
    if (newSortOrder !== undefined) {
      updates.sort_order = newSortOrder;
    }

    return this.updateTask(taskId, updates);
  },

  async reorderTasks(dealId: string, status: string, taskIds: string[]) {
    // Update sort_order for all tasks in the column
    const updates = taskIds.map((taskId, index) => ({
      id: taskId,
      sort_order: index
    }));

    const promises = updates.map(update =>
      supabase
        .from('deal_tasks')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id)
        .eq('deal_id', dealId)
        .eq('status', status)
    );

    const results = await Promise.all(promises);
    const errors = results.filter(result => result.error);
    
    if (errors.length > 0) {
      throw new Error(`Failed to reorder tasks: ${errors[0].error?.message}`);
    }

    return true;
  },

  async deleteTask(taskId: string) {
    const { error } = await supabase
      .from('deal_tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
    return true;
  },

  async getTaskCountsByStatus(dealId: string) {
    const { data, error } = await supabase
      .from('deal_tasks')
      .select('status')
      .eq('deal_id', dealId);

    if (error) throw error;

    const counts = { todo: 0, doing: 0, done: 0 };
    data?.forEach(task => {
      if (task.status in counts) {
        counts[task.status as keyof typeof counts]++;
      }
    });

    return counts;
  }
};

// Export all adapters
export const dbAdapter = {
  deals: dealsAdapter,
  files: filesAdapter,
  communications: communicationsAdapter,
  asins: asinsAdapter,
  tasks: tasksAdapter
};