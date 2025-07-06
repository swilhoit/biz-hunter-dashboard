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
    grossMargin?: number;
    netMargin?: number;
    growthRate?: number;
    cashFlow?: number;
    inventory?: number;
    [key: string]: any;
  };
  businessStory?: {
    foundingStory?: string;
    milestones?: string[];
    challenges?: string[];
    achievements?: string[];
    turningPoints?: string[];
    futureVision?: string;
  };
  marketPosition?: {
    competitiveAdvantages?: string[];
    uniqueSellingPoints?: string[];
    marketShare?: string;
    customerBase?: string;
    brandStrength?: string;
    barriers?: string[];
  };
  operations?: {
    businessModel?: string;
    keyProcesses?: string[];
    suppliers?: string[];
    fulfillmentMethod?: string;
    scalability?: string;
    automation?: string;
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
    ranking?: string;
    reviews?: number;
  }>;
  legal?: {
    entityType?: string;
    jurisdiction?: string;
    liabilities?: string[];
    intellectualProperty?: string[];
    contracts?: string[];
  };
  dates?: {
    established?: string;
    fiscalYearEnd?: string;
    lastUpdated?: string;
    saleTimeline?: string;
  };
  opportunities?: {
    growth?: string[];
    expansion?: string[];
    optimization?: string[];
    untapped?: string[];
  };
  risks?: {
    business?: string[];
    market?: string[];
    operational?: string[];
    financial?: string[];
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
      
      // Use the server endpoint which handles file path encoding properly
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
      } else if (file.type.startsWith('image/')) {
        // Use vision API for images
        const analysis = await DocumentAnalysisService.analyzeDocument(file, progressCallback);
        rawText = this.analysisToText(analysis);
      } else if (file.name.toLowerCase().endsWith('.pdf')) {
        // Handle PDFs with proper text extraction
        progressCallback?.('Processing PDF document...');
        
        try {
          // First try to extract text from the PDF using PDF.js
          console.log('Attempting PDF text extraction for:', file.name);
          const pdfjs = await import('pdfjs-dist');
          
          // Set worker source
          if (pdfjs.GlobalWorkerOptions) {
            pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
            console.log('PDF.js worker configured with version:', pdfjs.version);
          } else {
            console.warn('PDF.js GlobalWorkerOptions not available');
          }
          
          const arrayBuffer = await file.arrayBuffer();
          console.log('PDF arrayBuffer size:', arrayBuffer.byteLength);
          
          const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
          console.log('PDF loaded successfully, pages:', pdf.numPages);
          
          progressCallback?.('Extracting text from PDF pages...');
          
          // Extract text from all pages
          const textPromises = [];
          const maxPages = Math.min(pdf.numPages, 20); // Process up to 20 pages
          
          for (let i = 1; i <= maxPages; i++) {
            progressCallback?.(`Processing page ${i}/${maxPages}...`);
            textPromises.push(
              pdf.getPage(i).then(page => 
                page.getTextContent().then(textContent => {
                  const pageText = textContent.items.map((item: any) => item.str).join(' ');
                  console.log(`Page ${i} text length:`, pageText.length);
                  return pageText;
                })
              )
            );
          }
          
          const pageTexts = await Promise.all(textPromises);
          rawText = pageTexts.join('\n\n');
          
          console.log('Total extracted text length:', rawText.length);
          console.log('Text preview:', rawText.substring(0, 200));
          
          // Check if we got meaningful text
          if (!rawText || rawText.trim().length < 100) {
            console.warn('Insufficient text extracted from PDF:', rawText.length, 'characters');
            throw new Error('PDF appears to be scanned or contains minimal text');
          }
          
          progressCallback?.(`Extracted ${rawText.length} characters from PDF`);
          
        } catch (pdfError) {
          console.error('PDF text extraction failed:', pdfError);
          console.warn('PDF may be scanned or image-based, extracting content differently...');
          progressCallback?.('PDF appears to be scanned, extracting content...');
          
          // For scanned PDFs, use vision API to extract content
          progressCallback?.('PDF appears to be scanned, using AI vision to extract content...');
          
          try {
            // Use the vision API to analyze the scanned PDF
            console.log('Using vision API for scanned PDF analysis');
            const analysis = await DocumentAnalysisService.analyzeDocument(file, progressCallback);
            console.log('Vision analysis completed');
            
            // Convert the analysis to text format
            rawText = this.analysisToText(analysis);
            
            // If we still have minimal content, enhance it with the analysis details
            if (rawText.length < 500 && analysis.keyFindings && analysis.keyFindings.length > 0) {
              const enhancedText = [
                `Business: ${analysis.businessName || file.name}`,
                analysis.description ? `Description: ${analysis.description}` : '',
                '',
                'Financial Information:',
                analysis.annualRevenue ? `- Annual Revenue: $${analysis.annualRevenue.toLocaleString()}` : '',
                analysis.annualProfit ? `- Annual Profit: $${analysis.annualProfit.toLocaleString()}` : '',
                analysis.askingPrice ? `- Asking Price: $${analysis.askingPrice.toLocaleString()}` : '',
                '',
                'Key Findings:',
                ...analysis.keyFindings.map(f => `- ${f}`),
                '',
                'Additional Details:',
                analysis.additionalInfo ? JSON.stringify(analysis.additionalInfo, null, 2) : ''
              ].filter(line => line.trim()).join('\n');
              
              rawText = enhancedText;
            }
            
            console.log('Extracted text length from vision API:', rawText.length);
            
          } catch (visionError) {
            console.error('Vision API extraction failed:', visionError);
            // Check if the analysis returned something useful
            if (rawText && rawText.length > 200) {
              // We got some content from the analysis, use it
              console.log('Using partial content from vision analysis');
            } else {
              // Final fallback - create a more informative placeholder
              rawText = `Scanned PDF Document Analysis
              
Document: ${file.name}
Status: OCR extraction in progress...

This appears to be a scanned or image-based PDF. Our AI is attempting to extract text using advanced OCR technology.

File Details:
- Name: ${file.name}
- Size: ${Math.round(file.size / 1024)}KB
- Type: PDF (scanned/image-based)
- Processing: Vision-based OCR extraction attempted

Note: Scanned PDFs take longer to process. The AI will extract all visible text, financial data, and business information from the document images.

If extraction fails completely, please ensure the PDF contains clear, readable text and try again.`;
            }
          }
        }
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
    const prompt = `You are analyzing a business summary document. Extract ALL relevant information, paying special attention to the business story, context, and strategic details.

Document: ${fileName}
Content: ${text.substring(0, 10000)}

Extract comprehensive information and return as JSON. Look for:
- The founding story and journey of the business
- Key milestones and achievements
- Competitive advantages and market position
- Financial metrics WITH their context (not just numbers)
- Growth trajectory and future potential
- Operational strengths and scalability
- Risks and opportunities

Return as JSON:
{
  "financials": {
    "revenue": number or null,
    "profit": number or null,
    "ebitda": number or null,
    "askingPrice": number or null,
    "multiple": number or null,
    "grossMargin": number or null,
    "netMargin": number or null,
    "growthRate": number or null,
    "cashFlow": number or null,
    "inventory": number or null
  },
  "businessStory": {
    "foundingStory": "How and why the business was started",
    "milestones": ["Key achievements and growth points"],
    "challenges": ["Obstacles overcome"],
    "achievements": ["Notable successes"],
    "turningPoints": ["Critical moments that shaped the business"],
    "futureVision": "Where the business is headed"
  },
  "marketPosition": {
    "competitiveAdvantages": ["What makes this business stand out"],
    "uniqueSellingPoints": ["USPs"],
    "marketShare": "Position in market",
    "customerBase": "Customer demographics and loyalty",
    "brandStrength": "Brand recognition and value",
    "barriers": ["Barriers to entry for competitors"]
  },
  "operations": {
    "businessModel": "How the business operates",
    "keyProcesses": ["Core operational processes"],
    "suppliers": ["Key supplier relationships"],
    "fulfillmentMethod": "FBA/FBM/Hybrid",
    "scalability": "Ability to scale",
    "automation": "Level of automation"
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
      "revenue": number or null,
      "ranking": "BSR or category ranking",
      "reviews": number or null
    }
  ],
  "legal": {
    "entityType": string or null,
    "jurisdiction": string or null,
    "liabilities": [],
    "intellectualProperty": ["Trademarks, patents, etc"],
    "contracts": ["Key contracts or agreements"]
  },
  "dates": {
    "established": string or null,
    "fiscalYearEnd": string or null,
    "lastUpdated": string or null,
    "saleTimeline": "Expected sale timeline"
  },
  "opportunities": {
    "growth": ["Growth opportunities"],
    "expansion": ["Expansion possibilities"],
    "optimization": ["Areas for improvement"],
    "untapped": ["Untapped potential"]
  },
  "risks": {
    "business": ["Business-specific risks"],
    "market": ["Market-related risks"],
    "operational": ["Operational risks"],
    "financial": ["Financial risks"]
  }
}

IMPORTANT: Extract actual details from the document, not generic placeholders. If information is not present, use null or empty array.`;

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
    // Check if we have actual content to summarize
    if (!text || text.trim().length < 50) {
      return 'Document content could not be extracted. Manual review is recommended to access the information in this document.';
    }
    
    // Check if this is a scanned PDF or failed extraction
    if (!text || text.trim().length < 50 || 
        (text.includes('PDF could not be text-extracted') && text.includes('scanned document')) ||
        text.includes('Scanned PDF Document:') ||
        text.includes('could not be automatically processed')) {
      // Generate a more helpful summary for scanned PDFs
      return `This appears to be a scanned or image-based PDF document that could not be automatically processed. The document likely contains important business information that requires manual review.

**Document Status**: Unable to extract text automatically
**Document Type**: ${structuredData?.documentType || 'Business Document'} (Scanned/Image PDF)

**Next Steps**:
1. Download the document to review manually
2. Use OCR software to extract text if needed
3. Look for key business metrics:
   • Financial performance (revenue, profit, EBITDA)
   • Business valuation and asking price
   • Operational details and business model
   • Market position and competitive advantages
   • Growth opportunities and risk factors

**Note**: Once the document is converted to a text-searchable format, it can be re-uploaded for automated analysis and data extraction.`;
    }
    
    const prompt = `Generate a comprehensive summary of this business acquisition document that captures both the metrics AND the story.

Key data extracted:
${JSON.stringify(structuredData, null, 2)}

Document content:
${text.substring(0, 6000)}

Write a 3-4 paragraph summary that includes:

1. **Business Overview & Story**: What is this business, how did it start, and what makes it unique? Include the founding story, key milestones, and what the business has achieved.

2. **Financial Performance & Context**: Don't just list numbers - explain what they mean. How has the business grown? What's the trajectory? Include revenue, profit, margins, and valuation in context.

3. **Strategic Position & Opportunity**: What are the competitive advantages? What's the market position? What opportunities exist for a new owner? Include barriers to entry and growth potential.

4. **Key Insights & Considerations**: What are the most important things a potential buyer should know? Include both opportunities and risks.

IMPORTANT: Write in a narrative style that tells the business's story while incorporating the metrics. This should read like an executive summary that gives the full picture, not just a data dump.`;

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
    const data = extraction.structured_data;

    // Extract financial insights with context
    if (data.financials) {
      const fin = data.financials;
      
      if (fin.revenue) {
        insights.push({
          extraction_id: extraction.id,
          insight_type: 'financial_metric',
          insight_category: 'revenue',
          title: 'Annual Revenue',
          description: `Annual revenue of $${fin.revenue.toLocaleString()}${fin.growthRate ? ` with ${fin.growthRate}% growth rate` : ''}`,
          value: fin.revenue,
          confidence: 0.9
        });
      }

      if (fin.profit && fin.netMargin) {
        insights.push({
          extraction_id: extraction.id,
          insight_type: 'financial_metric',
          insight_category: 'profit',
          title: 'Profitability',
          description: `Annual profit of $${fin.profit.toLocaleString()} (${fin.netMargin}% net margin)`,
          value: { profit: fin.profit, margin: fin.netMargin },
          confidence: 0.9
        });
      }

      if (fin.multiple && fin.askingPrice) {
        insights.push({
          extraction_id: extraction.id,
          insight_type: 'financial_metric',
          insight_category: 'general',
          title: 'Valuation',
          description: `Asking price of $${fin.askingPrice.toLocaleString()} at ${fin.multiple}x multiple`,
          value: { askingPrice: fin.askingPrice, multiple: fin.multiple },
          confidence: 0.85
        });
      }
    }

    // Extract business story insights
    if (data.businessStory) {
      if (data.businessStory.milestones?.length > 0) {
        insights.push({
          extraction_id: extraction.id,
          insight_type: 'key_term',
          insight_category: 'general',
          title: 'Key Milestones',
          description: `Business milestones: ${data.businessStory.milestones.slice(0, 3).join('; ')}`,
          value: data.businessStory.milestones,
          confidence: 0.85
        });
      }

      if (data.businessStory.achievements?.length > 0) {
        insights.push({
          extraction_id: extraction.id,
          insight_type: 'opportunity',
          insight_category: 'market',
          title: 'Proven Success',
          description: `Notable achievements: ${data.businessStory.achievements.slice(0, 2).join('; ')}`,
          value: data.businessStory.achievements,
          confidence: 0.8
        });
      }
    }

    // Extract competitive advantages
    if (data.marketPosition?.competitiveAdvantages?.length > 0) {
      insights.push({
        extraction_id: extraction.id,
        insight_type: 'opportunity',
        insight_category: 'market',
        title: 'Competitive Advantages',
        description: `Key advantages: ${data.marketPosition.competitiveAdvantages.slice(0, 3).join('; ')}`,
        value: data.marketPosition.competitiveAdvantages,
        confidence: 0.85
      });
    }

    // Extract growth opportunities
    if (data.opportunities?.growth?.length > 0) {
      insights.push({
        extraction_id: extraction.id,
        insight_type: 'opportunity',
        insight_category: 'market',
        title: 'Growth Potential',
        description: `Growth opportunities: ${data.opportunities.growth.slice(0, 3).join('; ')}`,
        value: data.opportunities.growth,
        confidence: 0.8
      });
    }

    // Extract specific risks
    if (data.risks) {
      const allRisks = [
        ...(data.risks.business || []),
        ...(data.risks.market || []),
        ...(data.risks.operational || []),
        ...(data.risks.financial || [])
      ];
      
      if (allRisks.length > 0) {
        insights.push({
          extraction_id: extraction.id,
          insight_type: 'risk_factor',
          insight_category: 'general',
          title: 'Identified Risks',
          description: `Key risks: ${allRisks.slice(0, 3).join('; ')}`,
          value: data.risks,
          confidence: 0.75
        });
      }
    }

    // Extract operational insights
    if (data.operations) {
      if (data.operations.scalability) {
        insights.push({
          extraction_id: extraction.id,
          insight_type: 'opportunity',
          insight_category: 'operations',
          title: 'Scalability',
          description: `Scalability assessment: ${data.operations.scalability}`,
          value: data.operations.scalability,
          confidence: 0.8
        });
      }

      if (data.operations.fulfillmentMethod) {
        insights.push({
          extraction_id: extraction.id,
          insight_type: 'key_term',
          insight_category: 'operations',
          title: 'Fulfillment Method',
          description: `Uses ${data.operations.fulfillmentMethod} fulfillment`,
          value: data.operations.fulfillmentMethod,
          confidence: 0.9
        });
      }
    }

    // Extract product insights
    if (data.products?.length > 0) {
      const topProducts = data.products.slice(0, 3);
      insights.push({
        extraction_id: extraction.id,
        insight_type: 'product_info',
        insight_category: 'product',
        title: 'Product Portfolio',
        description: `Key products: ${topProducts.map(p => p.name).join(', ')}`,
        value: topProducts,
        confidence: 0.85
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
    if (analysis.askingPrice && analysis.askingPrice > 0) parts.push(`Asking Price: $${analysis.askingPrice.toLocaleString()}`);
    if (analysis.annualRevenue && analysis.annualRevenue > 0) parts.push(`Annual Revenue: $${analysis.annualRevenue.toLocaleString()}`);
    if (analysis.annualProfit && analysis.annualProfit > 0) parts.push(`Annual Profit: $${analysis.annualProfit.toLocaleString()}`);
    if (analysis.monthlyRevenue && analysis.monthlyRevenue > 0) parts.push(`Monthly Revenue: $${analysis.monthlyRevenue.toLocaleString()}`);
    if (analysis.monthlyProfit && analysis.monthlyProfit > 0) parts.push(`Monthly Profit: $${analysis.monthlyProfit.toLocaleString()}`);
    
    if (analysis.keyFindings && analysis.keyFindings.length > 0) {
      parts.push(`Key Findings:\n${analysis.keyFindings.map(f => `- ${f}`).join('\n')}`);
    }
    
    // If we have very little content, indicate extraction issues
    if (parts.length === 0 || (parts.length === 1 && parts[0].includes('PDF document'))) {
      return 'Document analysis yielded limited results. The document may be a scanned image or contain non-extractable content. Manual review recommended.';
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