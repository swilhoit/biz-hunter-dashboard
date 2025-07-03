interface AIProvider {
  name: 'openai' | 'anthropic' | 'groq';
  apiKey: string;
  model: string;
}

export async function extractFeatures(
  products: any[], 
  provider: 'openai' | 'anthropic' | 'groq'
): Promise<Map<string, string[]>> {
  const apiKey = getApiKey(provider);
  
  if (!apiKey) {
    console.warn(`${provider} API key not found, using mock data`);
    return getMockFeatures(products);
  }

  try {
    const productSample = products.slice(0, 20).map(p => ({
      title: p.title,
      price: p.price,
      category: p.category
    }));

    const prompt = `Analyze these Amazon products and extract key features that differentiate them. Group products by their main features (e.g., "wireless", "waterproof", "portable", etc.).

Products:
${JSON.stringify(productSample, null, 2)}

Return a JSON object with feature names as keys and arrays of product titles as values.`;

    const features = await callAIProvider(provider, apiKey, prompt);
    return new Map(Object.entries(features));
  } catch (error) {
    console.error('Error extracting features:', error);
    return getMockFeatures(products);
  }
}

export async function segmentByFeatures(
  products: any[],
  features: Map<string, string[]>,
  provider: 'openai' | 'anthropic' | 'groq'
): Promise<any[]> {
  const segments = [];
  
  // Create segments based on feature combinations
  const featureGroups = groupProductsByFeatures(products, features);
  
  for (const [featureCombo, groupProducts] of featureGroups.entries()) {
    if (groupProducts.length > 0) {
      segments.push({
        name: generateSegmentName(featureCombo),
        features: featureCombo.split(','),
        products: groupProducts
      });
    }
  }

  return segments.sort((a, b) => b.products.length - a.products.length);
}

function getApiKey(provider: 'openai' | 'anthropic' | 'groq'): string | null {
  switch (provider) {
    case 'openai':
      return import.meta.env.VITE_OPENAI_API_KEY || null;
    case 'anthropic':
      return import.meta.env.VITE_ANTHROPIC_API_KEY || null;
    case 'groq':
      return import.meta.env.VITE_GROQ_API_KEY || null;
    default:
      return null;
  }
}

async function callAIProvider(
  provider: 'openai' | 'anthropic' | 'groq',
  apiKey: string,
  prompt: string
): Promise<any> {
  switch (provider) {
    case 'openai':
      return callOpenAI(apiKey, prompt);
    case 'anthropic':
      return callAnthropic(apiKey, prompt);
    case 'groq':
      return callGroq(apiKey, prompt);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

async function callOpenAI(apiKey: string, prompt: string): Promise<any> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a product analysis expert. Always return valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    throw new Error('OpenAI API call failed');
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

async function callAnthropic(apiKey: string, prompt: string): Promise<any> {
  // Anthropic Claude API implementation
  // This would need actual implementation based on Claude API docs
  throw new Error('Anthropic provider not implemented');
}

async function callGroq(apiKey: string, prompt: string): Promise<any> {
  // Groq API implementation
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'mixtral-8x7b-32768',
      messages: [
        { role: 'system', content: 'You are a product analysis expert. Always return valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    throw new Error('Groq API call failed');
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

function getMockFeatures(products: any[]): Map<string, string[]> {
  const features = new Map<string, string[]>();
  
  // Common features to look for in product titles
  const featureKeywords = {
    'Wireless': ['wireless', 'bluetooth', 'wifi', 'cordless'],
    'Portable': ['portable', 'travel', 'compact', 'mini'],
    'Premium': ['premium', 'professional', 'pro', 'deluxe'],
    'Smart': ['smart', 'app', 'alexa', 'google'],
    'Waterproof': ['waterproof', 'water resistant', 'weatherproof'],
    'Eco-Friendly': ['eco', 'sustainable', 'biodegradable', 'green'],
    'Fast Charging': ['fast charging', 'quick charge', 'rapid'],
    'Multi-Function': ['multi', '3-in-1', 'all-in-one', 'versatile']
  };

  for (const [feature, keywords] of Object.entries(featureKeywords)) {
    const matchingProducts = products.filter(p => 
      keywords.some(keyword => 
        p.title.toLowerCase().includes(keyword)
      )
    );
    
    if (matchingProducts.length > 0) {
      features.set(feature, matchingProducts.map(p => p.title));
    }
  }

  return features;
}

function groupProductsByFeatures(
  products: any[],
  features: Map<string, string[]>
): Map<string, any[]> {
  const groups = new Map<string, any[]>();
  
  for (const product of products) {
    const productFeatures = [];
    
    for (const [feature, titles] of features.entries()) {
      if (titles.includes(product.title)) {
        productFeatures.push(feature);
      }
    }
    
    if (productFeatures.length > 0) {
      const key = productFeatures.sort().join(',');
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(product);
    }
  }
  
  return groups;
}

function generateSegmentName(features: string): string {
  const featureList = features.split(',');
  
  if (featureList.length === 1) {
    return `${featureList[0]} Products`;
  } else if (featureList.length === 2) {
    return `${featureList.join(' & ')} Products`;
  } else {
    return `${featureList.slice(0, 2).join(', ')} & More`;
  }
}