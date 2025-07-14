# Brand vs Deal Architecture

## Overview

This document clarifies the distinction between Brands and Deals in the FBA Hunter Dashboard and outlines the proper data hierarchy.

## Conceptual Model

```
Brand (e.g., "Mister Candle")
  ├── ASINs/Products
  │   ├── ASIN 1 (Candle Product A)
  │   ├── ASIN 2 (Candle Product B)
  │   └── ASIN 3 (Candle Product C)
  │
  ├── Brand Metrics
  │   ├── Total Revenue
  │   ├── Total ASINs
  │   ├── Market Share
  │   └── Growth Metrics
  │
  └── Deals (Acquisition Opportunities)
      ├── Deal 1 (2024 - Active)
      │   ├── Asking Price
      │   ├── Valuation
      │   ├── Deal Status
      │   └── Deal-specific Documents
      │
      └── Deal 2 (2023 - Closed)
          └── Historical Deal Data
```

## Key Distinctions

### Brand
- **Definition**: The actual Amazon seller/business entity
- **Scope**: All products, metrics, and data related to the business
- **Persistence**: Exists regardless of acquisition activity
- **Examples**: "Mister Candle", "ACME Goods", "Premium Pet Supplies"

### Deal
- **Definition**: A specific acquisition opportunity for a brand
- **Scope**: Transaction-specific information (price, terms, status)
- **Persistence**: Time-bound to the acquisition process
- **Relationship**: Many-to-one with brands (one brand can have multiple deals over time)

## Database Schema

### Current Issues
1. `deals.business_name` conflates brand identity with deal records
2. No clear separation between brand-level and deal-level data
3. ASINs are sometimes associated with deals instead of brands

### Proposed Structure

```sql
-- Brands table (source of truth for business entities)
brands
  - id (PK)
  - name (unique)
  - category
  - subcategory
  - brand metrics...

-- Deals table (acquisition opportunities)
deals
  - id (PK)
  - brand_id (FK -> brands.id)
  - asking_price
  - status
  - deal-specific fields...

-- ASINs belong to brands, not deals
asins
  - id (PK)
  - brand_id (FK -> brands.id)
  - asin
  - product data...
```

## Component Updates Needed

### Phase 1: Database Migration
1. Create `brands` table
2. Migrate unique brand data from `deals`
3. Add `brand_id` foreign keys
4. Update views and queries

### Phase 2: Service Layer
1. Create `BrandService` for brand operations
2. Update `DealsService` to work with brand relationships
3. Ensure ASINService queries by brand_id

### Phase 3: UI Components
1. Create dedicated Brand pages/components
2. Update Deal pages to reference brands
3. Ensure keyword tracking uses brand context

## Benefits

1. **Data Integrity**: Brands maintain consistent identity across multiple deals
2. **Historical Tracking**: Can track multiple acquisition attempts for the same brand
3. **Cleaner Analytics**: Brand metrics aren't duplicated across deals
4. **Better UX**: Users can view brand performance independent of deal status

## Migration Strategy

1. **Backward Compatibility**: Use views during transition
2. **Gradual Rollout**: Update components incrementally
3. **Data Validation**: Ensure no data loss during migration

## Example Use Cases

### Correct Usage
- "Show me all ASINs for the Mister Candle **brand**"
- "What's the asking price for the Mister Candle **deal**?"
- "Track keywords for the ACME Goods **brand**"
- "Update the status of the ACME Goods **deal** to 'Due Diligence'"

### Incorrect Usage
- ~~"Show me all ASINs for this deal"~~ (ASINs belong to brands)
- ~~"What's the revenue for this deal?"~~ (Revenue is a brand metric)
- ~~"Create a new deal called 'Mister Candle'"~~ (Deals reference brands)