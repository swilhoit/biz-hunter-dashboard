import { filesAdapter } from '../lib/database-adapter';
import { supabase } from '../lib/supabase';
import { encodeFilePath } from '../utils/fileUtils';
import { DocumentExtractors } from './DocumentExtractors';
import { getConfigValue } from '../config/runtime-config';

interface DealData {
  id: string;
  business_name: string;
  amazon_category: string;
  amazon_subcategory?: string;
  asking_price: number;
  annual_revenue: number;
  annual_profit: number;
  monthly_revenue?: number;
  monthly_profit?: number;
  amazon_store_url?: string;
  fba_percentage?: number;
  business_age?: number;
  tags?: string[];
  custom_fields?: Record<string, unknown>;
  [key: string]: unknown;
}

interface DealDocument {
  id: string;
  file_name: string;
  file_path: string;
  category?: string;
  file_type?: string;
  content?: string; // Extracted content from the document
}

interface CompetitiveAnalysis {
  competitors: Array<{
    name: string;
    marketPosition: string;
    strengths: string[];
    threats: string[];
  }>;
  marketDynamics: {
    competitionLevel: 'Low' | 'Medium' | 'High';
    barrierToEntry: 'Low' | 'Medium' | 'High';
    marketTrends: string[];
  };
  positioningAnalysis: string;
}

interface KeywordAnalysis {
  primaryKeywords: Array<{
    keyword: string;
    searchVolume: string;
    difficulty: string;
    relevance: number;
  }>;
  longTailOpportunities: string[];
  seasonalTrends: string[];
  keywordStrategy: string;
}

interface OpportunityScore {
  overall: number;
  breakdown: {
    financial: number;
    market: number;
    growth: number;
    risk: number;
  };
  reasoning: string;
  improvements: string[];
}

interface AIAnalysisReport {
  summary: string;
  competitiveAnalysis: CompetitiveAnalysis;
  keywordAnalysis: KeywordAnalysis;
  opportunityScore: OpportunityScore;
  riskFactors: string[];
  growthOpportunities: string[];
  recommendations: string[];
  confidenceLevel: number;
  lastUpdated: string;
}

export class AIAnalysisService {
  private apiUrl: string;

  constructor() {
    // Use server endpoints instead of direct OpenAI calls
    this.apiUrl = 'http://localhost:3002/api/openai';
  }

