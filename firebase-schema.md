# Firebase Schema Documentation

## Deals Collection

The deals collection stores all business acquisition deals with comprehensive business information.

### Core Fields
- `id`: string (auto-generated)
- `business_name`: string
- `status`: string (deal pipeline status)
- `source`: string (deal source)
- `priority`: number
- `created_at`: timestamp
- `updated_at`: timestamp
- `userId`: string (owner user ID)
- `created_by`: string (creator user ID)

### Financial Information
- `asking_price`: number
- `annual_revenue`: number
- `annual_profit`: number
- `monthly_revenue`: number
- `monthly_profit`: number
- `gross_margin`: number (percentage)
- `ebitda`: number
- `revenue_model`: string (Subscription/One-time/Recurring/etc)
- `customer_acquisition_cost`: number
- `customer_lifetime_value`: number
- `monthly_burn_rate`: number
- `cash_on_hand`: number
- `accounts_receivable`: number
- `inventory_value`: number
- `total_debt`: number

### Business Identity & Branding
- `brand_name`: string
- `website_url`: string
- `domain_authority`: number (1-100)
- `founding_year`: number
- `legal_entity_type`: string (LLC/Corp/Partnership/etc)
- `ein_tax_id`: string

### Digital Presence
- `social_media`: object
  - `facebook`: string (URL)
  - `instagram`: string (URL)
  - `linkedin`: string (URL)
  - `twitter`: string (URL)
  - `youtube`: string (URL)
  - `tiktok`: string (URL)
- `online_reviews`: object
  - `google`: {rating: number, count: number, url: string}
  - `yelp`: {rating: number, count: number, url: string}
  - `trustpilot`: {rating: number, count: number, url: string}

### Marketing & Sales
- `marketing_channels`: array of strings
- `sales_channels`: array of strings
- `customer_demographics`: object
  - `age_range`: string
  - `gender_split`: string
  - `geography`: string
  - `income_level`: string

### Operations & Infrastructure
- `physical_locations`: array of objects
  - `type`: string (HQ/Office/Warehouse/etc)
  - `address`: string
  - `owned`: boolean
  - `size_sqft`: number
- `key_assets`: array of strings
- `technology_stack`: array of objects
  - `category`: string
  - `tool`: string
  - `monthly_cost`: number
  - `essential`: boolean

### Team & HR
- `employee_count`: number
- `contractors_count`: number
- `key_employees`: array of objects
  - `role`: string
  - `name`: string
  - `years`: number
  - `staying`: boolean

### Market & Competition
- `competitors`: array of objects
  - `name`: string
  - `market_share`: string
  - `strengths`: array of strings
  - `weaknesses`: array of strings
- `market_size`: number
- `market_growth_rate`: number
- `market_share`: number

### Customer Metrics
- `total_customers`: number
- `monthly_active_users`: number
- `customer_retention_rate`: number
- `customer_churn_rate`: number
- `net_promoter_score`: number

### Legal & Compliance
- `licenses_permits`: array of objects
- `intellectual_property`: array of objects
- `pending_litigation`: boolean
- `litigation_details`: string

### AI Analysis Metadata
- `data_completeness_score`: number (0-100)
- `last_ai_extraction`: timestamp
- `ai_confidence_scores`: object
  - `financials`: number
  - `market`: number
  - `operations`: number
