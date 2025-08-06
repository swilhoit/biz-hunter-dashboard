import { supabase } from '../lib/supabase';

interface DataForSEOConfig {
  apiKey: string;
  baseUrl: string;
  username: string;
  password: string;
}

interface ProductSearchRequest {
  keyword: string;
  location_code: number;
  language_code: string;
  priority: 'standard' | 'high';
}

interface ProductSearchResponse {
  version: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  tasks_count: number;
  tasks_error: number;
  tasks: Array<{
    id: string;
    status_code: number;
    status_message: string;
    time: string;
    cost: number;
    result_count: number;
    path: string[];
    data: {
      api: string;
      function: string;
      se: string;
      se_type: string;
      language_code: string;
      location_code: number;
      keyword: string;
      priority: number;
    };
    result: Array<{
      keyword: string;
      location_code: number;
      language_code: string;
      check_url: string;
      datetime: string;
      spell: any;
      refinement_chips: any;
      item_types: string[];
      se_results_count: number;
      items_count: number;
      items: Array<{
        type: string;
        rank_group: number;
        rank_absolute: number;
        position: string;
        xpath: string;
        domain: string;
        title: string;
        url: string;
        breadcrumb: string;
        is_best_seller: boolean;
        is_amazon_choice: boolean;
        rating: {
          rating_type: string;
          value: number;
          votes_count: number;
          rating_max: number;
        };
        price: {
          current: number;
          regular: number;
          max_value: number;
          currency: string;
          is_price_range: boolean;
          displayed_price: string;
        };
        delivery: {
          price: number;
          currency: string;
        };
        special_offers: any[];
        asin: string;
        image_url: string;
        is_newer_model_available: boolean;
        newer_model: any;
        bsr: number;
        main_category: string;
        sub_category: string;
      }>;
    }>;
  }>;
}

interface SellerSearchRequest {
  asin: string;
  location_code: number;
  language_code: string;
}

interface SellerSearchResponse {
  version: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  tasks_count: number;
  tasks_error: number;
  tasks: Array<{
    id: string;
    status_code: number;
    status_message: string;
    time: string;
    cost: number;
    result_count: number;
    path: string[];
    data: {
      api: string;
      function: string;
      se: string;
      se_type: string;
      language_code: string;
      location_code: number;
      asin: string;
      priority: number;
    };
    result: Array<{
      asin: string;
      location_code: number;
      language_code: string;
      check_url: string;
      datetime: string;
      items_count: number;
      items: Array<{
        type: string;
        seller_name: string;
        seller_url: string;
        seller_rating: number;
        seller_rating_count: number;
        price: {
          current: number;
          currency: string;
          displayed_price: string;
        };
        delivery: {
          price: number;
          currency: string;
        };
        condition: string;
        condition_description: string;
        is_prime: boolean;
        is_amazon_seller: boolean;
        is_buy_box_winner: boolean;
      }>;
    }>;
  }>;
}

interface StorefrontParseRequest {
  target_url: string;
}

interface StorefrontParseResponse {
  version: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  tasks_count: number;
  tasks_error: number;
  tasks: Array<{
    id: string;
    status_code: number;
    status_message: string;
    time: string;
    cost: number;
    result_count: number;
    path: string[];
    data: {
      api: string;
      function: string;
      target_url: string;
    };
    result: Array<{
      crawl_progress: string;
      crawl_status: {
        max_crawl_pages: number;
        pages_in_queue: number;
        pages_crawled: number;
      };
      items_count: number;
      items: Array<{
        type: string;
        page_content: {
          header: any;
          main_content: {
            blocks: Array<{
              type: string;
              text: string;
              link: any;
            }>;
          };
          footer: any;
        };
        meta: {
          title: string;
          description: string;
          keywords: string;
          canonical: string;
          internal_links_count: number;
          external_links_count: number;
          inbound_links_count: number;
          images_count: number;
          images_size: number;
          scripts_count: number;
          scripts_size: number;
          stylesheets_count: number;
          stylesheets_size: number;
          page_size: number;
          rendered_page_size: number;
          duplicate_title_count: number;
          duplicate_description_count: number;
          duplicate_content_count: number;
          last_modified_time: string;
          load_time: number;
          redirect_count: number;
          status_code: number;
          status_message: string;
        };
        page_timing: {
          time_to_interactive: number;
          dom_complete: number;
          connection_time: number;
          time_to_secure_connection: number;
          request_sent_time: number;
          waiting_time: number;
          download_time: number;
          duration_time: number;
        };
        onpage_score: number;
        total_dom_size: number;
        custom_js_response: any;
        broken_resources: boolean;
        broken_links: boolean;
        duplicate_content: boolean;
        spell_check: any;
        social_media_tags: any;
        meta_keywords_count: number;
        plaintext_size: number;
        plaintext_word_count: number;
        automated_readability_index: number;
        coleman_liau_readability_index: number;
        dale_chall_readability_index: number;
        flesch_kincaid_readability_index: number;
        gunning_fog_readability_index: number;
        smog_readability_index: number;
        content_structure: any;
        spell_check_results: any;
        social_media_tags_results: any;
        pages: Array<{
          resource_type: string;
          resource_status_code: number;
          resource_errors: any;
          url: string;
          size: number;
          encoded_size: number;
          total_transfer_size: number;
          fetch_time: string;
          cache_control: any;
          checks: any;
          content_encoding: string;
          media_type: string;
          server: string;
          is_resource: boolean;
        }>;
        emails: string[];
        phone_numbers: string[];
        external_domains: string[];
      }>;
    }>;
  }>;
}

