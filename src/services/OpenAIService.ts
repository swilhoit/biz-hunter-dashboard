import OpenAI from 'openai';
import { getConfigValue } from '../config/runtime-config';

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
  private client: OpenAI;
  private readonly model = 'gpt-4o-mini'; // OpenAI's fastest model

  constructor() {
    const apiKey = getConfigValue('VITE_OPENAI_API_KEY') || 
                   import.meta.env.VITE_OPENAI_API_KEY || 
                   import.meta.env.OPENAI_API_KEY ||
                   import.meta.env.REACT_APP_OPENAI_API_KEY ||
                   (typeof window !== 'undefined' && (window as any).__RUNTIME_CONFIG__?.OPENAI_API_KEY);
    
    if (!apiKey) {
      console.error('OpenAI API key not found. Please set VITE_OPENAI_API_KEY or OPENAI_API_KEY environment variable.');
    }
    
    this.client = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
    });
  }

  async segmentProductPortfolio(products: ProductData[], batchSize: number = 20): Promise<{ segments: MarketSegment[] }> {
    console.log(`Starting portfolio segmentation with ${products.length} products`);
    
    if (products.length === 0) {
      return { segments: [] };
    }

    const totalProducts = products.length;
    const totalBatches = Math.ceil(totalProducts / batchSize);

    // For smaller portfolios, process all at once
    if (totalProducts <= batchSize) {
      return await this.processAllProductsAtOnce(products);
    }

    // For larger portfolios, use batch processing
    return await this.processBatchedSegmentation(products, batchSize, totalBatches);
  }

  private async processAllProductsAtOnce(products: ProductData[]): Promise<{ segments: MarketSegment[] }> {
    const prompt = this.createSegmentationPrompt(products);
    
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You are an expert Amazon marketplace analyst. Analyze product portfolios and create meaningful market segments based on product characteristics, price points, and market positioning."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 4000,
      });

      const result = response.choices[0]?.message?.content;
      if (!result) {
        throw new Error("No response from OpenAI");
      }

      return this.processSegmentationResult(result, products);
    } catch (error) {
      console.error("Error in OpenAI segmentation:", error);
      return { segments: [{ name: "All Products", products, totalRevenue: 0, averagePrice: 0, marketShare: 100 }] };
    }
  }

  private async processBatchedSegmentation(products: ProductData[], batchSize: number, totalBatches: number): Promise<{ segments: MarketSegment[] }> {
    // Store products in context first
    for (let i = 0; i < totalBatches; i++) {
      const start = i * batchSize;
      const end = Math.min((i + 1) * batchSize, products.length);
      const batch = products.slice(start, end);
      
      await this.storeBatchForAnalysis(batch, i + 1, totalBatches);
      
      // Rate limiting: 60 requests per minute for GPT-4o-mini
      if (i < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Create final segmentation
    return await this.createFinalSegmentation(products);
  }

  private async storeBatchForAnalysis(batch: ProductData[], batchIndex: number, totalBatches: number): Promise<void> {
    const prompt = `Store batch ${batchIndex} of ${totalBatches} for later analysis:\n\n${batch.map((p, index) => 
      `${index + 1}. ${p.title} (ASIN: ${p.asin}, Price: $${p.price || 'N/A'}, Category: ${p.category || 'N/A'})`
    ).join('\n')}`;

    try {
      await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You are storing product information for batch analysis. Simply acknowledge receipt."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 50,
      });
    } catch (error) {
      console.error(`Error storing batch ${batchIndex}:`, error);
    }
  }

  private async createFinalSegmentation(products: ProductData[]): Promise<{ segments: MarketSegment[] }> {
    const prompt = this.createSegmentationPrompt(products);
    
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You are an Amazon marketplace analyst. Create market segments based on the stored product data."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 4000,
      });

      const result = response.choices[0]?.message?.content;
      if (!result) {
        throw new Error("No response from OpenAI");
      }

      return this.processSegmentationResult(result, products);
    } catch (error) {
      console.error("Error in final segmentation:", error);
      return { segments: [{ name: "All Products", products, totalRevenue: 0, averagePrice: 0, marketShare: 100 }] };
    }
  }

  private createSegmentationPrompt(products: ProductData[]): string {
    return `Analyze and segment the following ${products.length} Amazon products into meaningful market segments based on their characteristics, price points, and categories.

Create segments that would be useful for a business acquisition analysis. Focus on:
1. Product categories and niches
2. Price tiers and market positioning  
3. Brand positioning and competition
4. Revenue potential and performance

Format your response as:
**Segment 1: [Specific Segment Name]**
1, 3, 5, 8, 12

**Segment 2: [Another Segment Name]**  
2, 4, 6, 7, 9

Requirements:
- Maximum 8 segments
- Minimum 2 products per segment
- Use actual product index numbers (1-based)
- Ensure ALL products are assigned to a segment

Products:
${products.map((p, index) => 
  `${index + 1}. ${p.title} - ASIN: ${p.asin} - Price: $${p.price || 'N/A'} - Category: ${p.category || 'N/A'} - Revenue: $${p.revenue || 'N/A'}`
).join('\n')}`;
  }

  private processSegmentationResult(result: string, originalProducts: ProductData[]): { segments: MarketSegment[] } {
    console.log("Processing segmentation result:", result);
    
    if (!result || !result.includes('**Segment')) {
      console.warn("Unexpected segmentation format, returning single segment");
      return { 
        segments: [{ 
          name: "All Products", 
          products: originalProducts,
          totalRevenue: originalProducts.reduce((sum, p) => sum + (p.revenue || 0), 0),
          averagePrice: originalProducts.reduce((sum, p) => sum + (p.price || 0), 0) / originalProducts.length,
          marketShare: 100
        }] 
      };
    }

    try {
      const segments = result.split('**Segment').filter(Boolean);
      const totalRevenue = originalProducts.reduce((sum, p) => sum + (p.revenue || 0), 0);
      
      const segmentedProducts = segments.map(segment => {
        const [nameAndIndices, ...rest] = segment.split('\n').filter(Boolean);
        const name = nameAndIndices.split(':')[1]?.trim() || "Unnamed Segment";
        
        const indicesStr = rest.join(' ');
        const indices = indicesStr.split(',')
          .flatMap(range => range.split(' '))
          .map(i => i.trim())
          .filter(i => !isNaN(parseInt(i)))
          .map(i => parseInt(i) - 1);
        
        const products = indices
          .map(index => originalProducts[index])
          .filter(Boolean);
        
        const segmentRevenue = products.reduce((sum, p) => sum + (p.revenue || 0), 0);
        const averagePrice = products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length;
        const marketShare = totalRevenue > 0 ? (segmentRevenue / totalRevenue) * 100 : 0;
        
        return {
          name,
          products,
          totalRevenue: segmentRevenue,
          averagePrice: isNaN(averagePrice) ? 0 : averagePrice,
          marketShare
        };
      }).filter(segment => segment.products.length > 0);

      if (segmentedProducts.length === 0) {
        return { 
          segments: [{ 
            name: "All Products", 
            products: originalProducts,
            totalRevenue,
            averagePrice: originalProducts.reduce((sum, p) => sum + (p.price || 0), 0) / originalProducts.length,
            marketShare: 100
          }] 
        };
      }

      return { segments: segmentedProducts };
    } catch (error) {
      console.error("Error processing segmentation result:", error);
      return { 
        segments: [{ 
          name: "All Products", 
          products: originalProducts,
          totalRevenue: originalProducts.reduce((sum, p) => sum + (p.revenue || 0), 0),
          averagePrice: originalProducts.reduce((sum, p) => sum + (p.price || 0), 0) / originalProducts.length,
          marketShare: 100
        }] 
      };
    }
  }

  async analyzePortfolioPerformance(products: ProductData[]): Promise<PortfolioAnalysis> {
    const segmentationResult = await this.segmentProductPortfolio(products);
    
    const prompt = `Analyze this Amazon seller's product portfolio and provide strategic insights:

Products: ${products.length}
Total Revenue: $${products.reduce((sum, p) => sum + (p.revenue || 0), 0).toLocaleString()}
Average Price: $${(products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length).toFixed(2)}

Segments: ${segmentationResult.segments.map(s => `${s.name}: ${s.products.length} products, $${s.totalRevenue.toLocaleString()} revenue`).join('; ')}

Provide a comprehensive analysis including:
1. Top 3 performing products (by revenue)
2. 3-5 key risk factors for this portfolio
3. 3-5 growth opportunities
4. Overall portfolio score (0-100) with brief justification

Format as JSON with these keys: topPerformers, riskFactors, opportunities, overallScore, analysis`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You are an expert Amazon business acquisition analyst. Provide detailed portfolio analysis in the requested JSON format."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const result = response.choices[0]?.message?.content;
      if (!result) {
        throw new Error("No analysis result from OpenAI");
      }

      // Try to parse JSON, fallback to structured text parsing
      try {
        const analysis = JSON.parse(result);
        return {
          segments: segmentationResult.segments,
          topPerformers: products.sort((a, b) => (b.revenue || 0) - (a.revenue || 0)).slice(0, 3),
          riskFactors: analysis.riskFactors || [],
          opportunities: analysis.opportunities || [],
          overallScore: analysis.overallScore || 50
        };
      } catch (parseError) {
        // Fallback to basic analysis
        return {
          segments: segmentationResult.segments,
          topPerformers: products.sort((a, b) => (b.revenue || 0) - (a.revenue || 0)).slice(0, 3),
          riskFactors: ["Portfolio analysis unavailable", "Manual review recommended"],
          opportunities: ["Detailed analysis needed", "Consider market research"],
          overallScore: 50
        };
      }
    } catch (error) {
      console.error("Error in portfolio analysis:", error);
      return {
        segments: segmentationResult.segments,
        topPerformers: products.sort((a, b) => (b.revenue || 0) - (a.revenue || 0)).slice(0, 3),
        riskFactors: ["Analysis unavailable due to API error"],
        opportunities: ["Manual analysis required"],
        overallScore: 0
      };
    }
  }

  async extractASINsFromText(text: string): Promise<string[]> {
    const prompt = `Extract all Amazon ASINs from the following text. ASINs are 10-character alphanumeric codes (letters and numbers) that identify Amazon products.

Look for patterns like:
- ASIN: B08N5WRWNW
- https://www.amazon.com/dp/B08N5WRWNW
- Product codes that match ASIN format

Text to analyze:
${text}

Return only the ASIN codes, one per line, without any additional text or formatting.`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You are an expert at identifying Amazon ASINs in text. Return only the ASIN codes, nothing else."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 500,
      });

      const result = response.choices[0]?.message?.content;
      if (!result) {
        return [];
      }

      // Extract ASINs from the response
      const asinPattern = /\b[A-Z0-9]{10}\b/g;
      const matches = result.match(asinPattern) || [];
      
      // Filter to valid ASIN format (must contain at least one letter)
      return matches.filter(asin => /[A-Z]/.test(asin));
    } catch (error) {
      console.error("Error extracting ASINs:", error);
      return [];
    }
  }
}

export default OpenAIService;