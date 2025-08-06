import { fetchProductDatabaseQuery, fetchDataForKeywords } from './explorer/junglescout';
import { supabase } from '../lib/supabase';

export interface BrandShareOfVoice {
  brand: string;
  totalRevenue: number;
  totalUnits: number;
  productCount: number;
  avgRating: number;
  avgReviews: number;
  marketShare: number;
  keywordShare: number;
  categoryDistribution: Record<string, number>;
  topKeywords: KeywordPresence[];
}

export interface KeywordPresence {
  keyword: string;
  searchVolume: number;
  brandProductCount: number;
  totalProductCount: number;
  sharePercentage: number;
}

export interface ShareOfVoiceReport {
  category: string;
  totalMarketRevenue: number;
  topBrands: BrandShareOfVoice[];
  keywordAnalysis: KeywordPresence[];
  competitiveLandscape: {
    totalBrands: number;
    totalProducts: number;
    avgProductsPerBrand: number;
    concentrationIndex: number; // Herfindahl index
  };
}

/**
 * Improved brand ASIN lookup using exact brand matching
 */
export async function fetchBrandASINs(brandName: string, marketplace: string = 'us'): Promise<any[]> {
  try {
    const allProducts: any[] = [];
    const searchVariations = [
      brandName,
      `"${brandName}"`, // Exact phrase
      brandName.replace(/\s+/g, ''), // No spaces
      brandName.toLowerCase(),
      brandName.toUpperCase()
    ];

    // Search with each variation to maximize results
    for (const searchTerm of searchVariations) {
      try {
        const response = await fetchProductDatabaseQuery({
          marketplace,
          includeKeywords: [searchTerm],
          pageSize: 100,
          excludeUnavailableProducts: true
        });

        if (response?.data) {
          // Filter to only include products where brand matches
          const brandProducts = response.data.filter((product: any) => {
            const productBrand = product.attributes?.brand || '';
            return productBrand.toLowerCase() === brandName.toLowerCase() ||
                   productBrand.toLowerCase().includes(brandName.toLowerCase()) ||
                   brandName.toLowerCase().includes(productBrand.toLowerCase());
          });

          allProducts.push(...brandProducts);
        }
      } catch (error) {
        console.error(`Error searching for brand ${searchTerm}:`, error);
      }
    }

    // Deduplicate by ASIN
    const uniqueProducts = Array.from(
      new Map(allProducts.map(p => [p.id, p])).values()
    );

    return uniqueProducts;
  } catch (error) {
    console.error('Error fetching brand ASINs:', error);
    return [];
  }
}

/**
 * Extract top keywords from a set of ASINs
 */