class DataForSEOService {
  private config: DataForSEOConfig;

  constructor() {
    this.config = {
      apiKey: import.meta.env.VITE_DATAFORSEO_API_KEY || '',
      baseUrl: 'https://api.dataforseo.com',
      username: import.meta.env.VITE_DATAFORSEO_USERNAME || '',
      password: import.meta.env.VITE_DATAFORSEO_PASSWORD || ''
    };
  }

  async makeRequest(endpoint: string, data: any): Promise<any> {
    const credentials = btoa(`${this.config.username}:${this.config.password}`);
    
    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify([data])
    });

    if (!response.ok) {
      throw new Error(`DataForSEO API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private async createCrawlJob(jobType: string, data: any): Promise<string> {
    const { data: job, error } = await supabase
      .from('crawl_jobs')
      .insert({
        job_type: jobType,
        status: 'pending',
        ...data
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create crawl job: ${error.message}`);
    }

    return job.id;
  }

  private async updateCrawlJob(jobId: string, updates: any): Promise<void> {
    const { error } = await supabase
      .from('crawl_jobs')
      .update(updates)
      .eq('id', jobId);

    if (error) {
      throw new Error(`Failed to update crawl job: ${error.message}`);
    }
  }

  // 1. Crawl niche once → build asins table
  async crawlProductsByKeyword(keyword: string, locationCode: number = 2840): Promise<void> {
    const jobId = await this.createCrawlJob('product_search', { keyword });

    try {
      await this.updateCrawlJob(jobId, { status: 'running', started_at: new Date().toISOString() });

      const request: ProductSearchRequest = {
        keyword,
        location_code: locationCode,
        language_code: 'en_US',
        priority: 'standard'
      };

      const response: ProductSearchResponse = await this.makeRequest('/v3/merchant/amazon/products/task_post', request);

      if (response.status_code !== 20000) {
        throw new Error(`DataForSEO API error: ${response.status_message}`);
      }

      const task = response.tasks[0];
      if (!task.result || task.result.length === 0) {
        throw new Error('No results returned from DataForSEO');
      }

      const items = task.result[0].items;
      const asinsToInsert = items.map(item => ({
        asin: item.asin,
        category: item.main_category,
        price: item.price?.current || 0,
        bsr: item.bsr,
        crawl_dt: new Date().toISOString(),
        next_bsr_refresh: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      }));

      // Insert ASINs into database
      const { error: insertError } = await supabase
        .from('asins')
        .upsert(asinsToInsert, { onConflict: 'asin' });

      if (insertError) {
        throw new Error(`Failed to insert ASINs: ${insertError.message}`);
      }

      await this.updateCrawlJob(jobId, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        cost_credits: task.cost,
        response_data: { items_count: items.length }
      });

    } catch (error) {
      await this.updateCrawlJob(jobId, {
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // 2. Look up sellers only for top20
  async lookupSellersForASIN(asin: string): Promise<void> {
    const jobId = await this.createCrawlJob('seller_lookup', { asin });

    try {
      await this.updateCrawlJob(jobId, { status: 'running', started_at: new Date().toISOString() });

      const request: SellerSearchRequest = {
        asin,
        location_code: 2840,
        language_code: 'en_US'
      };

      const response: SellerSearchResponse = await this.makeRequest('/v3/merchant/amazon/sellers/task_post', request);

      if (response.status_code !== 20000) {
        throw new Error(`DataForSEO API error: ${response.status_message}`);
      }

      const task = response.tasks[0];
      if (!task.result || task.result.length === 0) {
        throw new Error('No results returned from DataForSEO');
      }

      const items = task.result[0].items;
      
      // Get ASIN ID from database
      const { data: asinData } = await supabase
        .from('asins')
        .select('id')
        .eq('asin', asin)
        .single();

      if (!asinData) {
        throw new Error(`ASIN ${asin} not found in database`);
      }

      // Process each seller
      for (const item of items) {
        if (item.is_amazon_seller) continue; // Skip Amazon as seller

        // Check if seller URL already exists (deduplication)
        const isDuplicate = await this.isSellerUrlDuplicate(item.seller_url);
        
        let sellerId: string;
        
        if (isDuplicate) {
          // Get existing seller ID
          const { data: existingSeller } = await supabase
            .from('sellers')
            .select('id')
            .eq('seller_url', item.seller_url)
            .single();
          
          sellerId = existingSeller!.id;
        } else {
          // Create new seller
          const { data: newSeller, error: sellerError } = await supabase
            .from('sellers')
            .insert({
              seller_name: item.seller_name,
              seller_url: item.seller_url,
              avg_rating: item.seller_rating,
              listings_count: 1 // Will be updated by trigger
            })
            .select()
            .single();

          if (sellerError) {
            throw new Error(`Failed to insert seller: ${sellerError.message}`);
          }

          sellerId = newSeller.id;
        }

        // Create asin_sellers relationship
        await supabase
          .from('asin_sellers')
          .upsert({
            asin_id: asinData.id,
            seller_id: sellerId,
            is_primary_seller: item.is_buy_box_winner
          }, { onConflict: 'asin_id,seller_id' });
      }

      await this.updateCrawlJob(jobId, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        cost_credits: task.cost,
        response_data: { sellers_count: items.length }
      });

    } catch (error) {
      await this.updateCrawlJob(jobId, {
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // 3. Parse storefronts for contact extraction
  async parseStorefront(sellerUrl: string): Promise<void> {
    const jobId = await this.createCrawlJob('storefront_parse', { target_url: sellerUrl });

    try {
      await this.updateCrawlJob(jobId, { status: 'running', started_at: new Date().toISOString() });

      const request: StorefrontParseRequest = {
        target_url: sellerUrl
      };

      const response: StorefrontParseResponse = await this.makeRequest('/v3/on_page/content_parsing/live', request);

      if (response.status_code !== 20000) {
        throw new Error(`DataForSEO API error: ${response.status_message}`);
      }

      const task = response.tasks[0];
      if (!task.result || task.result.length === 0) {
        throw new Error('No results returned from DataForSEO');
      }

      const result = task.result[0];
      const item = result.items[0];

      // Get seller ID
      const { data: sellerData } = await supabase
        .from('sellers')
        .select('id')
        .eq('seller_url', sellerUrl)
        .single();

      if (!sellerData) {
        throw new Error(`Seller with URL ${sellerUrl} not found in database`);
      }

      // Extract contact information
      const contacts = [];
      
      // Add emails
      if (item.emails && item.emails.length > 0) {
        for (const email of item.emails) {
          contacts.push({
            seller_id: sellerData.id,
            contact_type: 'email',
            contact_value: email,
            source: 'storefront'
          });
        }
      }

      // Add phone numbers
      if (item.phone_numbers && item.phone_numbers.length > 0) {
        for (const phone of item.phone_numbers) {
          contacts.push({
            seller_id: sellerData.id,
            contact_type: 'phone',
            contact_value: phone,
            source: 'storefront'
          });
        }
      }

      // Add external domains
      if (item.external_domains && item.external_domains.length > 0) {
        for (const domain of item.external_domains) {
          contacts.push({
            seller_id: sellerData.id,
            contact_type: 'domain',
            contact_value: domain,
            source: 'storefront'
          });
        }
      }

      // Insert contacts
      if (contacts.length > 0) {
        const { error: contactsError } = await supabase
          .from('seller_contacts')
          .upsert(contacts, { onConflict: 'seller_id,contact_type,contact_value' });

        if (contactsError) {
          throw new Error(`Failed to insert contacts: ${contactsError.message}`);
        }
      }

      // Insert storefront data
      await supabase
        .from('seller_storefronts')
        .upsert({
          seller_id: sellerData.id,
          external_domains: item.external_domains || [],
          business_info: {
            title: item.meta?.title,
            description: item.meta?.description,
            keywords: item.meta?.keywords
          }
        }, { onConflict: 'seller_id' });

      // Mark seller as parsed
      await supabase
        .from('sellers')
        .update({ storefront_parsed: true })
        .eq('id', sellerData.id);

      await this.updateCrawlJob(jobId, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        cost_credits: task.cost,
        response_data: { contacts_found: contacts.length }
      });

    } catch (error) {
      await this.updateCrawlJob(jobId, {
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Helper method to check if seller URL is duplicate
  private async isSellerUrlDuplicate(sellerUrl: string): Promise<boolean> {
    const { data } = await supabase
      .from('sellers')
      .select('id')
      .eq('seller_url', sellerUrl)
      .single();

    return data !== null;
  }

  // Batch process top 20% ASINs for seller lookup
  async processBatchSellerLookup(batchSize: number = 100): Promise<void> {
    const { data: topASINs } = await supabase
      .from('asins')
      .select('asin')
      .eq('is_top_20_percent', true)
      .limit(batchSize);

    if (!topASINs || topASINs.length === 0) {
      return;
    }

    // Process in batches to stay within API limits
    for (let i = 0; i < topASINs.length; i += 10) {
      const batch = topASINs.slice(i, i + 10);
      const promises = batch.map(({ asin }) => this.lookupSellersForASIN(asin));
      
      await Promise.allSettled(promises);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Batch process storefronts for unparsed sellers
  async processBatchStorefrontParsing(batchSize: number = 50): Promise<void> {
    const { data: unparsedSellers } = await supabase
      .from('sellers')
      .select('seller_url')
      .eq('storefront_parsed', false)
      .limit(batchSize);

    if (!unparsedSellers || unparsedSellers.length === 0) {
      return;
    }

    // Process in smaller batches to manage costs
    for (let i = 0; i < unparsedSellers.length; i += 5) {
      const batch = unparsedSellers.slice(i, i + 5);
      const promises = batch.map(({ seller_url }) => this.parseStorefront(seller_url));
      
      await Promise.allSettled(promises);
      
      // Longer delay between batches for storefront parsing
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Get cost summary for all crawl jobs
  async getCostSummary(): Promise<any> {
    const { data } = await supabase
      .from('crawl_job_summary')
      .select('*');

    return data;
  }

  // Fetch single product by ASIN for image retrieval
  async fetchProductByASIN(asin: string): Promise<{ image_url?: string } | null> {
    try {
      const request = {
        keyword: asin,
        location_code: 2840, // US
        language_code: 'en_US',
        priority: 'standard'
      };

      const response: ProductSearchResponse = await this.makeRequest('/v3/merchant/amazon/products/task_post', request);

      if (response.status_code !== 20000) {
        throw new Error(`DataForSEO API error: ${response.status_message}`);
      }

      const task = response.tasks[0];
      if (!task.result || task.result.length === 0) {
        return null;
      }

      const items = task.result[0].items;
      
      // Find the matching ASIN in the results
      const matchingItem = items.find(item => item.asin === asin);
      
      if (matchingItem && matchingItem.image_url) {
        return { image_url: matchingItem.image_url };
      }

      return null;
    } catch (error) {
      console.error('Error fetching product by ASIN:', error);
      return null;
    }
  }

  // Fetch bulk product data for multiple ASINs
  async fetchBulkProductData(asins: string[]): Promise<any[]> {
    try {
      const results: any[] = [];
      
      // Search for each ASIN
      for (const asin of asins) {
        const request = {
          keyword: asin,
          location_code: 2840, // US
          language_code: 'en_US',
          priority: 'standard'
        };

        const response: ProductSearchResponse = await this.makeRequest('/v3/merchant/amazon/products/task_post', request);

        if (response.status_code === 20000 && response.tasks[0].result) {
          const items = response.tasks[0].result[0].items;
          const matchingItem = items.find(item => item.asin === asin);
          
          if (matchingItem) {
            results.push(matchingItem);
          }
        }
      }

      return results;
    } catch (error) {
      console.error('Error fetching bulk product data:', error);
      return [];
    }
  }
}

export default DataForSEOService;