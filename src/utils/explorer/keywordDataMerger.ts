// Utility functions to merge keyword data from multiple sources (JungleScout, Google Ads, etc.)

interface JungleScoutKeywordData {
  keyword: string;
  search_volume?: number;
  searchVolume?: number;
  searchVolumeTrend?: number;
  monthly_trend?: number;
  quarterly_trend?: number;
  ppc_bid_exact?: number;
  ppc_bid_broad?: number;
  ppcBid?: number;
  relevancy_score?: number;
  relevancyScore?: number;
  trendData?: Array<{ date: string; volume: number }>;
}

interface GoogleAdsKeywordData {
  keyword: string;
  searchVolume: number;
  competitionLevel: string;
  competitionIndex?: number;
  lowTopPageBid?: number;
  highTopPageBid?: number;
  averageCpc?: number;
  monthlySearchVolumes?: Array<{
    month: string;
    year: number;
    monthlySearches: number;
  }>;
}

interface MergedKeywordData {
  keyword: string;
  // Search volume data
  jungleScoutSearchVolume?: number;
  googleAdsSearchVolume?: number;
  combinedSearchVolume: number; // Average or weighted average
  searchVolumeTrend?: number;
  
  // Competition data
  competitionLevel?: string;
  competitionIndex?: number;
  relevancyScore?: number;
  
  // Bid/CPC data
  ppcBidJungleScout?: number;
  googleAdsLowBid?: number;
  googleAdsHighBid?: number;
  googleAdsAvgCpc?: number;
  recommendedBid: number; // Calculated recommendation
  
  // Historical data
  trendData?: Array<{ date: string; volume: number }>;
  monthlySearchVolumes?: Array<{
    month: string;
    year: number;
    monthlySearches: number;
  }>;
  
  // Source tracking
  dataSources: string[];
}

// Merge keyword data from JungleScout and Google Ads
export function mergeKeywordData(
  jungleScoutData: JungleScoutKeywordData[],
  googleAdsData: GoogleAdsKeywordData[]
): MergedKeywordData[] {
  const mergedMap = new Map<string, MergedKeywordData>();
  
  // Process JungleScout data
  jungleScoutData.forEach(jsData => {
    const keywordLower = jsData.keyword.toLowerCase();
    // Handle both snake_case and camelCase properties
    const searchVolume = jsData.search_volume || jsData.searchVolume || 0;
    const searchVolumeTrend = jsData.monthly_trend || jsData.searchVolumeTrend || 0;
    const relevancyScore = jsData.relevancy_score || jsData.relevancyScore || 0;
    const ppcBid = jsData.ppc_bid_exact || jsData.ppcBid || 0;
    
    const merged: MergedKeywordData = {
      keyword: jsData.keyword,
      jungleScoutSearchVolume: searchVolume,
      combinedSearchVolume: searchVolume,
      searchVolumeTrend: searchVolumeTrend,
      relevancyScore: relevancyScore,
      ppcBidJungleScout: ppcBid,
      recommendedBid: ppcBid,
      trendData: jsData.trendData,
      dataSources: ['JungleScout']
    };
    mergedMap.set(keywordLower, merged);
  });
  
  // Process and merge Google Ads data
  googleAdsData.forEach(gaData => {
    const keywordLower = gaData.keyword.toLowerCase();
    const existing = mergedMap.get(keywordLower);
    
    if (existing) {
      // Merge with existing data
      existing.googleAdsSearchVolume = gaData.searchVolume;
      existing.combinedSearchVolume = calculateCombinedSearchVolume(
        existing.jungleScoutSearchVolume,
        gaData.searchVolume
      );
      existing.competitionLevel = gaData.competitionLevel;
      existing.competitionIndex = gaData.competitionIndex;
      existing.googleAdsLowBid = gaData.lowTopPageBid;
      existing.googleAdsHighBid = gaData.highTopPageBid;
      existing.googleAdsAvgCpc = gaData.averageCpc;
      existing.recommendedBid = calculateRecommendedBid(existing);
      existing.monthlySearchVolumes = gaData.monthlySearchVolumes;
      existing.dataSources.push('GoogleAds');
    } else {
      // Create new entry with Google Ads data only
      const merged: MergedKeywordData = {
        keyword: gaData.keyword,
        googleAdsSearchVolume: gaData.searchVolume,
        combinedSearchVolume: gaData.searchVolume,
        competitionLevel: gaData.competitionLevel,
        competitionIndex: gaData.competitionIndex,
        googleAdsLowBid: gaData.lowTopPageBid,
        googleAdsHighBid: gaData.highTopPageBid,
        googleAdsAvgCpc: gaData.averageCpc,
        recommendedBid: gaData.averageCpc || 0,
        monthlySearchVolumes: gaData.monthlySearchVolumes,
        dataSources: ['GoogleAds']
      };
      mergedMap.set(keywordLower, merged);
    }
  });
  
  return Array.from(mergedMap.values());
}

