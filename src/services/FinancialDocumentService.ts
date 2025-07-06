import { supabase } from '../lib/supabase';
import { DocumentExtractors } from './DocumentExtractors';
import { DocumentAnalysisService } from './AIAnalysisService';
import { encodeFilePath } from '../utils/fileUtils';

/**
 * Financial Document Processing Service
 * Specialized service for extracting and processing financial data from documents
 */

// Types
export interface FinancialExtraction {
  id?: string;
  deal_id: string;
  document_id: string;
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
      throw new Error(`Failed to execute AI task: ${task}`);
    }

    return response.json();
  }

  /**
   * Process a financial document
   */
  async processFinancialDocument(
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
        // Try direct Supabase Storage download first
        const encodedFilePath = encodeFilePath(document.file_path);
        
        const { data: fileData, error: downloadError } = await supabaseAny.storage
          .from('deal-documents')
          .download(encodedFilePath);

        if (downloadError || !fileData) {
          throw new Error(`Direct download failed: ${downloadError?.message || 'Unknown error'}`);
        }

        // Convert to File object
        file = new File([fileData], document.file_name || 'document', {
          type: document.mime_type || 'application/octet-stream'
        });
        
        console.log('✅ Direct Supabase download successful');
        
      } catch (directDownloadError) {
        console.warn('⚠️ Direct download failed, trying server endpoint:', directDownloadError);
        
        // Fallback: use server endpoint for download
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
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
      
      if (DocumentExtractors.canExtractText(file.name)) {
        documentContent = await DocumentExtractors.extractTextFromFile(file);
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
      const financialData = await this.extractFinancialData(documentContent, documentType);

      // Extract period information
      progressCallback?.('Identifying reporting period...');
      const periodInfo = await this.extractPeriodInfo(documentContent, documentType);

      // Calculate confidence scores
      const confidenceScores = this.calculateConfidenceScores(financialData);

      // Validate extracted data
      progressCallback?.('Validating financial data...');
      const validationStatus = this.validateFinancialData(financialData, documentType);

      // Get user info for extracted_by
      const { data: { user } } = await supabaseAny.auth.getUser();

      // Create extraction record
      const extraction: FinancialExtraction = {
        deal_id: dealId,
        document_id: documentId,
        extraction_date: new Date().toISOString(),
        financial_data: financialData,
        period_covered: periodInfo,
        document_type: documentType,
        confidence_scores: confidenceScores,
        validation_status: validationStatus,
        extracted_by: user?.id || 'system'
      };

      // Save to database
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
      if (validationStatus.isValidated && !validationStatus.issues?.some(i => i.severity === 'error')) {
        progressCallback?.('Updating deal financials...');
        await this.updateDealFinancials(dealId, saved);
      }

      progressCallback?.('Financial extraction complete!');
      return saved;

    } catch (error) {
      console.error('Financial document processing error:', error);
      throw error;
    }
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
   * Extract financial data from document
   */
  private async extractFinancialData(
    content: string,
    documentType: FinancialDocumentType
  ): Promise<DetailedFinancials> {
    const prompt = this.getExtractionPrompt(documentType, content);

    const payload = {
      model: 'gpt-4o',
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
      const response = await this._callOpenAIProxy('chat.completions.create', payload);
      const extracted = JSON.parse(response.choices[0]?.message?.content || '{}');
      return this.normalizeFinancialData(extracted, documentType);
    } catch (error) {
      console.error('Financial extraction error:', error);
      return this.getEmptyFinancials();
    }
  }

  /**
   * Get extraction prompt based on document type
   */
  private getExtractionPrompt(documentType: FinancialDocumentType, content: string): string {
    const basePrompt = `Extract all financial data from this ${documentType} document.

Document content:
${content.substring(0, 10000)}

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
    documentType: FinancialDocumentType
  ): Promise<PeriodInfo> {
    const prompt = `Extract the financial reporting period from this document.

Document type: ${documentType}
Content: ${content.substring(0, 5000)}

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
      return JSON.parse(response.choices[0]?.message?.content || '{}');
    } catch {
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
   * Normalize financial data
   */
  private normalizeFinancialData(
    data: any,
    documentType: FinancialDocumentType
  ): DetailedFinancials {
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
      metrics: data.metrics || this.calculateMetrics(data)
    };

    // Calculate missing values
    if (!normalized.grossProfit && normalized.revenue.total && normalized.cogs.total) {
      normalized.grossProfit = normalized.revenue.total - normalized.cogs.total;
    }

    if (!normalized.ebitda && normalized.grossProfit && normalized.operatingExpenses.total) {
      normalized.ebitda = normalized.grossProfit - normalized.operatingExpenses.total;
    }

    return normalized;
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
      const updates = {
        annual_revenue: extraction.financial_data.revenue.total,
        annual_profit: extraction.financial_data.netIncome,
        ebitda: extraction.financial_data.ebitda,
        gross_margin: extraction.financial_data.metrics.grossMargin,
        operating_margin: extraction.financial_data.metrics.operatingMargin,
        net_margin: extraction.financial_data.metrics.netMargin,
        financial_last_updated: new Date().toISOString()
      };

      const { error: updateError } = await supabaseAny
        .from('deals')
        .update(updates)
        .eq('id', dealId);

      if (updateError) {
        console.error('Failed to update deal financials:', updateError);
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

    const { error } = await supabaseAny
      .from('financial_history')
      .insert(historyRecord);

    if (error) {
      console.error('Failed to create financial history:', error);
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
    const { data, error } = await supabaseAny
      .from('financial_extractions')
      .select('*')
      .eq('deal_id', dealId)
      .eq('validation_status->isValidated', true)
      .order('extraction_date', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  }
}