import { ExtendedDeal, AIExtractionRequest, AIExtractionResponse } from '../types/deal-extended';
// @ts-ignore - JavaScript module
import { dealsAdapter, filesAdapter } from '../lib/database-adapter';

export class BusinessDataExtractor {
  private apiUrl: string;

  constructor() {
    this.apiUrl = '/api/openai';
  }

  private async callOpenAI(messages: any[], options: any = {}): Promise<string> {
    try {
      const response = await fetch(`${this.apiUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          temperature: options.temperature || 0.3, // Lower temp for extraction accuracy
          max_tokens: options.max_tokens || 3000,
          model: options.model || 'gpt-4o-mini'
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to call AI service (${response.status})`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      throw error;
    }
  }

  async extractFromDocuments(request: AIExtractionRequest): Promise<AIExtractionResponse> {
    try {
      // Get deal and document data
      const { data: deal, error: dealError } = await dealsAdapter.getDeal(request.deal_id);

      if (dealError || !deal) {
        throw new Error('Deal not found');
      }

      // Get documents if specific IDs provided, otherwise get all deal documents
      let documents = [];
      if (request.document_ids && request.document_ids.length > 0) {
        // For Firebase, we'll fetch files associated with the deal
        const files = await filesAdapter.getFilesForDeal(request.deal_id);
        documents = files.filter((file: any) => 
          request.document_ids?.includes(file.id)
        );
      }

      // Combine all available information
      const context = this.buildContext(deal, documents);

      // Extract based on type
      let extractedData: Partial<ExtendedDeal> = {};
      let confidenceScores: Record<string, number> = {};

      switch (request.extraction_type) {
        case 'full':
          const results = await Promise.all([
            this.extractBusinessIdentity(context),
            this.extractFinancials(context),
            this.extractMarketData(context),
            this.extractOperationalData(context),
            this.extractDigitalPresence(context)
          ]);
          
          results.forEach(result => {
            extractedData = { ...extractedData, ...result.data };
            confidenceScores = { ...confidenceScores, ...result.confidence };
          });
          break;

        case 'financial':
          const financialResult = await this.extractFinancials(context);
          extractedData = financialResult.data;
          confidenceScores = financialResult.confidence;
          break;

        case 'market':
          const marketResult = await this.extractMarketData(context);
          extractedData = marketResult.data;
          confidenceScores = marketResult.confidence;
          break;

        case 'operational':
          const operationalResult = await this.extractOperationalData(context);
          extractedData = operationalResult.data;
          confidenceScores = operationalResult.confidence;
          break;

        case 'legal':
          const legalResult = await this.extractLegalData(context);
          extractedData = legalResult.data;
          confidenceScores = legalResult.confidence;
          break;
      }

      // Only include fields that weren't already set (unless override is true)
      if (!request.override_existing) {
        extractedData = this.filterExistingFields(deal, extractedData);
      }

      return {
        success: true,
        extracted_fields: extractedData,
        confidence_scores: confidenceScores,
        warnings: this.generateWarnings(extractedData, confidenceScores)
      };

    } catch (error) {
      console.error('Extraction error:', error);
      return {
        success: false,
        extracted_fields: {},
        confidence_scores: {},
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      };
    }
  }

  private buildContext(deal: any, documents: any[]): string {
    let context = `Business: ${deal.business_name}\n`;
    
    if (deal.description) {
      context += `Description: ${deal.description}\n`;
    }
    
    if (deal.listing_url) {
      context += `Listing URL: ${deal.listing_url}\n`;
    }

    // Add any existing data that might help with extraction
    if (deal.industry) context += `Industry: ${deal.industry}\n`;
    if (deal.location) context += `Location: ${deal.city}, ${deal.state}\n`;
    if (deal.annual_revenue) context += `Annual Revenue: $${deal.annual_revenue}\n`;
    if (deal.annual_profit) context += `Annual Profit: $${deal.annual_profit}\n`;

    // Add document summaries if available
    documents.forEach(doc => {
      if (doc.description) {
        context += `\nDocument (${doc.document_type}): ${doc.description}\n`;
      }
    });

    return context;
  }

  private async extractBusinessIdentity(context: string): Promise<{data: Partial<ExtendedDeal>, confidence: Record<string, number>}> {
    const prompt = `
      Based on this business information, extract the following details:
      ${context}

      Extract and provide in JSON format:
      1. brand_name: The primary brand name (if different from business name)
      2. website_url: The business website URL
      3. founding_year: Year the business was founded
      4. legal_entity_type: Type of legal entity (LLC, Corp, etc.)
      5. domain_authority: Estimated domain authority (1-100) based on business description

      Respond with JSON only. Use null for unknown values.
      Also include a "confidence" object with confidence scores (0-100) for each field.
    `;

    const response = await this.callOpenAI([
      { role: 'system', content: 'You are a business data extraction specialist. Extract information accurately and conservatively. Only extract what is clearly stated or strongly implied.' },
      { role: 'user', content: prompt }
    ]);

    try {
      const parsed = JSON.parse(response);
      const { confidence, ...data } = parsed;
      return { data, confidence: confidence || {} };
    } catch {
      return { data: {}, confidence: {} };
    }
  }

  private async extractFinancials(context: string): Promise<{data: Partial<ExtendedDeal>, confidence: Record<string, number>}> {
    const prompt = `
      Based on this business information, extract financial details:
      ${context}

      Extract and provide in JSON format:
      1. gross_margin: Gross margin percentage
      2. ebitda: EBITDA amount
      3. revenue_model: Type of revenue model (Subscription, One-time, Recurring, etc.)
      4. customer_acquisition_cost: CAC if mentioned
      5. customer_lifetime_value: CLV if mentioned
      6. monthly_burn_rate: Monthly burn rate if applicable
      7. cash_on_hand: Available cash
      8. accounts_receivable: AR amount
      9. inventory_value: Value of inventory
      10. total_debt: Total debt amount

      Respond with JSON only. Use null for unknown values.
      Include a "confidence" object with confidence scores (0-100) for each field.
    `;

    const response = await this.callOpenAI([
      { role: 'system', content: 'You are a financial analyst. Extract financial metrics accurately. Only include data that is explicitly stated or can be reliably calculated.' },
      { role: 'user', content: prompt }
    ]);

    try {
      const parsed = JSON.parse(response);
      const { confidence, ...data } = parsed;
      return { data, confidence: confidence || {} };
    } catch {
      return { data: {}, confidence: {} };
    }
  }

  private async extractMarketData(context: string): Promise<{data: Partial<ExtendedDeal>, confidence: Record<string, number>}> {
    const prompt = `
      Based on this business information, extract market-related data:
      ${context}

      Extract and provide in JSON format:
      1. competitors: Array of competitor objects with {name, market_share, strengths[], weaknesses[]}
      2. market_size: Total market size in dollars
      3. market_growth_rate: Annual growth rate percentage
      4. market_share: This business's market share percentage
      5. marketing_channels: Array of marketing channels used
      6. sales_channels: Array of sales channels used
      7. customer_demographics: Object with {age_range, gender_split, geography, income_level}
      8. total_customers: Number of customers
      9. customer_retention_rate: Retention rate percentage
      10. net_promoter_score: NPS if available

      Respond with JSON only. Use null for unknown values.
      Include a "confidence" object with confidence scores (0-100) for each field.
    `;

    const response = await this.callOpenAI([
      { role: 'system', content: 'You are a market research analyst. Extract market data and competitive intelligence. Be conservative with estimates.' },
      { role: 'user', content: prompt }
    ]);

    try {
      const parsed = JSON.parse(response);
      const { confidence, ...data } = parsed;
      return { data, confidence: confidence || {} };
    } catch {
      return { data: {}, confidence: {} };
    }
  }

  private async extractOperationalData(context: string): Promise<{data: Partial<ExtendedDeal>, confidence: Record<string, number>}> {
    const prompt = `
      Based on this business information, extract operational details:
      ${context}

      Extract and provide in JSON format:
      1. employee_count: Number of employees
      2. contractors_count: Number of contractors
      3. key_employees: Array of {role, years, staying} for key personnel
      4. physical_locations: Array of {type, address, owned, size_sqft}
      5. key_assets: Array of key business assets
      6. technology_stack: Array of {category, tool, monthly_cost, essential}
      7. reason_for_selling: Reason the owner is selling

      Respond with JSON only. Use null for unknown values.
      Include a "confidence" object with confidence scores (0-100) for each field.
    `;

    const response = await this.callOpenAI([
      { role: 'system', content: 'You are an operations analyst. Extract operational and infrastructure data accurately.' },
      { role: 'user', content: prompt }
    ]);

    try {
      const parsed = JSON.parse(response);
      const { confidence, ...data } = parsed;
      return { data, confidence: confidence || {} };
    } catch {
      return { data: {}, confidence: {} };
    }
  }

  private async extractDigitalPresence(context: string): Promise<{data: Partial<ExtendedDeal>, confidence: Record<string, number>}> {
    const prompt = `
      Based on this business information, extract digital presence data:
      ${context}

      Extract and provide in JSON format:
      1. social_media: Object with platform URLs {facebook, instagram, linkedin, twitter, youtube}
      2. online_reviews: Object with review data {google: {rating, count}, yelp: {rating, count}}
      3. domain_authority: Estimated domain authority (1-100)

      If you find social media handles or usernames, construct the full URL.
      Respond with JSON only. Use null for unknown values.
      Include a "confidence" object with confidence scores (0-100) for each field.
    `;

    const response = await this.callOpenAI([
      { role: 'system', content: 'You are a digital marketing analyst. Extract online presence data. Construct full URLs when possible.' },
      { role: 'user', content: prompt }
    ]);

    try {
      const parsed = JSON.parse(response);
      const { confidence, ...data } = parsed;
      return { data, confidence: confidence || {} };
    } catch {
      return { data: {}, confidence: {} };
    }
  }

  private async extractLegalData(context: string): Promise<{data: Partial<ExtendedDeal>, confidence: Record<string, number>}> {
    const prompt = `
      Based on this business information, extract legal and compliance data:
      ${context}

      Extract and provide in JSON format:
      1. licenses_permits: Array of {type, status} for required licenses
      2. intellectual_property: Array of {type, name, status} for IP assets
      3. pending_litigation: Boolean indicating if there's pending litigation
      4. litigation_details: Details of any litigation if mentioned

      Respond with JSON only. Use null for unknown values.
      Include a "confidence" object with confidence scores (0-100) for each field.
    `;

    const response = await this.callOpenAI([
      { role: 'system', content: 'You are a legal analyst. Extract legal and compliance information conservatively.' },
      { role: 'user', content: prompt }
    ]);

    try {
      const parsed = JSON.parse(response);
      const { confidence, ...data } = parsed;
      return { data, confidence: confidence || {} };
    } catch {
      return { data: {}, confidence: {} };
    }
  }

  private filterExistingFields(existing: any, extracted: Partial<ExtendedDeal>): Partial<ExtendedDeal> {
    const filtered: Partial<ExtendedDeal> = {};
    
    for (const [key, value] of Object.entries(extracted)) {
      // Only include if the existing value is null, undefined, empty string, or empty array/object
      const existingValue = existing[key];
      if (
        existingValue === null || 
        existingValue === undefined || 
        existingValue === '' ||
        (Array.isArray(existingValue) && existingValue.length === 0) ||
        (typeof existingValue === 'object' && Object.keys(existingValue).length === 0)
      ) {
        filtered[key as keyof ExtendedDeal] = value as any;
      }
    }
    
    return filtered;
  }

  private generateWarnings(data: Partial<ExtendedDeal>, confidence: Record<string, number>): string[] {
    const warnings: string[] = [];
    
    // Check for low confidence scores
    for (const [field, score] of Object.entries(confidence)) {
      if (score < 50) {
        warnings.push(`Low confidence (${score}%) for field: ${field}`);
      }
    }
    
    // Check for critical missing fields
    const criticalFields = ['brand_name', 'website_url', 'revenue_model'];
    for (const field of criticalFields) {
      if (!(field in data)) {
        warnings.push(`Could not extract critical field: ${field}`);
      }
    }
    
    return warnings;
  }

  // Auto-fill from business description
  async autoFillFromDescription(dealId: string, description: string): Promise<AIExtractionResponse> {
    const prompt = `
      Analyze this business description and extract all relevant business details:
      
      ${description}
      
      Extract comprehensive information including:
      - Business identity (brand, website, founding year, entity type)
      - Digital presence (social media URLs, review platforms)
      - Marketing and sales channels
      - Financial metrics and revenue model
      - Team and operational details
      - Market position and competitors
      - Customer metrics
      
      Provide a comprehensive JSON response with all extractable fields.
      Include a "confidence" object with confidence scores for each field.
      Be thorough but conservative - only extract what's clearly stated or strongly implied.
    `;

    try {
      const response = await this.callOpenAI([
        { role: 'system', content: 'You are a business analyst expert at extracting structured data from unstructured text. Be thorough but accurate.' },
        { role: 'user', content: prompt }
      ], { max_tokens: 4000 });

      const parsed = JSON.parse(response);
      const { confidence, ...extractedData } = parsed;

      return {
        success: true,
        extracted_fields: extractedData,
        confidence_scores: confidence || {},
        warnings: this.generateWarnings(extractedData, confidence || {})
      };
    } catch (error) {
      return {
        success: false,
        extracted_fields: {},
        confidence_scores: {},
        errors: ['Failed to parse AI response']
      };
    }
  }
}

export default BusinessDataExtractor;