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
  asking_price?: number;
  valuation_multiple?: number;
  annual_revenue?: number;
  annual_profit?: number;
  monthly_revenue?: number;
  monthly_profit?: number;
  business_age?: number;
  date_listed?: string;
  is_on_market?: boolean;
  listing_url?: string;
  original_listing_id?: string;
  description?: string;
  amazon_store_name?: string;
  amazon_store_url?: string;
  amazon_category?: string;
  amazon_subcategory?: string;
  seller_account_health?: string;
  fba_percentage?: number;
  website_url?: string;
  other_platforms?: Record<string, string>;
  seller_name?: string;
  seller_email?: string;
  seller_phone?: string;
  broker_name?: string;
  broker_email?: string;
  broker_phone?: string;
  broker_company?: string;
  first_contact_date?: string;
  loi_submitted_date?: string;
  due_diligence_start_date?: string;
  expected_close_date?: string;
  actual_close_date?: string;
  notes?: string;
  tags?: string[];
  custom_fields?: Record<string, any>;
  asin_list?: any[];
  image_url?: string;
  product_images?: string[];
  created_at?: string;
  updated_at?: string;
}