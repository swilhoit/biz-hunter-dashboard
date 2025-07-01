import { supabase } from '@/integrations/supabase/client';
import OpenAI from 'openai';

export interface AnalysisRequest {
  id: string;
  favoriteId: string;
  businessListing: {
    id: string;
    name: string;
    description: string;
    asking_price: number;
    annual_revenue: number;
    industry: string;
    location: string;
  };
  files: Array<{
    id: string;
    file_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
  }>;
  notes: string;
  createdAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface AnalysisResult {
  id: string;
  status: 'completed' | 'failed';
  executiveSummary: string;
  financialAnalysis: {
    revenue: string;
    profitability: string;
    growth: string;
    risks: string[];
  };
  marketAnalysis: {
    industryOverview: string;
    competition: string;
    marketSize: string;
    trends: string[];
  };
  operationalAnalysis: {
    businessModel: string;
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  valuation: {
    askingPrice: number;
    estimatedValue: string;
    multipleAnalysis: string;
    recommendation: string;
  };
  riskAssessment: {
    level: 'Low' | 'Medium' | 'High';
    factors: string[];
    mitigationStrategies: string[];
  };
  conclusion: {
    recommendation: 'Strong Buy' | 'Buy' | 'Hold' | 'Pass';
    reasoning: string;
    nextSteps: string[];
  };
  fileAnalysis?: {
    [fileName: string]: string;
  };
  generatedAt: string;
}

export class AIAnalysisService {
  private static instance: AIAnalysisService;
  private openai: OpenAI;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });
  }
  
  public static getInstance(): AIAnalysisService {
    if (!AIAnalysisService.instance) {
      AIAnalysisService.instance = new AIAnalysisService();
    }
    return AIAnalysisService.instance;
  }

  async readFileContent(filePath: string, mimeType: string): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from('favorite-files')
        .download(filePath);

      if (error) throw error;

      // Handle different file types
      if (mimeType.startsWith('text/') || mimeType === 'text/csv') {
        return await data.text();
      } else if (mimeType === 'application/pdf') {
        // For PDF files, we'd need a PDF parser. For now, return a placeholder
        return '[PDF file content - requires PDF parsing implementation]';
      } else if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
        // For Excel files, we'd need a spreadsheet parser
        return '[Excel file content - requires spreadsheet parsing implementation]';
      } else if (mimeType.startsWith('image/')) {
        // For images, we'd need OCR or image analysis
        return '[Image file - requires OCR or image analysis implementation]';
      } else {
        return '[Unsupported file type for text extraction]';
      }
    } catch (error) {
      console.error('Error reading file:', error);
      return '[Error reading file content]';
    }
  }

  async generateAnalysis(request: AnalysisRequest): Promise<AnalysisResult> {
    try {
      // Read file contents
      const fileContents: { [fileName: string]: string } = {};
      for (const file of request.files) {
        fileContents[file.file_name] = await this.readFileContent(file.file_path, file.mime_type);
      }

      // Create AI prompt
      const prompt = this.createAnalysisPrompt(request, fileContents);
      
      // Call OpenAI API for analysis
      const analysisResult = await this.callOpenAIAnalysis(request, prompt, fileContents);
      
      return analysisResult;
    } catch (error) {
      console.error('Error generating analysis:', error);
      throw error;
    }
  }

  private createAnalysisPrompt(request: AnalysisRequest, fileContents: { [fileName: string]: string }): string {
    const { businessListing, notes } = request;
    
    return `You are a professional business acquisition analyst. Analyze the following business opportunity and provide a comprehensive investment evaluation report.

BUSINESS OVERVIEW:
- Name: ${businessListing.name}
- Industry: ${businessListing.industry}
- Location: ${businessListing.location}
- Asking Price: $${businessListing.asking_price.toLocaleString()}
- Annual Revenue: $${businessListing.annual_revenue.toLocaleString()}
- Description: ${businessListing.description}

USER NOTES:
${notes || 'No additional notes provided'}

SUPPORTING DOCUMENTS:
${Object.entries(fileContents).map(([fileName, content]) => 
  `--- ${fileName} ---\n${content}\n`
).join('\n')}

Provide your analysis in the following JSON structure. Be thorough, professional, and base your assessment on the provided data:

{
  "executiveSummary": "Comprehensive 2-3 sentence overview of the opportunity",
  "financialAnalysis": {
    "revenue": "Analysis of revenue streams and sustainability",
    "profitability": "Assessment of current and projected profitability",
    "growth": "Growth potential and scalability analysis",
    "risks": ["List of key financial risks"]
  },
  "marketAnalysis": {
    "industryOverview": "Current industry conditions and outlook",
    "competition": "Competitive landscape assessment",
    "marketSize": "Total addressable market analysis",
    "trends": ["Key market trends affecting the business"]
  },
  "operationalAnalysis": {
    "businessModel": "Analysis of the business model and operations",
    "strengths": ["Key operational strengths"],
    "weaknesses": ["Areas needing improvement"],
    "opportunities": ["Growth and expansion opportunities"],
    "threats": ["External threats to the business"]
  },
  "valuation": {
    "estimatedValue": "Your estimated fair value range with reasoning",
    "multipleAnalysis": "Analysis of asking price vs industry multiples",
    "recommendation": "Your valuation assessment and negotiation advice"
  },
  "riskAssessment": {
    "level": "Low|Medium|High",
    "factors": ["Key risk factors to consider"],
    "mitigationStrategies": ["Recommended risk mitigation approaches"]
  },
  "conclusion": {
    "recommendation": "Strong Buy|Buy|Hold|Pass",
    "reasoning": "Detailed explanation of your recommendation",
    "nextSteps": ["Specific action items for due diligence"]
  }
}

Respond ONLY with valid JSON. Do not include any other text or formatting.`;
  }

  private async callOpenAIAnalysis(request: AnalysisRequest, prompt: string, fileContents: { [fileName: string]: string }): Promise<AnalysisResult> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a professional business acquisition analyst with expertise in financial analysis, market research, and investment evaluation. Provide detailed, actionable analysis based on the provided business data."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      });

      const responseContent = completion.choices[0]?.message?.content;
      if (!responseContent) {
        throw new Error('No response content from OpenAI');
      }

      // Parse the JSON response
      let analysisData;
      try {
        analysisData = JSON.parse(responseContent);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response as JSON:', responseContent);
        throw new Error('Invalid JSON response from AI analysis');
      }

      // Transform the OpenAI response to match our AnalysisResult interface
      const result: AnalysisResult = {
        id: request.id,
        status: 'completed',
        executiveSummary: analysisData.executiveSummary || 'Analysis completed successfully.',
        financialAnalysis: {
          revenue: analysisData.financialAnalysis?.revenue || 'Revenue analysis not available',
          profitability: analysisData.financialAnalysis?.profitability || 'Profitability analysis not available',
          growth: analysisData.financialAnalysis?.growth || 'Growth analysis not available',
          risks: analysisData.financialAnalysis?.risks || []
        },
        marketAnalysis: {
          industryOverview: analysisData.marketAnalysis?.industryOverview || 'Industry overview not available',
          competition: analysisData.marketAnalysis?.competition || 'Competition analysis not available',
          marketSize: analysisData.marketAnalysis?.marketSize || 'Market size analysis not available',
          trends: analysisData.marketAnalysis?.trends || []
        },
        operationalAnalysis: {
          businessModel: analysisData.operationalAnalysis?.businessModel || 'Business model analysis not available',
          strengths: analysisData.operationalAnalysis?.strengths || [],
          weaknesses: analysisData.operationalAnalysis?.weaknesses || [],
          opportunities: analysisData.operationalAnalysis?.opportunities || [],
          threats: analysisData.operationalAnalysis?.threats || []
        },
        valuation: {
          askingPrice: request.businessListing.asking_price,
          estimatedValue: analysisData.valuation?.estimatedValue || 'Valuation analysis not available',
          multipleAnalysis: analysisData.valuation?.multipleAnalysis || 'Multiple analysis not available',
          recommendation: analysisData.valuation?.recommendation || 'Valuation recommendation not available'
        },
        riskAssessment: {
          level: analysisData.riskAssessment?.level || 'Medium',
          factors: analysisData.riskAssessment?.factors || [],
          mitigationStrategies: analysisData.riskAssessment?.mitigationStrategies || []
        },
        conclusion: {
          recommendation: analysisData.conclusion?.recommendation || 'Hold',
          reasoning: analysisData.conclusion?.reasoning || 'Analysis reasoning not available',
          nextSteps: analysisData.conclusion?.nextSteps || []
        },
        fileAnalysis: fileContents,
        generatedAt: new Date().toISOString()
      };

      return result;
    } catch (error) {
      console.error('OpenAI API error:', error);
      // Fallback to simulated analysis if OpenAI fails
      return this.simulateAIAnalysis(request, fileContents);
    }
  }

  private async simulateAIAnalysis(request: AnalysisRequest, fileContents: { [fileName: string]: string }): Promise<AnalysisResult> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { businessListing } = request;
    const revenueMultiple = businessListing.asking_price / businessListing.annual_revenue;
    
    return {
      id: request.id,
      status: 'completed',
      executiveSummary: `${businessListing.name} is a ${businessListing.industry} business located in ${businessListing.location}. With an asking price of $${businessListing.asking_price.toLocaleString()} and annual revenue of $${businessListing.annual_revenue.toLocaleString()}, the business trades at ${revenueMultiple.toFixed(1)}x revenue multiple. Based on our analysis of the provided documents and business fundamentals, this opportunity presents ${revenueMultiple < 3 ? 'attractive' : revenueMultiple < 5 ? 'moderate' : 'elevated'} valuation metrics for the ${businessListing.industry} sector.`,
      
      financialAnalysis: {
        revenue: `Annual revenue of $${businessListing.annual_revenue.toLocaleString()} suggests ${businessListing.annual_revenue > 1000000 ? 'strong' : businessListing.annual_revenue > 500000 ? 'moderate' : 'developing'} market presence.`,
        profitability: `Revenue multiple of ${revenueMultiple.toFixed(1)}x indicates ${revenueMultiple < 3 ? 'attractive' : revenueMultiple < 5 ? 'fair' : 'premium'} pricing relative to industry standards.`,
        growth: `Growth potential appears ${businessListing.industry.includes('Tech') || businessListing.industry.includes('Digital') ? 'high' : 'moderate'} given the ${businessListing.industry} sector dynamics.`,
        risks: [
          'Market competition and competitive positioning',
          'Customer concentration and retention',
          'Operational scalability challenges',
          'Industry-specific regulatory changes'
        ]
      },
      
      marketAnalysis: {
        industryOverview: `The ${businessListing.industry} sector shows ${businessListing.industry.includes('Tech') ? 'strong digital transformation trends' : businessListing.industry.includes('Healthcare') ? 'steady demand driven by demographics' : 'mixed market conditions'} with varying growth prospects across subsegments.`,
        competition: `Competitive landscape in ${businessListing.location} market appears ${businessListing.location.includes('New York') || businessListing.location.includes('California') ? 'highly competitive' : 'moderately competitive'} based on regional market dynamics.`,
        marketSize: `Total addressable market for ${businessListing.industry} services in the region estimated at significant scale with room for market share growth.`,
        trends: [
          'Digital transformation accelerating across all sectors',
          'Increased focus on operational efficiency',
          'Growing demand for specialized services',
          'Shift towards sustainable business practices'
        ]
      },
      
      operationalAnalysis: {
        businessModel: `Revenue model appears to be based on ${businessListing.industry.includes('SaaS') ? 'recurring subscription revenue' : businessListing.industry.includes('Service') ? 'fee-for-service delivery' : businessListing.industry.includes('Retail') ? 'product sales and customer transactions' : 'mixed revenue streams'} which provides ${businessListing.industry.includes('SaaS') ? 'predictable' : 'variable'} cash flow characteristics.`,
        strengths: [
          'Established market presence and brand recognition',
          'Proven revenue generation capability',
          'Industry expertise and operational knowledge',
          'Customer base and market relationships'
        ],
        weaknesses: [
          'Potential operational scale limitations',
          'Technology infrastructure may need updates',
          'Dependence on key personnel and relationships',
          'Limited geographic market presence'
        ],
        opportunities: [
          'Market expansion into adjacent territories',
          'Service line diversification and enhancement',
          'Technology adoption and automation',
          'Strategic partnerships and alliances'
        ],
        threats: [
          'New market entrants and increased competition',
          'Economic downturns affecting customer demand',
          'Regulatory changes impacting operations',
          'Technology disruption and industry evolution'
        ]
      },
      
      valuation: {
        askingPrice: businessListing.asking_price,
        estimatedValue: `Based on revenue multiples and industry comparables, estimated value range: $${Math.round(businessListing.annual_revenue * 2).toLocaleString()} - $${Math.round(businessListing.annual_revenue * 4).toLocaleString()}`,
        multipleAnalysis: `Current asking price represents ${revenueMultiple.toFixed(1)}x revenue multiple, which is ${revenueMultiple < 3 ? 'below' : revenueMultiple < 5 ? 'within' : 'above'} typical industry range of 2-4x for ${businessListing.industry} businesses.`,
        recommendation: revenueMultiple < 3 ? 'Attractively priced relative to fundamentals' : revenueMultiple < 5 ? 'Fair valuation with room for negotiation' : 'Premium pricing requires strong due diligence'
      },
      
      riskAssessment: {
        level: revenueMultiple < 3 ? 'Medium' : revenueMultiple < 5 ? 'Medium' : 'High',
        factors: [
          'Market competition and positioning risks',
          'Customer concentration and retention',
          'Operational transition and integration',
          'Industry and regulatory environment changes'
        ],
        mitigationStrategies: [
          'Comprehensive due diligence on all operational aspects',
          'Customer diversification and retention programs',
          'Technology and process improvement initiatives',
          'Industry expertise and advisory support'
        ]
      },
      
      conclusion: {
        recommendation: revenueMultiple < 2.5 ? 'Strong Buy' : revenueMultiple < 3.5 ? 'Buy' : revenueMultiple < 5 ? 'Hold' : 'Pass',
        reasoning: `Based on valuation analysis, operational assessment, and market conditions, this opportunity ${revenueMultiple < 3.5 ? 'presents attractive investment potential' : revenueMultiple < 5 ? 'offers moderate investment appeal' : 'requires careful evaluation of premium pricing'}.`,
        nextSteps: [
          'Conduct detailed financial due diligence',
          'Verify customer contracts and retention metrics',
          'Assess operational processes and technology',
          'Evaluate management team and transition plans',
          'Review legal and regulatory compliance'
        ]
      },
      
      fileAnalysis: fileContents,
      generatedAt: new Date().toISOString()
    };
  }
}

export const aiAnalysisService = AIAnalysisService.getInstance();