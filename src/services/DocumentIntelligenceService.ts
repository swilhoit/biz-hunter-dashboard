import { supabase } from '../lib/supabase';
import { DocumentExtractors } from './DocumentExtractors';
import { AIAnalysisService, DocumentAnalysis, DocumentAnalysisService } from './AIAnalysisService';

/**
 * Document Intelligence Service
 * Manages persistent extraction, storage, and retrieval of document insights
 */

// Types
export interface DocumentExtraction {
  id: string;
  document_id: string;
  deal_id: string;
  extraction_date: string;
  extraction_version: string;
  file_hash: string;
  raw_text: string;
  structured_data: StructuredData;
  key_entities: KeyEntities;
  summary: string;
  document_type: DocumentType;
  confidence_score: number;
  language: string;
  search_vector?: string;
  embedding?: number[];
  created_at: string;
  updated_at: string;
}

export interface StructuredData {
  financials?: {
    revenue?: number;
    profit?: number;
    ebitda?: number;
    askingPrice?: number;
    multiple?: number;
    [key: string]: any;
  };
  contacts?: Array<{
    name: string;
    role: string;
    email?: string;
    phone?: string;
  }>;
  products?: Array<{
    name: string;
    asin?: string;
    category?: string;
    revenue?: number;
  }>;
  legal?: {
    entityType?: string;
    jurisdiction?: string;
    liabilities?: string[];
  };
  dates?: {
    established?: string;
    fiscalYearEnd?: string;
    lastUpdated?: string;
  };
  [key: string]: any;
}

export interface KeyEntities {
  companies: string[];
  people: string[];
  locations: string[];
  dates: string[];
  amounts: number[];
  products: string[];
}

export interface DocumentInsight {
  id?: string;
  extraction_id: string;
  insight_type: InsightType;
  insight_category: InsightCategory;
  title: string;
  description: string;
  value: any;
  confidence: number;
  source_page?: number;
  source_section?: string;
  created_at?: string;
}

export type DocumentType = 
  | 'financial_statement'
  | 'tax_return'
  | 'bank_statement'
  | 'contract'
  | 'correspondence'
  | 'legal_document'
  | 'product_catalog'
  | 'marketing_material'
  | 'due_diligence'
  | 'other';

export type InsightType = 
  | 'financial_metric'
  | 'risk_factor'
  | 'opportunity'
  | 'key_term'
  | 'important_date'
  | 'contact_info'
  | 'product_info'
  | 'legal_info';

export type InsightCategory = 
  | 'revenue'
  | 'profit'
  | 'operations'
  | 'legal'
  | 'market'
  | 'product'
  | 'customer'
  | 'supplier'
  | 'general';

const supabaseAny: any = supabase;

export class DocumentIntelligenceService {
  private readonly EXTRACTION_VERSION = '1.0';

  constructor() {
    // No-op
  }

  private async _callOpenAIProxy(task: string, payload: any) {
          const response = await fetch('http://localhost:3002/api/ai/openai-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task, payload }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`OpenAI proxy call for task ${task} failed:`, response.status, errorData);
      throw new Error(`Failed to execute AI task: ${task}`);
    }

    return response.json();
  }

