interface AIProvider {
  name: 'openai' | 'anthropic' | 'groq';
  apiKey: string;
  model: string;
}

export async function extractFeatures(
  products: any[],
  provider: 'openai' | 'anthropic' | 'groq'
): Promise<Map<string, string[]>> {
  try {
    const productSample = products.slice(0, 20).map(p => ({
      title: p.title,
      price: p.price,
      category: p.category,
      brand: p.brand,
      rating: p.rating
    }));

    const prompt = `Analyze these Amazon products and extract KEY DIFFERENTIATORS that would be meaningful for market segmentation and business analysis. Focus on:

1. FUNCTIONAL FEATURES: Core capabilities that define product use cases (e.g., "Voice-Activated Control", "Multi-Device Connectivity", "Professional-Grade Performance")
2. TARGET MARKET: Who the product is designed for (e.g., "Home Office Workers", "Outdoor Enthusiasts", "Content Creators")
3. TECHNOLOGY LEVEL: Technical sophistication (e.g., "AI-Powered", "Smart Home Integration", "Mechanical/Analog")
4. PRICE-PERFORMANCE TIER: Value proposition (e.g., "Budget-Conscious Entry", "Premium Performance", "Luxury/Prestige")
5. USE CASE SPECIFICITY: Primary application (e.g., "Gaming-Optimized", "Travel-Friendly", "Commercial/Industrial")

Products:
${JSON.stringify(productSample, null, 2)}

Return a JSON object with SPECIFIC, DESCRIPTIVE feature names as keys (avoid generic terms like "premium" or "portable") and arrays of product titles as values. Example:
{
  "Professional Audio Recording": ["Studio Mic XLR...", "Audio Interface..."],
  "Smart Home Automation": ["WiFi Smart Plug...", "Alexa Thermostat..."],
  "Outdoor Adventure Gear": ["Waterproof GPS...", "Solar Power Bank..."]
}`;

    const features = await callAIProvider(provider, prompt);
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

async function callAIProvider(
  provider: 'openai' | 'anthropic' | 'groq',
  prompt: string
): Promise<any> {
  switch (provider) {
    case 'openai':
      const payload = {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a product analysis expert. Always return valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      };

      const response = await fetch('http://localhost:3002/api/ai/openai-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task: 'chat.completions.create', payload }),
      });

      if (!response.ok) {
          throw new Error('OpenAI API call failed via proxy');
      }

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);

    case 'anthropic':
      // This would need actual implementation based on Claude API docs
      throw new Error('Anthropic provider not implemented');
    case 'groq':
       // Groq API implementation
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ` // Removed key
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

      if (!groqResponse.ok) {
        throw new Error('Groq API call failed');
      }

      const groqData = await groqResponse.json();
      return JSON.parse(groqData.choices[0].message.content);

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

function getMockFeatures(products: any[]): Map<string, string[]> {
  const features = new Map<string, string[]>();
  
  // More descriptive feature categories that highlight key differentiators
  const featureKeywords = {
    'Smart Home Integration': ['alexa', 'google home', 'homekit', 'smart home', 'voice control', 'app controlled'],
    'Professional/Commercial Grade': ['commercial', 'professional', 'industrial', 'heavy duty', 'contractor', 'pro series'],
    'Outdoor & Adventure Ready': ['waterproof', 'weatherproof', 'outdoor', 'camping', 'hiking', 'rugged', 'all-weather'],
    'Travel & Portability Optimized': ['travel', 'portable', 'compact', 'foldable', 'lightweight', 'carry-on'],
    'Gaming & Performance': ['gaming', 'rgb', 'mechanical', 'high performance', 'low latency', 'pro gaming'],
    'Health & Wellness Focused': ['health', 'fitness', 'wellness', 'medical', 'therapy', 'monitoring'],
    'Eco & Sustainability': ['eco-friendly', 'sustainable', 'solar', 'recyclable', 'biodegradable', 'energy efficient'],
    'Child & Family Safe': ['baby', 'child', 'kids', 'family', 'child-safe', 'non-toxic', 'bpa-free'],
    'Premium Audio/Video': ['studio', 'hi-fi', 'audiophile', '4k', 'hdr', 'professional audio', 'cinematic'],
    'Fast Charging & Power': ['fast charging', 'quick charge', 'pd charging', 'power delivery', 'rapid charge', 'turbo'],
    'Multi-Device Connectivity': ['multi-device', 'universal', 'cross-platform', 'multi-connect', 'hub', 'all-in-one'],
    'Budget Value Leaders': ['value', 'budget', 'affordable', 'basic', 'entry-level', 'starter']
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
  
  // Create more descriptive segment names based on feature combinations
  if (featureList.length === 1) {
    return featureList[0];
  } else if (featureList.length === 2) {
    // Smart combination naming
    const [feature1, feature2] = featureList;
    
    // Special cases for common combinations
    if (feature1.includes('Smart') && feature2.includes('Premium')) {
      return 'Premium Smart Solutions';
    }
    if (feature1.includes('Outdoor') && feature2.includes('Professional')) {
      return 'Professional Outdoor Equipment';
    }
    if (feature1.includes('Gaming') && feature2.includes('Fast Charging')) {
      return 'High-Performance Gaming Accessories';
    }
    if (feature1.includes('Travel') && feature2.includes('Multi-Device')) {
      return 'Travel-Ready Tech Hub Solutions';
    }
    
    // Default combination
    return `${feature1} with ${feature2}`;
  } else {
    // For 3+ features, create a descriptive name based on the most important features
    const primaryFeature = featureList[0];
    const secondaryFeature = featureList[1];
    return `${primaryFeature} - Multi-Feature ${secondaryFeature}`;
  }
}