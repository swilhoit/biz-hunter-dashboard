import { filesAdapter } from '../lib/database-adapter';
import { DocumentExtractors } from './DocumentExtractors';

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

  private async callOpenAI(messages: any[], options: { temperature?: number; max_tokens?: number; model?: string } = {}): Promise<string> {
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
          model: options.model || 'gpt-4o'  // Default to gpt-4o for better analysis
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
      // Use server endpoint to download file to handle path encoding properly
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
      const response = await fetch(`${API_BASE_URL}/api/files/download/${file.id}`);
      
      if (!response.ok) {
        console.error('Error downloading document from server:', response.status, response.statusText);
        return null;
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Convert to File object for analysis
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

    const prompt = `Conduct a critical competitive analysis for this Amazon FBA acquisition opportunity:

Business: ${deal.business_name}
Category: ${deal.amazon_category}
Subcategory: ${deal.amazon_subcategory || 'Not specified'}
Annual Revenue: $${deal.annual_revenue?.toLocaleString()}
Price: $${deal.asking_price?.toLocaleString()}
FBA %: ${deal.fba_percentage || 'Unknown'}%
Multiple: ${deal.asking_price && deal.annual_profit ? (deal.asking_price / deal.annual_profit).toFixed(2) + 'x' : 'Unknown'}
${documentContent}

Provide a CRITICAL and HONEST assessment analyzing:

1. **Direct Competitors**: Identify 3-5 major competitors with specific analysis:
   - Market share estimates
   - Key differentiators and competitive advantages
   - Price positioning and quality perception
   - Review ratings and customer sentiment trends

2. **Market Dynamics - Be brutally honest about**:
   - Amazon's increasing competition through private label
   - Chinese manufacturers going direct-to-consumer
   - Category saturation and commoditization risks
   - Actual barriers to entry (not theoretical ones)
   - Price erosion trends in the category

3. **Critical Risk Factors specific to this business**:
   - Single product/category concentration risk
   - Supplier dependency and sourcing vulnerabilities
   - Brand strength vs generic product risk
   - Platform dependency (100% Amazon = high risk)
   - Regulatory or compliance risks in this category

4. **Realistic Positioning Analysis**:
   - Where does this business ACTUALLY sit in the market?
   - Is it truly differentiated or just another me-too product?
   - Sustainability of current market position
   - Likelihood of maintaining margins over 2-3 years

5. **Red Flags from documents** (if available):
   - Declining metrics hidden in averages
   - Suspicious revenue spikes or seasonality
   - Missing critical information
   - Overoptimistic projections

Be skeptical and critical. Identify what could go wrong. Don't sugarcoat risks.

Format as JSON with keys: competitors, marketDynamics, positioningAnalysis, criticalRisks, redFlags`;

    try {
      const result = await this.callOpenAI([
        {
          role: "system",
          content: "You are a skeptical and experienced M&A advisor specializing in Amazon FBA acquisitions. You've seen many deals go bad and know the common pitfalls. Provide brutally honest, critical analysis that protects buyers from making costly mistakes. Focus on what could go wrong, hidden risks, and red flags. Be specific with data and examples."
        },
        { role: "user", content: prompt }
      ], { temperature: 0.3, max_tokens: 1500 });
      
      if (!result) throw new Error("No response");
      
      const parsed = JSON.parse(result);
      // Ensure backward compatibility while adding new fields
      return {
        competitors: parsed.competitors || [],
        marketDynamics: parsed.marketDynamics || {
          competitionLevel: 'High' as const,
          barrierToEntry: 'Low' as const,
          marketTrends: []
        },
        positioningAnalysis: parsed.positioningAnalysis || "Analysis pending"
      };
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

    const prompt = `Calculate a REALISTIC opportunity score (0-100) for this Amazon FBA acquisition:

Business: ${deal.business_name}
Category: ${deal.amazon_category}
Asking Price: $${deal.asking_price?.toLocaleString()}
Annual Revenue: $${deal.annual_revenue?.toLocaleString()}
Annual Profit: $${deal.annual_profit?.toLocaleString()}
Multiple: ${deal.asking_price && deal.annual_profit ? (deal.asking_price / deal.annual_profit).toFixed(1) : 'Unknown'}x
Business Age: ${deal.business_age || 'Unknown'} years
FBA %: ${deal.fba_percentage || 'Unknown'}%
Profit Margin: ${deal.annual_revenue && deal.annual_profit ? ((deal.annual_profit / deal.annual_revenue) * 100).toFixed(1) : 'Unknown'}%
${documentContent}

BE CONSERVATIVE AND REALISTIC. Most businesses score 40-70. Only exceptional opportunities score above 70.

Score breakdown (0-100 each) - BE CRITICAL:

1. **Financial Health (Weight: 35%)**
   - Profit margins vs industry average (15-25% is typical for FBA)
   - Revenue stability/trends (penalize heavy seasonality)
   - Working capital requirements
   - Cash conversion cycle
   - Hidden costs not reflected in profit

2. **Market Risk (Weight: 30%)** - DEDUCT points for:
   - Amazon private label threat in this category
   - Chinese competition intensity
   - Category maturity/saturation
   - Price erosion trends
   - Regulatory risks

3. **Business Quality (Weight: 20%)**
   - Brand strength vs generic products
   - Customer concentration
   - Supplier diversification
   - IP/patents/defensibility
   - Operational complexity

4. **Growth Reality Check (Weight: 15%)** - Be skeptical of:
   - "Easy" expansion claims
   - International growth without infrastructure
   - New product launches without track record
   - Unrealistic market share capture

Key Penalties to Apply:
- Deduct 10-20 points if multiple > 4x
- Deduct 15 points if single product > 50% revenue
- Deduct 20 points if no brand/trademark
- Deduct 10 points if margins declining YoY
- Deduct 15 points if category has Amazon Basics

Format as JSON with keys: overall, breakdown, reasoning, majorConcerns, dealBreakers`;

    try {
      const result = await this.callOpenAI([
        {
          role: "system",
          content: "You are a conservative investment analyst who has evaluated hundreds of FBA acquisitions. You've seen that 80% of buyers overpay and 50% of businesses decline post-acquisition. Be extremely critical and realistic. Most businesses are mediocre (40-60 score). Reserve high scores (70+) only for truly exceptional opportunities with strong moats. Always identify hidden costs and risks that sellers try to hide."
        },
        { role: "user", content: prompt }
      ], { temperature: 0.2, max_tokens: 1000 });
      
      if (!result) throw new Error("No response");
      
      const parsed = JSON.parse(result);
      return {
        overall: parsed.overall || 50,
        breakdown: parsed.breakdown || {
          financial: 50,
          market: 50,
          growth: 50,
          risk: 50
        },
        reasoning: parsed.reasoning || "Analysis pending",
        improvements: parsed.improvements || []
      };
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

    const prompt = `Provide a critical risk assessment for this Amazon FBA acquisition:

Business: ${deal.business_name}
Category: ${deal.amazon_category}
Annual Revenue: $${deal.annual_revenue?.toLocaleString()}
Annual Profit: $${deal.annual_profit?.toLocaleString()}
Multiple: ${deal.asking_price && deal.annual_profit ? (deal.asking_price / deal.annual_profit).toFixed(1) : 'Unknown'}x
FBA %: ${deal.fba_percentage || 'Unknown'}%
Profit Margin: ${deal.annual_revenue && deal.annual_profit ? ((deal.annual_profit / deal.annual_revenue) * 100).toFixed(1) : 'Unknown'}%
${documentContent}

CRITICAL RISK FACTORS - Be specific and data-driven:

1. **Immediate Risks (0-6 months)**:
   - Account suspension risk factors
   - Cash flow/inventory financing needs  
   - Key supplier dependencies
   - Listing hijacking vulnerabilities
   - Seasonal revenue cliff risks

2. **Medium-term Risks (6-24 months)**:
   - Amazon algorithm changes impact
   - Chinese competition timeline
   - Patent/trademark expiration
   - Key employee departure risk
   - Tariff and shipping cost exposure

3. **Structural Risks**:
   - % revenue from top 3 ASINs
   - Review velocity decline
   - Organic ranking deterioration
   - PPC dependency (>30% of sales = red flag)
   - Working capital trap growth

4. **Hidden Financial Risks**:
   - Inventory obsolescence not accounted
   - Returns/refunds trending up
   - Storage fee increases
   - Add-back legitimacy issues
   - Owner salary replacement cost

GROWTH OPPORTUNITIES - Be realistic about execution difficulty:
- Rate each opportunity: Easy/Medium/Hard to execute
- Estimate investment required
- Timeline to results
- Success probability %

STRATEGIC RECOMMENDATIONS - Prioritized action items:
- What to verify in due diligence
- Deal breakers to investigate
- Post-acquisition 90-day plan
- Key hires needed
- Systems to implement

BE BRUTALLY HONEST. Most businesses have more risks than opportunities.

Format as JSON with keys: riskFactors, growthOpportunities, recommendations, dueDiligencePriorities`;

    try {
      const result = await this.callOpenAI([
        {
          role: "system",
          content: "You are a battle-tested FBA acquisition specialist who has seen deals fail due to hidden risks. Your job is to protect buyers by uncovering every risk, questioning every assumption, and providing actionable due diligence priorities. Be specific with percentages, timelines, and dollar amounts. Assume sellers are hiding problems. Your credibility depends on finding issues others miss."
        },
        { role: "user", content: prompt }
      ], { temperature: 0.3, max_tokens: 1200 });
      
      if (!result) throw new Error("No response");
      
      const parsed = JSON.parse(result);
      return {
        riskFactors: parsed.riskFactors || [],
        growthOpportunities: parsed.growthOpportunities || [],
        recommendations: parsed.recommendations || []
      };
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

    const prompt = `Create a CRITICAL executive summary for this Amazon FBA acquisition:

Business: ${deal.business_name}
Category: ${deal.amazon_category}
Price: $${deal.asking_price?.toLocaleString()}
Revenue: $${deal.annual_revenue?.toLocaleString()}
Profit: $${deal.annual_profit?.toLocaleString()}
Multiple: ${deal.asking_price && deal.annual_profit ? (deal.asking_price / deal.annual_profit).toFixed(1) + 'x' : 'Unknown'}
Margin: ${deal.annual_revenue && deal.annual_profit ? ((deal.annual_profit / deal.annual_revenue) * 100).toFixed(1) + '%' : 'Unknown'}
${documentInfo}

Critical Findings:
- Opportunity Score: ${analysis.opportunityScore?.overall || 'Unknown'}/100 ${analysis.opportunityScore?.overall < 60 ? '⚠️ BELOW AVERAGE' : ''}
- Major Concerns: ${analysis.opportunityScore?.majorConcerns?.slice(0, 2).join('; ') || 'Multiple risk factors identified'}
- Competition: ${analysis.competitiveAnalysis?.marketDynamics?.competitionLevel || 'Unknown'} with ${analysis.competitiveAnalysis?.criticalRisks?.length || 'several'} critical risks
- Top 3 Risks: ${analysis.riskFactors?.slice(0, 3).join('; ') || 'Risk analysis required'}
- Deal Breakers: ${analysis.opportunityScore?.dealBreakers?.join('; ') || 'Several red flags identified'}

Write a 2-3 paragraph HONEST assessment that:
1. States upfront whether this is a GOOD, MEDIOCRE, or POOR opportunity
2. Highlights the 2-3 biggest concerns that could kill the deal
3. Mentions what's missing or suspicious in the data
4. Gives a clear GO/NO-GO recommendation with specific conditions
5. If documents were analyzed, note any discrepancies or red flags found

Start with the bottom line: Is this deal worth pursuing or not? Don't sugarcoat.`;

    try {
      const result = await this.callOpenAI([
        {
          role: "system",
          content: "You are a no-nonsense M&A advisor who tells clients the truth, even when it's uncomfortable. Your reputation is built on saving clients from bad deals. Write executive summaries that cut through the BS and give clear GO/NO-GO recommendations. Start with the verdict, then explain why. Most deals are mediocre - say so when they are."
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
        console.warn('PDF text extraction failed, trying OCR with vision API:', pdfError);
        
        // Try OCR with vision API for PDFs that can't be text-extracted
        try {
          const base64 = await DocumentAnalysisService.fileToBase64(file);
          const visionPrompt = `Analyze this PDF business document image and extract key information:

Extract the following information if available:
1. Business name and description
2. Asking price (look for "asking price", "listed price", "sale price", "valuation")
3. Annual revenue/sales
4. Annual profit/net income
5. Monthly revenue/profit
6. Inventory value (look for "inventory", "stock value", "assets")
7. Key financial metrics
8. Important business details

Focus specifically on:
- Any dollar amounts and what they represent
- Financial performance data
- Business valuation information
- Inventory or asset values

Format your response as JSON with these keys:
{
  "businessName": "...",
  "description": "...",
  "askingPrice": 0,
  "annualRevenue": 0,
  "annualProfit": 0,
  "keyFindings": ["finding1", "finding2"],
  "monthlyRevenue": 0,
  "monthlyProfit": 0,
  "inventoryValue": 0,
  "financials": {
    "inventoryValue": 0,
    "profitMargin": 0
  }
}`;

          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
          const visionResponse = await fetch(`${API_BASE_URL}/api/openai/vision`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image: base64,
              prompt: visionPrompt,
              max_tokens: 1500
            }),
          });

          if (visionResponse.ok) {
            const visionData = await visionResponse.json();
            const visionResult = visionData.response;
            
            try {
              const analysis = typeof visionResult === 'string' ? JSON.parse(visionResult) : visionResult;
              
              return {
                businessName: analysis.businessName || 'PDF Document',
                description: analysis.description || 'PDF business document analysis',
                askingPrice: analysis.askingPrice || 0,
                annualRevenue: analysis.annualRevenue || 0,
                annualProfit: analysis.annualProfit || 0,
                keyFindings: analysis.keyFindings || ['PDF document analyzed with OCR'],
                confidence: 75,
                dataExtracted: {
                  hasPL: analysis.annualRevenue > 0 || analysis.annualProfit !== 0,
                  hasRevenue: !!analysis.annualRevenue,
                  hasProfit: !!analysis.annualProfit,
                  hasInventory: !!analysis.inventoryValue || !!analysis.financials?.inventoryValue
                },
                monthlyRevenue: analysis.monthlyRevenue || (analysis.annualRevenue ? Math.round(analysis.annualRevenue / 12) : 0),
                monthlyProfit: analysis.monthlyProfit || (analysis.annualProfit ? Math.round(analysis.annualProfit / 12) : 0),
                additionalInfo: {
                  inventoryValue: analysis.inventoryValue || analysis.financials?.inventoryValue || 0,
                  reasonForSelling: 'See PDF document',
                  growthOpportunities: 'See PDF document'
                },
                industry: 'Unknown',
                location: 'Unknown'
              };
            } catch (parseError) {
              console.error('Error parsing vision analysis result:', parseError);
              // Continue to fallback
            }
          }
        } catch (visionError) {
          console.error('Vision API also failed:', visionError);
        }
        
        // Final fallback: send to document analysis endpoint with better prompt
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
        const response = await fetch(`${API_BASE_URL}/api/openai/analyze-document`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: `PDF business document that could not be text-extracted: ${file.name}. 
            
This appears to be a business summary document. Please provide a structured analysis assuming this is a business acquisition opportunity document. Look for standard elements like:
- Business name and description
- Asking price or valuation
- Revenue and profit figures
- Inventory values
- Key business metrics

Since text extraction failed, provide reasonable placeholder values and note that manual review is needed.`,
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
          description: analysis.description || 'PDF business document - text extraction failed, manual review recommended',
          askingPrice: analysis.askingPrice || 0,
          annualRevenue: analysis.annualRevenue || 0,
          annualProfit: analysis.annualProfit || 0,
          keyFindings: analysis.keyFindings || ['PDF document requires manual review - text extraction failed'],
          confidence: 15,
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
2. Asking price (look for "asking price", "listed price", "sale price", "valuation")
3. Annual revenue/sales
4. Annual profit/net income
5. Monthly revenue/profit
6. Inventory value (look for "inventory", "stock value", "assets")
7. Key financial metrics
8. Important business details

Format your response as JSON with these keys:
{
  "businessName": "...",
  "description": "...",
  "askingPrice": 0,
  "annualRevenue": 0,
  "annualProfit": 0,
  "keyFindings": ["finding1", "finding2"],
  "monthlyRevenue": 0,
  "monthlyProfit": 0,
  "inventoryValue": 0,
  "financials": {
    "inventoryValue": 0,
    "profitMargin": 0
  }
}`;
        
        const response = await fetch('http://localhost:3002/api/openai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: 'You are a business analyst expert at extracting information from financial documents. Focus on finding asking price and inventory values specifically.' },
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
              hasInventory: !!analysis.inventoryValue || !!analysis.financials?.inventoryValue
            },
            monthlyRevenue: analysis.monthlyRevenue || (analysis.annualRevenue ? Math.round(analysis.annualRevenue / 12) : 0),
            monthlyProfit: analysis.monthlyProfit || (analysis.annualProfit ? Math.round(analysis.annualProfit / 12) : 0),
            additionalInfo: {
              inventoryValue: analysis.inventoryValue || analysis.financials?.inventoryValue || 0,
              reasonForSelling: 'See PDF document',
              growthOpportunities: 'See PDF document'
            },
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

  private static async fileToBase64(file: File): Promise<string> {
    const reader = new FileReader();
    const promise = new Promise<string>((resolve, reject) => {
      reader.onloadend = (event) => {
        const base64 = event.target?.result as string;
        resolve(base64);
      };
      reader.onerror = reject;
    });
    reader.readAsDataURL(file);
    return promise;
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