  /**
   * Process a document and extract intelligence
   */
  async processDocument(
    documentId: string, 
    dealId: string,
    progressCallback?: (stage: string) => void
  ): Promise<DocumentExtraction> {
    try {
      // Check if extraction already exists
      const existing = await this.getExistingExtraction(documentId);
      if (existing) {
        progressCallback?.('Using cached extraction');
        return existing;
      }

      progressCallback?.('Fetching document...');
      
      // Get document metadata
      const { data: document, error } = await supabaseAny
        .from('deal_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error || !document) {
        throw new Error('Document not found');
      }

      // Download document content from server
      progressCallback?.('Downloading document...');
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
      const response = await fetch(`${API_BASE_URL}/api/files/download/${documentId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to download document: ${response.status} ${response.statusText}`);
      }

      const fileData = await response.blob();

      // Calculate file hash using Web Crypto API
      const fileBuffer = await fileData.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Convert to File object for extraction
      const file = new File([fileData], document.file_name || 'document', {
        type: document.mime_type || 'application/octet-stream'
      });

      // Extract text content
      progressCallback?.('Extracting content...');
      let rawText = '';
      
      if (DocumentExtractors.canExtractText(file.name)) {
        rawText = await DocumentExtractors.extractTextFromFile(file);
      } else if (file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.pdf')) {
        // Use vision API for images and PDFs
        const analysis = await DocumentAnalysisService.analyzeDocument(file, progressCallback);
        rawText = this.analysisToText(analysis);
      } else {
        throw new Error('Unsupported file type for extraction');
      }

      // Analyze content with AI
      progressCallback?.('Analyzing content with AI...');
      const structuredData = await this.extractStructuredData(rawText, file.name);
      const keyEntities = await this.extractKeyEntities(rawText);
      const summary = await this.generateSummary(rawText, structuredData);
      const documentType = await this.classifyDocument(rawText, file.name);
      
      // Generate embedding for semantic search
      progressCallback?.('Generating search embedding...');
      const embedding = await this.generateEmbedding(rawText);

      // Store extraction
      progressCallback?.('Saving extraction...');
      const extraction: Partial<DocumentExtraction> = {
        document_id: documentId,
        deal_id: dealId,
        file_hash: hash,
        raw_text: rawText,
        structured_data: structuredData,
        key_entities: keyEntities,
        summary: summary,
        document_type: documentType,
        confidence_score: this.calculateConfidence(structuredData, keyEntities),
        language: 'en',
        extraction_version: this.EXTRACTION_VERSION,
        embedding: embedding
      };

      const { data: savedExtraction, error: saveError } = await supabaseAny
        .from('document_extractions')
        .insert(extraction)
        .select()
        .single();

      if (saveError) {
        throw new Error(`Failed to save extraction: ${saveError.message}`);
      }

      // Extract and save insights
      progressCallback?.('Extracting insights...');
      const insights = await this.extractInsights(savedExtraction);
      await this.saveInsights(insights);

      progressCallback?.('Extraction complete!');
      return savedExtraction;

    } catch (error) {
      console.error('Document processing error:', error);
      throw error;
    }
  }

  /**
   * Get existing extraction if available
   */
  private async getExistingExtraction(documentId: string): Promise<DocumentExtraction | null> {
    const { data, error } = await supabaseAny
      .from('document_extractions')
      .select('*')
      .eq('document_id', documentId)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  }

  /**
   * Extract structured data from text
   */
  private async extractStructuredData(text: string, fileName: string): Promise<StructuredData> {
    const prompt = `Extract structured data from this business document.

Document: ${fileName}
Content: ${text.substring(0, 8000)}

Extract and return as JSON:
{
  "financials": {
    "revenue": number or null,
    "profit": number or null,
    "ebitda": number or null,
    "askingPrice": number or null,
    "multiple": number or null,
    "margins": {},
    "growth": {}
  },
  "contacts": [
    {
      "name": string,
      "role": string,
      "email": string or null,
      "phone": string or null
    }
  ],
  "products": [
    {
      "name": string,
      "asin": string or null,
      "category": string or null,
      "revenue": number or null
    }
  ],
  "legal": {
    "entityType": string or null,
    "jurisdiction": string or null,
    "liabilities": []
  },
  "dates": {
    "established": string or null,
    "fiscalYearEnd": string or null,
    "lastUpdated": string or null
  }
}

Return ONLY valid JSON.`;

    const payload = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a document analysis expert. Extract structured data accurately.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 2000
    };

    try {
      const response = await this._callOpenAIProxy('chat.completions.create', payload);
      return JSON.parse(response.choices[0]?.message?.content || '{}');
    } catch {
      return {};
    }
  }

  /**
   * Extract key entities from text
   */
  private async extractKeyEntities(text: string): Promise<KeyEntities> {
    const prompt = `Extract key entities from this business document.

Content: ${text.substring(0, 6000)}

Return as JSON:
{
  "companies": ["company names"],
  "people": ["person names"],
  "locations": ["cities, states, countries"],
  "dates": ["important dates"],
  "amounts": [numeric amounts],
  "products": ["product or service names"]
}`;

    const payload = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an entity extraction expert. Extract entities accurately.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 1000
    };

    try {
      const response = await this._callOpenAIProxy('chat.completions.create', payload);
      return JSON.parse(response.choices[0]?.message?.content || '{}');
    } catch {
      return {
        companies: [],
        people: [],
        locations: [],
        dates: [],
        amounts: [],
        products: []
      };
    }
  }

  /**
   * Generate document summary
   */
  private async generateSummary(text: string, structuredData: StructuredData): Promise<string> {
    const prompt = `Generate a concise summary of this business document.

Key data extracted:
${JSON.stringify(structuredData, null, 2)}

Document content:
${text.substring(0, 4000)}

Write a 2-3 paragraph summary highlighting:
1. Document type and purpose
2. Key financial metrics or business information
3. Important findings or notable items`;

    const payload = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a business document analyst. Write clear, concise summaries.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 500
    };

    const response = await this._callOpenAIProxy('chat.completions.create', payload);
    return response.choices[0]?.message?.content || 'Summary not available';
  }

  /**
   * Classify document type
   */
  private async classifyDocument(text: string, fileName: string): Promise<DocumentType> {
    const prompt = `Classify this business document into one of these categories:
- financial_statement
- tax_return
- bank_statement
- contract
- correspondence
- legal_document
- product_catalog
- marketing_material
- due_diligence
- other

Filename: ${fileName}
Content preview: ${text.substring(0, 2000)}

Return only the category name.`;

    const payload = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 50
    };

    const response = await this._callOpenAIProxy('chat.completions.create', payload);
    const category = response.choices[0]?.message?.content?.trim().toLowerCase();
    return (category as DocumentType) || 'other';
  }

  /**
   * Generate embedding for semantic search
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const payload = {
      model: 'text-embedding-3-small',
      input: text.substring(0, 8000), // Limit to token constraints
    };

    try {
      const response = await this._callOpenAIProxy('embeddings.create', payload);
      return response.data[0].embedding;
    } catch (error) {
      console.error('Embedding generation error:', error);
      return [];
    }
  }

  /**
   * Extract insights from document
   */
  private async extractInsights(extraction: DocumentExtraction): Promise<DocumentInsight[]> {
    const insights: DocumentInsight[] = [];

    // Extract financial insights
    if (extraction.structured_data.financials) {
      const fin = extraction.structured_data.financials;
      
      if (fin.revenue) {
        insights.push({
          extraction_id: extraction.id,
          insight_type: 'financial_metric',
          insight_category: 'revenue',
          title: 'Annual Revenue',
          description: `Document shows annual revenue of $${fin.revenue.toLocaleString()}`,
          value: fin.revenue,
          confidence: 0.9
        });
      }

      if (fin.profit) {
        insights.push({
          extraction_id: extraction.id,
          insight_type: 'financial_metric',
          insight_category: 'profit',
          title: 'Annual Profit',
          description: `Document shows annual profit of $${fin.profit.toLocaleString()}`,
          value: fin.profit,
          confidence: 0.9
        });
      }

      if (fin.multiple) {
        insights.push({
          extraction_id: extraction.id,
          insight_type: 'financial_metric',
          insight_category: 'general',
          title: 'Valuation Multiple',
          description: `Business valued at ${fin.multiple}x`,
          value: fin.multiple,
          confidence: 0.85
        });
      }
    }

    // Extract risk insights
    const riskKeywords = ['risk', 'liability', 'lawsuit', 'compliance', 'violation'];
    const riskMatches = riskKeywords.filter(keyword => 
      extraction.raw_text.toLowerCase().includes(keyword)
    );

    if (riskMatches.length > 0) {
      insights.push({
        extraction_id: extraction.id,
        insight_type: 'risk_factor',
        insight_category: 'legal',
        title: 'Potential Risk Indicators',
        description: `Document contains risk-related keywords: ${riskMatches.join(', ')}`,
        value: { keywords: riskMatches },
        confidence: 0.7
      });
    }

    // Extract opportunity insights
    const opportunityKeywords = ['growth', 'expansion', 'potential', 'opportunity', 'untapped'];
    const opportunityMatches = opportunityKeywords.filter(keyword => 
      extraction.raw_text.toLowerCase().includes(keyword)
    );

    if (opportunityMatches.length > 0) {
      insights.push({
        extraction_id: extraction.id,
        insight_type: 'opportunity',
        insight_category: 'market',
        title: 'Growth Opportunities',
        description: `Document mentions growth-related terms: ${opportunityMatches.join(', ')}`,
        value: { keywords: opportunityMatches },
        confidence: 0.7
      });
    }

    return insights;
  }

  /**
   * Save insights to database
   */
  private async saveInsights(insights: DocumentInsight[]): Promise<void> {
    if (insights.length === 0) return;

    const { error } = await supabaseAny
      .from('document_insights')
      .insert(insights);

    if (error) {
      console.error('Failed to save insights:', error);
    }
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(structuredData: StructuredData, entities: KeyEntities): number {
    let score = 0.5; // Base score

    // Increase confidence based on data completeness
    if (structuredData.financials && Object.keys(structuredData.financials).length > 0) score += 0.2;
    if (structuredData.contacts && structuredData.contacts.length > 0) score += 0.1;
    if (entities.companies.length > 0) score += 0.1;
    if (entities.amounts.length > 0) score += 0.1;

    return Math.min(1.0, score);
  }

  /**
   * Convert DocumentAnalysis to text
   */
  private analysisToText(analysis: DocumentAnalysis): string {
    const parts: string[] = [];
    
    if (analysis.businessName) parts.push(`Business: ${analysis.businessName}`);
    if (analysis.description) parts.push(`Description: ${analysis.description}`);
    if (analysis.askingPrice) parts.push(`Asking Price: $${analysis.askingPrice}`);
    if (analysis.annualRevenue) parts.push(`Annual Revenue: $${analysis.annualRevenue}`);
    if (analysis.annualProfit) parts.push(`Annual Profit: $${analysis.annualProfit}`);
    
    if (analysis.keyFindings && analysis.keyFindings.length > 0) {
      parts.push(`Key Findings: ${analysis.keyFindings.join('; ')}`);
    }

    return parts.join('\n\n');
  }

  /**
   * Query insights across documents for a deal
   */
  async queryDealInsights(
    dealId: string, 
    query?: {
      insightTypes?: InsightType[];
      categories?: InsightCategory[];
      searchText?: string;
    }
  ): Promise<DocumentInsight[]> {
    let queryBuilder = supabaseAny
      .from('document_insights')
      .select(`
        *,
        document_extractions!inner(
          deal_id,
          document_type,
          summary
        )
      `)
      .eq('document_extractions.deal_id', dealId);

    if (query?.insightTypes && query.insightTypes.length > 0) {
      queryBuilder = queryBuilder.in('insight_type', query.insightTypes);
    }

    if (query?.categories && query.categories.length > 0) {
      queryBuilder = queryBuilder.in('insight_category', query.categories);
    }

    if (query?.searchText) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query.searchText}%,description.ilike.%${query.searchText}%`);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('Failed to query insights:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get document summary for a deal
   */
  async getDealDocumentSummary(dealId: string): Promise<{
    totalDocuments: number;
    byType: Record<DocumentType, number>;
    keyFindings: string[];
    riskFactors: string[];
    opportunities: string[];
  }> {
    // Get all extractions for the deal
    const { data: extractions, error } = await supabaseAny
      .from('document_extractions')
      .select('*')
      .eq('deal_id', dealId);

    if (error || !extractions) {
      return {
        totalDocuments: 0,
        byType: {} as Record<DocumentType, number>,
        keyFindings: [],
        riskFactors: [],
        opportunities: []
      };
    }

    // Count by type
    const byType = extractions.reduce((acc, ext) => {
      acc[ext.document_type] = (acc[ext.document_type] || 0) + 1;
      return acc;
    }, {} as Record<DocumentType, number>);

    // Get insights
    const insights = await this.queryDealInsights(dealId);
    
    const keyFindings = insights
      .filter(i => i.insight_type === 'financial_metric' || i.insight_type === 'key_term')
      .map(i => i.description)
      .slice(0, 5);

    const riskFactors = insights
      .filter(i => i.insight_type === 'risk_factor')
      .map(i => i.description)
      .slice(0, 5);

    const opportunities = insights
      .filter(i => i.insight_type === 'opportunity')
      .map(i => i.description)
      .slice(0, 5);

    return {
      totalDocuments: extractions.length,
      byType,
      keyFindings,
      riskFactors,
      opportunities
    };
  }
}