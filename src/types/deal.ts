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
  ebitda?: number;
  sde?: number; // Seller's Discretionary Earnings
  multiple?: number;
  
  // Business Details
  business_age?: number;
  employee_count?: number;
  inventory_value?: number;
  date_listed?: string;
  date_established?: string;
  is_on_market?: boolean;
  listing_url?: string;
  website_url?: string;
  original_listing_id?: string;
  description?: string;
  
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
  
  // UI/Display fields
  image_url?: string;
  product_images?: string[];
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
}