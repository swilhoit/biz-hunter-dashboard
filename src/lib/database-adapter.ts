/**
 * Database Adapter
 * Maps between mosaic-react expected structure and existing database structure
 */

import { supabase } from './supabase';
import { getBusinessImage } from '../utils/imageUtils';

// Map deal status values
export const mapDealStatus = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'prospecting': 'prospecting',
    'qualified_leads': 'initial_contact',
    'first_contact': 'initial_contact',
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
  async createDeal(dealData: any) {
    const mappedData: any = {};
    
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
  async updateDeal(dealId: string, updates: any) {
    const mappedUpdates: any = {};
    let needsCustomFieldsUpdate = false;
    const customFieldsUpdates: any = {};
    
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

  async uploadFile(dealId: string, file: File, metadata: any) {
    const fileName = `${dealId}/${Date.now()}-${file.name}`;
    
    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('deal-documents')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

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
        uploaded_by: (await supabase.auth.getUser()).data.user?.id,
        tags: metadata.tags || [],
        is_confidential: metadata.is_confidential || false,
        metadata: {
          description: metadata.description,
          ...metadata
        }
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Adapter for communications
export const communicationsAdapter = {
  async fetchDealCommunications(dealId: string) {
    const { data, error } = await supabase
      .from('deal_communications')
      .select('*')
      .eq('deal_id', dealId)
      .order('communication_date', { ascending: false });

    if (error) throw error;
    
    return data?.map(comm => ({
      ...comm,
      type: comm.communication_type,
      contact_name: comm.contact_person,
      summary: comm.notes,
      scheduled_at: comm.communication_date,
      completed_at: comm.communication_date
    }));
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

  async addASINToDeal(dealId: string, asin: string, metrics: any) {
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

// Export all adapters
export const dbAdapter = {
  deals: dealsAdapter,
  files: filesAdapter,
  communications: communicationsAdapter,
  asins: asinsAdapter
};