
import { supabase } from '../lib/supabase';
import { DocumentExtractors } from './DocumentExtractors';
import { DocumentAnalysisService } from './AIAnalysisService';

/**
 * Financial Document Processing Service
 * Specialized service for extracting and processing financial data from documents
 */

// Types
export interface FinancialExtraction {
  id?: string;
  deal_id: string;
  document_id: string;
  extraction_type: string;
  extracted_data?: any;
  extraction_date: string;
  financial_data: DetailedFinancials;
  period_covered: PeriodInfo;
  document_type: FinancialDocumentType;
  confidence_scores: ConfidenceScores;
  validation_status: ValidationStatus;
  extracted_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface DetailedFinancials {
  // Income Statement
  revenue: {
    total: number;
    breakdown?: {
      products?: number;
      services?: number;
      subscriptions?: number;
      other?: number;
    };
    byMonth?: Record<string, number>;
  };
  cogs: {
    total: number;
    breakdown?: {
      materials?: number;
      labor?: number;
      shipping?: number;
      other?: number;
    };
  };
  grossProfit: number;
  operatingExpenses: {
    total: number;
    breakdown?: {
      salaries?: number;
      rent?: number;
      utilities?: number;
      marketing?: number;
      insurance?: number;
      legal?: number;
      other?: number;
    };
  };
  ebitda: number;
  netIncome: number;
  
  // Balance Sheet
  assets: {
    current: {
      total: number;
      cash?: number;
      receivables?: number;
      inventory?: number;
      prepaid?: number;
    };
    fixed: {
      total: number;
      property?: number;
      equipment?: number;
      intangibles?: number;
    };
    total: number;
  };
  liabilities: {
    current: {
      total: number;
      payables?: number;
      accrued?: number;
      shortTermDebt?: number;
    };
    longTerm: {
      total: number;
      loans?: number;
      bonds?: number;
      other?: number;
    };
    total: number;
  };
  equity: {
    total: number;
    retainedEarnings?: number;
    paidInCapital?: number;
  };
  
  // Cash Flow
  cashFlow?: {
    operating: number;
    investing: number;
    financing: number;
    netChange: number;
    beginningCash?: number;
    endingCash?: number;
  };
  
  // Key Metrics
  metrics: {
    grossMargin: number;
    operatingMargin: number;
    netMargin: number;
    currentRatio?: number;
    quickRatio?: number;
    debtToEquity?: number;
    roe?: number;
    roa?: number;
    workingCapital?: number;
  };
  
  // Margins (simplified structure)
  margins?: {
    gross: number;
    operating: number;
    net: number;
  };
}

export interface PeriodInfo {
  startDate: string;
  endDate: string;
  periodType: 'annual' | 'quarterly' | 'monthly' | 'ytd';
  isPartial?: boolean;
}

export interface ConfidenceScores {
  overall: number;
  revenue: number;
  expenses: number;
  profitability: number;
  balanceSheet: number;
  cashFlow: number;
}

export interface ValidationStatus {
  isValidated: boolean;
  validatedBy?: string;
  validatedAt?: string;
  issues?: ValidationIssue[];
}

export interface ValidationIssue {
  field: string;
  issue: string;
  severity: 'error' | 'warning' | 'info';
}

export type FinancialDocumentType = 
  | 'income_statement'
  | 'balance_sheet'
  | 'cash_flow'
  | 'tax_return'
  | 'bank_statement'
  | 'financial_summary'
  | 'management_report';

const supabaseAny: any = supabase;

export class FinancialDocumentService {
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
      console.error('Request payload was:', JSON.stringify(payload).substring(0, 500));
      throw new Error(`Failed to execute AI task: ${task} - ${errorData.error || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Extract financial data from a document without saving
   */
  async extractFinancialData(
    documentId: string,
    dealId: string,
    progressCallback?: (stage: string) => void
  ): Promise<FinancialExtraction> {
    try {
      progressCallback?.('Starting financial document processing...');
      
      // Get document metadata
      const { data: document, error } = await supabaseAny
        .from('deal_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error || !document) {
        throw new Error('Document not found');
      }

      // Download document
      progressCallback?.('Downloading document...');
      
      let file: File;
      
      try {
        // Use server endpoint for reliable file downloads
        console.log('📁 Downloading document via server:', documentId);
        
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
        const response = await fetch(`${API_BASE_URL}/api/files/download/${documentId}`);
        
        if (!response.ok) {
          throw new Error(`Server download failed: ${response.status} ${response.statusText}`);
        }

        const fileData = await response.blob();
        
        // Convert to File object
        file = new File([fileData], document.file_name || 'document', {
          type: document.mime_type || 'application/octet-stream'
        });
        
        console.log('✅ Server download successful');
        
      } catch (directDownloadError) {
        console.warn('⚠️ Direct download failed, trying server endpoint:', directDownloadError);
        
        // Fallback: use server endpoint for download
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
        const response = await fetch(`${API_BASE_URL}/api/files/download/${documentId}`);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server download failed: ${errorText}`);
        }

