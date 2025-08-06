export type DealStatus = 
  | 'prospecting'
  | 'initial_contact'
  | 'analysis'
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

export interface Deal {
  id: string;
  business_name: string;
  status: DealStatus;
  source?: DealSource;
  priority?: number;
  
  // Financial Information
  asking_price?: number;
  list_price?: number;
  valuation_multiple?: number;
  annual_revenue?: number;
  annual_profit?: number;
  monthly_revenue?: number;
  monthly_profit?: number;
  avg_monthly_revenue?: number;
  avg_monthly_profit?: number;
  ttm_revenue?: number; // Trailing Twelve Months
  ttm_profit?: number;
  profit_margin?: number;
  pricing_period?: number; // Months used for multiple calculation
  ebitda?: number;
  sde?: number; // Seller's Discretionary Earnings
  multiple?: number;
  last_month_revenue?: number;
  last_month_profit?: number;
  
  // Business Details
  business_age?: number;
  business_started_date?: string;
  business_age_years?: number;
  business_age_months?: number;
  employee_count?: number;
  inventory_value?: number;
  date_listed?: string;
  date_established?: string;
  is_on_market?: boolean;
  listing_url?: string;
  website_url?: string;
  original_listing_id?: string;
  description?: string;
  hours_per_week?: number;
  owner_involvement?: string;
  growth_trend?: 'increasing' | 'stable' | 'declining';
  transfer_period_days?: number;
  training_included?: boolean;
  support_period_days?: number;
  
  // Location
  city?: string;
  state?: string;
  country?: string;
  
  // Industry
  industry?: string;
  sub_industry?: string;
  niche_keywords?: string[];
  
  // Amazon/E-commerce Specific
  amazon_store_name?: string;
  amazon_store_url?: string;
  amazon_category?: string;
  amazon_subcategory?: string;
  seller_account_health?: string;
  fba_percentage?: number;
  monthly_sessions?: number;
  conversion_rate?: number;
  brand_names?: string[];
  asin_list?: any[];
  sku_count?: number;
  parent_asin_count?: number;
  brand_registry?: boolean;
  tacos?: number; // Total Advertising Cost of Sale
  acos?: number; // Advertising Cost of Sale
  cogs_percentage?: number; // Cost of Goods Sold %
  top_seller_retail_price?: number;
  avg_retail_price?: number;
  top_skus?: Array<{
    sku: string;
    asin?: string;
    revenue_percentage?: number;
  }>;
  
  // Contact Information
  seller_name?: string;
  seller_email?: string;
  seller_phone?: string;
  broker_name?: string;
  broker_email?: string;
  broker_phone?: string;
  broker_company?: string;
  
  // Important Dates
  first_contact_date?: string;
  loi_submitted_date?: string;
  due_diligence_start_date?: string;
  expected_close_date?: string;
  actual_close_date?: string;
  
  // Pipeline Management
  stage?: string;
  stage_updated_at?: string;
  assigned_to?: string;
  score?: number; // 0-100 automated scoring
  substatus?: string;
  next_action?: string;
  next_action_date?: string;
  
  // User/Team
  created_by?: string;
  team_id?: string;
  
  // Additional Metadata
  notes?: string;
  tags?: string[];
  custom_fields?: Record<string, any>;
  other_platforms?: Record<string, string>;
  
  // Verification & Documentation
  verified_revenue?: boolean;
  verified_profit?: boolean;
  verification_date?: string;
  
  // Assets & Inclusions
  assets_included?: {
    amazon_seller_account?: boolean;
    trademark?: boolean;
    supplier_contracts?: boolean;
    etsy_account?: boolean;
    ebay_account?: boolean;
    social_media_accounts?: boolean;
    website?: boolean;
    email_list?: boolean;
    inventory?: boolean;
    equipment?: boolean;
    other?: string[];
  };
  
  // Financial History
  monthly_financials?: Array<{
    month: string;
    revenue: number;
    profit: number;
    expenses?: number;
  }>;
  revenue_sources?: Record<string, number>; // e.g., {amazon: 90, etsy: 5, ebay: 5}
  traffic_breakdown?: Record<string, number>;
  
  // UI/Display fields
  image_url?: string;
  product_images?: string[];
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
}