import OpenAI from 'openai';

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
  static async analyzeDocument(file: File): Promise<DocumentAnalysis> {
    try {
      console.log('Starting document analysis for file:', file.name, 'Type:', file.type, 'Size:', file.size);
      
      // Check if API key is available
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.REACT_APP_OPENAI_API_KEY;
      if (!apiKey) {
        console.error('OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your .env file');
        throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.');
      }
      
      // Create a temporary client instance for static methods
      const client = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true,
      });

      // Convert file to text based on type
      console.log('Extracting text from file...');
      const text = await this.extractTextFromFile(file, client);
      console.log('Text extracted, length:', text.length);
      
      // Analyze text using AI
      console.log('Analyzing text with AI...');
      const analysis = await this.analyzeText(text, file.name, client);
      console.log('Analysis complete:', analysis);
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing document:', error);
      throw new Error(`Failed to analyze document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async extractTextFromFile(file: File, client: OpenAI): Promise<string> {
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.pdf')) {
      return await this.extractTextFromPDF(file, client);
    } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      return await this.extractTextFromWord(file, client);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      return await this.extractTextFromExcel(file, client);
    } else if (fileName.endsWith('.txt')) {
      return await file.text();
    }
    
    throw new Error('Unsupported file type for analysis');
  }

  private static async extractTextFromPDF(file: File, client: OpenAI): Promise<string> {
    try {
      // For now, we'll use a simple approach - try to extract basic text content
      // In production, you'd want to use a proper PDF parsing library like pdf-parse
      const text = await this.basicTextExtraction(file);
      
      if (text.length > 50) {
        return text;
      }
      
      // Fallback: inform user that PDF parsing requires additional setup
      return `PDF document detected: "${file.name}". 
      
For better PDF text extraction, this would need a PDF parsing library. For now, please either:
1. Convert the PDF to text and upload as .txt file
2. Copy/paste the content into the manual form fields
3. Upload a Word document version if available

Basic document metadata extracted where possible.`;
    } catch (error) {
      console.error('PDF extraction error:', error);
      return `Error reading PDF file "${file.name}". Please try converting to text format or entering information manually.`;
    }
  }

  private static async extractTextFromWord(file: File, client: OpenAI): Promise<string> {
    try {
      // Basic text extraction attempt
      const text = await this.basicTextExtraction(file);
      
      if (text.length > 50) {
        return text;
      }
      
      return `Word document detected: "${file.name}".

For better Word document parsing, this would need a specialized library like mammoth.js. For now, please either:
1. Save the document as plain text (.txt) and upload
2. Copy/paste the content into the manual form fields
3. Export as PDF if the content is primarily text

Basic document metadata extracted where possible.`;
    } catch (error) {
      console.error('Word extraction error:', error);
      return `Error reading Word document "${file.name}". Please try saving as text format or entering information manually.`;
    }
  }

  private static async extractTextFromExcel(file: File, client: OpenAI): Promise<string> {
    try {
      // Basic text extraction attempt
      const text = await this.basicTextExtraction(file);
      
      if (text.length > 50) {
        return text;
      }
      
      return `Excel spreadsheet detected: "${file.name}".

For better Excel data extraction, this would need a specialized library like xlsx. For now, please either:
1. Export the spreadsheet as CSV and upload as .txt file
2. Copy/paste the relevant data into the manual form fields
3. Export key data as PDF if it's primarily tabular

Basic document metadata extracted where possible.`;
    } catch (error) {
      console.error('Excel extraction error:', error);
      return `Error reading Excel file "${file.name}". Please try exporting as CSV/text format or entering information manually.`;
    }
  }

  private static async basicTextExtraction(file: File): Promise<string> {
    try {
      // Try to read as text directly (works for some simple formats)
      const text = await file.text();
      return text;
    } catch (error) {
      // If direct text reading fails, return filename info
      return `Document: ${file.name} (${Math.round(file.size / 1024)}KB)`;
    }
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

  private static async analyzeText(text: string, fileName: string, client: OpenAI): Promise<DocumentAnalysis> {
    try {
      const prompt = `You are analyzing a business listing document to extract information for a deal entry form. Extract ALL possible fields that could help fill out a comprehensive business acquisition deal form.

IMPORTANT: Look for and extract EVERY piece of information that could be relevant to evaluating and contacting about this business opportunity.

Analyze this document and return ONLY valid JSON with this exact structure:

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

Document content:
${text}

Extraction Instructions:
- Extract ALL numerical values without currency symbols or commas
- For business age: if you find "established 2020" or "founded in 2020", calculate age from current year (2025)
- For valuation multiple: if asking price and annual profit exist, calculate price/profit
- For SDE/Seller's Discretionary Earnings/Cash Flow: treat as annual profit
- Look for ALL URLs mentioned (listing sites, Amazon stores, company websites)
- Extract complete business description including what they sell, how they operate, competitive advantages
- Identify ALL contact information and classify as broker vs seller based on context clues
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
            content: 'You are an expert business analyst specializing in extracting comprehensive information from business-for-sale listings. Your goal is to extract EVERY piece of information that could be useful for evaluating a business acquisition opportunity. Always return valid JSON in the exact format requested, and be thorough in looking for all data points.'
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
      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      // Parse the JSON response
      const analysis = JSON.parse(aiResponse);
      
      // Validate and ensure proper structure with ALL fields
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

      // Validate that we have enough useful information
      const validationResult = this.validateAnalysisQuality(structuredAnalysis, fileName);
      
      return {
        ...structuredAnalysis,
        confidence: validationResult.adjustedConfidence,
        keyFindings: validationResult.enhancedFindings
      };

    } catch (error) {
      console.error('AI analysis error:', error);
      
      // Fallback to basic regex analysis if AI fails
      return this.fallbackAnalysis(text);
    }
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
    const phoneMatch = text.match(/(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/);
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

  private static getContextAroundMatch(text: string, match: string, contextLength: number): string {
    const index = text.indexOf(match);
    if (index === -1) return '';
    
    const start = Math.max(0, index - contextLength);
    const end = Math.min(text.length, index + match.length + contextLength);
    
    return text.substring(start, end);
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