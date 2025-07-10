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
  
  // Define the expected database fields for deals
  private static readonly DEAL_DB_FIELDS = {
    // Basic information
    business_name: 'The name of the business',
    amazon_store_name: 'Amazon store name or brand name',
    asin_list: 'List of Amazon ASINs (product identifiers)',
    
    // Financial metrics
    asking_price: 'The asking price for the business',
    annual_revenue: 'Annual revenue in dollars',
    annual_profit: 'Annual profit/net income in dollars',
    monthly_revenue: 'Monthly revenue in dollars',
    monthly_profit: 'Monthly profit in dollars',
    ttm_revenue: 'Trailing twelve months revenue',
    ttm_profit: 'Trailing twelve months profit',
    
    // Business details
    business_created: 'Date when business was established',
    inventory_value: 'Current inventory value',
    multiple: 'Business valuation multiple',
    sde_multiple: 'Seller discretionary earnings multiple',
    
    // Location and industry
    industry: 'Business industry or category',
    location: 'Geographic location',
    niche: 'Business niche or sub-category',
    
    // URLs and identifiers
    listing_url: 'URL to the listing',
    seller_interview_url: 'URL to seller interview',
    pnl_url: 'URL to profit and loss statement',
    
    // Additional details
    description: 'Business description',
    reason_for_selling: 'Reason for selling the business',
    growth_opportunity: 'Growth opportunities',
    
    // Marketplace specific
    empire_flippers_listing_number: 'Empire Flippers listing ID',
    assets_included: 'Assets included in sale',
    seller_support: 'Post-sale seller support details',
    
    // Metadata
    source: 'Source of the listing (e.g., Empire Flippers, Flippa)',
    status: 'Current status of the deal',
    notes: 'Additional notes',
    user_id: 'User ID (auto-assigned)'
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
   * Get business listing fields (for backward compatibility)
   */
  private static getBusinessListingFields() {
    return {
      name: 'Business name',
      source: 'Source marketplace',
      asking_price: 'Asking price',
      annual_revenue: 'Annual revenue',
      annual_profit: 'Annual profit',
      monthly_revenue: 'Monthly revenue',
      monthly_profit: 'Monthly profit',
      location: 'Geographic location',
      industry: 'Industry or category',
      description: 'Business description',
      years_in_business: 'Years in operation',
      employees: 'Number of employees',
      established_date: 'Date established',
      reason_for_selling: 'Reason for selling',
      seller_financing: 'Seller financing available',
      multiple: 'Valuation multiple',
      inventory_value: 'Inventory value',
      real_estate_included: 'Real estate included',
      image_urls: 'Image URLs',
      original_url: 'Original listing URL',
      scraped_at: 'Date scraped',
      yoy_trend_percent: 'Year over year growth'
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