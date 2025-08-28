import { Deal } from './deal';

// Extended Deal interface with comprehensive business details
export interface ExtendedDeal extends Deal {
  // Business Identity & Branding
  brand_name?: string;
  domain_authority?: number;
  founding_year?: number;
  legal_entity_type?: string; // LLC, Corp, Partnership, etc
  ein_tax_id?: string;

  // Digital Presence & Social Media
  social_media?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
    pinterest?: string;
    snapchat?: string;
    [key: string]: string | undefined;
  };

  online_reviews?: {
    google?: {
      rating: number;
      count: number;
      url?: string;
    };
    yelp?: {
      rating: number;
      count: number;
      url?: string;
    };
    trustpilot?: {
      rating: number;
      count: number;
      url?: string;
    };
    bbb?: {
      rating: string;
      accredited: boolean;
      url?: string;
    };
    [key: string]: any;
  };

  // Marketing & Sales Channels
  marketing_channels?: Array<
    | 'SEO'
    | 'PPC'
    | 'Social Media'
    | 'Email'
    | 'Content Marketing'
    | 'Affiliate'
    | 'Direct Sales'
    | 'Influencer'
    | 'Radio'
    | 'TV'
    | 'Print'
    | string
  >;

  sales_channels?: Array<
    | 'Online'
    | 'Retail'
    | 'Wholesale'
    | 'B2B'
    | 'B2C'
    | 'Marketplace'
    | 'Subscription'
    | 'Direct to Consumer'
    | string
  >;

  customer_demographics?: {
    age_range?: string;
    gender_split?: string;
    geography?: string;
    income_level?: string;
    education?: string;
    psychographics?: string[];
  };

  // Operations & Infrastructure
  physical_locations?: Array<{
    type: 'HQ' | 'Office' | 'Warehouse' | 'Retail' | 'Manufacturing' | 'Other';
    address: string;
    city?: string;
    state?: string;
    country?: string;
    owned: boolean;
    leased?: boolean;
    size_sqft?: number;
    monthly_rent?: number;
    lease_expiry?: string;
  }>;

  key_assets?: Array<
    | 'Equipment'
    | 'Inventory'
    | 'IP/Patents'
    | 'Customer List'
    | 'Brand'
    | 'Software'
    | 'Real Estate'
    | 'Vehicles'
    | string
  >;

  technology_stack?: Array<{
    category: 'E-commerce' | 'CRM' | 'Accounting' | 'Marketing' | 'Operations' | 'Development' | 'Other';
    tool: string;
    monthly_cost?: number;
    essential: boolean;
  }>;

  // Team & Human Resources
  key_employees?: Array<{
    role: string;
    name?: string;
    years: number;
    staying: boolean;
    salary?: number;
    equity?: number;
    skills?: string[];
  }>;
  contractors_count?: number;

  // Financial Details (Extended)
  revenue_model?: 'Subscription' | 'One-time' | 'Recurring' | 'Transaction' | 'Hybrid' | string;
  gross_margin?: number;
  customer_acquisition_cost?: number;
  customer_lifetime_value?: number;
  monthly_burn_rate?: number;
  cash_on_hand?: number;
  accounts_receivable?: number;
  total_debt?: number;

  // Market & Competition
  competitors?: Array<{
    name: string;
    website?: string;
    market_share?: string;
    strengths?: string[];
    weaknesses?: string[];
    estimated_revenue?: number;
    threat_level?: 'Low' | 'Medium' | 'High';
  }>;

  market_size?: number;
  market_growth_rate?: number;
  market_share?: number;
  total_addressable_market?: number;
  serviceable_addressable_market?: number;
  serviceable_obtainable_market?: number;

  // Customer Metrics
  total_customers?: number;
  monthly_active_users?: number;
  customer_retention_rate?: number;
  customer_churn_rate?: number;
  net_promoter_score?: number;
  customer_satisfaction_score?: number;
  average_order_value?: number;
  purchase_frequency?: number;

  // Legal & Compliance
  licenses_permits?: Array<{
    type: string;
    issuer: string;
    number?: string;
    expiry?: string;
    status: 'Active' | 'Expired' | 'Pending';
  }>;

  intellectual_property?: Array<{
    type: 'Trademark' | 'Patent' | 'Copyright' | 'Trade Secret';
    name: string;
    registration_number?: string;
    status: 'Active' | 'Pending' | 'Expired';
    expiry?: string;
    value?: number;
  }>;

  pending_litigation?: boolean;
  litigation_details?: string;
  compliance_issues?: string[];

  // Seller Information (Extended)
  reason_for_selling?: string;
  seller_financing_available?: boolean;
  seller_financing_terms?: string;
  seller_non_compete_terms?: string;
  seller_involvement_required?: boolean;

  // AI Analysis Metadata
  data_completeness_score?: number; // 0-100
  last_ai_extraction?: string;
  ai_confidence_scores?: {
    financials?: number;
    market?: number;
    operations?: number;
    team?: number;
    legal?: number;
  };

  // Document Analysis Results
  document_insights?: {
    financial_statements?: {
      extracted: boolean;
      confidence: number;
      key_metrics: Record<string, any>;
    };
    market_research?: {
      extracted: boolean;
      confidence: number;
      insights: string[];
    };
    legal_documents?: {
      extracted: boolean;
      confidence: number;
      flags: string[];
    };
  };
}

// Helper type for partial updates
export type DealUpdate = Partial<ExtendedDeal>;

// Business completeness check
export interface BusinessCompletenessCheck {
  score: number; // 0-100
  missing_critical: string[];
  missing_important: string[];
  missing_nice_to_have: string[];
  ready_for_analysis: boolean;
}

// AI Extraction request/response types
export interface AIExtractionRequest {
  deal_id: string;
  document_ids?: string[];
  extraction_type: 'full' | 'financial' | 'market' | 'operational' | 'legal';
  override_existing?: boolean;
}

export interface AIExtractionResponse {
  success: boolean;
  extracted_fields: Partial<ExtendedDeal>;
  confidence_scores: Record<string, number>;
  warnings?: string[];
  errors?: string[];
}