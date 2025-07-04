import OpenAI from 'openai';
import { getConfigValue } from '../config/runtime-config';
import { filesAdapter } from '../lib/database-adapter';
import { supabase } from '../supabaseClient';

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
  private client: OpenAI;
  private readonly model = 'gpt-4o-mini';

  constructor() {
    const apiKey = getConfigValue('VITE_OPENAI_API_KEY') || 
                   import.meta.env.VITE_OPENAI_API_KEY || 
                   import.meta.env.REACT_APP_OPENAI_API_KEY;
    
    this.client = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
    });
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
    const analyzableTypes = ['pdf', 'txt', 'doc', 'docx', 'png', 'jpg', 'jpeg'];
    const extension = fileType.toLowerCase().split('.').pop() || '';
    return analyzableTypes.includes(extension) || 
           analyzableTypes.some(type => fileType.toLowerCase().includes(type));
  }

  private async downloadAndAnalyzeDocument(file: any): Promise<string | null> {
    try {
      // Download the file from Supabase storage
      const { data, error } = await supabase.storage
        .from('deal-documents')
        .download(file.file_path);

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

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content: "You are an expert Amazon marketplace analyst. Provide detailed competitive analysis for FBA business acquisitions."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    try {
      const result = response.choices[0]?.message?.content;
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

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content: "You are an Amazon SEO expert. Analyze keyword opportunities for Amazon FBA businesses based on category and product type."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1200,
    });

    try {
      const result = response.choices[0]?.message?.content;
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

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content: "You are an expert business acquisition analyst. Score Amazon FBA businesses on acquisition attractiveness."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 1000,
    });

    try {
      const result = response.choices[0]?.message?.content;
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

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content: "You are an Amazon FBA business acquisition expert. Identify key risks, opportunities, and strategic recommendations."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1200,
    });

    try {
      const result = response.choices[0]?.message?.content;
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

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content: "You are a business acquisition advisor. Write clear, concise executive summaries for investment opportunities."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content || 
      `This ${deal.amazon_category} Amazon FBA business presents a potential acquisition opportunity with ${deal.annual_revenue ? '$' + deal.annual_revenue.toLocaleString() : 'undisclosed'} in annual revenue. A comprehensive analysis is recommended to evaluate the full investment potential and associated risks.`;
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
      
      // Check if API key is available - try runtime config first
      console.log('Checking for OpenAI API key...');
      console.log('Window runtime config:', typeof window !== 'undefined' ? (window as any).__RUNTIME_CONFIG__ : 'Not available');
      console.log('Import meta env:', import.meta.env);
      
      const apiKey = getConfigValue('VITE_OPENAI_API_KEY') || 
                     import.meta.env.VITE_OPENAI_API_KEY || 
                     import.meta.env.REACT_APP_OPENAI_API_KEY;
      
      console.log('API key found:', apiKey ? 'Yes (hidden)' : 'No');
      
      if (!apiKey) {
        console.error('OpenAI API key not found');
        const isDev = import.meta.env.DEV;
        
        if (!isDev) {
          // Production-specific message
          throw new Error(
            `OpenAI API key not configured.\n\n` +
            `To enable AI document analysis:\n` +
            `1. Set VITE_OPENAI_API_KEY in your deployment environment (Railway, Vercel, etc.)\n` +
            `2. Make sure to rebuild and redeploy after setting the variable\n` +
            `3. Check that the variable name is exactly: VITE_OPENAI_API_KEY\n\n` +
            `For now, you can still upload images or text files.`
          );
        } else {
          // Development-specific message
          throw new Error(
            `OpenAI API key not configured.\n\n` +
            `To enable AI document analysis:\n` +
            `1. Add your OpenAI API key to .env.local\n` +
            `2. Add this line: VITE_OPENAI_API_KEY=your_api_key_here\n` +
            `3. Restart the development server\n\n` +
            `For now, you can still upload images or text files.`
          );
        }
      }
      
      // Create a temporary client instance for static methods
      const client = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true,
      });

      // Use Vision API for all document types
      console.log('Processing document with Vision API...');
      progressCallback?.('Processing document with AI Vision...');
      const analysis = await this.analyzeDocumentWithVision(file, client, progressCallback);
      console.log('Analysis complete:', analysis);
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing document:', error);
      throw new Error(`Failed to analyze document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async analyzeDocumentWithVision(file: File, client: OpenAI, progressCallback?: (stage: string) => void): Promise<DocumentAnalysis> {
    try {
      const fileName = file.name.toLowerCase();
      
      // For PDFs, we need to convert to images first
      if (fileName.endsWith('.pdf')) {
        progressCallback?.('Preparing PDF analysis...');
        return await this.analyzePDFWithVision(file, client, progressCallback);
      }
      
      // For images, send directly to Vision API
      if (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        progressCallback?.('Analyzing image with AI Vision...');
        return await this.analyzeImageWithVision(file, client);
      }
      
      // For text files, we can still read directly and analyze
      if (fileName.endsWith('.txt')) {
        progressCallback?.('Analyzing text document...');
        const text = await file.text();
        return await this.analyzeTextWithVision(text, file.name, client);
      }
      
      // For Word/Excel, try to convert to images or provide guidance
      if (fileName.match(/\.(docx?|xlsx?)$/i)) {
        return await this.analyzeOfficeWithVision(file, client);
      }
      
      throw new Error(`Unsupported file type: ${file.name}. Please upload PDF, images (PNG/JPG), or text files.`);
      
    } catch (error) {
      console.error('Vision API analysis error:', error);
      throw error;
    }
  }

  private static async analyzePDFWithVision(file: File, client: OpenAI, progressCallback?: (stage: string) => void): Promise<DocumentAnalysis> {
    try {
      console.log('Converting PDF to images for Vision API analysis...');
      progressCallback?.('Loading PDF document...');
      
      // Import PDF.js with better error handling
      let pdfjsLib;
      try {
        console.log('Attempting to dynamically import pdfjs-dist...');
        // Import the ES module version
        const pdfjs = await import('pdfjs-dist');
        console.log('Successfully imported pdfjs-dist. Module keys:', Object.keys(pdfjs));
        
        // Handle different export patterns
        if (pdfjs.getDocument) {
          console.log('Found getDocument directly on module.');
          pdfjsLib = pdfjs;
        } else if (pdfjs.default && pdfjs.default.getDocument) {
          console.log('Found getDocument on module.default.');
          pdfjsLib = pdfjs.default;
        } else if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
          console.log('Using window.pdfjsLib fallback.');
          pdfjsLib = (window as any).pdfjsLib;
        } else {
          console.log('getDocument not found directly, searching in module values...');
          // Try to find getDocument in the module
          const foundLib = Object.values(pdfjs).find((val: any) => val && typeof val.getDocument === 'function');
          if (foundLib) {
            console.log('Found getDocument in one of the module exports.');
            pdfjsLib = foundLib;
          } else {
            console.error('Could not find a valid pdfjs-dist export with getDocument.');
          }
        }
        
        console.log('PDF.js library selected. getDocument available:', typeof pdfjsLib?.getDocument === 'function');
      } catch (importError) {
        console.error('Failed to dynamically import pdfjs-dist:', importError);
        throw new Error('PDF processing library (pdfjs-dist) failed to load. Please try uploading images or text files instead.');
      }
      
      // Ensure we have the getDocument function
      if (!pdfjsLib || typeof pdfjsLib.getDocument !== 'function') {
        console.error('PDF.js is loaded but the getDocument function is not available or not a function.');
        throw new Error('PDF.js is not properly configured. Please try uploading images or text files instead.');
      }
      
      // Configure worker - PDF.js requires a worker source to be specified
      if (pdfjsLib.GlobalWorkerOptions) {
        const version = pdfjsLib.version || '3.11.174'; // Use detected version or fallback
        const workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.js`;
        console.log(`Setting PDF.js worker version: ${version}, path: ${workerSrc}`);
        
        // Use CDN worker source - this avoids local file CORS issues
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
        
        console.log('PDF.js worker configured successfully.');
      } else {
        console.warn('pdfjsLib.GlobalWorkerOptions is not available. PDF processing might be slow or fail for large files.');
      }
      
      // Load the PDF with fallback options and timeout
      progressCallback?.('Opening PDF document...');
      const arrayBuffer = await file.arrayBuffer();
      
      let pdf;
      try {
        const loadingOptions = {
          data: arrayBuffer,
          disableWorker: false, // Enable worker since we've configured it properly
          disableRange: true,  // Disable range requests
          disableStream: true, // Disable streaming
          useSystemFonts: false, // Don't use system fonts
          standardFontDataUrl: '', // Don't load external fonts
          verbosity: 0,
          isEvalSupported: false, // Disable eval for security
          fontExtraProperties: false, // Reduce font processing
          nativeImageDecoderSupport: 'none' // Use built-in image decoder
        };
        
        console.log('Attempting to load PDF with options:', loadingOptions);
        
        // Add timeout to prevent hanging
        const loadingTask = pdfjsLib.getDocument(loadingOptions);
        
        // Race between PDF loading and timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('PDF loading timeout - file may be too large or complex')), 30000);
        });
        
        pdf = await Promise.race([loadingTask.promise, timeoutPromise]);
      } catch (loadError) {
        console.error('PDF loading error:', loadError);
        
        // Provide more specific error messages
        if (loadError.message?.includes('timeout')) {
          throw new Error('PDF loading timed out. The file may be too large or complex. Try converting to images first.');
        } else if (loadError.message?.includes('password') || loadError.message?.includes('encrypted')) {
          throw new Error('PDF is password-protected. Please remove the password and try again.');
        } else if (loadError.message?.includes('Invalid') || loadError.message?.includes('format')) {
          throw new Error('Invalid PDF format. The file may be corrupted or not a valid PDF.');
        } else {
          throw new Error(`Failed to open PDF: ${loadError.message || 'Unknown error'}. Try uploading images or text files instead.`);
        }
      }
      
      console.log(`PDF loaded successfully. Processing ${pdf.numPages} pages...`);
      
      // --- START: Smart Page Selection Logic ---
      progressCallback?.('Scanning document for relevant pages...');
      
      const keywordWeights = {
        'revenue': 5, 'profit': 5, 'financial': 5, 'sales': 5, 'ebitda': 5, 'sde': 5, 'cash flow': 5,
        'income': 4, 'balance sheet': 4,
        'summary': 3, 'overview': 3, 'highlights': 3,
        'growth': 2, 'opportunity': 2, 'market': 2, 'competition': 2,
        'valuation': 2, 'asking price': 2,
      };

      const pageScores: { pageNum: number, score: number }[] = [];
      const maxPagesToScanForPrio = Math.min(pdf.numPages, 50); // Scan up to 50 pages for keywords

      for (let i = 1; i <= maxPagesToScanForPrio; i++) {
        try {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          if (textContent.items.length > 0) {
            const pageText = textContent.items.map((item: any) => item.str).join(' ').toLowerCase();
            let score = 0;
            for (const keyword in keywordWeights) {
              if (pageText.includes(keyword)) {
                score += (keywordWeights as any)[keyword];
              }
            }
            if (score > 0) {
              pageScores.push({ pageNum: i, score });
            }
          }
        } catch (e) {
          console.warn(`Could not pre-scan page ${i} for keywords.`);
        }
      }

      const maxPagesToAnalyze = 10;
      let pagesForAnalysis: number[];

      if (pageScores.length > 0) {
        pageScores.sort((a, b) => b.score - a.score);
        let prioritizedPages = pageScores.map(p => p.pageNum);

        if (!prioritizedPages.includes(1) && pdf.numPages > 0) {
          prioritizedPages.unshift(1);
        }

        pagesForAnalysis = [...new Set(prioritizedPages)].slice(0, maxPagesToAnalyze);
        console.log('Smart Selection: Prioritizing pages based on keywords:', pagesForAnalysis);
        progressCallback?.(`Found ${pagesForAnalysis.length} important pages to analyze...`);
      } else {
        pagesForAnalysis = Array.from({ length: Math.min(pdf.numPages, maxPagesToAnalyze) }, (_, i) => i + 1);
        console.log('Default Selection: No keywords found, analyzing first 10 pages.');
      }
      pagesForAnalysis.sort((a, b) => a - b); // Process pages in order
      // --- END: Smart Page Selection Logic ---

      
      // First, try to extract text directly from PDF (for text-based PDFs)
      let directTextExtraction = false;
      const directTexts: string[] = [];
      
      try {
        console.log('Attempting direct text extraction from PDF...');
        progressCallback?.('Attempting direct text extraction...');
        
        for (const pageNum of pagesForAnalysis) {
          try {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            // Better text extraction that preserves layout
            const textItems = textContent.items as any[];
            let pageText = '';
            let lastY = null;
            
            // Sort items by position to maintain reading order
            textItems.sort((a, b) => {
              const yDiff = b.transform[5] - a.transform[5]; // Y coordinate (top to bottom)
              if (Math.abs(yDiff) > 2) return yDiff;
              return a.transform[4] - b.transform[4]; // X coordinate (left to right)
            });
            
            for (const item of textItems) {
              // Add line breaks when Y position changes significantly
              if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
                pageText += '\n';
              }
              pageText += item.str;
              lastY = item.transform[5];
            }
            
            pageText = pageText.trim();
            
            if (pageText.length > 50) {
              directTexts.push(pageText);
              console.log(`Page ${pageNum} direct text extraction: ${pageText.length} characters`);
              console.log(`Page ${pageNum} preview:`, pageText.substring(0, 200) + '...');
            }
          } catch (pageError) {
            console.log(`Failed to extract text from page ${pageNum}:`, pageError);
          }
        }
        
        if (directTexts.length > 0) {
          directTextExtraction = true;
          console.log(`Direct text extraction successful: ${directTexts.length} pages with text`);
        }
      } catch (error) {
        console.log('Direct text extraction failed, will use image-based approach:', error);
      }
      
      // If direct text extraction worked, use that instead of Vision API
      if (directTextExtraction && directTexts.length > 0) {
        progressCallback?.('Analyzing extracted text...');
        const combinedText = directTexts.join('\n\n=== Page Break ===\n\n');
        console.log(`Direct extraction complete: ${combinedText.length} total characters`);
        return await this.analyzeTextWithVision(combinedText, file.name, client);
      }
      
      // Otherwise, fall back to image-based extraction
      progressCallback?.('No text found, switching to image analysis...');
      console.log('No text found via direct extraction. Using image-based extraction via Vision API...');
      
      // Limit pages to process but increase limit for better coverage
      const pageTexts: string[] = [];
      let pagesProcessed = 0;
      let pagesWithText = 0;
      
      for (const pageNum of pagesForAnalysis) {
        const progressText = `Processing prioritized page ${pageNum} of ${pdf.numPages}...`;
        progressCallback?.(progressText);
        console.log(progressText);
        
        try {
          // Add timeout for page processing to prevent hanging
          const pageProcessingPromise = (async () => {
            const page = await pdf.getPage(pageNum);
            
            // Increase scale for better quality
            const viewport = page.getViewport({ scale: 2.0 }); // Increased from 1.5 to 2.0
            
            // Create canvas
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            if (!context) throw new Error(`Failed to get canvas context for page ${pageNum}`);
            
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            // Set better rendering quality
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = 'high';
            
            // Render page with better quality settings and timeout
            const renderTask = page.render({
              canvasContext: context,
              viewport: viewport,
              intent: 'print' // Use print quality rendering
            });
            
            await renderTask.promise;
            
            // Convert to base64 with higher quality
            const imageData = canvas.toDataURL('image/png', 1.0); // Max quality
            const base64Image = imageData.split(',')[1];
            
            // Debug: Log image size
            console.log(`Page ${pageNum} canvas size:`, canvas.width, 'x', canvas.height);
            console.log(`Page ${pageNum} base64 length:`, base64Image.length);
            
            // Check if the image is too small or empty
            if (canvas.width < 100 || canvas.height < 100) {
              console.warn(`Page ${pageNum} rendered very small:`, canvas.width, 'x', canvas.height);
            }
            
            // Clean up canvas early to free memory
            canvas.width = 0;
            canvas.height = 0;
            
            return base64Image;
          })();
          
          // Add timeout for page processing
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Page ${pageNum} processing timeout`)), 15000);
          });
          
          const base64Image = await Promise.race([pageProcessingPromise, timeoutPromise]);
          
          // Send to Vision API with timeout
          progressCallback?.(`Extracting text from page ${pageNum}...`);
          console.log(`Sending page ${pageNum} to Vision API...`);
          
          // Debug: Create a test link for the first page
          if (pageNum === 1) {
            const debugLink = `data:image/png;base64,${base64Image}`;
            console.log(`Page 1 debug image (copy to browser):`, debugLink.substring(0, 100) + '...');
          }
          
          const visionPromise = this.analyzeImageBase64WithVision(base64Image, `${file.name} - Page ${pageNum}`, client);
          const visionTimeoutPromise = new Promise<string>((_, reject) => {
            setTimeout(() => reject(new Error(`Vision API timeout for page ${pageNum}`)), 20000);
          });
          
          const pageText = await Promise.race([visionPromise, visionTimeoutPromise]) as string;
          
          if (pageText && pageText.trim().length > 50) {
            console.log(`Page ${pageNum} extracted text length:`, pageText.length);
            console.log(`Page ${pageNum} preview:`, pageText.substring(0, 200) + '...');
            pageTexts.push(pageText);
            pagesWithText++;
          } else {
            console.warn(`Page ${pageNum} extracted very little text (${pageText?.length || 0} characters)`);
          }
          
          pagesProcessed++;
          
        } catch (error) {
          console.error(`Error processing page ${pageNum}:`, error);
          pagesProcessed++;
          
          // If we're failing on multiple pages, try to continue but warn
          if (pageNum <= 3 && pagesWithText === 0) {
            console.warn(`Failed to process page ${pageNum}, continuing with next page...`);
          }
        }
        
        // Early exit if we're not getting any text from the first few pages
        if (pageNum >= 3 && pagesWithText === 0) {
          console.warn('No text extracted from first 3 pages, PDF may be image-based or corrupted');
          break;
        }
      }
      
      // Check if we extracted enough content
      if (pageTexts.length === 0) {
        console.error(`No content extracted from PDF. Processed ${pagesProcessed} pages, ${pagesWithText} had text.`);
        throw new Error(`No readable content could be extracted from the PDF. Processed ${pagesProcessed} pages but found no text. The document may be image-based, corrupted, or password-protected.`);
      }
      
      // Log extraction summary
      console.log(`PDF extraction complete: ${pageTexts.length} pages with text out of ${pagesProcessed} processed`);
      
      // Combine and analyze
      progressCallback?.('Finalizing analysis of extracted content...');
      const combinedText = pageTexts.join('\n\n=== Page Break ===\n\n');
      console.log(`Combined text length: ${combinedText.length} characters`);
      
      return await this.analyzeTextWithVision(combinedText, file.name, client);
      
    } catch (error) {
      console.error('PDF processing error:', error);
      
      // More detailed error messages with helpful guidance
      let errorMessage = 'PDF processing failed: ';
      let suggestions: string[] = [];
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage += 'Processing timed out. The PDF may be too large or complex.';
          suggestions = [
            '• Try a smaller PDF (fewer pages)',
            '• Convert PDF to individual image files (PNG/JPG)',
            '• Use a PDF with simpler formatting'
          ];
        } else if (error.message.includes('No readable content') || error.message.includes('No content')) {
          errorMessage += 'Unable to extract readable text from PDF. The document may be image-based or scanned.';
          suggestions = [
            '• Take screenshots of important PDF pages and upload as PNG/JPG files',
            '• Copy and paste text content into a .txt file',
            '• Use OCR software to convert scanned PDF to searchable text'
          ];
        } else if (error.message.includes('password') || error.message.includes('encrypted')) {
          errorMessage += 'PDF is password-protected or encrypted.';
          suggestions = [
            '• Remove password protection from the PDF',
            '• Save as a new unprotected PDF',
            '• Convert to images or text file instead'
          ];
        } else if (error.message.includes('corrupted') || error.message.includes('Invalid') || error.message.includes('format')) {
          errorMessage += 'PDF file appears to be corrupted or invalid.';
          suggestions = [
            '• Try opening the PDF in a PDF viewer to verify it works',
            '• Re-download or re-save the PDF',
            '• Convert to images or text file instead'
          ];
        } else if (error.message.includes('load') || error.message.includes('getDocument')) {
          errorMessage += 'Failed to load PDF processing library.';
          suggestions = [
            '• Try refreshing the page',
            '• Upload images (PNG/JPG) or text files instead',
            '• Check your internet connection'
          ];
        } else {
          errorMessage += error.message;
          suggestions = [
            '• Try uploading images (PNG/JPG) or text files instead',
            '• Ensure the PDF is not corrupted or password-protected'
          ];
        }
      } else {
        errorMessage += 'Unknown error occurred';
        suggestions = ['• Try uploading images or text files instead'];
      }
      
      // Return helpful error analysis instead of throwing
      return {
        businessName: null,
        confidence: 0,
        keyFindings: [
          `❌ ${errorMessage}`,
          '',
          '💡 Suggestions for better results:',
          ...suggestions,
          '',
          '📝 Alternative approaches:',
          '• Upload individual page screenshots as PNG/JPG files',
          '• Copy text content and save as .txt file',
          '• Use Excel/CSV format for financial data'
        ],
        missingCriticalInfo: ['PDF processing failed - please try alternative file formats']
      };
    }
  }

  private static async analyzeImageWithVision(file: File, client: OpenAI): Promise<DocumentAnalysis> {
    const base64 = await this.fileToBase64(file);
    const extractedText = await this.analyzeImageBase64WithVision(base64, file.name, client);
    return await this.analyzeTextWithVision(extractedText, file.name, client);
  }

  private static async analyzeImageBase64WithVision(base64: string, _fileName: string, client: OpenAI): Promise<string> {
    console.log('Sending image to Vision API for text extraction...');
    
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Extract all text from this document image. Return ONLY the text content, no commentary or refusal. This is a business document being processed for data entry purposes.

Focus on extracting:

• All text content
• All numbers and figures
• Names and contact info
• Tables and lists
• Headers and footers

Just transcribe what you see.`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${base64}`
              }
            }
          ]
        }
      ],
      max_tokens: 4000,
      temperature: 0.1 // Lower temperature for more accurate extraction
    });
    
    const extractedText = response.choices[0]?.message?.content;
    if (!extractedText) throw new Error('No text extracted from image');
    
    console.log(`Successfully extracted text from image: ${extractedText.length} characters`);
    console.log('Text preview:', extractedText.substring(0, 200) + '...');
    
    // Check if we got meaningful content
    if (extractedText.length < 50) {
      console.warn('Very little text extracted from image - the image may be unclear or contain no text');
    }
    
    return extractedText;
  }

  private static async analyzeOfficeWithVision(file: File, _client: OpenAI): Promise<DocumentAnalysis> {
    // For Office files, we can't easily convert to images in the browser
    // Provide guidance to the user
    const guidance = `Office document detected: "${file.name}"

To analyze this document with AI Vision:
1. Open the document in Word/Excel
2. Take screenshots of the important pages
3. Save as PDF and upload
4. Or copy the text content and save as .txt file

The Vision API works best with images and PDFs.`;
    
    return {
      businessName: null,
      confidence: 0,
      keyFindings: [guidance],
      missingCriticalInfo: ['Unable to process Office files directly']
    };
  }

  private static async analyzeTextWithVision(text: string, fileName: string, client: OpenAI): Promise<DocumentAnalysis> {
    try {
      console.log('Analyzing extracted text with AI...');
      
      const prompt = `You are an expert business analyst specializing in business-for-sale listings. You are analyzing text extracted from a business listing document (likely from a broker, marketplace, or direct seller).

CRITICAL: This document contains information about a business for sale. Your job is to extract EVERY piece of data that would be useful for evaluating this acquisition opportunity.

Common patterns to look for:
- "Asking Price:", "List Price:", "Sale Price:" followed by dollar amounts
- "Revenue:", "Sales:", "Gross Income:" for revenue figures  
- "Profit:", "Net Income:", "SDE:", "EBITDA:", "Cash Flow:" for profit metrics
- "Multiple:", "Valuation:", "x SDE", "x EBITDA" for valuation multiples
- Business descriptions often start with industry/category mentions
- Contact info often appears at bottom or in headers
- Look for "Established", "Founded", "Years in Business" for age
- Amazon businesses mention "FBA", "Amazon", "ASIN", "SKU"

Analyze this text and return ONLY valid JSON with this exact structure:

{
  "businessName": "string or null",
  "description": "string or null (comprehensive business description, products sold, unique selling points, business model)",
  "askingPrice": number or null,
  "annualRevenue": number or null,
  "annualProfit": number or null,
  "monthlyRevenue": number or null,
  "monthlyProfit": number or null,
  "valuationMultiple": number or null (calculate if price and profit available),
  "businessAge": number or null,
  "dateListed": "string or null (ISO date if found)",
  "industry": "string or null",
  "location": "string or null (city, state, country)",
  "listingUrl": "string or null",
  "websiteUrl": "string or null",
  "brokerInfo": {
    "name": "string or null",
    "company": "string or null", 
    "email": "string or null",
    "phone": "string or null"
  },
  "sellerInfo": {
    "name": "string or null",
    "email": "string or null",
    "phone": "string or null"
  },
  "amazonInfo": {
    "storeName": "string or null",
    "storeUrl": "string or null",
    "category": "string or null",
    "subcategory": "string or null",
    "fbaPercentage": number or null,
    "accountHealth": "string or null",
    "asinCount": number or null,
    "topProducts": ["array of product names or ASINs"]
  },
  "additionalInfo": {
    "inventoryValue": number or null,
    "employeeCount": number or null,
    "reasonForSelling": "string or null",
    "growthOpportunities": "string or null",
    "includesRealEstate": boolean or null,
    "trainingProvided": boolean or null
  },
  "keyFindings": ["array of key information found"],
  "missingCriticalInfo": ["array of important missing fields"],
  "confidence": number between 0-100
}

Document text (from ${fileName}):
${text}

Extraction Instructions:
- Extract ALL numerical values without currency symbols or commas
- For business age: if you find "established 2020" or "founded in 2020", calculate age from current year (2025)
- For valuation multiple: if asking price and annual profit exist, calculate price/profit
- For SDE/Seller's Discretionary Earnings/Cash Flow: treat as annual profit
- Look for ALL URLs mentioned (listing sites, Amazon stores, company websites)
- Extract complete business description including what they sell, how they operate, competitive advantages
- Identify ALL contact information and classify as broker vs seller based on context
- For Amazon businesses: look for FBA%, seller account health, number of ASINs/SKUs, product categories
- Extract any mention of inventory value, number of employees, reason for selling
- Look for growth opportunities, expansion potential, or improvement areas mentioned
- Set confidence based on completeness - 90%+ if most fields filled, 70%+ if key fields filled, 50%+ if basic info present
- List missing critical information (like no price, no revenue, no contact info)
- Return ONLY the JSON object, no other text or explanation`;

      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert business analyst specializing in extracting comprehensive information from business-for-sale listings. Always return valid JSON in the exact format requested.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (!aiResponse) throw new Error('No response from AI');

      console.log('AI analysis response length:', aiResponse.length);
      console.log('AI analysis response preview:', aiResponse.substring(0, 500));
      
      let analysis;
      try {
        analysis = JSON.parse(aiResponse);
      } catch (error) {
        console.error('Failed to parse AI response as JSON:', error);
        console.log('Original AI response:', aiResponse);
        
        // Attempt to fix common JSON issues (e.g., wrapped in markdown)
        const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          console.log('Attempting to parse JSON from extracted markdown block...');
          try {
            analysis = JSON.parse(jsonMatch[1]);
            console.log('Successfully parsed JSON after stripping markdown.');
          } catch (nestedError) {
            console.error('Still failed to parse JSON after stripping markdown:', nestedError);
            throw new Error('AI returned a malformed data structure that could not be repaired.');
          }
        } else {
          throw new Error('AI returned a malformed data structure.');
        }
      }
      
      // Log what was extracted
      console.log('Extracted data summary:', {
        businessName: analysis.businessName ? 'Found' : 'Not found',
        askingPrice: analysis.askingPrice ? `$${analysis.askingPrice}` : 'Not found',
        revenue: analysis.annualRevenue ? `$${analysis.annualRevenue}` : 'Not found',
        profit: analysis.annualProfit ? `$${analysis.annualProfit}` : 'Not found',
        confidence: analysis.confidence
      });
      
      // Validate and structure the analysis
      return this.structureAnalysisResponse(analysis, fileName);
      
    } catch (error) {
      console.error('Text analysis error:', error);
      throw error;
    }
  }

  private static structureAnalysisResponse(analysis: any, fileName: string): DocumentAnalysis {
    const structuredAnalysis = {
      businessName: analysis.businessName || null,
      description: analysis.description || null,
      askingPrice: this.parseNumber(analysis.askingPrice),
      annualRevenue: this.parseNumber(analysis.annualRevenue),
      annualProfit: this.parseNumber(analysis.annualProfit),
      monthlyRevenue: this.parseNumber(analysis.monthlyRevenue),
      monthlyProfit: this.parseNumber(analysis.monthlyProfit),
      valuationMultiple: this.parseNumber(analysis.valuationMultiple),
      businessAge: this.parseNumber(analysis.businessAge),
      dateListed: analysis.dateListed || null,
      industry: analysis.industry || null,
      location: analysis.location || null,
      listingUrl: analysis.listingUrl || null,
      websiteUrl: analysis.websiteUrl || null,
      brokerInfo: {
        name: analysis.brokerInfo?.name || null,
        company: analysis.brokerInfo?.company || null,
        email: analysis.brokerInfo?.email || null,
        phone: analysis.brokerInfo?.phone || null
      },
      sellerInfo: {
        name: analysis.sellerInfo?.name || null,
        email: analysis.sellerInfo?.email || null,
        phone: analysis.sellerInfo?.phone || null
      },
      amazonInfo: {
        storeName: analysis.amazonInfo?.storeName || null,
        category: analysis.amazonInfo?.category || null,
        subcategory: analysis.amazonInfo?.subcategory || null,
        storeUrl: analysis.amazonInfo?.storeUrl || null,
        fbaPercentage: this.parseNumber(analysis.amazonInfo?.fbaPercentage),
        accountHealth: analysis.amazonInfo?.accountHealth || null,
        asinCount: this.parseNumber(analysis.amazonInfo?.asinCount),
        topProducts: Array.isArray(analysis.amazonInfo?.topProducts) ? analysis.amazonInfo.topProducts : []
      },
      additionalInfo: {
        inventoryValue: this.parseNumber(analysis.additionalInfo?.inventoryValue),
        employeeCount: this.parseNumber(analysis.additionalInfo?.employeeCount),
        reasonForSelling: analysis.additionalInfo?.reasonForSelling || null,
        growthOpportunities: analysis.additionalInfo?.growthOpportunities || null,
        includesRealEstate: analysis.additionalInfo?.includesRealEstate || null,
        trainingProvided: analysis.additionalInfo?.trainingProvided || null
      },
      keyFindings: Array.isArray(analysis.keyFindings) ? analysis.keyFindings : ['AI analysis completed'],
      missingCriticalInfo: Array.isArray(analysis.missingCriticalInfo) ? analysis.missingCriticalInfo : [],
      confidence: Math.min(100, Math.max(0, analysis.confidence || 0))
    };

    // Validate quality
    const validationResult = this.validateAnalysisQuality(structuredAnalysis, fileName);
    
    return {
      ...structuredAnalysis,
      confidence: validationResult.adjustedConfidence,
      keyFindings: validationResult.enhancedFindings
    };
  }

  private static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private static parseNumber(value: any): number | null {
    if (value === null || value === undefined) return null;
    const num = typeof value === 'string' ? parseFloat(value.replace(/[,$]/g, '')) : Number(value);
    return isNaN(num) ? null : num;
  }

  private static validateAnalysisQuality(analysis: DocumentAnalysis, fileName: string): {
    adjustedConfidence: number;
    enhancedFindings: string[];
  } {
    const findings = [...(analysis.keyFindings || [])];
    let qualityScore = 0;
    let criticalDataPoints = 0;
    let warnings: string[] = [];

    // Core business information (highest priority)
    if (analysis.businessName) {
      qualityScore += 25;
      criticalDataPoints++;
    } else {
      warnings.push("⚠️ No business name found - this is critical for deal identification");
    }

    // Financial information (very important)
    const hasFinancials = analysis.askingPrice || analysis.annualRevenue || analysis.annualProfit;
    if (hasFinancials) {
      qualityScore += 30;
      criticalDataPoints++;
      
      // Check for complete financial picture
      if (analysis.askingPrice && (analysis.annualRevenue || analysis.annualProfit)) {
        qualityScore += 15; // Bonus for having both price and performance data
        findings.push("💰 Complete financial data found (price + performance metrics)");
      }
    } else {
      warnings.push("⚠️ No financial information found - asking price, revenue, or profit data needed");
    }

    // Contact information (important for follow-up)
    const hasContacts = analysis.brokerInfo?.email || analysis.brokerInfo?.phone || 
                       analysis.sellerInfo?.email || analysis.sellerInfo?.phone;
    if (hasContacts) {
      qualityScore += 20;
      criticalDataPoints++;
    } else {
      warnings.push("⚠️ No contact information found - email or phone needed for outreach");
    }

    // Business details (moderate importance)
    const hasBusinessDetails = analysis.industry || analysis.businessAge || analysis.location;
    if (hasBusinessDetails) {
      qualityScore += 10;
    }

    // Amazon-specific data (moderate importance for FBA businesses)
    const hasAmazonData = analysis.amazonInfo?.category || analysis.amazonInfo?.storeUrl || 
                         analysis.amazonInfo?.fbaPercentage;
    if (hasAmazonData) {
      qualityScore += 15;
      findings.push("🛒 Amazon business data detected");
    }

    // Quality assessment and warnings
    if (criticalDataPoints < 2) {
      warnings.push("❌ Insufficient data extracted - need at least 2 of: business name, financials, or contacts");
      qualityScore = Math.min(qualityScore, 40); // Cap confidence if missing critical data
    }

    // Document type specific validation
    const fileType = fileName.toLowerCase();
    if (fileType.includes('financial') || fileType.includes('p&l') || fileType.includes('income')) {
      if (!hasFinancials) {
        warnings.push("❌ Financial document uploaded but no financial data extracted");
        qualityScore = Math.max(0, qualityScore - 20);
      }
    }

    if (fileType.includes('listing') || fileType.includes('broker') || fileType.includes('teaser')) {
      if (!analysis.businessName && !hasFinancials) {
        warnings.push("❌ Business listing document but missing key listing information");
        qualityScore = Math.max(0, qualityScore - 15);
      }
    }

    // Add warnings to findings
    const enhancedFindings = [
      ...findings,
      ...warnings
    ];

    // Add quality summary
    if (criticalDataPoints >= 3) {
      enhancedFindings.unshift("✅ High-quality extraction - multiple critical data points found");
    } else if (criticalDataPoints >= 2) {
      enhancedFindings.unshift("✅ Good extraction - sufficient data for deal creation");
    } else if (criticalDataPoints >= 1) {
      enhancedFindings.unshift("⚠️ Limited extraction - some useful data found but incomplete");
    } else {
      enhancedFindings.unshift("❌ Poor extraction - minimal useful data found");
    }

    return {
      adjustedConfidence: Math.min(100, Math.max(0, qualityScore)),
      enhancedFindings
    };
  }

  private static _fallbackAnalysis(text: string): DocumentAnalysis {
    const analysis: DocumentAnalysis = {
      confidence: 30,
      keyFindings: ['Used fallback analysis due to AI processing error']
    };

    // Basic email extraction
    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      analysis.brokerInfo = { email: emailMatch[1] };
      analysis.keyFindings?.push(`Found email: ${emailMatch[1]}`);
    }

    // Basic phone extraction
    const phoneMatch = text.match(/(\(?\d{3}\)?[-.\\s]?\d{3}[-.\\s]?\d{4})/);
    if (phoneMatch) {
      if (!analysis.brokerInfo) analysis.brokerInfo = {};
      analysis.brokerInfo.phone = phoneMatch[1];
      analysis.keyFindings?.push(`Found phone: ${phoneMatch[1]}`);
    }

    // Basic price extraction
    const priceMatch = text.match(/\$?([\d,]+(?:\.\d{2})?)/);
    if (priceMatch) {
      analysis.askingPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
      analysis.keyFindings?.push(`Found potential price: $${analysis.askingPrice.toLocaleString()}`);
    }

    return analysis;
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
}

export default AIAnalysisService;