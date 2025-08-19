// Market Analysis Types

export interface MarketAnalysis {
  id: string;
  deal_id: string;
  total_market_revenue?: number;
  market_growth_rate?: number;
  tam_total_addressable_market?: number;
  sam_serviceable_market?: number;
  som_obtainable_market?: number;
  market_share?: number;
  market_position?: number;
  total_competitors?: number;
  competitive_advantage?: string;
  market_opportunity_score?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ChannelPerformance {
  id: string;
  deal_id: string;
  channel_name: string;
  revenue?: number;
  revenue_percentage?: number;
  growth_rate?: number;
  customer_count?: number;
  conversion_rate?: number;
  avg_order_value?: number;
  ltv_customer_lifetime_value?: number;
  cac_customer_acquisition_cost?: number;
  roi_percentage?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AmazonChannelAnalysis {
  id: string;
  deal_id: string;
  // Basic metrics
  total_asins?: number;
  active_asins?: number;
  best_seller_rank_avg?: number;
  rating_avg?: number;
  review_count_total?: number;
  
  // Performance metrics
  buy_box_percentage?: number;
  inventory_turnover_rate?: number;
  return_rate?: number;
  account_health_score?: number;
  
  // Competitive analysis
  market_saturation_score?: number;
  competitor_count?: number;
  price_competitiveness_score?: number;
  brand_strength_score?: number;
  
  created_at?: string;
  updated_at?: string;
}

export interface AmazonCompetitor {
  id: string;
  deal_id: string;
  competitor_name: string;
  store_url?: string;
  estimated_revenue?: number;
  product_count?: number;
  avg_rating?: number;
  review_count?: number;
  price_range_low?: number;
  price_range_high?: number;
  market_share_percentage?: number;
  strengths?: string[];
  weaknesses?: string[];
  threat_level?: 'low' | 'medium' | 'high';
  created_at?: string;
  updated_at?: string;
}

export interface SEOAnalysis {
  id: string;
  deal_id: string;
  // Domain metrics
  domain_authority?: number;
  page_authority?: number;
  trust_flow?: number;
  citation_flow?: number;
  
  // Traffic metrics
  organic_traffic_monthly?: number;
  paid_traffic_monthly?: number;
  direct_traffic_monthly?: number;
  referral_traffic_monthly?: number;
  
  // Keyword metrics
  total_keywords_ranking?: number;
  keywords_top_3?: number;
  keywords_top_10?: number;
  keywords_top_100?: number;
  
  // Backlink metrics
  total_backlinks?: number;
  referring_domains?: number;
  dofollow_backlinks?: number;
  
  // Technical SEO
  page_speed_score?: number;
  mobile_score?: number;
  
  // Competitive analysis
  organic_competitors?: number;
  visibility_score?: number;
  content_quality_score?: number;
  
  created_at?: string;
  updated_at?: string;
}

export interface SEOCompetitor {
  id: string;
  deal_id: string;
  competitor_domain: string;
  domain_authority?: number;
  organic_traffic?: number;
  keyword_overlap_count?: number;
  keyword_overlap_percentage?: number;
  competing_pages?: number;
  visibility_score?: number;
  content_gap_opportunities?: number;
  backlink_gap_opportunities?: number;
  strengths?: string[];
  weaknesses?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface SEOKeyword {
  id: string;
  deal_id: string;
  keyword: string;
  search_volume?: number;
  keyword_difficulty?: number;
  current_position?: number;
  previous_position?: number;
  trend?: 'up' | 'down' | 'stable';
  url?: string;
  is_branded?: boolean;
  competitor_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SocialMediaAnalysis {
  id: string;
  deal_id: string;
  // Platform metrics (flexible JSONB)
  platform_metrics?: {
    instagram?: {
      followers: number;
      engagement_rate: number;
      posts_monthly: number;
    };
    facebook?: {
      followers: number;
      engagement_rate: number;
      posts_monthly: number;
    };
    youtube?: {
      subscribers: number;
      views_monthly: number;
      videos_monthly: number;
    };
    twitter?: {
      followers: number;
      engagement_rate: number;
      tweets_monthly: number;
    };
    tiktok?: {
      followers: number;
      engagement_rate: number;
      videos_monthly: number;
    };
  };
  
  // Aggregate metrics
  total_followers?: number;
  total_engagement_rate?: number;
  avg_post_reach?: number;
  avg_post_engagement?: number;
  
  // Content metrics
  post_frequency_weekly?: number;
  content_types?: string[];
  top_performing_content_type?: string;
  
  // Audience metrics
  audience_growth_rate?: number;
  audience_demographics?: {
    age_groups?: { range: string; percentage: number }[];
    gender?: { male: number; female: number; other: number };
    locations?: { city: string; percentage: number }[];
  };
  audience_interests?: string[];
  
  // Competitive analysis
  social_share_of_voice?: number;
  sentiment_score?: number;
  brand_mentions_monthly?: number;
  
  created_at?: string;
  updated_at?: string;
}

export interface SocialCompetitor {
  id: string;
  deal_id: string;
  competitor_name: string;
  platform_presence?: {
    instagram?: { followers: number; engagement: number };
    facebook?: { followers: number; engagement: number };
    youtube?: { subscribers: number; views: number };
    twitter?: { followers: number; engagement: number };
    tiktok?: { followers: number; engagement: number };
  };
  total_reach?: number;
  engagement_rate_avg?: number;
  post_frequency_weekly?: number;
  content_strategy?: string;
  strengths?: string[];
  weaknesses?: string[];
  audience_overlap_percentage?: number;
  share_of_voice?: number;
  created_at?: string;
  updated_at?: string;
}

export interface MarketInsight {
  id: string;
  deal_id: string;
  insight_type: 'strength' | 'weakness' | 'opportunity' | 'threat';
  channel: 'overall' | 'amazon' | 'seo' | 'social' | 'other';
  title: string;
  description?: string;
  impact_score?: number; // 1-10
  effort_score?: number; // 1-10
  priority?: number; // 1-5
  potential_revenue_impact?: number;
  implementation_timeframe?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CompetitiveAdvantage {
  id: string;
  deal_id: string;
  channel: 'overall' | 'amazon' | 'seo' | 'social' | 'other';
  advantage_type: string;
  description?: string;
  sustainability_score?: number; // 1-10
  moat_strength?: 'weak' | 'moderate' | 'strong';
  created_at?: string;
  updated_at?: string;
}

// Aggregate type for all market analysis data
export interface DealMarketAnalysisData {
  marketAnalysis?: MarketAnalysis;
  channelPerformance?: ChannelPerformance[];
  amazonAnalysis?: AmazonChannelAnalysis;
  amazonCompetitors?: AmazonCompetitor[];
  seoAnalysis?: SEOAnalysis;
  seoCompetitors?: SEOCompetitor[];
  seoKeywords?: SEOKeyword[];
  socialAnalysis?: SocialMediaAnalysis;
  socialCompetitors?: SocialCompetitor[];
  marketInsights?: MarketInsight[];
  competitiveAdvantages?: CompetitiveAdvantage[];
}