import OpenAI from 'openai';
import { supabase } from '../lib/supabase';

interface ColumnMapping {
  csvColumn: string;
  dbField: string;
  confidence: number;
  transformationType?: 'direct' | 'numeric' | 'boolean' | 'date' | 'array' | 'combined';
  transformationNotes?: string;
}

interface MappingResult {
  mappings: ColumnMapping[];
  unmappedColumns: string[];
  suggestions: string[];
  dataTypeDetection: { [key: string]: string };
}

export class CSVColumnMappingService {
  private static openai: OpenAI | null = null;
  
  // Define the expected database fields for deals (verified against actual schema)
  private static readonly DEAL_DB_FIELDS = {
    // Basic information
    business_name: 'The name of the business (REQUIRED)',
    amazon_store_name: 'Amazon store name or brand name',
    amazon_store_url: 'Amazon store URL',
    amazon_category: 'Amazon category (use for industry)',
    amazon_subcategory: 'Amazon subcategory',
    
    // Financial metrics - all are NUMERIC type in database
    asking_price: 'The asking price for the business',
    list_price: 'List price',
    annual_revenue: 'Annual revenue in dollars',
    annual_profit: 'Annual profit/net income in dollars',
    avg_monthly_revenue: 'Average monthly revenue',
    avg_monthly_profit: 'Average monthly profit',
    ttm_revenue: 'Trailing twelve months revenue',
    ttm_profit: 'Trailing twelve months profit',
    ebitda: 'EBITDA',
    sde: 'Seller discretionary earnings',
    gross_margin: 'Gross margin percentage',
    operating_margin: 'Operating margin percentage',
    net_margin: 'Net margin percentage',
    profit_margin: 'Profit margin percentage',
    multiple: 'Business valuation multiple',
    inventory_value: 'Current inventory value',
    
    // Business details
    business_started_date: 'Date when business was established',
    business_age: 'Age of business in months',
    business_age_years: 'Age of business in years',
    business_age_months: 'Age of business in months',
    employee_count: 'Number of employees',
    entity_type: 'Business entity type',
    dba_names: 'DBA names (array)',
    
    // Seller information
    seller_name: 'Name of the seller',
    seller_email: 'Seller email address',
    seller_phone: 'Seller phone number',
    seller_location: 'Seller location (use for location)',
    seller_account_health: 'Seller account health status',
    
    // Business description - IMPORTANT: field is business_description, not description
    business_description: 'Business description',
    
    // Amazon specific
    fba_percentage: 'Percentage of sales through FBA',
    sku_count: 'Number of SKUs',
    parent_asin_count: 'Number of parent ASINs',
    brand_registry: 'Has brand registry (boolean)',
    tacos: 'Total advertising cost of sale',
    acos: 'Advertising cost of sale',
    cogs_percentage: 'Cost of goods sold percentage',
    
    // Operations
    hours_per_week: 'Hours per week required',
    owner_involvement: 'Level of owner involvement',
    growth_trend: 'Business growth trend',
    transfer_period_days: 'Transfer period in days',
    training_included: 'Training included (boolean)',
    support_period_days: 'Support period in days',
    
    // Metadata
    source: 'Source of the listing (REQUIRED - e.g., CSV Import)',
    is_on_market: 'Whether business is on market (boolean - default true)',
    stage: 'Deal stage',
    priority: 'Deal priority',
    date_listed: 'Date listed',
    
    // Fields that DON'T exist in deals table:
    // - asin_list, industry, location, niche, description, listing_url, original_url, scraped_at
    // - monthly_revenue, monthly_profit (use avg_monthly_revenue, avg_monthly_profit)
  };

