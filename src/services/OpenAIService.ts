interface ProductData {
  asin: string;
  title: string;
  category?: string;
  price?: number;
  sales?: number;
  revenue?: number;
  brand?: string;
  description?: string;
}

interface MarketSegment {
  name: string;
  products: ProductData[];
  totalRevenue: number;
  averagePrice: number;
  marketShare: number;
}

interface PortfolioAnalysis {
  segments: MarketSegment[];
  topPerformers: ProductData[];
  riskFactors: string[];
  opportunities: string[];
  overallScore: number;
}

export class OpenAIService {
  private apiUrl: string;

  constructor() {
    // Use server endpoints instead of direct OpenAI calls
    this.apiUrl = '/api/openai';
  }

  async segmentProductPortfolio(products: ProductData[], batchSize: number = 20): Promise<{ segments: MarketSegment[] }> {
    console.log(`Starting portfolio segmentation with ${products.length} products`);
    
    if (products.length === 0) {
      return { segments: [] };
    }

    try {
      const response = await fetch(`${this.apiUrl}/segment-portfolio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ products, batchSize }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to segment portfolio');
      }

      const data = await response.json();
      return { segments: data.segments };
    } catch (error) {
      console.error("Error in portfolio segmentation:", error);
      return { 
        segments: [{ 
          name: "All Products", 
          products, 
          totalRevenue: products.reduce((sum, p) => sum + (p.revenue || 0), 0),
          averagePrice: products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length,
          marketShare: 100 
        }] 
      };
    }
  }

  async analyzePortfolioPerformance(products: ProductData[]): Promise<PortfolioAnalysis> {
    try {
      const response = await fetch(`${this.apiUrl}/analyze-portfolio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ products }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to analyze portfolio');
      }

      const data = await response.json();
      return {
        segments: data.segments,
        topPerformers: data.topPerformers,
        riskFactors: data.riskFactors,
        opportunities: data.opportunities,
        overallScore: data.overallScore
      };
    } catch (error) {
      console.error("Error in portfolio analysis:", error);
      const segments = await this.segmentProductPortfolio(products);
      return {
        segments: segments.segments,
        topPerformers: products.sort((a, b) => (b.revenue || 0) - (a.revenue || 0)).slice(0, 3),
        riskFactors: ["Analysis unavailable due to API error"],
        opportunities: ["Manual analysis required"],
        overallScore: 0
      };
    }
  }

  async extractASINsFromText(text: string): Promise<string[]> {
    try {
      const response = await fetch(`${this.apiUrl}/extract-asins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to extract ASINs');
      }

      const data = await response.json();
      return data.asins || [];
    } catch (error) {
      console.error("Error extracting ASINs:", error);
      // Fallback to basic regex extraction
      const asinPattern = /\b[A-Z0-9]{10}\b/g;
      const matches = text.match(asinPattern) || [];
      return matches.filter(asin => /[A-Z]/.test(asin));
    }
  }
}

export default OpenAIService;