  private async callOpenAI(messages: any[], options: { temperature?: number; max_tokens?: number } = {}): Promise<string> {
    try {
      const response = await fetch(`${this.apiUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 2000,
          model: 'gpt-4o-mini'
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to call OpenAI';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          // If JSON parsing fails, try to get text
          try {
            errorMessage = await response.text() || errorMessage;
          } catch (textError) {
            // If text parsing also fails, use the status
            errorMessage = `${errorMessage} (Status: ${response.status})`;
          }
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error('Failed to parse OpenAI response as JSON:', e);
        throw new Error('Invalid JSON response from OpenAI');
      }
      
      return data.response;
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      throw error;
    }
  }

  async generateDealAnalysis(deal: DealData, progressCallback?: (stage: string) => void): Promise<AIAnalysisReport> {
    console.log(`Generating AI analysis for deal: ${deal.business_name}`);

    try {
      // Fetch and analyze deal documents
      progressCallback?.('Fetching deal documents...');
      const documents = await this.fetchAndAnalyzeDealDocuments(deal.id, progressCallback);
      
      // Create enhanced deal data with document insights
      const enhancedDeal = {
        ...deal,
        documentInsights: documents
      };

      // Run multiple analyses in parallel for efficiency
      progressCallback?.('Analyzing business data...');
      const [
        competitiveAnalysis,
        keywordAnalysis,
        opportunityScore,
        riskAndOpportunities
      ] = await Promise.all([
        this.analyzeCompetition(enhancedDeal, documents),
        this.analyzeKeywords(enhancedDeal, documents),
        this.calculateOpportunityScore(enhancedDeal, documents),
        this.analyzeRisksAndOpportunities(enhancedDeal, documents)
      ]);

      progressCallback?.('Generating summary...');
      const summary = await this.generateSummary(enhancedDeal, {
        competitiveAnalysis,
        keywordAnalysis,
        opportunityScore,
        ...riskAndOpportunities
      }, documents);

      return {
        summary,
        competitiveAnalysis,
        keywordAnalysis,
        opportunityScore,
        riskFactors: riskAndOpportunities.riskFactors,
        growthOpportunities: riskAndOpportunities.growthOpportunities,
        recommendations: riskAndOpportunities.recommendations,
        confidenceLevel: this.calculateConfidenceLevel(enhancedDeal, documents),
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error("Error generating AI analysis:", error);
      throw new Error("Failed to generate AI analysis report");
    }
  }

  private async fetchAndAnalyzeDealDocuments(dealId: string, progressCallback?: (stage: string) => void): Promise<DealDocument[]> {
    try {
      // Fetch all documents for the deal
      const files = await filesAdapter.fetchDealFiles(dealId);
      
      if (!files || files.length === 0) {
        console.log('No documents found for deal:', dealId);
        return [];
      }

      console.log(`Found ${files.length} documents for deal:`, dealId);
      
      const analyzedDocuments: DealDocument[] = [];
      
      // Process each document
      for (const file of files) {
        progressCallback?.(`Analyzing document: ${file.file_name}...`);
        
        try {
          // Skip non-document files
          if (!this.isAnalyzableDocument(file.file_type || '')) {
            console.log(`Skipping non-analyzable file: ${file.file_name}`);
            continue;
          }

          // Download and analyze the document
          const content = await this.downloadAndAnalyzeDocument(file);
          
          if (content) {
            analyzedDocuments.push({
              id: file.id,
              file_name: file.file_name,
              file_path: file.file_path,
              category: file.category,
              file_type: file.file_type,
              content: content
            });
          }
        } catch (error) {
          console.error(`Error analyzing document ${file.file_name}:`, error);
          // Continue with other documents
        }
      }

      console.log(`Successfully analyzed ${analyzedDocuments.length} documents`);
      return analyzedDocuments;
    } catch (error) {
      console.error('Error fetching deal documents:', error);
      return [];
    }
  }

  private isAnalyzableDocument(fileType: string): boolean {
    const analyzableTypes = ['pdf', 'txt', 'doc', 'docx', 'xlsx', 'xls', 'csv', 'png', 'jpg', 'jpeg'];
    const extension = fileType.toLowerCase().split('.').pop() || '';
    return analyzableTypes.includes(extension) || 
           analyzableTypes.some(type => fileType.toLowerCase().includes(type));
  }

  private async downloadAndAnalyzeDocument(file: any): Promise<string | null> {
    try {
      // URL encode the file path to handle special characters and spaces
      const encodedFilePath = encodeFilePath(file.file_path);
      
      // Download the file from Supabase storage
      const { data, error } = await supabase.storage
        .from('deal-documents')
        .download(encodedFilePath);

      if (error) {
        console.error('Error downloading document:', error);
        return null;
      }

      // Convert to File object for analysis
      const blob = new Blob([data], { type: file.file_type || 'application/octet-stream' });
      const fileObj = new File([blob], file.file_name, { type: file.file_type || 'application/octet-stream' });

      // Use DocumentAnalysisService to analyze the document
      const analysis = await DocumentAnalysisService.analyzeDocument(fileObj);
      
      // Extract relevant content from the analysis
      const content = this.extractContentFromAnalysis(analysis);
      
      return content;
    } catch (error) {
      console.error('Error downloading/analyzing document:', error);
      return null;
    }
  }

  private extractContentFromAnalysis(analysis: DocumentAnalysis): string {
    const parts: string[] = [];
    
    // Add business information
    if (analysis.businessName) {
      parts.push(`Business Name: ${analysis.businessName}`);
    }
    if (analysis.description) {
      parts.push(`Description: ${analysis.description}`);
    }
    
    // Add financial information
    if (analysis.askingPrice) {
      parts.push(`Asking Price: $${analysis.askingPrice.toLocaleString()}`);
    }
    if (analysis.annualRevenue) {
      parts.push(`Annual Revenue: $${analysis.annualRevenue.toLocaleString()}`);
    }
    if (analysis.annualProfit) {
      parts.push(`Annual Profit: $${analysis.annualProfit.toLocaleString()}`);
    }
    
    // Add additional details
    if (analysis.additionalInfo?.reasonForSelling) {
      parts.push(`Reason for Selling: ${analysis.additionalInfo.reasonForSelling}`);
    }
    if (analysis.additionalInfo?.growthOpportunities) {
      parts.push(`Growth Opportunities: ${analysis.additionalInfo.growthOpportunities}`);
    }
    
    // Add key findings
    if (analysis.keyFindings && analysis.keyFindings.length > 0) {
      parts.push(`Key Findings: ${analysis.keyFindings.join('; ')}`);
    }
    
    return parts.join('\n\n');
  }

  private async analyzeCompetition(deal: DealData, documents: DealDocument[]): Promise<CompetitiveAnalysis> {
    // Compile document insights
    const documentContent = documents.length > 0 
      ? `\n\nAdditional insights from ${documents.length} uploaded documents:\n${documents.map(doc => doc.content).join('\n\n')}`
      : '';

    const prompt = `Analyze the competitive landscape for this Amazon FBA business:

Business: ${deal.business_name}
Category: ${deal.amazon_category}
Subcategory: ${deal.amazon_subcategory || 'Not specified'}
Annual Revenue: $${deal.annual_revenue?.toLocaleString()}
Price: $${deal.asking_price?.toLocaleString()}
FBA %: ${deal.fba_percentage || 'Unknown'}%
${documentContent}

Based on all available information including any P&L statements, broker teasers, or business documents provided, analyze:
1. Key competitors in this space
2. Market dynamics (competition level, barriers to entry)
3. Market trends affecting this category
4. Positioning analysis
5. Any competitive advantages or unique selling points mentioned in the documents

Format as JSON with keys: competitors, marketDynamics, positioningAnalysis`;

    try {
      const result = await this.callOpenAI([
        {
          role: "system",
          content: "You are an expert Amazon marketplace analyst. Provide detailed competitive analysis for FBA business acquisitions."
        },
        { role: "user", content: prompt }
      ], { temperature: 0.3, max_tokens: 1500 });
      
      if (!result) throw new Error("No response");
      
      return JSON.parse(result);
    } catch (error) {
      return {
        competitors: [
          { name: "Analysis unavailable", marketPosition: "Unknown", strengths: [], threats: [] }
        ],
        marketDynamics: {
          competitionLevel: 'Medium' as const,
          barrierToEntry: 'Medium' as const,
          marketTrends: ["Market analysis required"]
        },
        positioningAnalysis: "Detailed competitive analysis unavailable due to API limitations"
      };
    }
  }

  private async analyzeKeywords(deal: DealData, documents: DealDocument[]): Promise<KeywordAnalysis> {
    const documentContent = documents.length > 0 
      ? `\n\nAdditional product and market information from documents:\n${documents.map(doc => doc.content).join('\n\n')}`
      : '';

    const prompt = `Analyze keyword opportunities for this Amazon business:

Business: ${deal.business_name}
Category: ${deal.amazon_category}
Subcategory: ${deal.amazon_subcategory || 'Not specified'}
${documentContent}

Based on the category, business type, and any product details from the documents:
1. Primary keywords with estimated search volume and difficulty
2. Long-tail keyword opportunities
3. Seasonal trends for this category
4. Keyword strategy recommendations
5. Any specific product keywords or niches mentioned in the documents

Format as JSON with keys: primaryKeywords, longTailOpportunities, seasonalTrends, keywordStrategy`;

    try {
      const result = await this.callOpenAI([
        {
          role: "system",
          content: "You are an Amazon SEO expert. Analyze keyword opportunities for Amazon FBA businesses based on category and product type."
        },
        { role: "user", content: prompt }
      ], { temperature: 0.3, max_tokens: 1200 });
      
      if (!result) throw new Error("No response");
      
      return JSON.parse(result);
    } catch (error) {
      return {
        primaryKeywords: [
          { keyword: "Analysis required", searchVolume: "Unknown", difficulty: "Unknown", relevance: 0 }
        ],
        longTailOpportunities: ["Keyword research needed"],
        seasonalTrends: ["Seasonal analysis required"],
        keywordStrategy: "Detailed keyword analysis unavailable"
      };
    }
  }

  private async calculateOpportunityScore(deal: DealData, documents: DealDocument[]): Promise<OpportunityScore> {
    const documentContent = documents.length > 0 
      ? `\n\nDetailed financial and business information from ${documents.length} documents:\n${documents.map(doc => doc.content).join('\n\n')}`
      : '';

    const prompt = `Calculate an opportunity score (0-100) for this Amazon FBA acquisition:

Business: ${deal.business_name}
Category: ${deal.amazon_category}
Asking Price: $${deal.asking_price?.toLocaleString()}
Annual Revenue: $${deal.annual_revenue?.toLocaleString()}
Annual Profit: $${deal.annual_profit?.toLocaleString()}
Multiple: ${deal.asking_price && deal.annual_profit ? (deal.asking_price / deal.annual_profit).toFixed(1) : 'Unknown'}x
Business Age: ${deal.business_age || 'Unknown'} years
FBA %: ${deal.fba_percentage || 'Unknown'}%
${documentContent}

Using all available information including financial statements and business details:
Score breakdown (0-100 each):
- Financial Health (revenue trends, profit margins, cash flow stability from documents)
- Market Opportunity (category growth, competition, market size)
- Growth Potential (scalability, expansion opportunities mentioned in documents)
- Risk Assessment (dependencies, market risks, any red flags in documents)

Provide overall score and reasoning based on comprehensive analysis.

Format as JSON with keys: overall, breakdown, reasoning, improvements`;

    try {
      const result = await this.callOpenAI([
        {
          role: "system",
          content: "You are an expert business acquisition analyst. Score Amazon FBA businesses on acquisition attractiveness."
        },
        { role: "user", content: prompt }
      ], { temperature: 0.2, max_tokens: 1000 });
      
      if (!result) throw new Error("No response");
      
      return JSON.parse(result);
    } catch (error) {
      const revenue = deal.annual_revenue || 0;
      const profit = deal.annual_profit || 0;
      const multiple = deal.asking_price && profit ? deal.asking_price / profit : 0;
      
      // Simple fallback scoring
      const financialScore = Math.min(100, (profit > 0 ? 70 : 20) + (multiple < 4 ? 20 : multiple < 6 ? 10 : 0));
      
      return {
        overall: Math.round(financialScore * 0.7), // Conservative estimate
        breakdown: {
          financial: financialScore,
          market: 50,
          growth: 50,
          risk: 50
        },
        reasoning: "Automated scoring based on financial metrics",
        improvements: ["Detailed analysis required", "Manual review recommended"]
      };
    }
  }

  private async analyzeRisksAndOpportunities(deal: DealData, documents: DealDocument[]): Promise<{
    riskFactors: string[];
    growthOpportunities: string[];
    recommendations: string[];
  }> {
    const documentContent = documents.length > 0 
      ? `\n\nBusiness details and insights from documents:\n${documents.map(doc => doc.content).join('\n\n')}`
      : '';

    const prompt = `Analyze risks and opportunities for this Amazon FBA acquisition:

Business: ${deal.business_name}
Category: ${deal.amazon_category}
Annual Revenue: $${deal.annual_revenue?.toLocaleString()}
Annual Profit: $${deal.annual_profit?.toLocaleString()}
Multiple: ${deal.asking_price && deal.annual_profit ? (deal.asking_price / deal.annual_profit).toFixed(1) : 'Unknown'}x
FBA %: ${deal.fba_percentage || 'Unknown'}%
${documentContent}

Based on all available information including documents:
1. Key risk factors (5-7 items) - consider any red flags or concerns mentioned in documents
2. Growth opportunities (5-7 items) - include any opportunities mentioned in broker materials
3. Strategic recommendations (5-7 items) - based on comprehensive analysis

Focus on Amazon-specific risks and opportunities, and any specific details from the documents.

Format as JSON with keys: riskFactors, growthOpportunities, recommendations`;

    try {
      const result = await this.callOpenAI([
        {
          role: "system",
          content: "You are an Amazon FBA business acquisition expert. Identify key risks, opportunities, and strategic recommendations."
        },
        { role: "user", content: prompt }
      ], { temperature: 0.3, max_tokens: 1200 });
      
      if (!result) throw new Error("No response");
      
      return JSON.parse(result);
    } catch (error) {
      return {
        riskFactors: [
          "Amazon policy changes",
          "Increased competition",
          "Supply chain disruptions",
          "Detailed risk analysis required"
        ],
        growthOpportunities: [
          "Product line expansion",
          "International marketplace expansion",
          "SEO optimization",
          "Detailed opportunity analysis needed"
        ],
        recommendations: [
          "Conduct thorough due diligence",
          "Analyze historical performance",
          "Review supplier relationships",
          "Professional evaluation recommended"
        ]
      };
    }
  }

  private async generateSummary(deal: DealData, analysis: any, documents: DealDocument[]): Promise<string> {
    const documentInfo = documents.length > 0 
      ? `\nAnalysis based on ${documents.length} uploaded documents including: ${documents.map(d => d.file_name).join(', ')}`
      : '';

    const prompt = `Create an executive summary for this Amazon FBA acquisition opportunity:

Business: ${deal.business_name}
Category: ${deal.amazon_category}
Price: $${deal.asking_price?.toLocaleString()}
Revenue: $${deal.annual_revenue?.toLocaleString()}
Profit: $${deal.annual_profit?.toLocaleString()}
${documentInfo}

Key Analysis Points:
- Opportunity Score: ${analysis.opportunityScore?.overall || 'Unknown'}/100
- Competition Level: ${analysis.competitiveAnalysis?.marketDynamics?.competitionLevel || 'Unknown'}
- Top Risk: ${analysis.riskFactors?.[0] || 'Risk analysis needed'}
- Top Opportunity: ${analysis.growthOpportunities?.[0] || 'Opportunity analysis needed'}
- Document Analysis: ${documents.length > 0 ? 'Comprehensive review of financial documents and business materials completed' : 'No supporting documents analyzed'}

Write a 2-3 paragraph executive summary that:
1. Highlights the key investment thesis based on all available data
2. Incorporates key findings from the uploaded documents
3. Addresses main opportunities and primary concerns
4. Mentions if critical information is missing or if documents provided additional clarity`;

    try {
      const result = await this.callOpenAI([
        {
          role: "system",
          content: "You are a business acquisition advisor. Write clear, concise executive summaries for investment opportunities."
        },
        { role: "user", content: prompt }
      ], { temperature: 0.3, max_tokens: 500 });
      
      return result || 
        `This ${deal.amazon_category} Amazon FBA business presents a potential acquisition opportunity with ${deal.annual_revenue ? '$' + deal.annual_revenue.toLocaleString() : 'undisclosed'} in annual revenue. A comprehensive analysis is recommended to evaluate the full investment potential and associated risks.`;
    } catch (error) {
      return `This ${deal.amazon_category} Amazon FBA business presents a potential acquisition opportunity with ${deal.annual_revenue ? '$' + deal.annual_revenue.toLocaleString() : 'undisclosed'} in annual revenue. A comprehensive analysis is recommended to evaluate the full investment potential and associated risks.`;
    }
  }

  private calculateConfidenceLevel(deal: DealData, documents: DealDocument[]): number {
    let confidence = 50; // Base confidence
    
    // Increase confidence based on available data
    if (deal.annual_revenue) confidence += 10;
    if (deal.annual_profit) confidence += 10;
    if (deal.amazon_category) confidence += 5;
    if (deal.amazon_subcategory) confidence += 5;
    if (deal.fba_percentage) confidence += 5;
    if (deal.business_age) confidence += 5;
    if (deal.amazon_store_url) confidence += 5;
    if (deal.tags && deal.tags.length > 0) confidence += 5;
    
    // Significantly increase confidence based on document analysis
    if (documents.length > 0) {
      confidence += 15; // Base boost for having documents
      
      // Additional boost based on document types
      const hasFinancialDocs = documents.some(doc => 
        doc.category?.toLowerCase().includes('financial') || 
        doc.file_name.toLowerCase().includes('p&l') ||
        doc.file_name.toLowerCase().includes('profit')
      );
      
      if (hasFinancialDocs) confidence += 10;
      
      // More documents = more confidence (up to a limit)
      confidence += Math.min(documents.length * 2, 10);
    }
    
    return Math.min(100, confidence);
  }

  async refreshAnalysis(dealId: string, deal: DealData, progressCallback?: (stage: string) => void): Promise<AIAnalysisReport> {
    // This would typically check if analysis is stale and regenerate if needed
    return this.generateDealAnalysis(deal, progressCallback);
  }
}

// Document Analysis for Add Deal Modal - Static utility methods
export class DocumentAnalysisService {
  static async analyzeDocument(file: File, progressCallback?: (stage: string) => void): Promise<DocumentAnalysis> {
    try {
      console.log('Starting document analysis for file:', file.name, 'Type:', file.type, 'Size:', file.size);
      
      // Process the document based on type - all analysis happens server-side now
      console.log('Processing document:', file.name, 'Type:', file.type);
      progressCallback?.('Analyzing document...');
      
      try {
        // For text-based files, extract content first
        const fileName = file.name.toLowerCase();
        let documentContent = '';
        
        if (fileName.endsWith('.txt')) {
          documentContent = await file.text();
        } else if (fileName.endsWith('.docx')) {
          documentContent = await DocumentExtractors.extractFromDocx(file);
        } else if (fileName.match(/\.(xlsx?|csv)$/i)) {
          if (fileName.endsWith('.csv')) {
            documentContent = await DocumentExtractors.extractFromCSV(file);
          } else {
            documentContent = await DocumentExtractors.extractFromExcel(file);
          }
        } else if (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          // For images, convert to base64 and use vision API
          return await this.analyzeImageDocument(file, progressCallback);
        } else if (fileName.endsWith('.pdf')) {
          // For PDFs, we need special handling
          return await this.analyzePDFDocument(file, progressCallback);
        } else {
          throw new Error(`Unsupported file type: ${file.name}`);
        }
        
        // Send text content to server for analysis
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
        const response = await fetch(`${API_BASE_URL}/api/openai/analyze-document`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: documentContent,
            fileName: file.name,
            fileType: file.type,
            analysisType: 'business'
          }),
        });
        
        if (!response.ok) {
          let errorMessage = 'Failed to analyze document';
          try {
            const error = await response.json();
            errorMessage = error.error || errorMessage;
          } catch (e) {
            // If JSON parsing fails, try to get text
            errorMessage = await response.text() || errorMessage;
          }
          throw new Error(errorMessage);
        }
        
        let data;
        try {
          data = await response.json();
        } catch (e) {
          console.error('Failed to parse response as JSON:', e);
          throw new Error('Invalid JSON response from server');
        }
        
        const analysis = data.analysis;
        
        // Calculate confidence based on extracted data
        const confidence = this.calculateDocumentConfidence(analysis);
        
        console.log('Document analysis result:', {
          businessName: analysis.businessName,
          hasRevenue: !!analysis.annualRevenue,
          hasProfit: !!analysis.annualProfit,
          keyFindingsCount: analysis.keyFindings?.length || 0,
          confidence: confidence
        });
        
        return {
          businessName: analysis.businessName || 'Unknown Business',
          description: analysis.description || '',
          askingPrice: analysis.askingPrice || 0,
          annualRevenue: analysis.annualRevenue || 0,
          annualProfit: analysis.annualProfit || 0,
          monthlyRevenue: analysis.monthlyRevenue || 0,
          monthlyProfit: analysis.monthlyProfit || 0,
          keyFindings: analysis.keyFindings || [],
          confidence: confidence,
          dataExtracted: {
            hasPL: analysis.financials?.hasDetailedPL || false,
            hasRevenue: !!analysis.annualRevenue,
            hasProfit: !!analysis.annualProfit,
            hasInventory: !!analysis.financials?.inventoryValue
          },
          additionalInfo: {
            inventoryValue: analysis.financials?.inventoryValue,
            reasonForSelling: analysis.redFlags?.join(', '),
            growthOpportunities: analysis.opportunities?.join(', ')
          }
        };
      } catch (error) {
        console.error('Error in document analysis:', error);
        // Return a fallback analysis if parsing fails
        return {
          businessName: 'Document Analysis',
          description: 'Could not extract detailed information from document',
          askingPrice: 0,
          annualRevenue: 0,
          annualProfit: 0,
          keyFindings: [`Analysis parsing failed: ${error.message}`],
          confidence: 0,
          dataExtracted: {
            hasPL: false,
            hasRevenue: false,
            hasProfit: false,
            hasInventory: false
          },
          monthlyRevenue: 0,
          monthlyProfit: 0,
          industry: 'Unknown',
          location: 'Unknown'
        };
      }
    } catch (error) {
      console.error('Error analyzing document:', error);
      // Return a fallback analysis instead of throwing
      return {
        businessName: 'Document',
        description: 'Failed to analyze document',
        askingPrice: 0,
        annualRevenue: 0,
        annualProfit: 0,
        keyFindings: [`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        confidence: 0,
        dataExtracted: {
          hasPL: false,
          hasRevenue: false,
          hasProfit: false,
          hasInventory: false
        },
        monthlyRevenue: 0,
        monthlyProfit: 0,
        industry: 'Unknown',
        location: 'Unknown'
      };
    }
  }

