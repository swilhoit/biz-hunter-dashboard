export async function generateKeywords(productTitles: string[], seedKeyword: string): Promise<string[]> {
  try {
    const response = await fetch('http://localhost:3002/api/ai/generate-keywords', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productTitles, seedKeyword }),
    });

    if (!response.ok) {
      // Try to get more details from the server response
      const errorData = await response.json().catch(() => ({}));
      console.error('Failed to generate keywords. Server responded with:', response.status, errorData);
      // Fallback to mock data on failure
      return getMockKeywords(seedKeyword);
    }

    const data = await response.json();
    return data.keywords || [];

  } catch (error) {
    console.error('Error generating keywords:', error);
    return getMockKeywords(seedKeyword);
  }
}

function getMockKeywords(seedKeyword: string): string[] {
  const baseKeywords = [
    `${seedKeyword} for home`,
    `best ${seedKeyword}`,
    `${seedKeyword} reviews`,
    `cheap ${seedKeyword}`,
    `${seedKeyword} deals`,
    `professional ${seedKeyword}`,
    `${seedKeyword} accessories`,
    `portable ${seedKeyword}`,
    `${seedKeyword} kit`,
    `${seedKeyword} set`,
    `premium ${seedKeyword}`,
    `${seedKeyword} bundle`,
    `wireless ${seedKeyword}`,
    `smart ${seedKeyword}`,
    `${seedKeyword} with case`
  ];

  return baseKeywords.slice(0, 10);
}

export async function fetchKeywordData(keywords: string[]): Promise<any[]> {
  // Mock implementation - in real app, this would call JungleScout API
  return keywords.map(keyword => ({
    keyword,
    searchVolume: Math.floor(Math.random() * 50000) + 1000,
    searchVolumeTrend: Math.floor(Math.random() * 40) - 20,
    ppcBid: Math.random() * 3 + 0.5,
    relevancyScore: Math.floor(Math.random() * 30) + 70
  }));
}

export async function fetchRelatedKeywords(seedKeyword: string): Promise<any[]> {
  // Mock implementation
  const variations = [
    `${seedKeyword} alternative`,
    `${seedKeyword} vs`,
    `${seedKeyword} comparison`,
    `similar to ${seedKeyword}`,
    `${seedKeyword} replacement`,
    `${seedKeyword} upgrade`,
    `${seedKeyword} budget`,
    `${seedKeyword} premium`
  ];

  return variations.map(keyword => ({
    keyword,
    searchVolume: Math.floor(Math.random() * 30000) + 500,
    searchVolumeTrend: Math.floor(Math.random() * 40) - 20,
    ppcBid: Math.random() * 2 + 0.3,
    relevancyScore: Math.floor(Math.random() * 30) + 60
  }));
}