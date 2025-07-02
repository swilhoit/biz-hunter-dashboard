export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      deals: {
        Row: {
          id: string
          user_id: string
          business_name: string
          status: DealStatus
          source: DealSource | null
          priority: number
          asking_price: number | null
          valuation_multiple: number | null
          annual_revenue: number | null
          annual_profit: number | null
          monthly_revenue: number | null
          monthly_profit: number | null
          business_age: number | null
          date_listed: string | null
          is_on_market: boolean
          listing_url: string | null
          amazon_store_name: string | null
          amazon_store_url: string | null
          amazon_category: string | null
          amazon_subcategory: string | null
          seller_account_health: string | null
          fba_percentage: number | null
          website_url: string | null
          other_platforms: Json | null
          seller_name: string | null
          seller_email: string | null
          seller_phone: string | null
          broker_name: string | null
          broker_email: string | null
          broker_phone: string | null
          broker_company: string | null
          first_contact_date: string | null
          loi_submitted_date: string | null
          due_diligence_start_date: string | null
          expected_close_date: string | null
          actual_close_date: string | null
          notes: string | null
          tags: string[] | null
          custom_fields: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_name: string
          status?: DealStatus
          source?: DealSource | null
          priority?: number
          asking_price?: number | null
          valuation_multiple?: number | null
          annual_revenue?: number | null
          annual_profit?: number | null
          monthly_revenue?: number | null
          monthly_profit?: number | null
          business_age?: number | null
          date_listed?: string | null
          is_on_market?: boolean
          listing_url?: string | null
          amazon_store_name?: string | null
          amazon_store_url?: string | null
          amazon_category?: string | null
          amazon_subcategory?: string | null
          seller_account_health?: string | null
          fba_percentage?: number | null
          website_url?: string | null
          other_platforms?: Json | null
          seller_name?: string | null
          seller_email?: string | null
          seller_phone?: string | null
          broker_name?: string | null
          broker_email?: string | null
          broker_phone?: string | null
          broker_company?: string | null
          first_contact_date?: string | null
          loi_submitted_date?: string | null
          due_diligence_start_date?: string | null
          expected_close_date?: string | null
          actual_close_date?: string | null
          notes?: string | null
          tags?: string[] | null
          custom_fields?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_name?: string
          status?: DealStatus
          source?: DealSource | null
          priority?: number
          asking_price?: number | null
          valuation_multiple?: number | null
          annual_revenue?: number | null
          annual_profit?: number | null
          monthly_revenue?: number | null
          monthly_profit?: number | null
          business_age?: number | null
          date_listed?: string | null
          is_on_market?: boolean
          listing_url?: string | null
          amazon_store_name?: string | null
          amazon_store_url?: string | null
          amazon_category?: string | null
          amazon_subcategory?: string | null
          seller_account_health?: string | null
          fba_percentage?: number | null
          website_url?: string | null
          other_platforms?: Json | null
          seller_name?: string | null
          seller_email?: string | null
          seller_phone?: string | null
          broker_name?: string | null
          broker_email?: string | null
          broker_phone?: string | null
          broker_company?: string | null
          first_contact_date?: string | null
          loi_submitted_date?: string | null
          due_diligence_start_date?: string | null
          expected_close_date?: string | null
          actual_close_date?: string | null
          notes?: string | null
          tags?: string[] | null
          custom_fields?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      asins: {
        Row: {
          id: string
          asin: string
          product_name: string | null
          category: string | null
          subcategory: string | null
          brand: string | null
          created_at: string
        }
        Insert: {
          id?: string
          asin: string
          product_name?: string | null
          category?: string | null
          subcategory?: string | null
          brand?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          asin?: string
          product_name?: string | null
          category?: string | null
          subcategory?: string | null
          brand?: string | null
          created_at?: string
        }
      }
      deal_asins: {
        Row: {
          id: string
          deal_id: string
          asin_id: string
          units_sold_monthly: number | null
          revenue_monthly: number | null
          profit_monthly: number | null
          inventory_value: number | null
          rank_current: number | null
          rank_average: number | null
          review_count: number | null
          review_rating: number | null
          is_primary: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          deal_id: string
          asin_id: string
          units_sold_monthly?: number | null
          revenue_monthly?: number | null
          profit_monthly?: number | null
          inventory_value?: number | null
          rank_current?: number | null
          rank_average?: number | null
          review_count?: number | null
          review_rating?: number | null
          is_primary?: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          deal_id?: string
          asin_id?: string
          units_sold_monthly?: number | null
          revenue_monthly?: number | null
          profit_monthly?: number | null
          inventory_value?: number | null
          rank_current?: number | null
          rank_average?: number | null
          review_count?: number | null
          review_rating?: number | null
          is_primary?: boolean
          notes?: string | null
          created_at?: string
        }
      }
      files: {
        Row: {
          id: string
          deal_id: string
          user_id: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          category: FileCategory | null
          description: string | null
          uploaded_by: string | null
          is_confidential: boolean
          created_at: string
        }
        Insert: {
          id?: string
          deal_id: string
          user_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          category?: FileCategory | null
          description?: string | null
          uploaded_by?: string | null
          is_confidential?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          deal_id?: string
          user_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          category?: FileCategory | null
          description?: string | null
          uploaded_by?: string | null
          is_confidential?: boolean
          created_at?: string
        }
      }
      communications: {
        Row: {
          id: string
          deal_id: string
          user_id: string
          type: CommunicationType
          direction: 'inbound' | 'outbound' | null
          contact_name: string | null
          subject: string | null
          summary: string | null
          full_content: string | null
          scheduled_at: string | null
          completed_at: string | null
          attachments: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          deal_id: string
          user_id: string
          type: CommunicationType
          direction?: 'inbound' | 'outbound' | null
          contact_name?: string | null
          subject?: string | null
          summary?: string | null
          full_content?: string | null
          scheduled_at?: string | null
          completed_at?: string | null
          attachments?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          deal_id?: string
          user_id?: string
          type?: CommunicationType
          direction?: 'inbound' | 'outbound' | null
          contact_name?: string | null
          subject?: string | null
          summary?: string | null
          full_content?: string | null
          scheduled_at?: string | null
          completed_at?: string | null
          attachments?: Json | null
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          deal_id: string
          user_id: string
          assigned_to: string | null
          title: string
          description: string | null
          due_date: string | null
          priority: number
          is_completed: boolean
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          deal_id: string
          user_id: string
          assigned_to?: string | null
          title: string
          description?: string | null
          due_date?: string | null
          priority?: number
          is_completed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          deal_id?: string
          user_id?: string
          assigned_to?: string | null
          title?: string
          description?: string | null
          due_date?: string | null
          priority?: number
          is_completed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ai_analyses: {
        Row: {
          id: string
          deal_id: string
          user_id: string
          analysis_type: string
          request_prompt: string | null
          result_data: Json
          confidence_score: number | null
          created_at: string
        }
        Insert: {
          id?: string
          deal_id: string
          user_id: string
          analysis_type: string
          request_prompt?: string | null
          result_data: Json
          confidence_score?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          deal_id?: string
          user_id?: string
          analysis_type?: string
          request_prompt?: string | null
          result_data?: Json
          confidence_score?: number | null
          created_at?: string
        }
      }
      market_data_cache: {
        Row: {
          id: string
          asin: string | null
          category: string | null
          data_type: string | null
          data_value: Json
          fetched_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          asin?: string | null
          category?: string | null
          data_type?: string | null
          data_value: Json
          fetched_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          asin?: string | null
          category?: string | null
          data_type?: string | null
          data_value?: Json
          fetched_at?: string
          expires_at?: string | null
        }
      }
      notes: {
        Row: {
          id: string
          deal_id: string
          user_id: string
          title: string | null
          content: string
          is_pinned: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          deal_id: string
          user_id: string
          title?: string | null
          content: string
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          deal_id?: string
          user_id?: string
          title?: string | null
          content?: string
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      deal_metrics_history: {
        Row: {
          id: string
          deal_id: string
          metric_date: string
          revenue: number | null
          profit: number | null
          units_sold: number | null
          conversion_rate: number | null
          acos: number | null
          inventory_value: number | null
          created_at: string
        }
        Insert: {
          id?: string
          deal_id: string
          metric_date: string
          revenue?: number | null
          profit?: number | null
          units_sold?: number | null
          conversion_rate?: number | null
          acos?: number | null
          inventory_value?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          deal_id?: string
          metric_date?: string
          revenue?: number | null
          profit?: number | null
          units_sold?: number | null
          conversion_rate?: number | null
          acos?: number | null
          inventory_value?: number | null
          created_at?: string
        }
      }
    }
  }
}

export type DealStatus = 
  | 'prospecting'
  | 'initial_contact'
  | 'loi_submitted'
  | 'due_diligence'
  | 'negotiation'
  | 'under_contract'
  | 'closing'
  | 'closed_won'
  | 'closed_lost'
  | 'on_hold';

export type DealSource = 
  | 'marketplace'
  | 'broker'
  | 'direct_outreach'
  | 'referral'
  | 'other';

export type CommunicationType = 
  | 'email'
  | 'phone'
  | 'meeting'
  | 'text'
  | 'other';

export type FileCategory = 
  | 'financial_statements'
  | 'tax_returns'
  | 'bank_statements'
  | 'product_info'
  | 'supplier_info'
  | 'legal_documents'
  | 'due_diligence'
  | 'contracts'
  | 'correspondence'
  | 'analytics'
  | 'other';

export type Deal = Database['public']['Tables']['deals']['Row'];
export type Asin = Database['public']['Tables']['asins']['Row'];
export type DealAsin = Database['public']['Tables']['deal_asins']['Row'];
export type DealFile = Database['public']['Tables']['files']['Row'];
export type Communication = Database['public']['Tables']['communications']['Row'];
export type Task = Database['public']['Tables']['tasks']['Row'];
export type AIAnalysis = Database['public']['Tables']['ai_analyses']['Row'];
export type Note = Database['public']['Tables']['notes']['Row'];
export type DealMetricsHistory = Database['public']['Tables']['deal_metrics_history']['Row'];