  private static calculateDocumentConfidence(analysis: any): number {
    let confidence = 0;
    let totalChecks = 0;

    // Business name check (20 points)
    totalChecks += 20;
    if (analysis.businessName && analysis.businessName !== 'Unknown Business' && analysis.businessName.length > 2) {
      confidence += 20;
    }

    // Financial data checks (60 points total)
    totalChecks += 20;
    if (analysis.annualRevenue && analysis.annualRevenue > 0) {
      confidence += 20;
    }

    totalChecks += 20;
    if (analysis.annualProfit && analysis.annualProfit > 0) {
      confidence += 20;
    }

    totalChecks += 20;
    if (analysis.askingPrice && analysis.askingPrice > 0) {
      confidence += 20;
    }

    // Content quality checks (20 points total)
    totalChecks += 10;
    if (analysis.keyFindings && analysis.keyFindings.length > 0) {
      confidence += 10;
    }

    totalChecks += 10;
    if (analysis.description && analysis.description.length > 10) {
      confidence += 10;
    }

    // Calculate percentage
    const confidencePercentage = Math.round((confidence / totalChecks) * 100);
    
    console.log('Confidence calculation:', {
      totalChecks,
      actualScore: confidence,
      percentage: confidencePercentage,
      hasBusinessName: !!analysis.businessName,
      hasRevenue: !!analysis.annualRevenue,
      hasProfit: !!analysis.annualProfit,
      hasPrice: !!analysis.askingPrice,
      keyFindingsCount: analysis.keyFindings?.length || 0
    });

    return confidencePercentage;
  }

