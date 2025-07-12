interface ProductData {
  asin: string;
  title: string;
  category?: string;
  price?: number;
  sales?: number;
  revenue?: number;
  brand?: string;
  description?: string;
  rating?: number;
}

interface MarketSegment {
  name: string;
  description?: string;
  features?: string[];
  products: ProductData[];
  totalRevenue: number;
  averagePrice: number;
  averageRating?: number;
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
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes timeout
      
      console.log(`Fetching segments from: ${this.apiUrl}/segment-portfolio`);
      console.log('Request body:', { products: products.length, batchSize });
      
      const response = await fetch(`${this.apiUrl}/segment-portfolio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ products, batchSize }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        // Handle timeout specifically
        if (response.status === 408) {
          console.warn('Request timed out. Using fallback segmentation.');
          throw new Error('Request timed out');
        }
        
        // Try to parse error response, but handle cases where body might be empty
        let errorMessage = 'Failed to segment portfolio';
        try {
          const errorData = await response.json();
          // Handle server error response format { success: false, error: "message" }
          errorMessage = errorData.error || errorData.message || errorMessage;
          
          // If it's specifically an OpenAI API key error, use fallback
          if (errorMessage.includes('OpenAI API key not configured')) {
            console.log('OpenAI API key not configured, using fallback segmentation');
            return this.createFallbackSegments(products);
          }
        } catch (e) {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Response data:', { success: data.success, segmentsCount: data.segments?.length });
      
      // Handle server response format
      if (data.success && data.segments) {
        console.log('Returning segments from server');
        return { segments: data.segments };
      } else if (data.segments) {
        console.log('Returning segments (no success flag)');
        return { segments: data.segments };
      } else {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error("Error in portfolio segmentation:", error);
      
      // Fallback: Create intelligent segments based on available data
      return this.createFallbackSegments(products);
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

  private createFallbackSegments(products: ProductData[]): { segments: MarketSegment[] } {
    console.log("Using fallback segmentation logic");
    
    // Group products by category and price range
    const segments: Map<string, MarketSegment> = new Map();
    
    products.forEach(product => {
      // Determine segment based on category and price
      let segmentKey = '';
      let segmentName = '';
      
      // Price-based segmentation
      const price = product.price || 0;
      let priceRange = '';
      if (price < 20) priceRange = 'Budget';
      else if (price < 50) priceRange = 'Mid-Range';
      else if (price < 100) priceRange = 'Premium';
      else priceRange = 'Luxury';
      
      // Category-based segmentation
      const category = product.category || 'General';
      const categoryWords = category.toLowerCase().split(/[\s&,/-]+/);
      
      // Look for key category indicators
      if (categoryWords.some(w => ['electronics', 'gadgets', 'tech', 'computer', 'phone', 'tablet'].includes(w))) {
        segmentName = `${priceRange} Electronics & Tech`;
        segmentKey = `tech-${priceRange}`;
      } else if (categoryWords.some(w => ['home', 'kitchen', 'garden', 'furniture', 'decor'].includes(w))) {
        segmentName = `${priceRange} Home & Living`;
        segmentKey = `home-${priceRange}`;
      } else if (categoryWords.some(w => ['health', 'beauty', 'personal', 'care', 'fitness'].includes(w))) {
        segmentName = `${priceRange} Health & Beauty`;
        segmentKey = `health-${priceRange}`;
      } else if (categoryWords.some(w => ['toys', 'games', 'kids', 'baby', 'children'].includes(w))) {
        segmentName = `${priceRange} Kids & Toys`;
        segmentKey = `kids-${priceRange}`;
      } else if (categoryWords.some(w => ['sports', 'outdoor', 'camping', 'hiking', 'fitness'].includes(w))) {
        segmentName = `${priceRange} Sports & Outdoors`;
        segmentKey = `sports-${priceRange}`;
      } else if (categoryWords.some(w => ['office', 'business', 'professional', 'work'].includes(w))) {
        segmentName = `${priceRange} Office & Business`;
        segmentKey = `office-${priceRange}`;
      } else {
        segmentName = `${priceRange} ${category}`;
        segmentKey = `${category.toLowerCase()}-${priceRange}`;
      }
      
      // Get or create segment
      if (!segments.has(segmentKey)) {
        segments.set(segmentKey, {
          name: segmentName,
          description: `Products in the ${segmentName} category`,
          features: [],
          products: [],
          totalRevenue: 0,
          averagePrice: 0,
          averageRating: 0,
          marketShare: 0
        });
      }
      
      const segment = segments.get(segmentKey)!;
      segment.products.push(product);
    });
    
    // Calculate metrics for each segment
    const totalRevenue = products.reduce((sum, p) => sum + (p.revenue || 0), 0);
    
    const segmentArray = Array.from(segments.values()).map(segment => {
      const segmentRevenue = segment.products.reduce((sum, p) => sum + (p.revenue || 0), 0);
      const avgPrice = segment.products.reduce((sum, p) => sum + (p.price || 0), 0) / segment.products.length;
      const avgRating = segment.products.reduce((sum, p) => sum + (p.rating || 0), 0) / segment.products.length;
      
      // Extract features from product titles and descriptions
      const commonWords = new Map<string, number>();
      segment.products.forEach(p => {
        const words = (p.title || '').toLowerCase().split(/\s+/)
          .filter(w => w.length > 4 && !['with', 'from', 'that', 'this', 'have'].includes(w));
        words.forEach(w => commonWords.set(w, (commonWords.get(w) || 0) + 1));
      });
      
      // Get top 3 most common features
      const features = Array.from(commonWords.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
      
      return {
        ...segment,
        features,
        totalRevenue: segmentRevenue,
        averagePrice: avgPrice || 0,
        averageRating: avgRating || 0,
        marketShare: totalRevenue > 0 ? (segmentRevenue / totalRevenue) * 100 : 0
      };
    });
    
    // Sort by revenue and filter out empty segments
    return { 
      segments: segmentArray
        .filter(s => s.products.length > 0)
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
    };
  }
}

export default OpenAIService;