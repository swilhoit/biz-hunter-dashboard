export async function generateKeywords(productTitles: string[], seedKeyword: string): Promise<string[]> {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('OpenAI API key not found, returning mock data');
      return getMockKeywords(seedKeyword);
    }

    const prompt = `Based on these Amazon product titles and the seed keyword "${seedKeyword}", generate 20 relevant keywords for Amazon product search. Focus on buyer intent keywords.

Product titles:
${productTitles.slice(0, 5).join('\n')}

Return only the keywords, one per line.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an Amazon keyword research expert.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate keywords');
    }

    const data = await response.json();
    const keywords = data.choices[0].message.content
      .split('\n')
      .filter(k => k.trim())
      .map(k => k.trim());

    return keywords;
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