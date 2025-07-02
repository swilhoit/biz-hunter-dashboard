/**
 * Database Adapter
 * Maps between mosaic-react expected structure and existing database structure
 */

import { supabase } from './supabase';

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
      .select(`
        *,
        deal_documents(count),
        deal_communications(count),
        deal_notes(count)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map the data to match mosaic-react expectations
    return data?.map(deal => ({
      ...deal,
      status: mapDealStatus(deal.stage || 'prospecting'),
      document_count: deal.deal_documents?.[0]?.count || 0,
      communication_count: deal.deal_communications?.[0]?.count || 0,
      note_count: deal.deal_notes?.[0]?.count || 0,
      // Add any other field mappings needed
      valuation_multiple: deal.multiple,
      monthly_revenue: deal.monthly_revenue || (deal.annual_revenue ? deal.annual_revenue / 12 : null),
      monthly_profit: deal.monthly_profit || (deal.annual_profit ? deal.annual_profit / 12 : null)
    }));
  },

  // Create a new deal
  async createDeal(dealData: any) {
    const { data, error } = await supabase
      .from('deals')
      .insert({
        ...dealData,
        stage: mapDealStatus(dealData.status),
        multiple: dealData.valuation_multiple,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update a deal
  async updateDeal(dealId: string, updates: any) {
    const mappedUpdates = {
      ...updates,
      stage: updates.status ? mapDealStatus(updates.status) : undefined,
      multiple: updates.valuation_multiple
    };

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
  }
};

// Adapter for documents/files
export const filesAdapter = {
  async fetchDealFiles(dealId: string) {
    // Fetch from both deal_documents and files tables
    const [docsResult, filesResult] = await Promise.all([
      supabase
        .from('deal_documents')
        .select('*')
        .eq('deal_id', dealId),
      supabase
        .from('files')
        .select('*')
        .eq('deal_id', dealId)
    ]);

    if (docsResult.error) throw docsResult.error;
    if (filesResult.error) throw filesResult.error;

    // Combine and map the results
    const allFiles = [
      ...(docsResult.data || []).map(doc => ({
        id: doc.id,
        file_name: doc.document_name,
        file_path: doc.file_url,
        category: doc.document_type,
        uploaded_at: doc.uploaded_at,
        created_at: doc.created_at
      })),
      ...(filesResult.data || [])
    ];

    return allFiles;
  },

  async uploadFile(dealId: string, file: File, metadata: any) {
    const fileName = `${dealId}/${Date.now()}-${file.name}`;
    
    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('deal-documents')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Save file metadata
    const { data, error } = await supabase
      .from('files')
      .insert({
        deal_id: dealId,
        file_name: file.name,
        file_path: fileName,
        file_size: file.size,
        file_type: file.type,
        category: metadata.category,
        description: metadata.description,
        user_id: (await supabase.auth.getUser()).data.user?.id
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