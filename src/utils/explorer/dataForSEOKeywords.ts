interface DataForSEOKeywordData {
  keyword: string;
  search_volume: number;
  cpc: number;
  competition: number;
  competition_level: string;
  monthly_searches: Array<{
    month: string;
    search_volume: number;
  }>;
  keyword_difficulty: number;
}

export async function fetchKeywordsFromDataForSEO(keywords: string[]): Promise<DataForSEOKeywordData[]> {
  try {
    const username = import.meta.env.VITE_DATAFORSEO_USERNAME;
    const password = import.meta.env.VITE_DATAFORSEO_PASSWORD;
    
    if (!username || !password) {
      console.error('[DataForSEO] Credentials not configured');
      return [];
    }

    const credentials = btoa(`${username}:${password}`);
    const endpoint = 'https://api.dataforseo.com/v3/keywords_data/amazon/keywords_for_keywords/live';
    
    // DataForSEO Amazon Keywords API payload
    const payload = [{
      keywords: keywords,
      location_code: 2840, // USA
      language_code: 'en',
      sort_by: 'search_volume',
      limit: 100
    }];

    console.log('[DataForSEO] Fetching keyword data for:', keywords);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DataForSEO] API error:', response.status, errorText);
      return [];
    }

    const data = await response.json();
    
    if (data.status_code === 20000 && data.tasks?.[0]?.result?.[0]?.items) {
      const items = data.tasks[0].result[0].items;
      console.log('[DataForSEO] Found', items.length, 'keywords');
      
      // Map DataForSEO results to our format
      return items.map((item: any) => ({
        keyword: item.keyword || '',
        search_volume: item.keyword_info?.search_volume || 0,
        cpc: item.keyword_info?.cpc || 0,
        competition: item.keyword_info?.competition || 0,
        competition_level: getCompetitionLevel(item.keyword_info?.competition || 0),
        monthly_searches: item.keyword_info?.monthly_searches || [],
        keyword_difficulty: item.keyword_info?.keyword_difficulty || 0
      }));
    }
    
    console.log('[DataForSEO] No keywords found or API error');
    return [];
  } catch (error) {
    console.error('Error fetching keywords from DataForSEO:', error);
    return [];
  }
}

export async function fetchRelatedKeywordsFromDataForSEO(seedKeyword: string): Promise<DataForSEOKeywordData[]> {
  try {
    const username = import.meta.env.VITE_DATAFORSEO_USERNAME;
    const password = import.meta.env.VITE_DATAFORSEO_PASSWORD;
    
    if (!username || !password) {
      console.error('[DataForSEO] Credentials not configured');
      return [];
    }

    const credentials = btoa(`${username}:${password}`);
    const endpoint = 'https://api.dataforseo.com/v3/keywords_data/amazon/keyword_suggestions/live';
    
    // DataForSEO Amazon Keyword Suggestions API payload
    const payload = [{
      keyword: seedKeyword,
      location_code: 2840, // USA
      language_code: 'en',
      limit: 50
    }];

    console.log('[DataForSEO] Fetching related keywords for:', seedKeyword);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DataForSEO] API error:', response.status, errorText);
      return [];
    }

    const data = await response.json();
    
    if (data.status_code === 20000 && data.tasks?.[0]?.result?.[0]?.items) {
      const items = data.tasks[0].result[0].items;
      console.log('[DataForSEO] Found', items.length, 'related keywords');
      
      // Map DataForSEO results to our format
      return items.map((item: any) => ({
        keyword: item.keyword || '',
        search_volume: item.keyword_info?.search_volume || 0,
        cpc: item.keyword_info?.cpc || 0,
        competition: item.keyword_info?.competition || 0,
        competition_level: getCompetitionLevel(item.keyword_info?.competition || 0),
        monthly_searches: item.keyword_info?.monthly_searches || [],
        keyword_difficulty: item.keyword_info?.keyword_difficulty || 0
      }));
    }
    
    console.log('[DataForSEO] No related keywords found or API error');
    return [];
  } catch (error) {
    console.error('Error fetching related keywords from DataForSEO:', error);
    return [];
  }
}

function getCompetitionLevel(competition: number): string {
  if (competition >= 0.7) return 'High';
  if (competition >= 0.4) return 'Medium';
  return 'Low';
}

// Calculate trend from monthly searches
export function calculateTrend(monthlySearches: Array<{ month: string; search_volume: number }>): number {
  if (!monthlySearches || monthlySearches.length < 2) return 0;
  
  // Sort by date
  const sorted = [...monthlySearches].sort((a, b) => 
    new Date(a.month).getTime() - new Date(b.month).getTime()
  );
  
  // Calculate trend from last 3 months vs previous 3 months
  const recentMonths = sorted.slice(-3);
  const previousMonths = sorted.slice(-6, -3);
  
  if (previousMonths.length === 0) return 0;
  
  const recentAvg = recentMonths.reduce((sum, m) => sum + m.search_volume, 0) / recentMonths.length;
  const previousAvg = previousMonths.reduce((sum, m) => sum + m.search_volume, 0) / previousMonths.length;
  
  if (previousAvg === 0) return 0;
  
  const trend = ((recentAvg - previousAvg) / previousAvg) * 100;
  return Math.round(trend);
}