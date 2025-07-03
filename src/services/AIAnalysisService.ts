import OpenAI from 'openai';
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
  custom_fields?: any;
  [key: string]: any;
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
    this.client = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.REACT_APP_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true,
    });
  }

  async generateDealAnalysis(deal: DealData): Promise<AIAnalysisReport> {
    console.log(`Generating AI analysis for deal: ${deal.business_name}`);

    try {
      // Run multiple analyses in parallel for efficiency
      const [
        competitiveAnalysis,
        keywordAnalysis,
        opportunityScore,
        riskAndOpportunities
      ] = await Promise.all([
        this.analyzeCompetition(deal),
        this.analyzeKeywords(deal),
        this.calculateOpportunityScore(deal),
        this.analyzeRisksAndOpportunities(deal)
      ]);

      const summary = await this.generateSummary(deal, {
        competitiveAnalysis,
        keywordAnalysis,
        opportunityScore,
        ...riskAndOpportunities
      });

      return {
        summary,
        competitiveAnalysis,
        keywordAnalysis,
        opportunityScore,
        riskFactors: riskAndOpportunities.riskFactors,
        growthOpportunities: riskAndOpportunities.growthOpportunities,
        recommendations: riskAndOpportunities.recommendations,
        confidenceLevel: this.calculateConfidenceLevel(deal),
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error("Error generating AI analysis:", error);
      throw new Error("Failed to generate AI analysis report");
    }
  }

  private async analyzeCompetition(deal: DealData): Promise<CompetitiveAnalysis> {
    const prompt = `Analyze the competitive landscape for this Amazon FBA business:

Business: ${deal.business_name}
Category: ${deal.amazon_category}
Subcategory: ${deal.amazon_subcategory || 'Not specified'}
Annual Revenue: $${deal.annual_revenue?.toLocaleString()}
Price: $${deal.asking_price?.toLocaleString()}
FBA %: ${deal.fba_percentage || 'Unknown'}%

Provide a comprehensive competitive analysis including:
1. Key competitors in this space
2. Market dynamics (competition level, barriers to entry)
3. Market trends affecting this category
4. Positioning analysis

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

  private async analyzeKeywords(deal: DealData): Promise<KeywordAnalysis> {
    const prompt = `Analyze keyword opportunities for this Amazon business:

Business: ${deal.business_name}
Category: ${deal.amazon_category}
Subcategory: ${deal.amazon_subcategory || 'Not specified'}

Based on the category and business type, identify:
1. Primary keywords with estimated search volume and difficulty
2. Long-tail keyword opportunities
3. Seasonal trends for this category
4. Keyword strategy recommendations

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

  private async calculateOpportunityScore(deal: DealData): Promise<OpportunityScore> {
    const prompt = `Calculate an opportunity score (0-100) for this Amazon FBA acquisition:

Business: ${deal.business_name}
Category: ${deal.amazon_category}
Asking Price: $${deal.asking_price?.toLocaleString()}
Annual Revenue: $${deal.annual_revenue?.toLocaleString()}
Annual Profit: $${deal.annual_profit?.toLocaleString()}
Multiple: ${deal.asking_price && deal.annual_profit ? (deal.asking_price / deal.annual_profit).toFixed(1) : 'Unknown'}x
Business Age: ${deal.business_age || 'Unknown'} years
FBA %: ${deal.fba_percentage || 'Unknown'}%

Score breakdown (0-100 each):
- Financial Health (revenue, profit, multiple)
- Market Opportunity (category growth, competition)
- Growth Potential (scalability, expansion)
- Risk Assessment (dependencies, market risks)

Provide overall score and reasoning.

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

  private async analyzeRisksAndOpportunities(deal: DealData): Promise<{
    riskFactors: string[];
    growthOpportunities: string[];
    recommendations: string[];
  }> {
    const prompt = `Analyze risks and opportunities for this Amazon FBA acquisition:

Business: ${deal.business_name}
Category: ${deal.amazon_category}
Annual Revenue: $${deal.annual_revenue?.toLocaleString()}
Annual Profit: $${deal.annual_profit?.toLocaleString()}
Multiple: ${deal.asking_price && deal.annual_profit ? (deal.asking_price / deal.annual_profit).toFixed(1) : 'Unknown'}x
FBA %: ${deal.fba_percentage || 'Unknown'}%

Identify:
1. Key risk factors (5-7 items)
2. Growth opportunities (5-7 items)  
3. Strategic recommendations (5-7 items)

Focus on Amazon-specific risks and opportunities.

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

  private async generateSummary(deal: DealData, analysis: any): Promise<string> {
    const prompt = `Create an executive summary for this Amazon FBA acquisition opportunity:

Business: ${deal.business_name}
Category: ${deal.amazon_category}
Price: $${deal.asking_price?.toLocaleString()}
Revenue: $${deal.annual_revenue?.toLocaleString()}
Profit: $${deal.annual_profit?.toLocaleString()}

Key Analysis Points:
- Opportunity Score: ${analysis.opportunityScore?.overall || 'Unknown'}/100
- Competition Level: ${analysis.competitiveAnalysis?.marketDynamics?.competitionLevel || 'Unknown'}
- Top Risk: ${analysis.riskFactors?.[0] || 'Risk analysis needed'}
- Top Opportunity: ${analysis.growthOpportunities?.[0] || 'Opportunity analysis needed'}

Write a 2-3 paragraph executive summary highlighting the key investment thesis, main opportunities, and primary concerns.`;

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

  private calculateConfidenceLevel(deal: DealData): number {
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
    
    return Math.min(100, confidence);
  }

  async refreshAnalysis(dealId: string, deal: DealData): Promise<AIAnalysisReport> {
    // This would typically check if analysis is stale and regenerate if needed
    return this.generateDealAnalysis(deal);
  }
}

// Document Analysis for Add Deal Modal - Static utility methods
export class DocumentAnalysisService {
  static async analyzeDocument(file: File, progressCallback?: (stage: string) => void): Promise<DocumentAnalysis> {
    try {
      console.log('Starting document analysis for file:', file.name, 'Type:', file.type, 'Size:', file.size);
      
      // Check if API key is available
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.REACT_APP_OPENAI_API_KEY;
      if (!apiKey) {
        console.error('OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your .env file');
        const isDev = import.meta.env.DEV;
        const envFile = isDev ? '.env.local' : '.env.production';
        throw new Error(
          `OpenAI API key not configured.\n\n` +
          `To enable AI document analysis:\n` +
          `1. Add your OpenAI API key to ${envFile}\n` +
          `2. Add this line: VITE_OPENAI_API_KEY=your_api_key_here\n` +
          `3. Restart the application\n\n` +
          `For now, you can still upload images or text files for analysis.`
        );
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
      
      // Import PDF.js properly
      let pdfjsLib;
      try {
        // Import the standard build
        const pdfjs = await import('pdfjs-dist');
        
        // Log what we got
        console.log('PDF.js import result:', pdfjs);
        console.log('PDF.js keys:', Object.keys(pdfjs));
        
        // The ES module exports everything directly
        pdfjsLib = pdfjs;
        
        // Double-check for the function we need
        if (!pdfjsLib.getDocument && pdfjs.default) {
          pdfjsLib = pdfjs.default;
        }
        
        // Last resort - check window
        if (!pdfjsLib.getDocument && typeof window !== 'undefined' && (window as any).pdfjsLib) {
          console.log('Using window.pdfjsLib');
          pdfjsLib = (window as any).pdfjsLib;
        }
        
        console.log('PDF.js loaded, getDocument available:', typeof pdfjsLib.getDocument);
      } catch (importError) {
        console.error('Failed to load PDF.js:', importError);
        throw new Error('PDF processing library failed to load. Please try uploading images or text files instead.');
      }
      
      // Ensure we have the getDocument function
      if (!pdfjsLib.getDocument) {
        console.error('PDF.js loaded but getDocument not found');
        throw new Error('PDF.js loaded incorrectly. Please try uploading images or text files instead.');
      }
      
      // Configure worker - try multiple approaches
      if (pdfjsLib.GlobalWorkerOptions) {
        try {
          // First try: Use a data URL with minimal worker
          const workerCode = `
            self.addEventListener('message', function(e) {
              // Minimal fake worker
            });
          `;
          const blob = new Blob([workerCode], { type: 'application/javascript' });
          const workerUrl = URL.createObjectURL(blob);
          pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
        } catch (e) {
          console.warn('Could not create worker blob');
        }
      }
      
      // Load the PDF with fallback options
      progressCallback?.('Opening PDF document...');
      const arrayBuffer = await file.arrayBuffer();
      
      let pdf;
      try {
        const loadingOptions = {
          data: arrayBuffer,
          disableWorker: true, // Always disable worker to avoid CORS
          disableRange: true,  // Disable range requests
          disableStream: true, // Disable streaming
          useSystemFonts: true,
          standardFontDataUrl: '', // Don't load external fonts
          verbosity: 0
        };
        
        console.log('Attempting to load PDF with options:', loadingOptions);
        const loadingTask = pdfjsLib.getDocument(loadingOptions);
        pdf = await loadingTask.promise;
      } catch (loadError) {
        console.error('PDF loading error:', loadError);
        throw new Error('Failed to open PDF. The file may be corrupted, password-protected, or in an unsupported format.');
      }
      
      console.log(`PDF loaded successfully. Processing ${pdf.numPages} pages...`);
      
      // Limit pages to process but increase limit for better coverage
      const maxPages = Math.min(pdf.numPages, 10); // Increased from 5 to 10
      const pageTexts: string[] = [];
      
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        progressCallback?.(`Processing PDF page ${pageNum}/${maxPages}...`);
        console.log(`Processing page ${pageNum}/${maxPages}...`);
        
        try {
          const page = await pdf.getPage(pageNum);
          // Increase scale for better quality
          const viewport = page.getViewport({ scale: 2.0 }); // Increased from 1.5 to 2.0
          
          // Create canvas
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          if (!context) continue;
          
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          // Set better rendering quality
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = 'high';
          
          // Render page with better quality settings
          await page.render({
            canvasContext: context,
            viewport: viewport,
            intent: 'print' // Use print quality rendering
          }).promise;
          
          // Convert to base64 with higher quality
          const imageData = canvas.toDataURL('image/png', 1.0); // Max quality
          const base64Image = imageData.split(',')[1];
          
          // Send to Vision API
          progressCallback?.(`Extracting text from page ${pageNum}...`);
          const pageText = await this.analyzeImageBase64WithVision(base64Image, `${file.name} - Page ${pageNum}`, client);
          if (pageText) {
            console.log(`Page ${pageNum} extracted text length:`, pageText.length);
            console.log(`Page ${pageNum} preview:`, pageText.substring(0, 200) + '...');
            pageTexts.push(pageText);
          }
          
          // Clean up canvas to free memory
          canvas.width = 0;
          canvas.height = 0;
          
        } catch (error) {
          console.error(`Error processing page ${pageNum}:`, error);
        }
      }
      
      if (pageTexts.length === 0) {
        throw new Error('No content could be extracted from the PDF');
      }
      
      // Combine and analyze
      progressCallback?.('Analyzing extracted content...');
      const combinedText = pageTexts.join('\n\n=== Page Break ===\n\n');
      return await this.analyzeTextWithVision(combinedText, file.name, client);
      
    } catch (error) {
      console.error('PDF processing error:', error);
      
      // More detailed error messages
      let errorMessage = 'PDF processing error: ';
      if (error instanceof Error) {
        if (error.message.includes('No content')) {
          errorMessage += 'Unable to extract readable text from PDF. The document may be scanned or image-based.';
        } else if (error.message.includes('getDocument')) {
          errorMessage += 'Failed to load PDF. The file may be corrupted or password-protected.';
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += 'Unknown error occurred';
      }
      
      // Provide helpful guidance if PDF processing fails
      return {
        businessName: null,
        confidence: 0,
        keyFindings: [
          errorMessage,
          '💡 Suggestions for better results:',
          '• Try taking screenshots of the PDF pages and uploading as PNG/JPG files',
          '• Copy the text content and save as a .txt file',
          '• Ensure the PDF is not password-protected or corrupted',
          '• For scanned documents, use OCR software first'
        ],
        missingCriticalInfo: ['Unable to process PDF - please try alternative formats']
      };
    }
  }

  private static async analyzeImageWithVision(file: File, client: OpenAI): Promise<DocumentAnalysis> {
    const base64 = await this.fileToBase64(file);
    const extractedText = await this.analyzeImageBase64WithVision(base64, file.name, client);
    return await this.analyzeTextWithVision(extractedText, file.name, client);
  }

  private static async analyzeImageBase64WithVision(base64: string, fileName: string, client: OpenAI): Promise<string> {
    console.log('Sending image to Vision API for text extraction...');
    
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are analyzing page ${fileName.includes('Page') ? fileName.split('Page')[1] : ''} of a business-for-sale document. This is likely a broker listing, marketplace listing, or business summary.

CRITICAL INSTRUCTION: Extract EVERY piece of text visible in this image, maintaining the exact format and structure. Do not summarize or skip anything.

Pay special attention to:

1. Business Information:
   - Business name/title
   - Business description
   - Industry/category
   - Location (city, state, country)
   - Years in business/established date
   
2. Financial Data (CRITICAL - extract ALL numbers):
   - Asking/listing price
   - Annual revenue/sales
   - Annual profit/net income/SDE/EBITDA
   - Monthly revenue/profit
   - Gross margin
   - Inventory value
   - Any financial multiples mentioned
   
3. Contact Information:
   - Broker/agent name and company
   - Seller name
   - Phone numbers
   - Email addresses
   - Website URLs
   
4. Amazon/E-commerce Specific (if applicable):
   - Amazon store name/URL
   - FBA percentage
   - Number of SKUs/ASINs
   - Product categories
   - Account health metrics
   
5. Additional Details:
   - Reason for selling
   - Number of employees
   - Growth opportunities
   - Training/transition offered
   - Real estate included
   - Listing ID/reference number

EXTRACTION RULES:
- Extract text EXACTLY as shown in the image
- Include ALL numbers, even if context is unclear
- Preserve formatting of financial figures (e.g., "$1,234,567")
- Don't skip sections - extract everything visible
- If tables are present, extract all data maintaining structure
- Include headers, footers, and any fine print

Return the COMPLETE extracted text, maintaining the original structure as much as possible.`
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

  private static async analyzeOfficeWithVision(file: File, client: OpenAI): Promise<DocumentAnalysis> {
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

      const analysis = JSON.parse(aiResponse);
      
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

  private static fallbackAnalysis(text: string): DocumentAnalysis {
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