  private static getClient(): OpenAI {
    if (!this.openai) {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OpenAI API key not configured');
      }
      this.openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true
      });
    }
    return this.openai;
  }

  /**
   * Analyze CSV headers and sample data to detect data types
   */
  private static analyzeDataTypes(headers: string[], sampleRows: any[]): { [key: string]: string } {
    const dataTypes: { [key: string]: string } = {};
    
    headers.forEach(header => {
      const values = sampleRows.map(row => row[header]).filter(v => v !== null && v !== undefined && v !== '');
      
      if (values.length === 0) {
        dataTypes[header] = 'unknown';
        return;
      }
      
      // Check if all values are numbers
      if (values.every(v => !isNaN(Number(v)))) {
        // Check if they look like currency
        if (values.some(v => String(v).includes('$') || String(v).match(/^\d+\.\d{2}$/))) {
          dataTypes[header] = 'currency';
        } else if (values.every(v => Number.isInteger(Number(v)))) {
          dataTypes[header] = 'integer';
        } else {
          dataTypes[header] = 'decimal';
        }
      }
      // Check if they look like dates
      else if (values.some(v => {
        const dateStr = String(v);
        return dateStr.match(/\d{4}-\d{2}-\d{2}/) || 
               dateStr.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/) ||
               dateStr.match(/\d{1,2}-\d{1,2}-\d{2,4}/);
      })) {
        dataTypes[header] = 'date';
      }
      // Check if they look like URLs
      else if (values.some(v => String(v).match(/^https?:\/\//))) {
        dataTypes[header] = 'url';
      }
      // Check if they look like boolean
      else if (values.every(v => ['true', 'false', 'yes', 'no', '1', '0', 'y', 'n'].includes(String(v).toLowerCase()))) {
        dataTypes[header] = 'boolean';
      }
      // Check if they look like lists
      else if (values.some(v => String(v).includes(',') || String(v).includes(';') || String(v).includes('|'))) {
        dataTypes[header] = 'list';
      }
      else {
        dataTypes[header] = 'string';
      }
    });
    
    return dataTypes;
  }

  /**
   * Use AI to intelligently map CSV columns to database fields
   */
  static async generateSmartMapping(
    csvHeaders: string[],
    sampleRows: any[],
    targetTable: 'deals' | 'business_listings' = 'deals'
  ): Promise<MappingResult> {
    try {
      const client = this.getClient();
      
      // Analyze data types from sample data
      const dataTypeDetection = this.analyzeDataTypes(csvHeaders, sampleRows);
      
      // Prepare the prompt
      const dbFields = targetTable === 'deals' ? this.DEAL_DB_FIELDS : this.getBusinessListingFields();
      
      const prompt = `You are a data mapping expert. Analyze these CSV columns and map them to database fields.

CSV Headers: ${csvHeaders.join(', ')}

Sample data for context:
${JSON.stringify(sampleRows.slice(0, 3), null, 2)}

Detected data types:
${JSON.stringify(dataTypeDetection, null, 2)}

Target database fields (${targetTable} table):
${JSON.stringify(dbFields, null, 2)}

Instructions:
1. Map each CSV column to the most appropriate database field
2. Consider column names, data types, and sample values
3. Handle variations in naming (e.g., "revenue" could map to "annual_revenue" or "monthly_revenue" based on context)
4. Identify columns that might need transformation (e.g., combining city/state into location)
5. Provide confidence scores (0-100) for each mapping
6. List any CSV columns that don't have clear mappings
7. Suggest any data transformations needed
8. IMPORTANT: The dbField value MUST be one of the exact database field names shown above (e.g., "annual_profit", not "Annual profit")

Return as JSON with this structure:
{
  "mappings": [
    {
      "csvColumn": "column_name",
      "dbField": "database_field",
      "confidence": 95,
      "transformationType": "direct|numeric|boolean|date|array|combined",
      "transformationNotes": "any special handling needed"
    }
  ],
  "unmappedColumns": ["columns", "without", "clear", "mapping"],
  "suggestions": ["helpful suggestions for the user"]
}`;

      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at mapping CSV data to database schemas. You understand various naming conventions and can intelligently match fields based on context.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      const result = JSON.parse(content);
      
      // Validate and clean up the AI response
      if (result.mappings && Array.isArray(result.mappings)) {
        result.mappings = result.mappings.map((mapping: ColumnMapping) => {
          // Ensure dbField is in proper snake_case format
          const cleanDbField = mapping.dbField
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '');
          
          return {
            ...mapping,
            dbField: cleanDbField
          };
        });
      }
      
      // Add data type detection to the result
      result.dataTypeDetection = dataTypeDetection;
      
      return result;
      
    } catch (error) {
      console.error('Error generating smart mapping:', error);
      
      // Fallback to basic mapping
      return this.generateFallbackMapping(csvHeaders, dataTypeDetection);
    }
  }

  /**
   * Generate a fallback mapping using simple heuristics
   */
  private static generateFallbackMapping(
    csvHeaders: string[],
    dataTypeDetection: { [key: string]: string }
  ): MappingResult {
    const mappings: ColumnMapping[] = [];
    const unmappedColumns: string[] = [];
    
    // Common column name variations
    const commonMappings: { [key: string]: string } = {
      // Business names
      'name': 'business_name',
      'business_name': 'business_name',
      'company_name': 'business_name',
      'business': 'business_name',
      'store_name': 'amazon_store_name',
      'brand': 'amazon_store_name',
      'brand_name': 'amazon_store_name',
      
      // Financial fields
      'price': 'asking_price',
      'asking_price': 'asking_price',
      'sale_price': 'asking_price',
      'revenue': 'annual_revenue',
      'annual_revenue': 'annual_revenue',
      'yearly_revenue': 'annual_revenue',
      'profit': 'annual_profit',
      'annual_profit': 'annual_profit',
      'net_income': 'annual_profit',
      'monthly_revenue': 'monthly_revenue',
      'monthly_profit': 'monthly_profit',
      
      // Other common fields
      'url': 'listing_url',
      'link': 'listing_url',
      'listing_url': 'listing_url',
      'description': 'description',
      'summary': 'description',
      'location': 'location',
      'industry': 'industry',
      'category': 'industry',
      'niche': 'niche',
      'source': 'source',
      'marketplace': 'source'
    };
    
    csvHeaders.forEach(header => {
      const lowerHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
      
      // Check if we have a direct mapping
      if (commonMappings[lowerHeader]) {
        mappings.push({
          csvColumn: header,
          dbField: commonMappings[lowerHeader],
          confidence: 85,
          transformationType: 'direct'
        });
      }
      // Check for partial matches
      else {
        let mapped = false;
        for (const [pattern, dbField] of Object.entries(commonMappings)) {
          if (lowerHeader.includes(pattern) || pattern.includes(lowerHeader)) {
            mappings.push({
              csvColumn: header,
              dbField: dbField,
              confidence: 70,
              transformationType: 'direct'
            });
            mapped = true;
            break;
          }
        }
        
        if (!mapped) {
          unmappedColumns.push(header);
        }
      }
    });
    
    return {
      mappings,
      unmappedColumns,
      suggestions: [
        'Review the suggested mappings and adjust as needed',
        'Some columns may need manual mapping',
        'Consider the data type detection when mapping numeric fields'
      ],
      dataTypeDetection
    };
  }

  /**
   * Get business listing fields (verified against actual schema)
   */
  private static getBusinessListingFields() {
    return {
      // Basic fields (REQUIRED)
      name: 'Business name (REQUIRED)',
      source: 'Source marketplace (REQUIRED)',
      original_url: 'Original listing URL',
      
      // Financial fields - asking_price, annual_revenue, annual_profit are BIGINT
      // monthly_profit is NUMERIC
      asking_price: 'Asking price (bigint)',
      annual_revenue: 'Annual revenue (bigint)',
      annual_profit: 'Annual profit (bigint)',
      monthly_revenue: 'Monthly revenue',
      monthly_profit: 'Monthly profit (numeric)',
      gross_revenue: 'Gross revenue',
      net_revenue: 'Net revenue',
      inventory_value: 'Inventory value',
      profit_multiple: 'Profit multiple (NOT just multiple)',
      profit_margin: 'Profit margin percentage',
      
      // Business details
      industry: 'Industry or category',
      location: 'Geographic location',
      description: 'Business description (NOT business_description)',
      business_age_months: 'Business age in months',
      established_year: 'Year established',
      revenue_trend: 'Revenue trend',
      asin_count: 'Number of ASINs',
      
      // Seller/Owner info
      seller_name: 'Seller name',
      owner_name: 'Owner name',
      owner_title: 'Owner title',
      owner_email: 'Owner email',
      owner_phone: 'Owner phone',
      owner_linkedin: 'Owner LinkedIn',
      company_website: 'Company website',
      
      // Status fields
      is_off_market: 'Is off market (boolean - default false)',
      listing_status: 'Listing status',
      status: 'Status',
      
      // Other fields
      image_url: 'Main image URL (NOT image_urls)',
      scraped_at: 'Date scraped',
      highlights: 'Business highlights (array)',
      
      // Fields that DON'T exist in business_listings:
      // - niche, years_in_business, employees, reason_for_selling, 
      // - seller_financing, multiple (use profit_multiple), real_estate_included,
      // - image_urls (use image_url), yoy_trend_percent, business_description
    };
  }

  /**
   * Apply column mapping to transform CSV data
   */
  static transformDataWithMapping(
    csvData: any[],
    mappings: ColumnMapping[]
  ): any[] {
    return csvData.map(row => {
      const transformedRow: any = {};
      
      mappings.forEach(mapping => {
        const value = row[mapping.csvColumn];
        
        if (value === null || value === undefined || value === '') {
          return;
        }
        
        // Apply transformation based on type
        switch (mapping.transformationType) {
          case 'numeric':
            transformedRow[mapping.dbField] = this.parseNumericValue(value);
            break;
            
          case 'boolean':
            transformedRow[mapping.dbField] = this.parseBooleanValue(value);
            break;
            
          case 'date':
            transformedRow[mapping.dbField] = this.parseDateValue(value);
            break;
            
          case 'array':
            transformedRow[mapping.dbField] = this.parseArrayValue(value);
            break;
            
          case 'combined':
            // Handle combined fields (e.g., city + state = location)
            // This would need custom logic based on the specific combination
            transformedRow[mapping.dbField] = value;
            break;
            
          default:
            transformedRow[mapping.dbField] = String(value).trim();
        }
      });
      
      return transformedRow;
    });
  }

  private static parseNumericValue(value: any): number {
    if (typeof value === 'number') return value;
    
    // Remove currency symbols and commas
    const cleaned = String(value).replace(/[$,]/g, '').trim();
    const num = parseFloat(cleaned);
    
    return isNaN(num) ? 0 : num;
  }
  
  /**
   * Parse numeric value for bigint fields (business_listings specific fields)
   */
  private static parseBigIntValue(value: any): number {
    const num = this.parseNumericValue(value);
    return Math.round(num); // BigInt fields need integers
  }

  private static parseBooleanValue(value: any): boolean {
    const stringValue = String(value).toLowerCase();
    return ['true', 'yes', '1', 'y'].includes(stringValue);
  }

  private static parseDateValue(value: any): string | null {
    try {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
    } catch {
      return null;
    }
  }

  private static parseArrayValue(value: any): string[] {
    if (Array.isArray(value)) return value;
    
    const stringValue = String(value);
    // Try different delimiters
    if (stringValue.includes(',')) {
      return stringValue.split(',').map(v => v.trim()).filter(v => v);
    } else if (stringValue.includes(';')) {
      return stringValue.split(';').map(v => v.trim()).filter(v => v);
    } else if (stringValue.includes('|')) {
      return stringValue.split('|').map(v => v.trim()).filter(v => v);
    }
    
    return [stringValue];
  }
}

export default CSVColumnMappingService;