  private static async analyzeImageDocument(file: File, progressCallback?: (stage: string) => void): Promise<DocumentAnalysis> {
    try {
      progressCallback?.('Converting image for analysis...');
      
      // Convert image to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      progressCallback?.('Analyzing image with AI Vision...');
      
      const prompt = `Analyze this business document image and extract key information:
1. Business name
2. Business type/description
3. Financial data (revenue, profit, asking price)
4. Key metrics and numbers
5. Important details or findings

Format your response as JSON with these keys:
{
  "businessName": "...",
  "description": "...",
  "askingPrice": 0,
  "annualRevenue": 0,
  "annualProfit": 0,
  "monthlyRevenue": 0,
  "monthlyProfit": 0,
  "keyFindings": [],
  "metrics": {}
}`;

      const response = await fetch('http://localhost:3002/api/openai/vision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64,
          prompt: prompt,
          max_tokens: 1500
        }),
      });
      
      if (!response.ok) {
        let errorMessage = `Failed to analyze image (Status: ${response.status})`;
        try {
          const responseText = await response.text();
          if (responseText) {
            try {
              const error = JSON.parse(responseText);
              // Check for specific vision API errors
              if (error.error?.includes('Invalid MIME type')) {
                errorMessage = 'Vision API error: File format not supported for image analysis';
              } else {
                errorMessage = error.error || error.message || errorMessage;
              }
            } catch (e) {
              // Not JSON, use as text
              errorMessage = responseText;
            }
          }
        } catch (e) {
          // If text parsing fails, use the status
          console.error('Failed to read error response:', e);
        }
        
        // Make vision API errors non-fatal - return a basic analysis instead of throwing
        if (errorMessage.includes('Invalid MIME type') || errorMessage.includes('Vision API')) {
          console.warn('Vision API failed for image analysis, returning basic analysis:', errorMessage);
          return {
            businessName: 'Image Document',
            description: 'Image uploaded but AI analysis unavailable',
            askingPrice: 0,
            annualRevenue: 0,
            annualProfit: 0,
            keyFindings: ['Image uploaded successfully - AI analysis temporarily unavailable'],
            confidence: 10,
            dataExtracted: {
              hasPL: false,
              hasRevenue: false,
              hasProfit: false,
              hasInventory: false
            },
            monthlyRevenue: 0,
            monthlyProfit: 0
          };
        }
        
        throw new Error(errorMessage);
      }
      
      let data;
      const responseText = await response.text();
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        console.error('Response text:', responseText);
        throw new Error('Invalid JSON response from server');
      }
      
      const result = data.response;
      
      try {
        const analysis = typeof result === 'string' ? JSON.parse(result) : result;
        return {
          businessName: analysis.businessName || 'Image Analysis',
          description: analysis.description || '',
          askingPrice: analysis.askingPrice || 0,
          annualRevenue: analysis.annualRevenue || 0,
          annualProfit: analysis.annualProfit || 0,
          monthlyRevenue: analysis.monthlyRevenue || 0,
          monthlyProfit: analysis.monthlyProfit || 0,
          keyFindings: analysis.keyFindings || [],
          confidence: 90,
          dataExtracted: {
            hasPL: !!analysis.annualProfit,
            hasRevenue: !!analysis.annualRevenue,
            hasProfit: !!analysis.annualProfit,
            hasInventory: false
          }
        };
      } catch (e) {
        // If JSON parsing fails, return basic analysis
        return {
          businessName: 'Image Document',
          description: result.substring(0, 200),
          askingPrice: 0,
          annualRevenue: 0,
          annualProfit: 0,
          keyFindings: [result],
          confidence: 70,
          dataExtracted: {
            hasPL: false,
            hasRevenue: false,
            hasProfit: false,
            hasInventory: false
          }
        };
      }
    } catch (error) {
      console.error('Error analyzing image document:', error);
      // Return a fallback analysis instead of throwing to prevent breaking the workflow
      return {
        businessName: 'Image Document',
        description: 'Failed to analyze image document',
        askingPrice: 0,
        annualRevenue: 0,
        annualProfit: 0,
        keyFindings: [`Analysis failed: ${error.message}`],
        confidence: 0,
        dataExtracted: {
          hasPL: false,
          hasRevenue: false,
          hasProfit: false,
          hasInventory: false
        },
        monthlyRevenue: 0,
        monthlyProfit: 0,
        industry: 'Unknown',
        location: 'Unknown'
      };
    }
  }
  
  private static async analyzePDFDocument(file: File, progressCallback?: (stage: string) => void): Promise<DocumentAnalysis> {
    try {
      progressCallback?.('Processing PDF document...');
      
      // First try to extract text from the PDF
      let pdfText = '';
      try {
        // Use PDF.js to extract text
        const pdfjs = await import('pdfjs-dist');
        
        // Set worker source with proper error handling
        if (pdfjs.GlobalWorkerOptions) {
          pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
        } else {
          console.warn('PDF.js GlobalWorkerOptions not available, PDF processing may be limited');
        }
        
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        
        progressCallback?.('Extracting text from PDF...');
        
        // Extract text from all pages
        const textPromises = [];
        for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) { // Limit to first 10 pages
          textPromises.push(
            pdf.getPage(i).then(page => 
              page.getTextContent().then(textContent => 
                textContent.items.map((item: any) => item.str).join(' ')
              )
            )
          );
        }
        
        const pageTexts = await Promise.all(textPromises);
        pdfText = pageTexts.join('\n\n');
        
      } catch (pdfError) {
        console.warn('PDF text extraction failed, falling back to document analysis endpoint:', pdfError);
        
        // Fallback: send to document analysis endpoint
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
        const response = await fetch(`${API_BASE_URL}/api/openai/analyze-document`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: `PDF document: ${file.name}`,
            fileName: file.name,
            fileType: file.type,
            analysisType: 'business'
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Document analysis failed: ${response.status}`);
        }
        
        const data = await response.json();
        const analysis = data.analysis;
        
        return {
          businessName: analysis.businessName || 'PDF Document',
          description: analysis.description || 'PDF business document',
          askingPrice: analysis.askingPrice || 0,
          annualRevenue: analysis.annualRevenue || 0,
          annualProfit: analysis.annualProfit || 0,
          keyFindings: analysis.keyFindings || ['PDF document analyzed'],
          confidence: 25,
          dataExtracted: {
            hasPL: false,
            hasRevenue: false,
            hasProfit: false,
            hasInventory: false
          },
          monthlyRevenue: 0,
          monthlyProfit: 0,
          industry: 'Unknown',
          location: 'Unknown'
        };
      }
      
      // If we successfully extracted text, analyze it
      if (pdfText && pdfText.trim().length > 0) {
        progressCallback?.('Analyzing PDF content with AI...');
        
        const prompt = `Analyze this PDF business document content and extract key information:

PDF Content:
${pdfText.substring(0, 4000)} // Limit content to avoid token limits

Focus on finding:
1. Business name and description
2. Financial data (revenue, profit, income, expenses)
3. Tax information (if it's a tax return)
4. Key business metrics and numbers
5. Important findings

For tax documents (Schedule C, 1040, etc), extract:
- Business income/revenue
- Business expenses
- Net profit/loss
- Business name/description

Format your response as JSON with these keys:
{
  "businessName": "...",
  "description": "...",
  "askingPrice": 0,
  "annualRevenue": 0,
  "annualProfit": 0,
  "keyFindings": ["finding1", "finding2"],
  "monthlyRevenue": 0,
  "monthlyProfit": 0
}`;
        
        const response = await fetch('http://localhost:3002/api/openai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: 'You are a business analyst expert at extracting information from financial documents.' },
              { role: 'user', content: prompt }
            ],
            model: 'gpt-4o-mini',
            max_tokens: 1500
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Chat API failed: ${response.status}`);
        }
        
        const data = await response.json();
        const result = data.response;
        
        try {
          const analysis = typeof result === 'string' ? JSON.parse(result) : result;
          
          const confidence = this.calculateDocumentConfidence(analysis);
          
          return {
            businessName: analysis.businessName || 'PDF Document',
            description: analysis.description || 'PDF business document analysis',
            askingPrice: analysis.askingPrice || 0,
            annualRevenue: analysis.annualRevenue || 0,
            annualProfit: analysis.annualProfit || 0,
            keyFindings: analysis.keyFindings || ['PDF document analyzed with text extraction'],
            confidence: confidence,
            dataExtracted: {
              hasPL: analysis.annualRevenue > 0 || analysis.annualProfit !== 0,
              hasRevenue: !!analysis.annualRevenue,
              hasProfit: !!analysis.annualProfit,
              hasInventory: false
            },
            monthlyRevenue: analysis.monthlyRevenue || (analysis.annualRevenue ? Math.round(analysis.annualRevenue / 12) : 0),
            monthlyProfit: analysis.monthlyProfit || (analysis.annualProfit ? Math.round(analysis.annualProfit / 12) : 0),
            industry: 'Unknown',
            location: 'Unknown'
          };
        } catch (error) {
          console.error('Error parsing PDF analysis result:', error);
          return {
            businessName: 'PDF Document',
            description: 'PDF analysis completed but could not parse detailed results',
            askingPrice: 0,
            annualRevenue: 0,
            annualProfit: 0,
            keyFindings: ['PDF document processed with text extraction'],
            confidence: 25,
            dataExtracted: {
              hasPL: false,
              hasRevenue: false,
              hasProfit: false,
              hasInventory: false
            },
            monthlyRevenue: 0,
            monthlyProfit: 0,
            industry: 'Unknown',
            location: 'Unknown'
          };
        }
      } else {
        // No text extracted, return basic analysis
        return {
          businessName: 'PDF Document',
          description: 'PDF document uploaded but no text could be extracted',
          askingPrice: 0,
          annualRevenue: 0,
          annualProfit: 0,
          keyFindings: ['PDF document uploaded but content could not be extracted'],
          confidence: 10,
          dataExtracted: {
            hasPL: false,
            hasRevenue: false,
            hasProfit: false,
            hasInventory: false
          },
          monthlyRevenue: 0,
          monthlyProfit: 0,
          industry: 'Unknown',
          location: 'Unknown'
        };
      }
    } catch (error) {
      console.error('Error analyzing PDF:', error);
      return {
        businessName: 'PDF Document',
        description: 'PDF analysis failed',
        askingPrice: 0,
        annualRevenue: 0,
        annualProfit: 0,
        keyFindings: [`PDF analysis failed: ${error.message}`],
        confidence: 0,
        dataExtracted: {
          hasPL: false,
          hasRevenue: false,
          hasProfit: false,
          hasInventory: false
        },
        monthlyRevenue: 0,
        monthlyProfit: 0,
        industry: 'Unknown',
        location: 'Unknown'
      };
    }
  }

}
// Document analysis interface for Add Deal Modal
export interface DocumentAnalysis {
  businessName?: string;
  description?: string;
  askingPrice?: number;
  annualRevenue?: number;
  annualProfit?: number;
  monthlyRevenue?: number;
  monthlyProfit?: number;
  valuationMultiple?: number;
  businessAge?: number;
  dateListed?: string;
  industry?: string;
  location?: string;
  listingUrl?: string;
  websiteUrl?: string;
  brokerInfo?: {
    name?: string;
    company?: string;
    email?: string;
    phone?: string;
  };
  sellerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  amazonInfo?: {
    storeName?: string;
    category?: string;
    subcategory?: string;
    storeUrl?: string;
    fbaPercentage?: number;
    accountHealth?: string;
    asinCount?: number;
    topProducts?: string[];
  };
  additionalInfo?: {
    inventoryValue?: number;
    employeeCount?: number;
    reasonForSelling?: string;
    growthOpportunities?: string;
    includesRealEstate?: boolean;
    trainingProvided?: boolean;
  };
  keyFindings?: string[];
  missingCriticalInfo?: string[];
  confidence: number;
  dataExtracted?: {
    hasPL: boolean;
    hasRevenue: boolean;
    hasProfit: boolean;
    hasInventory: boolean;
  };
}

export default AIAnalysisService;