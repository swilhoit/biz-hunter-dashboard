import { filesAdapter } from '../lib/database-adapter';

// Analysis result interfaces
export interface AnalysisResult {
  dealMetrics?: {
    askingPrice?: number;
    annualRevenue?: number;
    annualProfit?: number;
    profitMargin?: number;
  };
  businessInfo?: {
    name?: string;
    category?: string;
    description?: string;
  };
  confidence: number;
  summary: string;
}

export interface DocumentAnalysis {
  businessName?: string;
  description?: string;
  askingPrice?: number;
  annualRevenue?: number;
  annualProfit?: number;
  monthlyRevenue?: number;
  monthlyProfit?: number;
  keyFindings?: string[];
  confidence: number;
  dataExtracted?: {
    hasPL: boolean;
    hasRevenue: boolean;
    hasProfit: boolean;
    hasInventory: boolean;
  };
}

interface DealData {
  id: string;
  business_name: string;
  category?: string;
  industry?: string;
  asking_price: number;
  annual_revenue: number;
  annual_profit: number;
  monthly_revenue?: number;
  monthly_profit?: number;
  business_age?: number;
  location?: string;
  description?: string;
  [key: string]: unknown;
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
  criticalRisks?: string[];
  redFlags?: string[];
}

interface MarketAnalysis {
  targetMarket: string;
  marketSize: string;
  growthRate: string;
  keyTrends: string[];
  opportunities: string[];
  threats: string[];
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
  majorConcerns?: string[];
  dealBreakers?: string[];
}

export interface AIAnalysisReport {
  summary: string;
  competitiveAnalysis: CompetitiveAnalysis;
  marketAnalysis: MarketAnalysis;
  opportunityScore: OpportunityScore;
  riskFactors: string[];
  growthOpportunities: string[];
  recommendations: string[];
  dueDiligencePriorities?: string[];
  confidenceLevel: number;
  lastUpdated: string;
}

class AIAnalysisService {
  private apiUrl: string;

  constructor() {
    // Always use relative path - Vite will proxy in development
    this.apiUrl = '/api/openai';
  }