export async function extractTopKeywordsFromASINs(asins: string[]): Promise<string[]> {
  try {
    // For each ASIN, we'll extract keywords from title and analyze them
    const keywordCandidates: string[] = [];
    
    // Get product details from our database first
    const { data: products } = await supabase
      .from('asins')
      .select('title, category, subcategory')
      .in('asin', asins);

    if (products) {
      products.forEach(product => {
        // Extract meaningful keywords from titles
        const titleWords = extractKeywordsFromTitle(product.title);
        keywordCandidates.push(...titleWords);
        
        // Add category as keyword
        if (product.category) {
          keywordCandidates.push(product.category.toLowerCase());
        }
      });
    }

    // Get unique keywords and their frequency
    const keywordFrequency = keywordCandidates.reduce((acc, keyword) => {
      acc[keyword] = (acc[keyword] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Sort by frequency and take top keywords
    const topKeywords = Object.entries(keywordFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([keyword]) => keyword);

    return topKeywords;
  } catch (error) {
    console.error('Error extracting keywords from ASINs:', error);
    return [];
  }
}

/**
 * Extract meaningful keywords from product title
 */
function extractKeywordsFromTitle(title: string): string[] {
  if (!title) return [];
  
  // Remove common stop words and filter
  const stopWords = new Set([
    'for', 'and', 'the', 'with', 'of', 'to', 'in', 'on', 'by', 'from',
    'pack', 'set', 'kit', 'bundle', 'new', 'best', 'top', 'premium'
  ]);
  
  // Extract words and clean them
  const words = title.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  // Extract 2-word phrases as well
  const phrases: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(`${words[i]} ${words[i + 1]}`);
  }

  return [...words, ...phrases];
}

/**
 * Analyze competitors for given keywords
 */
export async function analyzeKeywordCompetitors(keywords: string[]): Promise<Map<string, Set<string>>> {
  const brandsByKeyword = new Map<string, Set<string>>();
  
  for (const keyword of keywords) {
    try {
      const response = await fetchProductDatabaseQuery({
        marketplace: 'us',
        includeKeywords: [keyword],
        pageSize: 50,
        sort: '-revenue'
      });

      if (response?.data) {
        const brands = new Set<string>();
        response.data.forEach((product: any) => {
          if (product.attributes?.brand) {
            brands.add(product.attributes.brand);
          }
        });
        brandsByKeyword.set(keyword, brands);
      }
    } catch (error) {
      console.error(`Error analyzing keyword ${keyword}:`, error);
    }
  }

  return brandsByKeyword;
}

/**
 * Calculate share of voice for brands in a category/niche
 */
export async function calculateShareOfVoice(
  category: string,
  topKeywords: string[],
  limitBrands: number = 10
): Promise<ShareOfVoiceReport> {
  try {
    // Fetch all products for the top keywords
    const allProducts: any[] = [];
    const keywordData = await fetchDataForKeywords(topKeywords);
    
    for (const keyword of topKeywords) {
      const response = await fetchProductDatabaseQuery({
        marketplace: 'us',
        includeKeywords: [keyword],
        pageSize: 100
      });
      
      if (response?.data) {
        allProducts.push(...response.data);
      }
    }

    // Deduplicate products by ASIN
    const uniqueProducts = Array.from(
      new Map(allProducts.map(p => [p.id, p])).values()
    );

    // Group products by brand
    const brandData = new Map<string, any[]>();
    uniqueProducts.forEach(product => {
      const brand = product.attributes?.brand || 'Unknown';
      if (!brandData.has(brand)) {
        brandData.set(brand, []);
      }
      brandData.get(brand)!.push(product);
    });

    // Calculate total market metrics
    const totalMarketRevenue = uniqueProducts.reduce((sum, p) => 
      sum + (p.attributes?.approximate_30_day_revenue || 0), 0
    );

    // Calculate brand metrics
    const brandMetrics: BrandShareOfVoice[] = [];
    
    for (const [brand, products] of brandData.entries()) {
      const totalRevenue = products.reduce((sum, p) => 
        sum + (p.attributes?.approximate_30_day_revenue || 0), 0
      );
      
      const totalUnits = products.reduce((sum, p) => 
        sum + (p.attributes?.approximate_30_day_units_sold || 0), 0
      );
      
      const avgRating = products.reduce((sum, p) => 
        sum + (p.attributes?.rating || 0), 0
      ) / products.length;
      
      const avgReviews = products.reduce((sum, p) => 
        sum + (p.attributes?.reviews || 0), 0
      ) / products.length;

      // Calculate category distribution
      const categoryDist: Record<string, number> = {};
      products.forEach(p => {
        const cat = p.attributes?.category || 'Unknown';
        categoryDist[cat] = (categoryDist[cat] || 0) + 1;
      });

      // Calculate keyword share
      const brandKeywords: KeywordPresence[] = [];
      for (const kw of topKeywords) {
        const kwProducts = allProducts.filter(p => 
          p.attributes?.title?.toLowerCase().includes(kw.toLowerCase())
        );
        const brandKwProducts = kwProducts.filter(p => 
          p.attributes?.brand === brand
        );
        
        const kwSearchVolume = keywordData.find(k => k.keyword === kw)?.search_volume || 0;
        
        brandKeywords.push({
          keyword: kw,
          searchVolume: kwSearchVolume,
          brandProductCount: brandKwProducts.length,
          totalProductCount: kwProducts.length,
          sharePercentage: kwProducts.length > 0 
            ? (brandKwProducts.length / kwProducts.length) * 100 
            : 0
        });
      }

      const keywordShare = brandKeywords.reduce((sum, kw) => 
        sum + kw.sharePercentage, 0
      ) / brandKeywords.length;

      brandMetrics.push({
        brand,
        totalRevenue,
        totalUnits,
        productCount: products.length,
        avgRating,
        avgReviews,
        marketShare: (totalRevenue / totalMarketRevenue) * 100,
        keywordShare,
        categoryDistribution: categoryDist,
        topKeywords: brandKeywords.sort((a, b) => b.sharePercentage - a.sharePercentage).slice(0, 5)
      });
    }

    // Sort brands by market share and limit
    const topBrands = brandMetrics
      .sort((a, b) => b.marketShare - a.marketShare)
      .slice(0, limitBrands);

    // Calculate concentration index (Herfindahl)
    const concentrationIndex = topBrands.reduce((sum, brand) => 
      sum + Math.pow(brand.marketShare / 100, 2), 0
    );

    // Calculate keyword analysis across all brands
    const overallKeywordAnalysis: KeywordPresence[] = [];
    for (const keyword of topKeywords) {
      const kwProducts = uniqueProducts.filter(p => 
        p.attributes?.title?.toLowerCase().includes(keyword.toLowerCase())
      );
      
      const kwSearchVolume = keywordData.find(k => k.keyword === keyword)?.search_volume || 0;
      
      overallKeywordAnalysis.push({
        keyword,
        searchVolume: kwSearchVolume,
        brandProductCount: kwProducts.length,
        totalProductCount: uniqueProducts.length,
        sharePercentage: (kwProducts.length / uniqueProducts.length) * 100
      });
    }

    return {
      category,
      totalMarketRevenue,
      topBrands,
      keywordAnalysis: overallKeywordAnalysis.sort((a, b) => b.searchVolume - a.searchVolume),
      competitiveLandscape: {
        totalBrands: brandData.size,
        totalProducts: uniqueProducts.length,
        avgProductsPerBrand: uniqueProducts.length / brandData.size,
        concentrationIndex
      }
    };
  } catch (error) {
    console.error('Error calculating share of voice:', error);
    throw error;
  }
}

/**
 * Generate share of voice report for a specific brand
 */
export async function generateBrandShareOfVoiceReport(
  brandName: string,
  category?: string
): Promise<{
  brandData: BrandShareOfVoice;
  marketReport: ShareOfVoiceReport;
}> {
  try {
    // Step 1: Get brand ASINs
    const brandProducts = await fetchBrandASINs(brandName);
    const asins = brandProducts.map(p => p.id);
    
    // Step 2: Extract top keywords from brand's products
    const brandKeywords = await extractTopKeywordsFromASINs(asins);
    
    // Step 3: If no category specified, use the most common category from brand products
    if (!category) {
      const categories = brandProducts.map(p => p.attributes?.category).filter(Boolean);
      const categoryCounts = categories.reduce((acc, cat) => {
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      category = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || 'General';
    }
    
    // Step 4: Calculate share of voice for the market
    const marketReport = await calculateShareOfVoice(category, brandKeywords, 20);
    
    // Step 5: Find the brand's data in the report
    let brandData = marketReport.topBrands.find(b => 
      b.brand.toLowerCase() === brandName.toLowerCase()
    );
    
    // If brand not found in top brands, create a minimal entry
    if (!brandData) {
      // Calculate brand-specific metrics from the fetched products
      const brandRevenue = brandProducts.reduce((sum, p) => 
        sum + (p.attributes?.approximate_30_day_revenue || 0), 0
      );
      const brandUnits = brandProducts.reduce((sum, p) => 
        sum + (p.attributes?.approximate_30_day_units_sold || 0), 0
      );
      const avgRating = brandProducts.length > 0 
        ? brandProducts.reduce((sum, p) => sum + (p.attributes?.rating || 0), 0) / brandProducts.length
        : 0;
      const avgReviews = brandProducts.length > 0
        ? brandProducts.reduce((sum, p) => sum + (p.attributes?.reviews || 0), 0) / brandProducts.length
        : 0;
      
      // Create brand data with actual or minimal metrics
      brandData = {
        brand: brandName,
        totalRevenue: brandRevenue,
        totalUnits: brandUnits,
        productCount: brandProducts.length,
        avgRating: avgRating,
        avgReviews: avgReviews,
        marketShare: marketReport.totalMarketRevenue > 0 
          ? (brandRevenue / marketReport.totalMarketRevenue) * 100 
          : 0,
        keywordShare: 0, // Will be calculated based on keyword presence
        categoryDistribution: {},
        topKeywords: []
      };
      
      // Add category distribution
      const categoryDist: Record<string, number> = {};
      brandProducts.forEach(p => {
        const cat = p.attributes?.category || 'Unknown';
        categoryDist[cat] = (categoryDist[cat] || 0) + 1;
      });
      brandData.categoryDistribution = categoryDist;
    }
    
    return {
      brandData,
      marketReport
    };
  } catch (error) {
    console.error('Error generating brand share of voice report:', error);
    throw error;
  }
}

/**
 * Generate share of voice report from an Amazon store URL
 */
export async function generateShareOfVoiceReportFromStoreURL(
  storeUrl: string,
  category?: string
): Promise<{
  brandData: BrandShareOfVoice;
  marketReport: ShareOfVoiceReport;
  storeName?: string;
}> {
  try {
    // Import ASINService dynamically to avoid circular dependencies
    const { ASINService } = await import('../services/ASINService');
    
    // Step 1: Extract ASINs from store URL
    console.log('Extracting ASINs from store URL:', storeUrl);
    const storeData = await ASINService.lookupASINsFromStoreURL(storeUrl);
    
    if (!storeData.asins || storeData.asins.length === 0) {
      throw new Error('No ASINs found for the provided store URL');
    }
    
    console.log(`Found ${storeData.asins.length} ASINs from store`);
    
    // Step 2: Fetch detailed data for the ASINs
    const asinData = await ASINService.fetchBulkASINData(storeData.asins);
    
    if (asinData.length === 0) {
      throw new Error('Unable to fetch product data for store ASINs');
    }
    
    // Step 3: Extract the brand name from the products
    // Most products from a store should have the same brand
    const brands = asinData.map(p => p.brand).filter(b => b && b !== 'Unknown');
    const brandCounts = brands.reduce((acc, brand) => {
      acc[brand] = (acc[brand] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const primaryBrand = Object.entries(brandCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0];
    
    if (!primaryBrand) {
      throw new Error('Unable to determine brand from store products');
    }
    
    console.log('Identified primary brand:', primaryBrand);
    
    // Step 4: Extract top keywords from store's products
    const brandKeywords = await extractTopKeywordsFromASINs(storeData.asins);
    
    // Step 5: If no category specified, use the most common category from products
    if (!category) {
      const categories = asinData.map(p => p.category).filter(c => c && c !== 'Unknown');
      const categoryCounts = categories.reduce((acc, cat) => {
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      category = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || 'General';
    }
    
    console.log('Using category:', category);
    
    // Step 6: Calculate share of voice for the market
    const marketReport = await calculateShareOfVoice(category, brandKeywords, 20);
    
    // Step 7: Find the brand's data in the report
    let brandData = marketReport.topBrands.find(b => 
      b.brand.toLowerCase() === primaryBrand.toLowerCase()
    );
    
    // If brand not found in top brands, calculate it separately
    if (!brandData) {
      const brandRevenue = asinData.reduce((sum, p) => sum + p.monthly_revenue, 0);
      const brandUnits = asinData.reduce((sum, p) => sum + p.monthly_units, 0);
      const avgRating = asinData.reduce((sum, p) => sum + p.rating, 0) / asinData.length;
      const avgReviews = asinData.reduce((sum, p) => sum + p.reviews, 0) / asinData.length;
      
      brandData = {
        brand: primaryBrand,
        totalRevenue: brandRevenue,
        totalUnits: brandUnits,
        productCount: asinData.length,
        avgRating,
        avgReviews,
        marketShare: (brandRevenue / marketReport.totalMarketRevenue) * 100,
        keywordShare: 0, // Will be calculated below
        categoryDistribution: {},
        topKeywords: []
      };
      
      // Calculate keyword share for the brand
      const brandKeywordPresence: KeywordPresence[] = [];
      for (const kw of brandKeywords.slice(0, 10)) {
        const kwData = marketReport.keywordAnalysis.find(k => k.keyword === kw);
        if (kwData) {
          brandKeywordPresence.push({
            ...kwData,
            brandProductCount: asinData.filter(p => 
              p.product_name.toLowerCase().includes(kw.toLowerCase())
            ).length,
            sharePercentage: 0 // Will be recalculated
          });
        }
      }
      
      brandData.topKeywords = brandKeywordPresence;
      brandData.keywordShare = brandKeywordPresence.reduce((sum, kw) => 
        sum + (kw.brandProductCount / Math.max(kw.totalProductCount, 1)) * 100, 0
      ) / Math.max(brandKeywordPresence.length, 1);
      
      // Add to market report if not present
      marketReport.topBrands.push(brandData);
      marketReport.topBrands.sort((a, b) => b.marketShare - a.marketShare);
    }
    
    return {
      brandData,
      marketReport,
      storeName: storeData.sellerName || primaryBrand
    };
  } catch (error) {
    console.error('Error generating share of voice report from store URL:', error);
    throw error;
  }
}