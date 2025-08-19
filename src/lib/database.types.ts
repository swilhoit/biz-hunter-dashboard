export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_analyses: {
        Row: {
          analysis_data: Json
          analysis_type: string
          created_at: string | null
          created_by: string | null
          deal_id: string | null
          id: string
          listing_id: string | null
          model_used: string | null
        }
        Insert: {
          analysis_data: Json
          analysis_type: string
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          id?: string
          listing_id?: string | null
          model_used?: string | null
        }
        Update: {
          analysis_data?: Json
          analysis_type?: string
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          id?: string
          listing_id?: string | null
          model_used?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_analyses_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analyses_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "business_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analyses_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "off_market_sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      asin_history: {
        Row: {
          asin_id: string | null
          created_at: string | null
          current_bsr: number | null
          id: string
          monthly_revenue: number | null
          monthly_units: number | null
          price: number | null
          recorded_at: string | null
          review_count: number | null
          review_rating: number | null
        }
        Insert: {
          asin_id?: string | null
          created_at?: string | null
          current_bsr?: number | null
          id?: string
          monthly_revenue?: number | null
          monthly_units?: number | null
          price?: number | null
          recorded_at?: string | null
          review_count?: number | null
          review_rating?: number | null
        }
        Update: {
          asin_id?: string | null
          created_at?: string | null
          current_bsr?: number | null
          id?: string
          monthly_revenue?: number | null
          monthly_units?: number | null
          price?: number | null
          recorded_at?: string | null
          review_count?: number | null
          review_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "asin_history_asin_id_fkey"
            columns: ["asin_id"]
            isOneToOne: false
            referencedRelation: "asins"
            referencedColumns: ["id"]
          },
        ]
      }
      asin_keywords: {
        Row: {
          asin_id: string | null
          created_at: string | null
          id: string
          keyword: string
          last_updated: string | null
          monthly_trend: number | null
          organic_product_count: number | null
          ppc_bid_broad: number | null
          ppc_bid_exact: number | null
          quarterly_trend: number | null
          rank_organic: number | null
          rank_sponsored: number | null
          relevancy_score: number | null
          search_volume: number | null
          sponsored_product_count: number | null
        }
        Insert: {
          asin_id?: string | null
          created_at?: string | null
          id?: string
          keyword: string
          last_updated?: string | null
          monthly_trend?: number | null
          organic_product_count?: number | null
          ppc_bid_broad?: number | null
          ppc_bid_exact?: number | null
          quarterly_trend?: number | null
          rank_organic?: number | null
          rank_sponsored?: number | null
          relevancy_score?: number | null
          search_volume?: number | null
          sponsored_product_count?: number | null
        }
        Update: {
          asin_id?: string | null
          created_at?: string | null
          id?: string
          keyword?: string
          last_updated?: string | null
          monthly_trend?: number | null
          organic_product_count?: number | null
          ppc_bid_broad?: number | null
          ppc_bid_exact?: number | null
          quarterly_trend?: number | null
          rank_organic?: number | null
          rank_sponsored?: number | null
          relevancy_score?: number | null
          search_volume?: number | null
          sponsored_product_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "asin_keywords_asin_id_fkey"
            columns: ["asin_id"]
            isOneToOne: false
            referencedRelation: "asins"
            referencedColumns: ["id"]
          },
        ]
      }
      asin_recommended_keywords: {
        Row: {
          amazon_search_volume: number | null
          asin_id: string
          created_at: string | null
          estimated_competition: string | null
          generated_at: string | null
          google_competition: number | null
          google_cpc: number | null
          google_search_volume: number | null
          id: string
          junglescout_updated_at: string | null
          keyword: string
          monthly_trend: number | null
          organic_product_count: number | null
          ppc_bid_broad: number | null
          ppc_bid_exact: number | null
          quarterly_trend: number | null
          relevance_reason: string | null
          relevance_score: number | null
          search_intent: string | null
          search_volume: number | null
          sponsored_product_count: number | null
          updated_at: string | null
        }
        Insert: {
          amazon_search_volume?: number | null
          asin_id: string
          created_at?: string | null
          estimated_competition?: string | null
          generated_at?: string | null
          google_competition?: number | null
          google_cpc?: number | null
          google_search_volume?: number | null
          id?: string
          junglescout_updated_at?: string | null
          keyword: string
          monthly_trend?: number | null
          organic_product_count?: number | null
          ppc_bid_broad?: number | null
          ppc_bid_exact?: number | null
          quarterly_trend?: number | null
          relevance_reason?: string | null
          relevance_score?: number | null
          search_intent?: string | null
          search_volume?: number | null
          sponsored_product_count?: number | null
          updated_at?: string | null
        }
        Update: {
          amazon_search_volume?: number | null
          asin_id?: string
          created_at?: string | null
          estimated_competition?: string | null
          generated_at?: string | null
          google_competition?: number | null
          google_cpc?: number | null
          google_search_volume?: number | null
          id?: string
          junglescout_updated_at?: string | null
          keyword?: string
          monthly_trend?: number | null
          organic_product_count?: number | null
          ppc_bid_broad?: number | null
          ppc_bid_exact?: number | null
          quarterly_trend?: number | null
          relevance_reason?: string | null
          relevance_score?: number | null
          search_intent?: string | null
          search_volume?: number | null
          sponsored_product_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asin_recommended_keywords_asin_id_fkey"
            columns: ["asin_id"]
            isOneToOne: false
            referencedRelation: "asins"
            referencedColumns: ["id"]
          },
        ]
      }
      asin_sellers: {
        Row: {
          asin_id: string
          created_at: string | null
          id: string
          is_primary_seller: boolean | null
          seller_id: string
        }
        Insert: {
          asin_id: string
          created_at?: string | null
          id?: string
          is_primary_seller?: boolean | null
          seller_id: string
        }
        Update: {
          asin_id?: string
          created_at?: string | null
          id?: string
          is_primary_seller?: boolean | null
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asin_sellers_asin_id_fkey"
            columns: ["asin_id"]
            isOneToOne: false
            referencedRelation: "asins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asin_sellers_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asin_sellers_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      asins: {
        Row: {
          asin: string
          brand: string | null
          bsr: number | null
          category: string | null
          created_at: string | null
          current_bsr: number | null
          current_price: number | null
          date_first_available: string | null
          est_rev: number | null
          est_units: number | null
          fulfillment: string | null
          id: string
          is_top_20_percent: boolean | null
          last_updated: string | null
          main_image_url: string | null
          monthly_revenue: number | null
          monthly_units: number | null
          price: number | null
          review_count: number | null
          review_rating: number | null
          seller_name: string | null
          subcategory: string | null
          title: string | null
        }
        Insert: {
          asin: string
          brand?: string | null
          bsr?: number | null
          category?: string | null
          created_at?: string | null
          current_bsr?: number | null
          current_price?: number | null
          date_first_available?: string | null
          est_rev?: number | null
          est_units?: number | null
          fulfillment?: string | null
          id?: string
          is_top_20_percent?: boolean | null
          last_updated?: string | null
          main_image_url?: string | null
          monthly_revenue?: number | null
          monthly_units?: number | null
          price?: number | null
          review_count?: number | null
          review_rating?: number | null
          seller_name?: string | null
          subcategory?: string | null
          title?: string | null
        }
        Update: {
          asin?: string
          brand?: string | null
          bsr?: number | null
          category?: string | null
          created_at?: string | null
          current_bsr?: number | null
          current_price?: number | null
          date_first_available?: string | null
          est_rev?: number | null
          est_units?: number | null
          fulfillment?: string | null
          id?: string
          is_top_20_percent?: boolean | null
          last_updated?: string | null
          main_image_url?: string | null
          monthly_revenue?: number | null
          monthly_units?: number | null
          price?: number | null
          review_count?: number | null
          review_rating?: number | null
          seller_name?: string | null
          subcategory?: string | null
          title?: string | null
        }
        Relationships: []
      }
      brand_categories: {
        Row: {
          brand_id: string
          category: string
          created_at: string | null
          id: string
        }
        Insert: {
          brand_id: string
          category: string
          created_at?: string | null
          id?: string
        }
        Update: {
          brand_id?: string
          category?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_categories_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brand_metrics"
            referencedColumns: ["brand_id"]
          },
          {
            foreignKeyName: "brand_categories_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_performance_history: {
        Row: {
          avg_rank: number | null
          brand_id: string
          created_at: string | null
          date: string
          id: string
          total_profit: number | null
          total_revenue: number | null
          total_units_sold: number | null
        }
        Insert: {
          avg_rank?: number | null
          brand_id: string
          created_at?: string | null
          date: string
          id?: string
          total_profit?: number | null
          total_revenue?: number | null
          total_units_sold?: number | null
        }
        Update: {
          avg_rank?: number | null
          brand_id?: string
          created_at?: string | null
          date?: string
          id?: string
          total_profit?: number | null
          total_revenue?: number | null
          total_units_sold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_performance_history_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brand_metrics"
            referencedColumns: ["brand_id"]
          },
          {
            foreignKeyName: "brand_performance_history_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          amazon_store_url: string | null
          avg_profit_margin: number | null
          created_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          total_asins: number | null
          total_monthly_profit: number | null
          total_monthly_revenue: number | null
          total_monthly_units: number | null
          updated_at: string | null
          user_id: string
          website_url: string | null
        }
        Insert: {
          amazon_store_url?: string | null
          avg_profit_margin?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          total_asins?: number | null
          total_monthly_profit?: number | null
          total_monthly_revenue?: number | null
          total_monthly_units?: number | null
          updated_at?: string | null
          user_id: string
          website_url?: string | null
        }
        Update: {
          amazon_store_url?: string | null
          avg_profit_margin?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          total_asins?: number | null
          total_monthly_profit?: number | null
          total_monthly_revenue?: number | null
          total_monthly_units?: number | null
          updated_at?: string | null
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      business_listings: {
        Row: {
          annual_profit: number | null
          annual_revenue: number | null
          asin_count: number | null
          asking_price: number | null
          business_age_months: number | null
          company_website: string | null
          contact_confidence_score: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          duplicate_count: number | null
          duplicate_group_id: string | null
          established_year: number | null
          gross_revenue: number | null
          highlights: string[] | null
          id: string
          image_url: string | null
          industry: string | null
          inventory_value: number | null
          is_active: boolean | null
          is_off_market: boolean | null
          is_primary_listing: boolean | null
          last_verified_at: string | null
          listing_status: string | null
          location: string | null
          monthly_profit: number | null
          monthly_revenue: number | null
          name: string
          net_revenue: number | null
          normalized_name: string | null
          original_url: string | null
          owner_email: string | null
          owner_linkedin: string | null
          owner_name: string | null
          owner_phone: string | null
          owner_title: string | null
          profit_margin: number | null
          profit_multiple: number | null
          revenue_trend: string | null
          scraped_at: string | null
          seller_name: string | null
          similarity_score: number | null
          source: string | null
          status: Database["public"]["Enums"]["listing_status"] | null
          top_asins: Json | null
          updated_at: string | null
          verification_status: string | null
        }
        Insert: {
          annual_profit?: number | null
          annual_revenue?: number | null
          asin_count?: number | null
          asking_price?: number | null
          business_age_months?: number | null
          company_website?: string | null
          contact_confidence_score?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duplicate_count?: number | null
          duplicate_group_id?: string | null
          established_year?: number | null
          gross_revenue?: number | null
          highlights?: string[] | null
          id?: string
          image_url?: string | null
          industry?: string | null
          inventory_value?: number | null
          is_active?: boolean | null
          is_off_market?: boolean | null
          is_primary_listing?: boolean | null
          last_verified_at?: string | null
          listing_status?: string | null
          location?: string | null
          monthly_profit?: number | null
          monthly_revenue?: number | null
          name: string
          net_revenue?: number | null
          normalized_name?: string | null
          original_url?: string | null
          owner_email?: string | null
          owner_linkedin?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          owner_title?: string | null
          profit_margin?: number | null
          profit_multiple?: number | null
          revenue_trend?: string | null
          scraped_at?: string | null
          seller_name?: string | null
          similarity_score?: number | null
          source?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          top_asins?: Json | null
          updated_at?: string | null
          verification_status?: string | null
        }
        Update: {
          annual_profit?: number | null
          annual_revenue?: number | null
          asin_count?: number | null
          asking_price?: number | null
          business_age_months?: number | null
          company_website?: string | null
          contact_confidence_score?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duplicate_count?: number | null
          duplicate_group_id?: string | null
          established_year?: number | null
          gross_revenue?: number | null
          highlights?: string[] | null
          id?: string
          image_url?: string | null
          industry?: string | null
          inventory_value?: number | null
          is_active?: boolean | null
          is_off_market?: boolean | null
          is_primary_listing?: boolean | null
          last_verified_at?: string | null
          listing_status?: string | null
          location?: string | null
          monthly_profit?: number | null
          monthly_revenue?: number | null
          name?: string
          net_revenue?: number | null
          normalized_name?: string | null
          original_url?: string | null
          owner_email?: string | null
          owner_linkedin?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          owner_title?: string | null
          profit_margin?: number | null
          profit_multiple?: number | null
          revenue_trend?: string | null
          scraped_at?: string | null
          seller_name?: string | null
          similarity_score?: number | null
          source?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          top_asins?: Json | null
          updated_at?: string | null
          verification_status?: string | null
        }
        Relationships: []
      }
      crawl_jobs: {
        Row: {
          actual_cost: number | null
          completed_at: string | null
          cost_estimate: number | null
          created_at: string | null
          error_message: string | null
          id: string
          input_data: Json | null
          job_type: string
          output_data: Json | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          actual_cost?: number | null
          completed_at?: string | null
          cost_estimate?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          job_type: string
          output_data?: Json | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          actual_cost?: number | null
          completed_at?: string | null
          cost_estimate?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          job_type?: string
          output_data?: Json | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      deal_activities: {
        Row: {
          created_at: string | null
          deal_id: string
          description: string | null
          id: string
          outcome: string | null
          title: string
          type: Database["public"]["Enums"]["activity_type"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deal_id: string
          description?: string | null
          id?: string
          outcome?: string | null
          title: string
          type: Database["public"]["Enums"]["activity_type"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          deal_id?: string
          description?: string | null
          id?: string
          outcome?: string | null
          title?: string
          type?: Database["public"]["Enums"]["activity_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_asins: {
        Row: {
          added_at: string | null
          asin_id: string
          deal_id: string
          id: string
          is_primary: boolean | null
          notes: string | null
        }
        Insert: {
          added_at?: string | null
          asin_id: string
          deal_id: string
          id?: string
          is_primary?: boolean | null
          notes?: string | null
        }
        Update: {
          added_at?: string | null
          asin_id?: string
          deal_id?: string
          id?: string
          is_primary?: boolean | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_asins_asin_id_fkey"
            columns: ["asin_id"]
            isOneToOne: false
            referencedRelation: "asins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_asins_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_documents: {
        Row: {
          deal_id: string
          description: string | null
          document_type: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          uploaded_at: string | null
          uploaded_by: string
        }
        Insert: {
          deal_id: string
          description?: string | null
          document_type?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          uploaded_at?: string | null
          uploaded_by: string
        }
        Update: {
          deal_id?: string
          description?: string | null
          document_type?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          uploaded_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_documents_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string
          deal_id: string
          description: string | null
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["priority_level"] | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          deal_id: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["priority_level"] | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          deal_id?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["priority_level"] | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          acos: number | null
          actual_close_date: string | null
          amazon_category: string | null
          amazon_store_name: string | null
          amazon_store_url: string | null
          amazon_subcategory: string | null
          annual_profit: number | null
          annual_revenue: number | null
          asking_price: number | null
          assets_included: Json | null
          avg_monthly_profit: number | null
          avg_monthly_revenue: number | null
          avg_retail_price: number | null
          brand_registry: boolean | null
          business_age: number | null
          business_age_months: number | null
          business_age_years: number | null
          business_description: string | null
          business_name: string
          business_started_date: string | null
          cogs_percentage: number | null
          created_at: string | null
          custom_fields: Json | null
          date_listed: string | null
          dba_names: string[] | null
          due_diligence_start_date: string | null
          ebitda: number | null
          employee_count: number | null
          entity_type: string | null
          expected_close_date: string | null
          fba_percentage: number | null
          financial_last_updated: string | null
          first_contact_date: string | null
          gross_margin: number | null
          growth_trend: string | null
          hours_per_week: number | null
          id: string
          inventory_value: number | null
          is_on_market: boolean | null
          last_month_profit: number | null
          last_month_revenue: number | null
          list_price: number | null
          listing_id: string | null
          loi_submitted_date: string | null
          monthly_financials: Json | null
          multiple: number | null
          net_margin: number | null
          operating_margin: number | null
          owner_involvement: string | null
          parent_asin_count: number | null
          pricing_period: number | null
          priority: Database["public"]["Enums"]["priority_level"] | null
          profit_margin: number | null
          revenue_sources: Json | null
          sde: number | null
          seller_account_health: string | null
          seller_email: string | null
          seller_location: string | null
          seller_name: string | null
          seller_phone: string | null
          sku_count: number | null
          source: string | null
          stage: Database["public"]["Enums"]["deal_stage"] | null
          support_period_days: number | null
          tacos: number | null
          top_seller_retail_price: number | null
          top_skus: Json | null
          traffic_breakdown: Json | null
          training_included: boolean | null
          transfer_period_days: number | null
          ttm_profit: number | null
          ttm_revenue: number | null
          updated_at: string | null
          user_id: string
          verification_date: string | null
          verified_profit: boolean | null
          verified_revenue: boolean | null
        }
        Insert: {
          acos?: number | null
          actual_close_date?: string | null
          amazon_category?: string | null
          amazon_store_name?: string | null
          amazon_store_url?: string | null
          amazon_subcategory?: string | null
          annual_profit?: number | null
          annual_revenue?: number | null
          asking_price?: number | null
          assets_included?: Json | null
          avg_monthly_profit?: number | null
          avg_monthly_revenue?: number | null
          avg_retail_price?: number | null
          brand_registry?: boolean | null
          business_age?: number | null
          business_age_months?: number | null
          business_age_years?: number | null
          business_description?: string | null
          business_name: string
          business_started_date?: string | null
          cogs_percentage?: number | null
          created_at?: string | null
          custom_fields?: Json | null
          date_listed?: string | null
          dba_names?: string[] | null
          due_diligence_start_date?: string | null
          ebitda?: number | null
          employee_count?: number | null
          entity_type?: string | null
          expected_close_date?: string | null
          fba_percentage?: number | null
          financial_last_updated?: string | null
          first_contact_date?: string | null
          gross_margin?: number | null
          growth_trend?: string | null
          hours_per_week?: number | null
          id?: string
          inventory_value?: number | null
          is_on_market?: boolean | null
          last_month_profit?: number | null
          last_month_revenue?: number | null
          list_price?: number | null
          listing_id?: string | null
          loi_submitted_date?: string | null
          monthly_financials?: Json | null
          multiple?: number | null
          net_margin?: number | null
          operating_margin?: number | null
          owner_involvement?: string | null
          parent_asin_count?: number | null
          pricing_period?: number | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          profit_margin?: number | null
          revenue_sources?: Json | null
          sde?: number | null
          seller_account_health?: string | null
          seller_email?: string | null
          seller_location?: string | null
          seller_name?: string | null
          seller_phone?: string | null
          sku_count?: number | null
          source?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"] | null
          support_period_days?: number | null
          tacos?: number | null
          top_seller_retail_price?: number | null
          top_skus?: Json | null
          traffic_breakdown?: Json | null
          training_included?: boolean | null
          transfer_period_days?: number | null
          ttm_profit?: number | null
          ttm_revenue?: number | null
          updated_at?: string | null
          user_id: string
          verification_date?: string | null
          verified_profit?: boolean | null
          verified_revenue?: boolean | null
        }
        Update: {
          acos?: number | null
          actual_close_date?: string | null
          amazon_category?: string | null
          amazon_store_name?: string | null
          amazon_store_url?: string | null
          amazon_subcategory?: string | null
          annual_profit?: number | null
          annual_revenue?: number | null
          asking_price?: number | null
          assets_included?: Json | null
          avg_monthly_profit?: number | null
          avg_monthly_revenue?: number | null
          avg_retail_price?: number | null
          brand_registry?: boolean | null
          business_age?: number | null
          business_age_months?: number | null
          business_age_years?: number | null
          business_description?: string | null
          business_name?: string
          business_started_date?: string | null
          cogs_percentage?: number | null
          created_at?: string | null
          custom_fields?: Json | null
          date_listed?: string | null
          dba_names?: string[] | null
          due_diligence_start_date?: string | null
          ebitda?: number | null
          employee_count?: number | null
          entity_type?: string | null
          expected_close_date?: string | null
          fba_percentage?: number | null
          financial_last_updated?: string | null
          first_contact_date?: string | null
          gross_margin?: number | null
          growth_trend?: string | null
          hours_per_week?: number | null
          id?: string
          inventory_value?: number | null
          is_on_market?: boolean | null
          last_month_profit?: number | null
          last_month_revenue?: number | null
          list_price?: number | null
          listing_id?: string | null
          loi_submitted_date?: string | null
          monthly_financials?: Json | null
          multiple?: number | null
          net_margin?: number | null
          operating_margin?: number | null
          owner_involvement?: string | null
          parent_asin_count?: number | null
          pricing_period?: number | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          profit_margin?: number | null
          revenue_sources?: Json | null
          sde?: number | null
          seller_account_health?: string | null
          seller_email?: string | null
          seller_location?: string | null
          seller_name?: string | null
          seller_phone?: string | null
          sku_count?: number | null
          source?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"] | null
          support_period_days?: number | null
          tacos?: number | null
          top_seller_retail_price?: number | null
          top_skus?: Json | null
          traffic_breakdown?: Json | null
          training_included?: boolean | null
          transfer_period_days?: number | null
          ttm_profit?: number | null
          ttm_revenue?: number | null
          updated_at?: string | null
          user_id?: string
          verification_date?: string | null
          verified_profit?: boolean | null
          verified_revenue?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "business_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "off_market_sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      document_extractions: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          deal_id: string
          document_id: string
          document_type: string | null
          embedding: string | null
          extraction_date: string | null
          extraction_version: string | null
          file_hash: string | null
          id: string
          key_entities: Json | null
          language: string | null
          raw_text: string | null
          search_vector: unknown | null
          structured_data: Json | null
          summary: string | null
          updated_at: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          deal_id: string
          document_id: string
          document_type?: string | null
          embedding?: string | null
          extraction_date?: string | null
          extraction_version?: string | null
          file_hash?: string | null
          id?: string
          key_entities?: Json | null
          language?: string | null
          raw_text?: string | null
          search_vector?: unknown | null
          structured_data?: Json | null
          summary?: string | null
          updated_at?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          deal_id?: string
          document_id?: string
          document_type?: string | null
          embedding?: string | null
          extraction_date?: string | null
          extraction_version?: string | null
          file_hash?: string | null
          id?: string
          key_entities?: Json | null
          language?: string | null
          raw_text?: string | null
          search_vector?: unknown | null
          structured_data?: Json | null
          summary?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_extractions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_extractions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "deal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_insights: {
        Row: {
          confidence: number | null
          created_at: string | null
          description: string | null
          extraction_id: string
          id: string
          insight_category: string
          insight_type: string
          source_page: number | null
          source_section: string | null
          title: string
          value: Json | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          description?: string | null
          extraction_id: string
          id?: string
          insight_category: string
          insight_type: string
          source_page?: number | null
          source_section?: string | null
          title: string
          value?: Json | null
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          description?: string | null
          extraction_id?: string
          id?: string
          insight_category?: string
          insight_type?: string
          source_page?: number | null
          source_section?: string | null
          title?: string
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "document_insights_extraction_id_fkey"
            columns: ["extraction_id"]
            isOneToOne: false
            referencedRelation: "document_extractions"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          listing_id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          listing_id: string
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          listing_id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "business_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "off_market_sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_extractions: {
        Row: {
          confidence_scores: Json
          created_at: string | null
          deal_id: string | null
          document_id: string | null
          document_type: string | null
          extracted_by: string | null
          extracted_data: Json
          extraction_date: string
          extraction_type: string
          financial_data: Json
          id: string
          period_covered: Json
          updated_at: string | null
          validation_status: Json
        }
        Insert: {
          confidence_scores?: Json
          created_at?: string | null
          deal_id?: string | null
          document_id?: string | null
          document_type?: string | null
          extracted_by?: string | null
          extracted_data: Json
          extraction_date?: string
          extraction_type: string
          financial_data?: Json
          id?: string
          period_covered?: Json
          updated_at?: string | null
          validation_status?: Json
        }
        Update: {
          confidence_scores?: Json
          created_at?: string | null
          deal_id?: string | null
          document_id?: string | null
          document_type?: string | null
          extracted_by?: string | null
          extracted_data?: Json
          extraction_date?: string
          extraction_type?: string
          financial_data?: Json
          id?: string
          period_covered?: Json
          updated_at?: string | null
          validation_status?: Json
        }
        Relationships: [
          {
            foreignKeyName: "financial_extractions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_extractions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "deal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_history: {
        Row: {
          cogs: number | null
          created_at: string | null
          deal_id: string
          ebitda: number | null
          extraction_id: string | null
          gross_margin: number | null
          gross_profit: number | null
          id: string
          net_income: number | null
          net_margin: number | null
          operating_expenses: number | null
          operating_margin: number | null
          period_end: string
          period_start: string
          period_type: string
          revenue: number | null
        }
        Insert: {
          cogs?: number | null
          created_at?: string | null
          deal_id: string
          ebitda?: number | null
          extraction_id?: string | null
          gross_margin?: number | null
          gross_profit?: number | null
          id?: string
          net_income?: number | null
          net_margin?: number | null
          operating_expenses?: number | null
          operating_margin?: number | null
          period_end: string
          period_start: string
          period_type: string
          revenue?: number | null
        }
        Update: {
          cogs?: number | null
          created_at?: string | null
          deal_id?: string
          ebitda?: number | null
          extraction_id?: string | null
          gross_margin?: number | null
          gross_profit?: number | null
          id?: string
          net_income?: number | null
          net_margin?: number | null
          operating_expenses?: number | null
          operating_margin?: number | null
          period_end?: string
          period_start?: string
          period_type?: string
          revenue?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_history_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_history_extraction_id_fkey"
            columns: ["extraction_id"]
            isOneToOne: false
            referencedRelation: "financial_extractions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_history_extraction_id_fkey"
            columns: ["extraction_id"]
            isOneToOne: false
            referencedRelation: "latest_financial_extractions"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          contact_email: string
          contact_phone: string | null
          created_at: string | null
          id: string
          listing_id: string
          message: string
          status: string | null
          user_id: string
        }
        Insert: {
          contact_email: string
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          listing_id: string
          message: string
          status?: string | null
          user_id: string
        }
        Update: {
          contact_email?: string
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          listing_id?: string
          message?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "business_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "off_market_sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      market_data_cache: {
        Row: {
          created_at: string | null
          data_key: string
          data_type: string
          data_value: Json
          expires_at: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          data_key: string
          data_type: string
          data_value: Json
          expires_at?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          data_key?: string
          data_type?: string
          data_value?: Json
          expires_at?: string | null
          id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      saved_listings: {
        Row: {
          id: string
          listing_id: string
          notes: string | null
          saved_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          listing_id: string
          notes?: string | null
          saved_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          listing_id?: string
          notes?: string | null
          saved_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "business_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "off_market_sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      scraped_pages: {
        Row: {
          html_content: string
          id: string
          last_used: string | null
          listings_extracted: number | null
          scraped_at: string | null
          status: string | null
          url: string
        }
        Insert: {
          html_content: string
          id?: string
          last_used?: string | null
          listings_extracted?: number | null
          scraped_at?: string | null
          status?: string | null
          url: string
        }
        Update: {
          html_content?: string
          id?: string
          last_used?: string | null
          listings_extracted?: number | null
          scraped_at?: string | null
          status?: string | null
          url?: string
        }
        Relationships: []
      }
      seller_contacts: {
        Row: {
          contact_type: string
          contact_value: string
          created_at: string | null
          id: string
          seller_id: string
          source: string | null
          verified: boolean | null
        }
        Insert: {
          contact_type: string
          contact_value: string
          created_at?: string | null
          id?: string
          seller_id: string
          source?: string | null
          verified?: boolean | null
        }
        Update: {
          contact_type?: string
          contact_value?: string
          created_at?: string | null
          id?: string
          seller_id?: string
          source?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_contacts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_contacts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      sellers: {
        Row: {
          avg_rating: number | null
          created_at: string | null
          id: string
          is_whale: boolean | null
          listings_count: number | null
          seller_name: string | null
          seller_url: string
          storefront_parsed: boolean | null
          total_est_revenue: number | null
          updated_at: string | null
        }
        Insert: {
          avg_rating?: number | null
          created_at?: string | null
          id?: string
          is_whale?: boolean | null
          listings_count?: number | null
          seller_name?: string | null
          seller_url: string
          storefront_parsed?: boolean | null
          total_est_revenue?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_rating?: number | null
          created_at?: string | null
          id?: string
          is_whale?: boolean | null
          listings_count?: number | null
          seller_name?: string | null
          seller_url?: string
          storefront_parsed?: boolean | null
          total_est_revenue?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      share_of_voice_competitors: {
        Row: {
          avg_rating: number | null
          avg_reviews: number | null
          brand_name: string
          created_at: string | null
          id: string
          keyword_share: number | null
          market_share: number | null
          product_count: number | null
          rank: number | null
          report_id: string | null
          revenue: number | null
          units_sold: number | null
        }
        Insert: {
          avg_rating?: number | null
          avg_reviews?: number | null
          brand_name: string
          created_at?: string | null
          id?: string
          keyword_share?: number | null
          market_share?: number | null
          product_count?: number | null
          rank?: number | null
          report_id?: string | null
          revenue?: number | null
          units_sold?: number | null
        }
        Update: {
          avg_rating?: number | null
          avg_reviews?: number | null
          brand_name?: string
          created_at?: string | null
          id?: string
          keyword_share?: number | null
          market_share?: number | null
          product_count?: number | null
          rank?: number | null
          report_id?: string | null
          revenue?: number | null
          units_sold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "share_of_voice_competitors_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "share_of_voice_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      share_of_voice_keywords: {
        Row: {
          amazon_search_volume: number | null
          brand_product_count: number | null
          created_at: string | null
          google_search_volume: number | null
          id: string
          keyword: string
          listing_share_percentage: number | null
          report_id: string | null
          sales_share_percentage: number | null
          search_volume: number | null
          share_percentage: number | null
          total_product_count: number | null
        }
        Insert: {
          amazon_search_volume?: number | null
          brand_product_count?: number | null
          created_at?: string | null
          google_search_volume?: number | null
          id?: string
          keyword: string
          listing_share_percentage?: number | null
          report_id?: string | null
          sales_share_percentage?: number | null
          search_volume?: number | null
          share_percentage?: number | null
          total_product_count?: number | null
        }
        Update: {
          amazon_search_volume?: number | null
          brand_product_count?: number | null
          created_at?: string | null
          google_search_volume?: number | null
          id?: string
          keyword?: string
          listing_share_percentage?: number | null
          report_id?: string | null
          sales_share_percentage?: number | null
          search_volume?: number | null
          share_percentage?: number | null
          total_product_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "share_of_voice_keywords_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "share_of_voice_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      share_of_voice_reports: {
        Row: {
          analysis_date: string | null
          avg_products_per_brand: number | null
          brand_avg_rating: number | null
          brand_avg_reviews: number | null
          brand_keyword_share: number | null
          brand_market_share: number | null
          brand_name: string
          brand_product_count: number | null
          brand_rank: number | null
          brand_revenue: number | null
          brand_units_sold: number | null
          category: string | null
          category_distribution: Json | null
          concentration_index: number | null
          created_at: string | null
          deal_id: string | null
          id: string
          keyword_analysis: Json | null
          top_brands: Json | null
          total_brands: number | null
          total_market_revenue: number | null
          total_products: number | null
          updated_at: string | null
        }
        Insert: {
          analysis_date?: string | null
          avg_products_per_brand?: number | null
          brand_avg_rating?: number | null
          brand_avg_reviews?: number | null
          brand_keyword_share?: number | null
          brand_market_share?: number | null
          brand_name: string
          brand_product_count?: number | null
          brand_rank?: number | null
          brand_revenue?: number | null
          brand_units_sold?: number | null
          category?: string | null
          category_distribution?: Json | null
          concentration_index?: number | null
          created_at?: string | null
          deal_id?: string | null
          id?: string
          keyword_analysis?: Json | null
          top_brands?: Json | null
          total_brands?: number | null
          total_market_revenue?: number | null
          total_products?: number | null
          updated_at?: string | null
        }
        Update: {
          analysis_date?: string | null
          avg_products_per_brand?: number | null
          brand_avg_rating?: number | null
          brand_avg_reviews?: number | null
          brand_keyword_share?: number | null
          brand_market_share?: number | null
          brand_name?: string
          brand_product_count?: number | null
          brand_rank?: number | null
          brand_revenue?: number | null
          brand_units_sold?: number | null
          category?: string | null
          category_distribution?: Json | null
          concentration_index?: number | null
          created_at?: string | null
          deal_id?: string | null
          id?: string
          keyword_analysis?: Json | null
          top_brands?: Json | null
          total_brands?: number | null
          total_market_revenue?: number | null
          total_products?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "share_of_voice_reports_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_asin_metrics: {
        Row: {
          id: string
          price: number | null
          profit: number | null
          rank: number | null
          rating: number | null
          recorded_at: string | null
          revenue: number | null
          review_count: number | null
          units_sold: number | null
          user_asin_id: string
        }
        Insert: {
          id?: string
          price?: number | null
          profit?: number | null
          rank?: number | null
          rating?: number | null
          recorded_at?: string | null
          revenue?: number | null
          review_count?: number | null
          units_sold?: number | null
          user_asin_id: string
        }
        Update: {
          id?: string
          price?: number | null
          profit?: number | null
          rank?: number | null
          rating?: number | null
          recorded_at?: string | null
          revenue?: number | null
          review_count?: number | null
          units_sold?: number | null
          user_asin_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_asin_metrics_user_asin_id_fkey"
            columns: ["user_asin_id"]
            isOneToOne: false
            referencedRelation: "user_asins"
            referencedColumns: ["id"]
          },
        ]
      }
      user_asins: {
        Row: {
          asin: string
          brand: string | null
          brand_id: string | null
          category: string | null
          created_at: string | null
          current_price: number | null
          current_rank: number | null
          id: string
          is_active: boolean | null
          monthly_profit: number | null
          monthly_revenue: number | null
          monthly_units_sold: number | null
          portfolio_id: string | null
          product_name: string | null
          profit_margin: number | null
          rating: number | null
          review_count: number | null
          subcategory: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          asin: string
          brand?: string | null
          brand_id?: string | null
          category?: string | null
          created_at?: string | null
          current_price?: number | null
          current_rank?: number | null
          id?: string
          is_active?: boolean | null
          monthly_profit?: number | null
          monthly_revenue?: number | null
          monthly_units_sold?: number | null
          portfolio_id?: string | null
          product_name?: string | null
          profit_margin?: number | null
          rating?: number | null
          review_count?: number | null
          subcategory?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          asin?: string
          brand?: string | null
          brand_id?: string | null
          category?: string | null
          created_at?: string | null
          current_price?: number | null
          current_rank?: number | null
          id?: string
          is_active?: boolean | null
          monthly_profit?: number | null
          monthly_revenue?: number | null
          monthly_units_sold?: number | null
          portfolio_id?: string | null
          product_name?: string | null
          profit_margin?: number | null
          rating?: number | null
          review_count?: number | null
          subcategory?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_asins_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brand_metrics"
            referencedColumns: ["brand_id"]
          },
          {
            foreignKeyName: "user_asins_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_asins_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolio_metrics"
            referencedColumns: ["portfolio_id"]
          },
          {
            foreignKeyName: "user_asins_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "user_portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      user_portfolios: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      brand_metrics: {
        Row: {
          amazon_store_url: string | null
          avg_profit_margin: number | null
          avg_rank: number | null
          avg_rating: number | null
          avg_reviews: number | null
          brand_id: string | null
          brand_name: string | null
          created_at: string | null
          description: string | null
          logo_url: string | null
          total_asins: number | null
          total_monthly_profit: number | null
          total_monthly_revenue: number | null
          total_monthly_units: number | null
          updated_at: string | null
          user_id: string | null
          website_url: string | null
        }
        Relationships: []
      }
      business_listing_duplicates: {
        Row: {
          duplicate_count: number | null
          duplicate_group_id: string | null
          earliest_created: string | null
          latest_created: string | null
          listing_ids: string[] | null
          listing_names: string[] | null
          sources: string[] | null
        }
        Relationships: []
      }
      crawl_job_summary: {
        Row: {
          avg_cost: number | null
          first_job: string | null
          job_count: number | null
          job_type: string | null
          last_completed: string | null
          status: string | null
          total_cost: number | null
        }
        Relationships: []
      }
      document_insights_expanded: {
        Row: {
          confidence: number | null
          created_at: string | null
          deal_id: string | null
          description: string | null
          document_id: string | null
          document_name: string | null
          document_summary: string | null
          document_type: string | null
          extraction_id: string | null
          file_type: string | null
          id: string | null
          insight_category: string | null
          insight_type: string | null
          source_page: number | null
          source_section: string | null
          title: string | null
          value: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "document_extractions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_extractions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "deal_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_insights_extraction_id_fkey"
            columns: ["extraction_id"]
            isOneToOne: false
            referencedRelation: "document_extractions"
            referencedColumns: ["id"]
          },
        ]
      }
      latest_financial_extractions: {
        Row: {
          confidence_scores: Json | null
          created_at: string | null
          deal_id: string | null
          document_id: string | null
          document_type: string | null
          document_uploaded_at: string | null
          extracted_by: string | null
          extracted_data: Json | null
          extraction_date: string | null
          extraction_type: string | null
          file_name: string | null
          financial_data: Json | null
          id: string | null
          period_covered: Json | null
          updated_at: string | null
          validation_status: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_extractions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_extractions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "deal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      off_market_sellers: {
        Row: {
          annual_profit: number | null
          annual_revenue: number | null
          asin_count: number | null
          business_age_months: number | null
          business_name: string | null
          category: string | null
          company_website: string | null
          contact_confidence_score: number | null
          created_at: string | null
          established_year: number | null
          id: string | null
          monthly_profit: number | null
          monthly_revenue: number | null
          owner_email: string | null
          owner_linkedin: string | null
          owner_name: string | null
          owner_phone: string | null
          owner_title: string | null
          profit_margin: number | null
          revenue_trend: string | null
          seller_name: string | null
          top_asins: Json | null
          updated_at: string | null
        }
        Insert: {
          annual_profit?: number | null
          annual_revenue?: number | null
          asin_count?: number | null
          business_age_months?: number | null
          business_name?: string | null
          category?: string | null
          company_website?: string | null
          contact_confidence_score?: number | null
          created_at?: string | null
          established_year?: number | null
          id?: string | null
          monthly_profit?: number | null
          monthly_revenue?: number | null
          owner_email?: string | null
          owner_linkedin?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          owner_title?: string | null
          profit_margin?: number | null
          revenue_trend?: string | null
          seller_name?: string | null
          top_asins?: Json | null
          updated_at?: string | null
        }
        Update: {
          annual_profit?: number | null
          annual_revenue?: number | null
          asin_count?: number | null
          business_age_months?: number | null
          business_name?: string | null
          category?: string | null
          company_website?: string | null
          contact_confidence_score?: number | null
          created_at?: string | null
          established_year?: number | null
          id?: string | null
          monthly_profit?: number | null
          monthly_revenue?: number | null
          owner_email?: string | null
          owner_linkedin?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          owner_title?: string | null
          profit_margin?: number | null
          revenue_trend?: string | null
          seller_name?: string | null
          top_asins?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      portfolio_metrics: {
        Row: {
          avg_profit_margin: number | null
          created_at: string | null
          description: string | null
          portfolio_id: string | null
          portfolio_name: string | null
          total_asins: number | null
          total_brands: number | null
          total_monthly_profit: number | null
          total_monthly_revenue: number | null
          total_monthly_units: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
      seller_metrics: {
        Row: {
          avg_rating: number | null
          created_at: string | null
          domain_contacts: number | null
          email_contacts: number | null
          id: string | null
          is_whale: boolean | null
          listings_count: number | null
          phone_contacts: number | null
          seller_name: string | null
          seller_url: string | null
          storefront_parsed: boolean | null
          total_contacts: number | null
          total_est_revenue: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      user_portfolio_summary: {
        Row: {
          active_asins: number | null
          avg_profit_margin: number | null
          avg_rating: number | null
          total_asins: number | null
          total_brands: number | null
          total_monthly_profit: number | null
          total_monthly_revenue: number | null
          total_monthly_units: number | null
          total_portfolios: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_sample_off_market_sellers: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      get_deal_stage_order: {
        Args: { stage_name: Database["public"]["Enums"]["deal_stage"] }
        Returns: number
      }
      get_off_market_sellers: {
        Args: {
          min_revenue?: number
          min_listings?: number
          has_contacts?: boolean
        }
        Returns: {
          seller_id: string
          seller_name: string
          seller_url: string
          listings_count: number
          total_est_revenue: number
          avg_rating: number
          email_contacts: number
          phone_contacts: number
          domain_contacts: number
          storefront_parsed: boolean
          is_whale: boolean
        }[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      insert_deal_document: {
        Args: {
          p_deal_id: string
          p_file_name: string
          p_file_path: string
          p_file_size: number
          p_mime_type: string
          p_document_type: string
          p_description: string
          p_uploaded_by: string
        }
        Returns: Json
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      normalize_business_name: {
        Args: { name: string }
        Returns: string
      }
      record_brand_performance_snapshot: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      activity_type:
        | "email"
        | "call"
        | "meeting"
        | "note"
        | "stage_change"
        | "document_upload"
        | "task"
      app_role: "admin" | "user" | "broker"
      deal_stage:
        | "prospecting"
        | "analysis"
        | "initial_contact"
        | "loi_submitted"
        | "due_diligence"
        | "negotiation"
        | "under_contract"
        | "closing"
        | "closed_won"
        | "closed_lost"
        | "on_hold"
      listing_status: "active" | "pending" | "sold" | "withdrawn"
      listing_status_type:
        | "live"
        | "under_offer"
        | "sold"
        | "offline"
        | "pending"
      priority_level: "low" | "medium" | "high" | "urgent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_type: [
        "email",
        "call",
        "meeting",
        "note",
        "stage_change",
        "document_upload",
        "task",
      ],
      app_role: ["admin", "user", "broker"],
      deal_stage: [
        "prospecting",
        "analysis",
        "initial_contact",
        "loi_submitted",
        "due_diligence",
        "negotiation",
        "under_contract",
        "closing",
        "closed_won",
        "closed_lost",
        "on_hold",
      ],
      listing_status: ["active", "pending", "sold", "withdrawn"],
      listing_status_type: [
        "live",
        "under_offer",
        "sold",
        "offline",
        "pending",
      ],
      priority_level: ["low", "medium", "high", "urgent"],
    },
  },
} as const