  private async callOpenAI(
    messages: any[], 
    options: { 
      temperature?: number; 
      max_tokens?: number; 
      model?: string 
    } = {}
  ): Promise<string> {
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
          model: options.model || 'gpt-4o-mini'
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `Failed to call AI service (${response.status})`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      throw error;
    }
  }

  async generateDealAnalysis(
    deal: DealData, 
    progressCallback?: (stage: string) => void
  ): Promise<AIAnalysisReport> {
    console.log(`Generating AI analysis for deal: ${deal.business_name}`);

    try {
      progressCallback?.('Analyzing business fundamentals...');
      
      // Run analyses in parallel for efficiency
      const [
        competitiveAnalysis,
        marketAnalysis,
        opportunityScore,
        riskAndOpportunities
      ] = await Promise.all([
        this.analyzeCompetition(deal),
        this.analyzeMarket(deal),
        this.calculateOpportunityScore(deal),
        this.analyzeRisksAndOpportunities(deal)
      ]);

      progressCallback?.('Generating comprehensive report...');
      const summary = await this.generateSummary(deal, {
        competitiveAnalysis,
        marketAnalysis,
        opportunityScore,
        ...riskAndOpportunities
      });

      const dueDiligencePriorities = await this.generateDueDiligencePriorities(deal, {
        competitiveAnalysis,
        opportunityScore,
        riskFactors: riskAndOpportunities.riskFactors
      });

      return {
        summary,
        competitiveAnalysis,
        marketAnalysis,
        opportunityScore,
        riskFactors: riskAndOpportunities.riskFactors,
        growthOpportunities: riskAndOpportunities.growthOpportunities,
        recommendations: riskAndOpportunities.recommendations,
        dueDiligencePriorities,
        confidenceLevel: this.calculateConfidenceLevel(deal),
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error("Error generating AI analysis:", error);
      throw new Error(`Failed to generate AI analysis: ${error.message}`);
    }
  }

  private async analyzeCompetition(deal: DealData): Promise<CompetitiveAnalysis> {
    // Build comprehensive context including extended fields
    let competitiveContext = `
      Analyze the competitive landscape for this business:
      - Business: ${deal.business_name}
      - Brand Name: ${(deal as any).brand_name || deal.business_name}
      - Website: ${(deal as any).website_url || 'Not specified'}
      - Industry/Category: ${deal.category || deal.industry || 'General Business'}
      - Annual Revenue: $${deal.annual_revenue?.toLocaleString() || 'N/A'}
      - Location: ${deal.location || 'Not specified'}
    `;
    
    // Add market data if available
    if ((deal as any).market_size) {
      competitiveContext += `\n      - Market Size: $${(deal as any).market_size.toLocaleString()}`;
    }
    if ((deal as any).market_share) {
      competitiveContext += `\n      - Market Share: ${(deal as any).market_share}%`;
    }
    
    // Add existing competitors if known
    if ((deal as any).competitors?.length > 0) {
      competitiveContext += `\n      - Known Competitors: ${(deal as any).competitors.map((c: any) => c.name).join(', ')}`;
    }
    
    // Add marketing channels for competitive insight
    if ((deal as any).marketing_channels?.length > 0) {
      competitiveContext += `\n      - Marketing Channels: ${(deal as any).marketing_channels.join(', ')}`;
    }
    
    const prompt = competitiveContext + `
      
      Provide a JSON response with:
      1. Top 3 potential competitors (name, marketPosition, strengths array, threats array)
      2. Market dynamics (competitionLevel, barrierToEntry, marketTrends array)
      3. Positioning analysis (1-2 sentences)
      4. Critical risks array (if any)
      5. Red flags array (if any)
      
      Consider the business's digital presence, marketing channels, and market position in your analysis.
    `;

    const response = await this.callOpenAI([
      { role: 'system', content: 'You are a business analyst expert. Respond only with valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    try {
      return JSON.parse(response);
    } catch {
      // Fallback if parsing fails
      return {
        competitors: [],
        marketDynamics: {
          competitionLevel: 'Medium',
          barrierToEntry: 'Medium',
          marketTrends: ['Market analysis unavailable']
        },
        positioningAnalysis: 'Unable to determine competitive position at this time.'
      };
    }
  }

  private async analyzeMarket(deal: DealData): Promise<MarketAnalysis> {
    const prompt = `
      Analyze the market opportunity for this business:
      - Business: ${deal.business_name}
      - Industry: ${deal.category || deal.industry || 'General Business'}
      - Annual Revenue: $${deal.annual_revenue?.toLocaleString() || 'N/A'}
      - Annual Profit: $${deal.annual_profit?.toLocaleString() || 'N/A'}
      
      Provide a JSON response with:
      1. targetMarket: Brief description of target customers
      2. marketSize: Estimated market size
      3. growthRate: Expected growth rate
      4. keyTrends: Array of 3-4 market trends
      5. opportunities: Array of 3-4 growth opportunities
      6. threats: Array of 2-3 market threats
      
      Be realistic and specific to this type of business.
    `;

    const response = await this.callOpenAI([
      { role: 'system', content: 'You are a market research analyst. Respond only with valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    try {
      return JSON.parse(response);
    } catch {
      return {
        targetMarket: 'Analysis pending',
        marketSize: 'To be determined',
        growthRate: 'Industry average',
        keyTrends: ['Digital transformation', 'Changing consumer behavior'],
        opportunities: ['Market expansion', 'Product diversification'],
        threats: ['Economic uncertainty', 'Increased competition']
      };
    }
  }

  private async calculateOpportunityScore(deal: DealData): Promise<OpportunityScore> {
    const profitMargin = (deal.annual_profit / deal.annual_revenue) * 100 || 0;
    const multiple = deal.asking_price / deal.annual_profit || 0;
    
    const prompt = `
      Score this business opportunity (0-100) based on:
      - Business: ${deal.business_name}
      - Asking Price: $${deal.asking_price?.toLocaleString()}
      - Annual Revenue: $${deal.annual_revenue?.toLocaleString()}
      - Annual Profit: $${deal.annual_profit?.toLocaleString()}
      - Profit Margin: ${profitMargin.toFixed(1)}%
      - Valuation Multiple: ${multiple.toFixed(1)}x
      - Business Age: ${deal.business_age || 'Unknown'} years
      
      Provide a JSON response with:
      1. overall: Overall score (0-100)
      2. breakdown: {financial, market, growth, risk} each 0-100
      3. reasoning: Brief explanation (2-3 sentences)
      4. improvements: Array of 3-4 improvement suggestions
      5. majorConcerns: Array of major concerns (if score < 60)
      6. dealBreakers: Array of potential deal breakers (if any)
      
      Be critical but fair. Consider typical SMB acquisition metrics.
    `;

    const response = await this.callOpenAI([
      { role: 'system', content: 'You are a business valuation expert. Respond only with valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    try {
      return JSON.parse(response);
    } catch {
      // Calculate basic scores if AI fails
      const financial = Math.min(100, Math.max(0, 100 - (multiple * 10)));
      const margin = Math.min(100, profitMargin * 3);
      
      return {
        overall: Math.round((financial + margin) / 2),
        breakdown: {
          financial: Math.round(financial),
          market: 50,
          growth: 50,
          risk: 50
        },
        reasoning: 'Automated scoring based on financial metrics.',
        improvements: ['Conduct detailed due diligence', 'Verify financial statements', 'Assess growth potential']
      };
    }
  }

  private async analyzeRisksAndOpportunities(deal: DealData): Promise<{
    riskFactors: string[];
    growthOpportunities: string[];
    recommendations: string[];
  }> {
    const prompt = `
      Analyze risks and opportunities for this business acquisition:
      - Business: ${deal.business_name}
      - Industry: ${deal.category || 'General Business'}
      - Revenue: $${deal.annual_revenue?.toLocaleString()}
      - Profit: $${deal.annual_profit?.toLocaleString()}
      - Asking Price: $${deal.asking_price?.toLocaleString()}
      
      Provide a JSON response with:
      1. riskFactors: Array of 4-5 key risks
      2. growthOpportunities: Array of 4-5 growth opportunities
      3. recommendations: Array of 4-5 strategic recommendations
      
      Focus on practical, actionable insights for a potential buyer.
    `;

    const response = await this.callOpenAI([
      { role: 'system', content: 'You are a business strategy consultant. Respond only with valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    try {
      return JSON.parse(response);
    } catch {
      return {
        riskFactors: [
          'Market competition',
          'Economic uncertainty',
          'Operational dependencies',
          'Customer concentration risk'
        ],
        growthOpportunities: [
          'Digital transformation',
          'Market expansion',
          'Product line extension',
          'Operational optimization'
        ],
        recommendations: [
          'Conduct thorough due diligence',
          'Verify all financial claims',
          'Assess market position',
          'Evaluate growth potential'
        ]
      };
    }
  }

  private async generateSummary(
    deal: DealData, 
    analyses: any
  ): Promise<string> {
    const prompt = `
      Write a concise executive summary (3-4 sentences) for this business opportunity:
      
      Business: ${deal.business_name}
      Asking Price: $${deal.asking_price?.toLocaleString()}
      Annual Revenue: $${deal.annual_revenue?.toLocaleString()}
      Annual Profit: $${deal.annual_profit?.toLocaleString()}
      
      Opportunity Score: ${analyses.opportunityScore.overall}/100
      Competition Level: ${analyses.competitiveAnalysis.marketDynamics.competitionLevel}
      
      Key Strengths: ${analyses.growthOpportunities.slice(0, 2).join(', ')}
      Key Risks: ${analyses.riskFactors.slice(0, 2).join(', ')}
      
      Provide a balanced, professional assessment that helps the buyer make an informed decision.
    `;

    return await this.callOpenAI([
      { role: 'system', content: 'You are a senior M&A advisor writing for potential buyers.' },
      { role: 'user', content: prompt }
    ]);
  }

  private async generateDueDiligencePriorities(
    deal: DealData,
    analyses: any
  ): Promise<string[]> {
    const prompt = `
      Based on this business analysis, list the top 5 due diligence priorities:
      
      Business: ${deal.business_name}
      Opportunity Score: ${analyses.opportunityScore.overall}/100
      Major Concerns: ${analyses.opportunityScore.majorConcerns?.join(', ') || 'None identified'}
      Risk Factors: ${analyses.riskFactors.slice(0, 3).join(', ')}
      
      Provide a JSON array of 5 specific due diligence items to investigate.
      Focus on items that would validate or invalidate the acquisition.
    `;

    const response = await this.callOpenAI([
      { role: 'system', content: 'You are a due diligence expert. Respond only with a JSON array of strings.' },
      { role: 'user', content: prompt }
    ]);

    try {
      return JSON.parse(response);
    } catch {
      return [
        'Verify all financial statements for the last 3 years',
        'Confirm customer contracts and revenue stability',
        'Assess operational dependencies and key personnel',
        'Review all legal agreements and potential liabilities',
        'Validate market position and competitive advantages'
      ];
    }
  }

  private calculateConfidenceLevel(deal: DealData): number {
    let confidence = 40; // Base confidence
    
    // Critical data (high weight)
    if (deal.annual_revenue) confidence += 10;
    if (deal.annual_profit) confidence += 10;
    if (deal.asking_price) confidence += 5;
    
    // Important business identity
    if ((deal as any).brand_name) confidence += 3;
    if ((deal as any).website_url) confidence += 3;
    if (deal.business_age) confidence += 3;
    if (deal.description) confidence += 3;
    if (deal.location) confidence += 2;
    if (deal.category || deal.industry) confidence += 3;
    
    // Extended financial metrics
    if ((deal as any).gross_margin) confidence += 3;
    if ((deal as any).customer_acquisition_cost) confidence += 2;
    if ((deal as any).customer_lifetime_value) confidence += 2;
    if ((deal as any).revenue_model) confidence += 2;
    
    // Market data
    if ((deal as any).market_size) confidence += 3;
    if ((deal as any).competitors?.length > 0) confidence += 3;
    if ((deal as any).marketing_channels?.length > 0) confidence += 2;
    
    // Customer metrics
    if ((deal as any).total_customers) confidence += 2;
    if ((deal as any).customer_retention_rate) confidence += 3;
    
    // Operational data
    if ((deal as any).employee_count) confidence += 2;
    if ((deal as any).key_employees?.length > 0) confidence += 2;
    
    // Digital presence
    if ((deal as any).social_media && Object.keys((deal as any).social_media).length > 0) confidence += 2;
    if ((deal as any).online_reviews) confidence += 2;
    
    // Cap at realistic maximum
    return Math.min(95, Math.max(20, confidence));
  }

  // Static methods for backward compatibility
  static async analyzeDocument(fileId: string, fileName: string): Promise<AnalysisResult> {
    const instance = new AIAnalysisService();
    try {
      // Simplified document analysis without actual file processing
      return {
        confidence: 75,
        summary: `Document "${fileName}" has been queued for analysis. Full document processing will be available in a future update.`,
        businessInfo: {
          name: fileName.replace(/\.[^/.]+$/, ""),
          category: 'Document',
          description: 'Pending analysis'
        }
      };
    } catch (error) {
      return {
        confidence: 0,
        summary: 'Document analysis failed'
      };
    }
  }

  static async extractFinancialMetrics(fileId: string): Promise<any> {
    // Placeholder for financial extraction
    return {
      success: false,
      message: 'Financial extraction will be available in a future update'
    };
  }
}

export default AIAnalysisService;

// Named exports for specific use cases
export { AIAnalysisService };

export class DocumentAnalysisService {
  static async analyzeBusinessDocument(fileId: string, fileName: string): Promise<AnalysisResult> {
    return AIAnalysisService.analyzeDocument(fileId, fileName);
  }
  
  static async analyzeDocument(
    file: any,
    progressCallback?: (progress: string) => void
  ): Promise<DocumentAnalysis> {
    progressCallback?.('Starting document analysis...');
    
    // Simplified analysis for now
    return {
      businessName: file.name?.replace(/\.[^/.]+$/, "") || 'Unknown',
      confidence: 50,
      keyFindings: ['Document uploaded successfully', 'Full analysis pending'],
      dataExtracted: {
        hasPL: false,
        hasRevenue: false,
        hasProfit: false,
        hasInventory: false
      }
    };
  }
}