/**
 * Database Adapter
 * Maps between mosaic-react expected structure and existing database structure
 */

import { supabase } from './supabase';
import { encodeFilePath } from '../utils/fileUtils';
import { getBusinessImage } from '../utils/imageUtils';

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

// Format listing source names for display
export const formatListingSource = (source: string): string => {
  const sourceMap: { [key: string]: string } = {
    'empire_flippers': 'Empire Flippers',
    'empire-flippers': 'Empire Flippers',
    'flippa': 'Flippa',
    'quietlight': 'Quiet Light',
    'quiet_light': 'Quiet Light',
    'quietlightbrokerage': 'Quiet Light',
    'fe_international': 'FE International',
    'fe-international': 'FE International',
    'feinternational': 'FE International',
    'investors_club': 'Investors Club',
    'investors-club': 'Investors Club',
    'investorsclub': 'Investors Club',
    'website_closers': 'Website Closers',
    'website-closers': 'Website Closers',
    'microacquire': 'MicroAcquire',
    'acquire.com': 'Acquire.com',
    'bizbuysell': 'BizBuySell'
  };
  return sourceMap[source?.toLowerCase()] || source || 'Unknown';
};

// Adapter functions to work with existing database structure
export const dealsAdapter = {
  // Fetch deals with proper mapping
  async fetchDeals() {
    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        listing:business_listings(
          original_url,
          source
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map the data to match mosaic-react expectations
    return data?.map((deal: any) => ({
      ...deal,
      status: mapDealStatus(deal.stage || 'prospecting'),
      // Add any other field mappings needed
      valuation_multiple: deal.multiple,
      monthly_revenue: deal.custom_fields?.monthly_revenue || (deal.annual_revenue ? deal.annual_revenue / 12 : null),
      monthly_profit: deal.custom_fields?.monthly_profit || (deal.annual_profit ? deal.annual_profit / 12 : null),
      // Extract custom fields
      ...deal.custom_fields,
      // Map opportunity_score to priority for frontend compatibility
      priority: deal.opportunity_score || deal.priority,
      // Ensure specific fields are available
      seller_name: deal.seller_name || 'Unknown',
      seller_email: deal.seller_email || '',
      seller_phone: deal.seller_phone || '',
      fba_percentage: deal.fba_percentage || 0,
      first_contact_date: deal.created_at,
      due_diligence_start_date: deal.stage === 'due_diligence' ? deal.stage_updated_at : null,
      expected_close_date: deal.next_action_date,
      notes: deal.custom_fields?.notes || '',
      // Add placeholder image if none exists
      image_url: deal.custom_fields?.image_url || getBusinessImage(deal.business_name),
      // Add listing information
      listing_url: deal.custom_fields?.listing_url || deal.listing?.original_url || '',
      listing_source: formatListingSource(deal.listing?.source || deal.source || 'Unknown')
    }));
  },

  // Fetch a single deal by ID
  async fetchDealById(dealId: string) {
    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        listing:business_listings(
          original_url,
          source
        )
      `)
      .eq('id', dealId)
      .single();

    if (error) throw error;

    if (!data) return null;

    // Map the data to match mosaic-react expectations
    const dealData = data as any;
    const mappedDeal = {
      ...dealData,
      status: mapDealStatus(dealData.stage || 'prospecting'),
      // Add any other field mappings needed
      valuation_multiple: dealData.multiple,
      monthly_revenue: dealData.custom_fields?.monthly_revenue || (dealData.annual_revenue ? dealData.annual_revenue / 12 : null),
      monthly_profit: dealData.custom_fields?.monthly_profit || (dealData.annual_profit ? dealData.annual_profit / 12 : null),
      // Extract custom fields
      ...dealData.custom_fields,
      // Map opportunity_score to priority for frontend compatibility
      priority: dealData.opportunity_score || dealData.priority,
      // Ensure specific fields are available
      seller_name: dealData.seller_name || 'Unknown',
      seller_email: dealData.seller_email || '',
      seller_phone: dealData.seller_phone || '',
      fba_percentage: dealData.fba_percentage || 0,
      first_contact_date: dealData.created_at,
      due_diligence_start_date: dealData.stage === 'due_diligence' ? dealData.stage_updated_at : null,
      expected_close_date: dealData.next_action_date,
      notes: dealData.custom_fields?.notes || '',
      // Add placeholder image if none exists
      image_url: dealData.custom_fields?.image_url || getBusinessImage(dealData.business_name),
      // Add listing information
      listing_url: dealData.custom_fields?.listing_url || dealData.listing?.original_url || '',
      listing_source: dealData.listing?.source || dealData.source || 'Unknown'
    };

    return mappedDeal;
  },

  // Create a new deal
  async createDeal(dealData: Record<string, any>) {
    const mappedData: Record<string, any> = {};
    
    // Fields that exist as actual columns in the deals table
    const directMappedFields = [
      'business_name',
      'asking_price',
      'annual_revenue',
      'annual_profit',
      'amazon_category',
      'amazon_subcategory',
      'amazon_store_name',
      'amazon_store_url',
      'business_age',
      'date_listed',
      'dba_names',
      'ebitda',
      'employee_count',
      'entity_type',
      'fba_percentage',
      'inventory_value',
      'list_price',
      'listing_id',
      'multiple',
      'sde',
      'seller_account_health',
      'seller_email',
      'seller_location',
      'seller_name',
      'seller_phone',
    ];

    // Fields that need to go into custom_fields
    const customFields = [
      'monthly_revenue',
      'monthly_profit',
      'image_url',
      'notes',
      'description',
      'listing_url',
      'website_url',
      'city',
      'state',
      'country',
      'industry',
      'sub_industry',
      'niche_keywords',
      'broker_name',
      'broker_email',
      'broker_phone',
      'broker_company',
      'brand_names',
      'tags',
      'monthly_sessions',
      'conversion_rate'
    ];
    
    // Map frontend fields to database fields
    Object.keys(dealData).forEach(key => {
      const value = dealData[key];
      
      // Skip null, undefined, or empty string values for non-required fields
      if (value === null || value === undefined || value === '') {
        return;
      }
      
      // Handle special field mappings
      if (key === 'status') {
        mappedData.stage = mapDealStatus(dealData.status);
      } else if (key === 'valuation_multiple') {
        mappedData.multiple = value;
      } else if (key === 'priority') {
        // Map priority to opportunity_score
        mappedData.opportunity_score = value;
      } else if (key === 'description') {
        mappedData.business_description = value;
      } else if (directMappedFields.includes(key)) {
        // Direct mapping for fields that exist as columns
        mappedData[key] = value;
      } else if (customFields.includes(key)) {
        // Store in custom_fields
        if (!mappedData.custom_fields) mappedData.custom_fields = {};
        mappedData.custom_fields[key] = value;
      } else if (key === 'source' || key === 'user_id') {
        // These are valid fields, map them directly
        mappedData[key] = value;
      } else {
        // Skip unknown fields to prevent database errors
        console.log(`Skipping field '${key}' - not in database schema`);
      }
    });

    // Set the user_id if not already set
    if (!mappedData.user_id) {
      const { data: userData } = await supabase.auth.getUser();
      mappedData.user_id = userData.user?.id || mappedData.created_by;
    }

    // Ensure required fields have default values
    if (!mappedData.business_name) {
      throw new Error('Business name is required');
    }

    // Set default stage if not provided
    if (!mappedData.stage) {
      mappedData.stage = 'prospecting';
    }

    console.log('Creating deal with data:', mappedData);

    const { data, error } = await supabase
      .from('deals')
      .insert(mappedData as any)
      .select()
      .single();

    if (error) {
      console.error('Database error creating deal:', error);
      throw error;
    }
    
    return data;
  },

  // Update a deal
  async updateDeal(dealId: string, updates: Record<string, any>) {
    const mappedUpdates: Record<string, any> = {};
    let needsCustomFieldsUpdate = false;
    const customFieldsUpdates: Record<string, any> = {};
    
    // Fields that exist as actual columns in the deals table
    const directMappedFields = [
      'business_name',
      'asking_price',
      'annual_revenue',
      'annual_profit',
      'amazon_category',
      'amazon_subcategory',
      'amazon_store_name',
      'amazon_store_url',
      'business_age',
      'date_listed',
      'dba_names',
      'ebitda',
      'employee_count',
      'entity_type',
      'fba_percentage',
      'inventory_value',
      'list_price',
      'listing_id',
      'multiple',
      'sde',
      'seller_account_health',
      'seller_email',
      'seller_location',
      'seller_name',
      'seller_phone',
    ];

    // Fields that need to go into custom_fields
    const customFields = [
      'monthly_revenue',
      'monthly_profit',
      'image_url',
      'notes',
      'listing_url',
      'website_url',
      'city',
      'state',
      'country',
      'industry',
      'sub_industry',
      'niche_keywords',
      'broker_name',
      'broker_email',
      'broker_phone',
      'broker_company',
      'brand_names',
      'tags',
      'monthly_sessions',
      'conversion_rate',
      'opportunity_score'
    ];
    
    // Map frontend fields to database fields
    Object.keys(updates).forEach(key => {
      const value = updates[key];
      
      // Handle special field mappings
      if (key === 'status') {
        mappedUpdates.stage = mapDealStatus(value);
      } else if (key === 'valuation_multiple') {
        mappedUpdates.multiple = value;
      } else if (key === 'priority') {
        // Map priority to opportunity_score in custom_fields for now
        customFieldsUpdates.opportunity_score = value;
        needsCustomFieldsUpdate = true;
      } else if (key === 'description') {
        mappedUpdates.business_description = value;
      } else if (directMappedFields.includes(key)) {
        // Direct mapping for fields that exist as columns
        mappedUpdates[key] = value;
      } else if (customFields.includes(key)) {
        // Store in custom_fields
        customFieldsUpdates[key] = value;
        needsCustomFieldsUpdate = true;
      } else {
        console.log(`Skipping field '${key}' in update - not in database schema`);
      }
    });

    // Handle custom_fields update if needed
    if (needsCustomFieldsUpdate) {
      const { data: existingDeal } = await supabase.from('deals').select('*').eq('id', dealId).single();
      const existingCustomFields = (existingDeal as any)?.custom_fields || {};
      mappedUpdates.custom_fields = { ...existingCustomFields, ...customFieldsUpdates };
    }

    // Remove undefined values
    Object.keys(mappedUpdates).forEach(key => 
      mappedUpdates[key] === undefined && delete mappedUpdates[key]
    );

    // Always update the updated_at timestamp
    mappedUpdates.updated_at = new Date().toISOString();

    console.log('Updating deal with data:', mappedUpdates);

    const { data, error } = await supabase
      .from('deals')
      .update(mappedUpdates)
      .eq('id', dealId)
      .select()
      .single();

    if (error) {
      console.error('Database error updating deal:', error);
      throw error;
    }
    
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
    const allFiles = (data || []).map((doc: any) => ({
      id: doc.id,
      file_name: doc.file_name || doc.document_name,
      file_path: doc.file_path,
      category: doc.category,
      uploaded_at: doc.uploaded_at,
      file_size: doc.file_size,
      file_type: doc.mime_type,
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

      // Create FormData for server upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dealId', dealId);
      formData.append('fileName', fileName);
      formData.append('metadata', JSON.stringify(metadata));

      // Upload via server endpoint to handle storage permissions
      console.log('Uploading file via server...');
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${errorText}`);
      }

      const uploadResult = await response.json();
      console.log('Server upload result:', uploadResult);

      if (!uploadResult.success) {
        throw new Error(`File upload failed: ${uploadResult.error}`);
      }

      console.log('File uploaded successfully via server:', uploadResult);
      
      // Server already handles database insertion, so just return the result
      return {
        id: uploadResult.fileId,
        deal_id: dealId,
        file_name: file.name,
        file_path: uploadResult.filePath || fileName,
        file_size: file.size,
        mime_type: file.type,
        category: metadata.category || 'general',
        uploaded_by: user.id,
        created_at: new Date().toISOString()
      };
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
        .select('file_path, file_name, deal_id, uploaded_by')
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
        
        // URL encode the file path to handle special characters and spaces
        const encodedFilePath = encodeFilePath(fileInfo.file_path);
        
        const { error: storageError } = await supabase.storage
          .from('deal-documents')
          .remove([encodedFilePath]);

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
      return { success: true, fileName: fileInfo.file_name };
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
        .select('file_path, file_name')
        .eq('id', fileId)
        .single();

      if (fetchError || !fileInfo) {
        throw new Error('File not found');
      }

      // URL encode the file path to handle special characters and spaces
      const encodedFilePath = encodeFilePath(fileInfo.file_path);

      // Create signed URL for private file access
      const { data, error } = await supabase.storage
        .from('deal-documents')
        .createSignedUrl(encodedFilePath, 3600); // 1 hour expiry

      if (error) {
        throw new Error(`Failed to generate download URL: ${error.message}`);
      }

      return {
        url: data.signedUrl,
        fileName: fileInfo.file_name
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
        .select('file_name, mime_type')
        .eq('id', fileId)
        .single();

      if (fetchError || !fileInfo) {
        console.error('File info fetch error:', fetchError);
        throw new Error('File not found in database');
      }

      console.log('File info retrieved:', fileInfo);
      
      // Download file from server endpoint
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/files/download/${fileId}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to download file: ${errorText}`);
      }

      const blob = await response.blob();
      console.log('File downloaded successfully, blob size:', blob.size);

      return {
        blob: blob,
        fileName: fileInfo.file_name,
        fileType: fileInfo.mime_type
      };
    } catch (error) {
      console.error('getFileBlob error:', error);
      throw error instanceof Error ? error : new Error('Failed to get file blob');
    }
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
        .order('created_at', { ascending: true });

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

      // Set a default order
      // const maxSort = 0;

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
          created_at: new Date().toISOString()
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

  async updateTaskStatus(taskId: string, newStatus: string) {
    const updates: Record<string, any> = { status: newStatus };
    return this.updateTask(taskId, updates);
  },

  async reorderTasks(_dealId: string, _status: string, _taskIds: string[]) {
    // For now, just return true as reordering is not implemented without sort_order
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
  asins: asinsAdapter,
  tasks: tasksAdapter
};