        const blob = await response.blob();
        file = new File([blob], document.file_name || 'document', {
          type: document.mime_type || 'application/octet-stream'
        });
        
        console.log('✅ Server endpoint download successful');
      }

      // Extract text content
      progressCallback?.('Extracting document content...');
      let documentContent = '';
      let useHybridApproach = false;
      
      if (DocumentExtractors.canExtractText(file.name)) {
        console.log('📄 Extracting text from file:', file.name);
        documentContent = await DocumentExtractors.extractTextFromFile(file);
        console.log('📄 Extracted content length:', documentContent.length);
        console.log('📄 Content preview:', documentContent.substring(0, 500));
        
        // For Excel files, consider hybrid approach for complex layouts
        if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
          console.log('📊 Excel file detected. First 1000 chars:', documentContent.substring(0, 1000));
          
          // Check if the spreadsheet seems complex (many empty cells, unclear structure)
          const lines = documentContent.split('\n');
          const emptyRatio = lines.filter(line => line.split(',').filter(cell => cell.trim() === '').length > 5).length / lines.length;
          
          if (emptyRatio > 0.3 || documentContent.length > 50000) {
            console.log('📊 Complex spreadsheet detected, will use hybrid approach');
            useHybridApproach = true;
          }
        }
      } else if (file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.pdf')) {
        // Use vision API for images and PDFs
        const analysis = await DocumentAnalysisService.analyzeDocument(file, progressCallback);
        documentContent = this.documentAnalysisToText(analysis);
      }

      // Identify document type
      progressCallback?.('Identifying document type...');
      const documentType = await this.identifyFinancialDocumentType(documentContent, file.name);

      // Extract financial data based on document type
      progressCallback?.('Extracting financial data...');
      console.log('💰 Extracting financial data for document type:', documentType);
      
      let financialData: DetailedFinancials;
      if (useHybridApproach) {
        financialData = await this.extractWithHybridApproach(file, documentContent, documentType, progressCallback);
      } else {
        financialData = await this.extractFinancialDataFromContent(documentContent, documentType);
      }
      
      console.log('💰 Extracted financial data:', JSON.stringify(financialData, null, 2).substring(0, 500));

      // Extract period information
      progressCallback?.('Identifying reporting period...');
      let periodInfo;
      try {
        periodInfo = await this.extractPeriodInfo(documentContent, documentType, financialData);
        console.log('📅 Period info extracted:', periodInfo);
      } catch (error) {
        console.error('⚠️ Failed to extract period info:', error);
        // Use default period based on financial data if available
        if (financialData?.revenue?.byMonth && Object.keys(financialData.revenue.byMonth).length > 0) {
          const months = Object.keys(financialData.revenue.byMonth).sort();
          periodInfo = {
            startDate: `${months[0]}-01`,
            endDate: `${months[months.length - 1]}-${new Date(parseInt(months[months.length - 1].split('-')[0]), parseInt(months[months.length - 1].split('-')[1]), 0).getDate()}`,
            periodType: 'annual' as const,
            isPartial: months.length % 12 !== 0
          };
        } else {
          const currentYear = new Date().getFullYear();
          periodInfo = {
            startDate: `${currentYear}-01-01`,
            endDate: `${currentYear}-12-31`,
            periodType: 'annual' as const,
            isPartial: false
          };
        }
      }

      // Calculate confidence scores
      console.log('📊 Calculating confidence scores...');
      const confidenceScores = this.calculateConfidenceScores(financialData);
      console.log('📊 Confidence scores:', confidenceScores);

      // Validate extracted data
      progressCallback?.('Validating financial data...');
      const validationStatus = this.validateFinancialData(financialData, documentType);
      console.log('✅ Validation status:', validationStatus);

      // Get user info for extracted_by
      let userId = 'system';
      try {
        const { data: { user } } = await supabaseAny.auth.getUser();
        userId = user?.id || 'system';
      } catch (error) {
        console.warn('⚠️ Could not get user info:', error);
      }

      // Create extraction record
      const extraction: FinancialExtraction = {
        deal_id: dealId,
        document_id: documentId,
        extraction_type: 'financial',
        extracted_data: financialData, // Store the same data in extracted_data for compatibility
        extraction_date: new Date().toISOString(),
        financial_data: financialData,
        period_covered: periodInfo,
        document_type: documentType,
        confidence_scores: confidenceScores,
        validation_status: validationStatus,
        extracted_by: userId
      };

      progressCallback?.('Financial extraction complete!');
      console.log('✨ Returning extraction for modal:', {
        dealId: extraction.deal_id,
        hasFinancialData: !!extraction.financial_data,
        revenue: extraction.financial_data?.revenue?.total,
        netIncome: extraction.financial_data?.netIncome
      });
      console.log('✨ Full extraction object being returned:', extraction);
      return extraction;

    } catch (error) {
      console.error('Financial document processing error:', error);
      throw error;
    }
  }

  /**
   * Save confirmed financial extraction to database
   */
  async saveFinancialExtraction(
    extraction: FinancialExtraction,
    progressCallback?: (stage: string) => void
  ): Promise<FinancialExtraction> {
    try {
      console.log('💾 saveFinancialExtraction called with:', {
        dealId: extraction.deal_id,
        hasData: !!extraction.financial_data,
        revenue: extraction.financial_data?.revenue?.total
      });
      progressCallback?.('Saving extraction results...');
      
      const { data: saved, error: saveError } = await supabaseAny
        .from('financial_extractions')
        .insert(extraction)
        .select()
        .single();

      if (saveError) {
        throw new Error(`Failed to save extraction: ${saveError.message}`);
      }

      // Update deal financials if validated
      if (extraction.validation_status.isValidated && !extraction.validation_status.issues?.some(i => i.severity === 'error')) {
        progressCallback?.('Updating deal financials...');
        await this.updateDealFinancials(extraction.deal_id, saved);
      }

      progressCallback?.('Financial data saved successfully!');
      return saved;
      
    } catch (error) {
      console.error('Failed to save financial extraction:', error);
      throw error;
    }
  }

  /**
   * Process a financial document (extract and save)
   */
  async processFinancialDocument(
    documentId: string,
    dealId: string,
    progressCallback?: (stage: string) => void
  ): Promise<FinancialExtraction> {
    // Extract the data
    const extraction = await this.extractFinancialData(documentId, dealId, progressCallback);
    
    // Save it to database
    return await this.saveFinancialExtraction(extraction, progressCallback);
  }

  /**
   * Identify financial document type
   */
  private async identifyFinancialDocumentType(
    content: string, 
    fileName: string
  ): Promise<FinancialDocumentType> {
    const prompt = `Identify the type of financial document:

Filename: ${fileName}
Content preview: ${content.substring(0, 3000)}

Document types:
- income_statement: P&L, profit and loss, income statement
- balance_sheet: balance sheet, statement of financial position
- cash_flow: cash flow statement
- tax_return: tax returns, 1120, 1065, Schedule C
- bank_statement: bank statements, account statements
- financial_summary: CIM, offering memorandum, financial overview
- management_report: management accounts, internal reports

Return only the document type.`;

    const payload = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 50
    };

    const response = await this._callOpenAIProxy('chat.completions.create', payload);
    const type = response.choices[0]?.message?.content?.trim();
    return (type as FinancialDocumentType) || 'financial_summary';
  }

  /**
   * Extract financial data from document content
   */
  private async extractFinancialDataFromContent(
    content: string,
    documentType: FinancialDocumentType
  ): Promise<DetailedFinancials> {
    const prompt = this.getExtractionPrompt(documentType, content);

    // Allow model configuration via environment variable
    const model = import.meta.env.VITE_FINANCIAL_EXTRACTION_MODEL || 'gpt-4o';
    
    const payload = {
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are a financial analyst expert. Extract financial data with extreme accuracy. Always return valid JSON.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 4000
    };

    try {
      console.log('🤖 Sending to OpenAI with prompt length:', prompt.length);
      const response = await this._callOpenAIProxy('chat.completions.create', payload);
      let content = response.choices[0]?.message?.content || '{}';
      console.log('🤖 OpenAI response:', content.substring(0, 300));
      
      // Remove markdown code blocks if present
      content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      const extracted = JSON.parse(content);
      console.log('🤖 Parsed extraction:', Object.keys(extracted));
      const normalized = this.normalizeFinancialData(extracted, documentType);
      console.log('🤖 Normalized data - Revenue:', normalized.revenue?.total, 'NetIncome:', normalized.netIncome);
      return normalized;
    } catch (error) {
      console.error('Financial extraction error:', error);
      console.error('🤖 Failed to extract financial data, returning empty financials');
      return this.getEmptyFinancials();
    }
  }

  /**
   * Get extraction prompt based on document type
   */
  private getExtractionPrompt(documentType: FinancialDocumentType, content: string): string {
    const basePrompt = `Extract all financial data from this ${documentType} document.

For Excel/spreadsheet data: Look for columns with months/dates and rows with financial line items.
Common P&L line items include: Sales, Revenue, Income, COGS, Cost of Goods Sold, Gross Profit, Operating Expenses, EBITDA, Net Income, etc.

Document content:
${content.substring(0, 15000)}

Return a JSON object with this exact structure:
{
  "revenue": {
    "total": number,
    "breakdown": {
      "products": number or null,
      "services": number or null,
      "subscriptions": number or null,
      "other": number or null
    },
    "byMonth": { "YYYY-MM": number }
  },
  "cogs": {
    "total": number,
    "breakdown": {
      "materials": number or null,
      "labor": number or null,
      "shipping": number or null,
      "other": number or null
    }
  },
  "grossProfit": number,
  "operatingExpenses": {
    "total": number,
    "breakdown": {
      "salaries": number or null,
      "rent": number or null,
      "utilities": number or null,
      "marketing": number or null,
      "insurance": number or null,
      "legal": number or null,
      "other": number or null
    }
  },
  "ebitda": number,
  "netIncome": number,
  "assets": {
    "current": {
      "total": number,
      "cash": number or null,
      "receivables": number or null,
      "inventory": number or null,
      "prepaid": number or null
    },
    "fixed": {
      "total": number,
      "property": number or null,
      "equipment": number or null,
      "intangibles": number or null
    },
    "total": number
  },
  "liabilities": {
    "current": {
      "total": number,
      "payables": number or null,
      "accrued": number or null,
      "shortTermDebt": number or null
    },
    "longTerm": {
      "total": number,
      "loans": number or null,
      "bonds": number or null,
      "other": number or null
    },
    "total": number
  },
  "equity": {
    "total": number,
    "retainedEarnings": number or null,
    "paidInCapital": number or null
  },
  "cashFlow": {
    "operating": number,
    "investing": number,
    "financing": number,
    "netChange": number,
    "beginningCash": number or null,
    "endingCash": number or null
  },
  "metrics": {
    "grossMargin": number,
    "operatingMargin": number,
    "netMargin": number,
    "currentRatio": number or null,
    "quickRatio": number or null,
    "debtToEquity": number or null,
    "roe": number or null,
    "roa": number or null,
    "workingCapital": number or null
  }
}

Instructions:
1. Extract actual numbers from the document
2. Use 0 for items not mentioned
3. Calculate metrics if not explicitly stated
4. Ensure all numbers are numeric (not strings)
5. Convert percentages to decimals (e.g., 25% = 0.25)
6. Make reasonable calculations for missing totals`;

    return basePrompt;
  }

  /**
   * Extract period information
   */
  private async extractPeriodInfo(
    content: string,
    documentType: FinancialDocumentType,
    financialData?: DetailedFinancials
  ): Promise<PeriodInfo> {
    // First try to detect from monthly data if available
    if (financialData?.revenue?.byMonth && Object.keys(financialData.revenue.byMonth).length > 0) {
      const months = Object.keys(financialData.revenue.byMonth).sort();
      const firstMonth = months[0];
      const lastMonth = months[months.length - 1];
      
      // Calculate if it spans multiple years
      const firstYear = parseInt(firstMonth.split('-')[0]);
      const lastYear = parseInt(lastMonth.split('-')[0]);
      const monthCount = months.length;
      
      return {
        startDate: `${firstMonth}-01`,
        endDate: `${lastMonth}-${new Date(parseInt(lastMonth.split('-')[0]), parseInt(lastMonth.split('-')[1]), 0).getDate()}`,
        periodType: monthCount > 12 ? 'annual' : monthCount === 12 ? 'annual' : monthCount === 3 ? 'quarterly' : 'monthly',
        isPartial: monthCount % 12 !== 0
      };
    }

    // Fall back to AI extraction with better prompting
    const prompt = `Extract the financial reporting period from this document. Look for specific date ranges, years, and period indicators.

Document type: ${documentType}
Content: ${content.substring(0, 5000)}

Common date patterns to look for:
- "For the year ended December 31, 2023"
- "Year ending 2023" 
- "2023 Financial Statement"
- "January 2023 - December 2023"
- "Q1 2023", "Q2 2023", etc.
- Column headers with months and years like "Jan 2023", "Feb 2023"
- "As of December 31, 2023"
- "12 months ended..."

If you find year information but no specific months, assume:
- Income statements: January 1 to December 31 of that year
- Balance sheets: As of December 31 of that year
- If multiple years mentioned, use the most recent complete year

Return JSON:
{
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD", 
  "periodType": "annual|quarterly|monthly|ytd",
  "isPartial": boolean
}`;

    const payload = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 200
    };

    try {
      const response = await this._callOpenAIProxy('chat.completions.create', payload);
      const result = JSON.parse(response.choices[0]?.message?.content || '{}');
      console.log('📅 AI extracted period:', result);
      
      // Validate the extracted dates
      if (result.startDate && result.endDate) {
        const startYear = parseInt(result.startDate.split('-')[0]);
        const endYear = parseInt(result.endDate.split('-')[0]);
        
        // Basic validation - years should be reasonable
        if (startYear >= 2000 && startYear <= 2030 && endYear >= 2000 && endYear <= 2030) {
          return result;
        }
      }
      
      throw new Error('Invalid dates extracted');
      
    } catch (error) {
      console.error('⚠️ Failed to extract period via AI:', error);
      
      // Try to extract year from content using smart contextual analysis
      const bestYear = this.extractRelevantYear(content);
      if (bestYear) {
        return {
          startDate: `${bestYear}-01-01`,
          endDate: `${bestYear}-12-31`,
          periodType: 'annual',
          isPartial: false
        };
      }
      
      // Default to current year
      const currentYear = new Date().getFullYear();
      return {
        startDate: `${currentYear}-01-01`,
        endDate: `${currentYear}-12-31`,
        periodType: 'annual',
        isPartial: false
      };
    }
  }

  /**
   * Extract the most relevant year for financial data using contextual analysis
   */
  private extractRelevantYear(content: string): number | null {
    const currentYear = new Date().getFullYear();
    const maxValidYear = currentYear + 1; // Allow next year for projections
    const minValidYear = currentYear - 10; // Don't go back more than 10 years
    
    // Find all years in the content
    const yearMatches = content.match(/\b(20\d{2})\b/g);
    if (!yearMatches || yearMatches.length === 0) {
      return null;
    }
    
    const years = [...new Set(yearMatches.map(y => parseInt(y)))]
      .filter(year => year >= minValidYear && year <= maxValidYear)
      .sort((a, b) => a - b); // Sort chronologically
    
    if (years.length === 0) {
      return null;
    }
    
    // If only one year, use it
    if (years.length === 1) {
      return years[0];
    }
    
    // Score years based on context relevance
    const yearScores = new Map<number, number>();
    
    for (const year of years) {
      let score = 0;
      const yearStr = year.toString();
      
      // Look for financial keywords near this year
      const contextRadius = 100; // Characters before and after
      const yearRegex = new RegExp(`\\b${yearStr}\\b`, 'gi');
      let match;
      
      while ((match = yearRegex.exec(content)) !== null) {
        const start = Math.max(0, match.index - contextRadius);
        const end = Math.min(content.length, match.index + yearStr.length + contextRadius);
        const context = content.substring(start, end).toLowerCase();
        
        // Score based on financial keywords near the year
        const financialKeywords = [
          { word: 'revenue', weight: 10 },
          { word: 'income', weight: 10 },
          { word: 'sales', weight: 10 },
          { word: 'profit', weight: 8 },
          { word: 'earnings', weight: 8 },
          { word: 'total', weight: 6 },
          { word: 'annual', weight: 8 },
          { word: 'monthly', weight: 6 },
          { word: 'year ended', weight: 12 },
          { word: 'ytd', weight: 8 },
          { word: 'quarter', weight: 6 },
          { word: 'q1', weight: 4 },
          { word: 'q2', weight: 4 },
          { word: 'q3', weight: 4 },
          { word: 'q4', weight: 4 },
          { word: 'jan', weight: 3 },
          { word: 'feb', weight: 3 },
          { word: 'mar', weight: 3 },
          { word: 'apr', weight: 3 },
          { word: 'may', weight: 3 },
          { word: 'jun', weight: 3 },
          { word: 'jul', weight: 3 },
          { word: 'aug', weight: 3 },
          { word: 'sep', weight: 3 },
          { word: 'oct', weight: 3 },
          { word: 'nov', weight: 3 },
          { word: 'dec', weight: 3 }
        ];
        
        for (const { word, weight } of financialKeywords) {
          if (context.includes(word)) {
            score += weight;
          }
        }
        
        // Bonus for dollar amounts near the year
        if (/\$[\d,]+/.test(context)) {
          score += 5;
        }
        
        // Penalty for metadata/timestamp patterns
        const metadataPatterns = [
          'created', 'modified', 'updated', 'timestamp', 
          'exported', 'generated', 'printed', 'version'
        ];
        
        for (const pattern of metadataPatterns) {
          if (context.includes(pattern)) {
            score -= 8;
          }
        }
      }
      
      // Preference for recent but not current year (financial data is usually from previous year)
      if (year === currentYear - 1) {
        score += 3;
      } else if (year === currentYear - 2) {
        score += 2;
      } else if (year === currentYear) {
        score -= 1; // Slightly penalize current year as it might be metadata
      }
      
      yearScores.set(year, score);
    }
    
    // Find the year with the highest score
    let bestYear = years[0];
    let bestScore = yearScores.get(bestYear) || 0;
    
    for (const [year, score] of yearScores.entries()) {
      if (score > bestScore) {
        bestYear = year;
        bestScore = score;
      }
    }
    
    console.log('📅 Year extraction scores:', Object.fromEntries(yearScores));
    console.log('📅 Selected year:', bestYear, 'with score:', bestScore);
    
    return bestYear;
  }

  /**
   * Normalize financial data
   */
  private normalizeFinancialData(
    data: any,
    documentType: FinancialDocumentType
  ): DetailedFinancials {
    // Helper function to round to 2 decimal places
    const round2 = (num: number) => Math.round(num * 100) / 100;
    
    // Ensure all required fields exist
    const normalized = {
      revenue: data.revenue || { total: 0, breakdown: {} },
      cogs: data.cogs || { total: 0, breakdown: {} },
      grossProfit: data.grossProfit || 0,
      operatingExpenses: data.operatingExpenses || { total: 0, breakdown: {} },
      ebitda: data.ebitda || 0,
      netIncome: data.netIncome || 0,
      assets: data.assets || {
        current: { total: 0 },
        fixed: { total: 0 },
        total: 0
      },
      liabilities: data.liabilities || {
        current: { total: 0 },
        longTerm: { total: 0 },
        total: 0
      },
      equity: data.equity || { total: 0 },
      cashFlow: data.cashFlow,
      metrics: data.metrics || this.calculateMetrics(data),
      margins: data.margins || this.calculateMargins(data)
    };

    // Round all financial values to 2 decimal places
    if (normalized.revenue.total) normalized.revenue.total = round2(normalized.revenue.total);
    if (normalized.cogs.total) normalized.cogs.total = round2(normalized.cogs.total);
    if (normalized.grossProfit) normalized.grossProfit = round2(normalized.grossProfit);
    if (normalized.operatingExpenses.total) normalized.operatingExpenses.total = round2(normalized.operatingExpenses.total);
    if (normalized.ebitda) normalized.ebitda = round2(normalized.ebitda);
    if (normalized.netIncome) normalized.netIncome = round2(normalized.netIncome);

    // Calculate missing values
    if (!normalized.grossProfit && normalized.revenue.total && normalized.cogs.total) {
      normalized.grossProfit = round2(normalized.revenue.total - normalized.cogs.total);
    }

    if (!normalized.ebitda && normalized.grossProfit && normalized.operatingExpenses.total) {
      normalized.ebitda = round2(normalized.grossProfit - normalized.operatingExpenses.total);
    }

    // Round monthly revenue data
    if (normalized.revenue.byMonth) {
      Object.keys(normalized.revenue.byMonth).forEach(month => {
        normalized.revenue.byMonth[month] = round2(normalized.revenue.byMonth[month]);
      });
    }

    return normalized;
  }

  /**
   * Calculate margins
   */
  private calculateMargins(data: any): { gross: number; operating: number; net: number } {
    const revenue = data.revenue?.total || 0;
    const cogs = data.cogs?.total || 0;
    const grossProfit = data.grossProfit || (revenue - cogs);
    const operatingExpenses = data.operatingExpenses?.total || 0;
    const netIncome = data.netIncome || 0;

    return {
      gross: revenue > 0 ? grossProfit / revenue : 0,
      operating: revenue > 0 ? (grossProfit - operatingExpenses) / revenue : 0,
      net: revenue > 0 ? netIncome / revenue : 0
    };
  }

  /**
   * Calculate financial metrics
   */
  private calculateMetrics(data: any): DetailedFinancials['metrics'] {
    const revenue = data.revenue?.total || 0;
    const cogs = data.cogs?.total || 0;
    const grossProfit = data.grossProfit || (revenue - cogs);
    const operatingExpenses = data.operatingExpenses?.total || 0;
    const netIncome = data.netIncome || 0;
    
    const currentAssets = data.assets?.current?.total || 0;
    const currentLiabilities = data.liabilities?.current?.total || 0;
    const totalAssets = data.assets?.total || 0;
    const totalLiabilities = data.liabilities?.total || 0;
    const equity = data.equity?.total || 0;

    return {
      grossMargin: revenue > 0 ? grossProfit / revenue : 0,
      operatingMargin: revenue > 0 ? (grossProfit - operatingExpenses) / revenue : 0,
      netMargin: revenue > 0 ? netIncome / revenue : 0,
      currentRatio: currentLiabilities > 0 ? currentAssets / currentLiabilities : null,
      quickRatio: null, // Would need inventory data
      debtToEquity: equity > 0 ? totalLiabilities / equity : null,
      roe: equity > 0 ? netIncome / equity : null,
      roa: totalAssets > 0 ? netIncome / totalAssets : null,
      workingCapital: currentAssets - currentLiabilities
    };
  }

  /**
   * Calculate confidence scores
   */
  private calculateConfidenceScores(data: DetailedFinancials): ConfidenceScores {
    const scores = {
      revenue: 0,
      expenses: 0,
      profitability: 0,
      balanceSheet: 0,
      cashFlow: 0,
      overall: 0
    };

    // Revenue confidence
    if (data.revenue.total > 0) scores.revenue += 0.5;
    if (data.revenue.breakdown && Object.keys(data.revenue.breakdown).length > 0) scores.revenue += 0.3;
    if (data.revenue.byMonth && Object.keys(data.revenue.byMonth).length > 0) scores.revenue += 0.2;

    // Expenses confidence
    if (data.cogs.total > 0) scores.expenses += 0.3;
    if (data.operatingExpenses.total > 0) scores.expenses += 0.3;
    if (data.operatingExpenses.breakdown && Object.keys(data.operatingExpenses.breakdown).length > 2) scores.expenses += 0.4;

    // Profitability confidence
    if (data.grossProfit > 0) scores.profitability += 0.3;
    if (data.ebitda !== 0) scores.profitability += 0.3;
    if (data.netIncome !== 0) scores.profitability += 0.4;

    // Balance sheet confidence
    if (data.assets.total > 0) scores.balanceSheet += 0.3;
    if (data.liabilities.total > 0) scores.balanceSheet += 0.3;
    if (data.equity.total !== 0) scores.balanceSheet += 0.4;

    // Cash flow confidence
    if (data.cashFlow) {
      scores.cashFlow = 0.8;
    }

    // Overall confidence
    scores.overall = (
      scores.revenue * 0.25 +
      scores.expenses * 0.25 +
      scores.profitability * 0.25 +
      scores.balanceSheet * 0.15 +
      scores.cashFlow * 0.10
    );

    return scores;
  }

  /**
   * Validate financial data
   */
  private validateFinancialData(
    data: DetailedFinancials,
    documentType: FinancialDocumentType
  ): ValidationStatus {
    const issues: ValidationIssue[] = [];

    // Basic validation
    if (data.revenue.total < 0) {
      issues.push({
        field: 'revenue.total',
        issue: 'Revenue cannot be negative',
        severity: 'error'
      });
    }

    // Validate monthly revenue sums match total
    if (data.revenue.byMonth && Object.keys(data.revenue.byMonth).length > 0) {
      const monthlySum = Object.values(data.revenue.byMonth).reduce((sum, val) => sum + val, 0);
      const totalRevenue = data.revenue.total;
      const difference = Math.abs(monthlySum - totalRevenue);
      
      // Allow for small rounding differences (0.01%)
      if (difference > totalRevenue * 0.0001 && difference > 1) {
        issues.push({
          field: 'revenue.byMonth',
          issue: `Monthly revenue sum (${monthlySum.toFixed(2)}) does not match total revenue (${totalRevenue.toFixed(2)})`,
          severity: 'warning'
        });
      }
    }

    // Validate gross profit calculation
    if (data.revenue.total > 0 && data.cogs.total >= 0) {
      const calculatedGrossProfit = data.revenue.total - data.cogs.total;
      const difference = Math.abs(calculatedGrossProfit - data.grossProfit);
      
      if (difference > 1) {
        issues.push({
          field: 'grossProfit',
          issue: `Gross profit calculation mismatch. Expected: ${calculatedGrossProfit.toFixed(2)}, Found: ${data.grossProfit.toFixed(2)}`,
          severity: 'warning'
        });
      }
    }

    // Balance sheet validation
    const assetLiabilityDiff = Math.abs(data.assets.total - (data.liabilities.total + data.equity.total));
    if (assetLiabilityDiff > 100 && data.assets.total > 0) {
      issues.push({
        field: 'balance_sheet',
        issue: 'Assets do not equal liabilities plus equity',
        severity: 'warning'
      });
    }

    // Margin validation
    if (data.metrics.grossMargin > 1 || data.metrics.grossMargin < -1) {
      issues.push({
        field: 'metrics.grossMargin',
        issue: 'Gross margin appears to be out of valid range',
        severity: 'warning'
      });
    }

    // Net income validation
    if (data.netIncome > data.revenue.total) {
      issues.push({
        field: 'netIncome',
        issue: 'Net income exceeds total revenue',
        severity: 'warning'
      });
    }

    return {
      isValidated: issues.filter(i => i.severity === 'error').length === 0,
      issues
    };
  }

  /**
   * Update deal financials with extracted data
   */
  private async updateDealFinancials(dealId: string, extraction: FinancialExtraction): Promise<void> {
    try {
      // Get existing deal data
      const { data: deal, error: dealError } = await supabaseAny
        .from('deals')
        .select('*')
        .eq('id', dealId)
        .single();

      if (dealError || !deal) {
        throw new Error('Deal not found');
      }

      // Update deal with latest financial data
      console.log('💾 Updating deal financials:', {
        revenue: extraction.financial_data.revenue?.total,
        netIncome: extraction.financial_data.netIncome,
        metrics: extraction.financial_data.metrics,
        margins: extraction.financial_data.margins
      });
      
      const updates = {
        annual_revenue: extraction.financial_data.revenue?.total || 0,
        annual_profit: extraction.financial_data.netIncome || 0,
        ebitda: extraction.financial_data.ebitda || 0,
        gross_margin: extraction.financial_data.metrics?.grossMargin || extraction.financial_data.margins?.gross || 0,
        operating_margin: extraction.financial_data.metrics?.operatingMargin || extraction.financial_data.margins?.operating || 0,
        net_margin: extraction.financial_data.metrics?.netMargin || extraction.financial_data.margins?.net || 0,
        financial_last_updated: new Date().toISOString()
      };
      
      console.log('💾 Deal updates:', updates);

      const { error: updateError } = await supabaseAny
        .from('deals')
        .update(updates)
        .eq('id', dealId);

      if (updateError) {
        console.error('Failed to update deal financials:', updateError);
        throw new Error(`Failed to update deal: ${updateError.message}`);
      } else {
        console.log('✅ Deal financials updated successfully for deal:', dealId);
      }

      // Create financial history record
      await this.createFinancialHistory(dealId, extraction);

    } catch (error) {
      console.error('Error updating deal financials:', error);
    }
  }

  /**
   * Create financial history record
   */
  private async createFinancialHistory(dealId: string, extraction: FinancialExtraction): Promise<void> {
    const historyRecord = {
      deal_id: dealId,
      period_start: extraction.period_covered.startDate,
      period_end: extraction.period_covered.endDate,
      period_type: extraction.period_covered.periodType,
      revenue: extraction.financial_data.revenue.total,
      cogs: extraction.financial_data.cogs.total,
      gross_profit: extraction.financial_data.grossProfit,
      operating_expenses: extraction.financial_data.operatingExpenses.total,
      ebitda: extraction.financial_data.ebitda,
      net_income: extraction.financial_data.netIncome,
      extraction_id: extraction.id,
      created_at: new Date().toISOString()
    };

    // Use upsert to handle duplicate constraints
    const { error } = await supabaseAny
      .from('financial_history')
      .upsert(historyRecord, {
        onConflict: 'deal_id,period_start,period_end,period_type',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Failed to create/update financial history:', error);
    } else {
      console.log('✅ Financial history record created/updated successfully');
    }
  }

  /**
   * Get empty financials structure
   */
  private getEmptyFinancials(): DetailedFinancials {
    return {
      revenue: { total: 0, breakdown: {} },
      cogs: { total: 0, breakdown: {} },
      grossProfit: 0,
      operatingExpenses: { total: 0, breakdown: {} },
      ebitda: 0,
      netIncome: 0,
      assets: {
        current: { total: 0 },
        fixed: { total: 0 },
        total: 0
      },
      liabilities: {
        current: { total: 0 },
        longTerm: { total: 0 },
        total: 0
      },
      equity: { total: 0 },
      metrics: {
        grossMargin: 0,
        operatingMargin: 0,
        netMargin: 0,
        currentRatio: null,
        quickRatio: null,
        debtToEquity: null,
        roe: null,
        roa: null,
        workingCapital: null
      }
    };
  }

  /**
   * Convert document analysis to text
   */
  private documentAnalysisToText(analysis: any): string {
    // Convert the analysis object to readable text
    return JSON.stringify(analysis, null, 2);
  }

  /**
   * Use hybrid approach for complex spreadsheets
   */
  private async extractWithHybridApproach(
    file: File,
    textContent: string,
    documentType: FinancialDocumentType,
    progressCallback?: (stage: string) => void
  ): Promise<DetailedFinancials> {
    progressCallback?.('Using advanced AI vision for complex spreadsheet...');
    
    try {
      // First, try with the text content we have
      const textBasedExtraction = await this.extractFinancialDataFromContent(textContent, documentType);
      
      // If we got good results from text (high confidence), use it
      const confidence = this.calculateConfidenceScores(textBasedExtraction);
      if (confidence.overall > 0.85) {
        console.log('✅ Text extraction confidence high enough, skipping image analysis');
        return textBasedExtraction;
      }
      
      // Otherwise, try vision API for better context understanding
      console.log('👁️ Using vision API for better context understanding');
      const visionAnalysis = await DocumentAnalysisService.analyzeDocument(file, progressCallback);
      
      // Combine insights from both approaches
      const prompt = `You have two sources of financial data:

1. Text extraction (may have formatting issues):
${textContent.substring(0, 5000)}

2. Vision analysis of the document:
${JSON.stringify(visionAnalysis, null, 2).substring(0, 5000)}

Extract the most accurate financial data, preferring exact numbers from text extraction but using vision analysis for context and structure understanding.

Return the financial data in the standard JSON format with revenue, expenses, etc.`;

      const payload = {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a financial analyst expert. Combine multiple data sources to extract the most accurate financial information.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 4000
      };

      const response = await this._callOpenAIProxy('chat.completions.create', payload);
      let content = response.choices[0]?.message?.content || '{}';
      content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      const hybridExtraction = JSON.parse(content);
      return this.normalizeFinancialData(hybridExtraction, documentType);
      
    } catch (error) {
      console.error('Hybrid approach failed, falling back to text extraction:', error);
      // Fall back to pure text extraction
      return await this.extractFinancialDataFromContent(textContent, documentType);
    }
  }

  /**
   * Get financial extractions for a deal
   */
  async getDealFinancialExtractions(dealId: string): Promise<FinancialExtraction[]> {
    const { data, error } = await supabaseAny
      .from('financial_extractions')
      .select('*')
      .eq('deal_id', dealId)
      .order('extraction_date', { ascending: false });

    if (error) {
      console.error('Failed to get financial extractions:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get latest validated financials for a deal
   */
  async getLatestValidatedFinancials(dealId: string): Promise<FinancialExtraction | null> {
    try {
      const { data, error } = await supabaseAny
        .from('financial_extractions')
        .select('*')
        .eq('deal_id', dealId)
        .eq('validation_status->isValidated', true)
        .order('extraction_date', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // If table doesn't exist (406 error), return null gracefully
        if (error.code === '42P01' || error.message?.includes('not exist') || error.code === '406') {
          console.warn('financial_extractions table does not exist. Please run the migration.');
          return null;
        }
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Error fetching validated financials:', error);
      return null;
    }
  }
}