// Calculate combined search volume (weighted average favoring Google Ads)
function calculateCombinedSearchVolume(
  jungleScoutVolume?: number,
  googleAdsVolume?: number
): number {
  if (jungleScoutVolume !== undefined && googleAdsVolume !== undefined) {
    // Weight Google Ads slightly higher (60/40) as it's the primary ads platform
    return Math.round(googleAdsVolume * 0.6 + jungleScoutVolume * 0.4);
  }
  return jungleScoutVolume || googleAdsVolume || 0;
}

// Calculate recommended bid based on available data
function calculateRecommendedBid(data: MergedKeywordData): number {
  const bids: number[] = [];
  
  if (data.ppcBidJungleScout) bids.push(data.ppcBidJungleScout);
  if (data.googleAdsAvgCpc) bids.push(data.googleAdsAvgCpc);
  if (data.googleAdsLowBid && data.googleAdsHighBid) {
    // Use the midpoint of Google Ads bid range
    bids.push((data.googleAdsLowBid + data.googleAdsHighBid) / 2);
  }
  
  if (bids.length === 0) return 0;
  
  // Return the average of all available bids
  return bids.reduce((sum, bid) => sum + bid, 0) / bids.length;
}

// Fetch Google Ads data from the server
export async function fetchGoogleAdsKeywordData(
  keywords: string[]
): Promise<GoogleAdsKeywordData[]> {
  try {
    // First try the ADC endpoint (using gcloud credentials)
          const adcResponse = await fetch('http://localhost:3002/api/google-ads-adc/keywords/ideas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ keywords }),
    });
    
    if (adcResponse.ok) {
      const result = await adcResponse.json();
      return result.data || [];
    }
    
    // Fallback to regular endpoint if ADC fails
          const response = await fetch('http://localhost:3002/api/google-ads/keywords/ideas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ keywords }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Google Ads API error:', error);
      // Return empty array on error to allow graceful degradation
      return [];
    }
    
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Failed to fetch Google Ads keyword data:', error);
    return [];
  }
}

// Fetch Google Ads search volume only
export async function fetchGoogleAdsSearchVolume(
  keywords: string[]
): Promise<Map<string, number>> {
  try {
    const response = await fetch('http://localhost:3002/api/google-ads/keywords/search-volume', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ keywords }),
    });
    
    if (!response.ok) {
      console.error('Google Ads search volume API error');
      return new Map();
    }
    
    const result = await response.json();
    return new Map(Object.entries(result.data || {}));
  } catch (error) {
    console.error('Failed to fetch Google Ads search volume:', error);
    return new Map();
  }
}

// Format competition level for display
export function formatCompetitionLevel(level?: string, index?: number): string {
  if (!level) return 'Unknown';
  
  if (index !== undefined) {
    return `${level} (${index}%)`;
  }
  
  return level;
}

// Calculate trend percentage from monthly data
export function calculateTrendFromMonthlyData(
  monthlyData?: Array<{ month: string; year: number; monthlySearches: number }>
): number {
  if (!monthlyData || monthlyData.length < 2) return 0;
  
  // Sort by year and month
  const sorted = [...monthlyData].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return parseInt(a.month) - parseInt(b.month);
  });
  
  // Compare last month to first month
  const firstMonth = sorted[0].monthlySearches || 1;
  const lastMonth = sorted[sorted.length - 1].monthlySearches || 1;
  
  return Math.round(((lastMonth - firstMonth) / firstMonth) * 100);
}