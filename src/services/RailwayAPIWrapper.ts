// Railway-compatible API wrapper with enhanced error handling
import { getConfigValue } from '../config/runtime-config';

interface APICallOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export class RailwayAPIWrapper {
  private static instance: RailwayAPIWrapper;
  private isRailway: boolean;
  
  constructor() {
    // Detect if we're running on Railway
    this.isRailway = this.detectRailwayEnvironment();
    
    if (this.isRailway) {
      console.log('🚂 Railway environment detected - using enhanced API handling');
    }
  }
  
  static getInstance(): RailwayAPIWrapper {
    if (!this.instance) {
      this.instance = new RailwayAPIWrapper();
    }
    return this.instance;
  }
  
  private detectRailwayEnvironment(): boolean {
    // Check multiple indicators that we're on Railway
    if (typeof window !== 'undefined') {
      // Client-side detection
      const hostname = window.location.hostname;
      return hostname.includes('railway.app') || 
             hostname.includes('up.railway.app') ||
             window.location.protocol === 'https:' && !hostname.includes('localhost');
    }
    
    // Server-side detection
    return !!(process.env.RAILWAY_ENVIRONMENT || 
              process.env.RAILWAY_PROJECT_ID ||
              process.env.RAILWAY_SERVICE_ID);
  }
  
  async callScraperAPI(url: string, options: APICallOptions = {}): Promise<Response> {
    const apiKey = this.getScraperAPIKey();
    
    if (!apiKey) {
      throw new Error('ScraperAPI key not found. Please set SCRAPER_API_KEY environment variable in Railway.');
    }
    
    const { timeout = 60000, retries = 3, retryDelay = 2000 } = options;
    
    const scraperApiUrl = new URL('https://api.scraperapi.com/');
    scraperApiUrl.searchParams.append('api_key', apiKey);
    scraperApiUrl.searchParams.append('url', url);
    scraperApiUrl.searchParams.append('render', 'true');
    scraperApiUrl.searchParams.append('country_code', 'us');
    
    // Add Railway-specific parameters
    if (this.isRailway) {
      scraperApiUrl.searchParams.append('premium', 'true');
      scraperApiUrl.searchParams.append('retry_404', 'true');
    }
    
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔄 ScraperAPI attempt ${attempt}/${retries} for ${url}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(scraperApiUrl.toString(), {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Accept': 'text/html,application/xhtml+xml',
            'User-Agent': 'Mozilla/5.0 (compatible; Railway/1.0)'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log(`✅ ScraperAPI request successful on attempt ${attempt}`);
          return response;
        }
        
        // Log detailed error information
        const errorText = await response.text();
        console.error(`❌ ScraperAPI error (attempt ${attempt}): ${response.status} - ${errorText}`);
        
        if (response.status === 403) {
          throw new Error('ScraperAPI authentication failed. Check your API key.');
        }
        
        if (response.status === 429) {
          throw new Error('ScraperAPI rate limit exceeded. Please try again later.');
        }
        
        lastError = new Error(`ScraperAPI returned ${response.status}: ${response.statusText}`);
        
      } catch (error: any) {
        console.error(`❌ ScraperAPI request failed (attempt ${attempt}):`, error.message);
        lastError = error;
        
        if (error.name === 'AbortError') {
          lastError = new Error(`ScraperAPI request timed out after ${timeout}ms`);
        }
      }
      
      // Wait before retrying
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
    
    throw lastError || new Error('ScraperAPI request failed after all retries');
  }
  
  async callOpenAI(messages: any[], options: any = {}): Promise<any> {
    const apiKey = this.getOpenAIKey();
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please set VITE_OPENAI_API_KEY environment variable in Railway.');
    }
    
    const { timeout = 30000, retries = 3, retryDelay = 1000 } = options;
    
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🤖 OpenAI API attempt ${attempt}/${retries}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Railway-App/1.0'
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: messages,
            ...options
          })
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log(`✅ OpenAI API request successful on attempt ${attempt}`);
          return await response.json();
        }
        
        const errorData = await response.text();
        console.error(`❌ OpenAI API error (attempt ${attempt}): ${response.status} - ${errorData}`);
        
        if (response.status === 401) {
          throw new Error('OpenAI authentication failed. Check your API key.');
        }
        
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          if (retryAfter && attempt < retries) {
            const waitTime = parseInt(retryAfter) * 1000;
            console.log(`⏳ Rate limited. Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          throw new Error('OpenAI rate limit exceeded. Please try again later.');
        }
        
        lastError = new Error(`OpenAI API returned ${response.status}: ${errorData}`);
        
      } catch (error: any) {
        console.error(`❌ OpenAI API request failed (attempt ${attempt}):`, error.message);
        lastError = error;
        
        if (error.name === 'AbortError') {
          lastError = new Error(`OpenAI API request timed out after ${timeout}ms`);
        }
      }
      
      // Wait before retrying
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
    
    throw lastError || new Error('OpenAI API request failed after all retries');
  }
  
  private getScraperAPIKey(): string | undefined {
    // Try multiple sources for the API key
    return process.env.SCRAPER_API_KEY ||
           (typeof window !== 'undefined' && (window as any).__RUNTIME_CONFIG__?.SCRAPER_API_KEY) ||
           undefined;
  }
  
  private getOpenAIKey(): string | undefined {
    // Try multiple sources for the API key
    return getConfigValue('VITE_OPENAI_API_KEY') ||
           process.env.VITE_OPENAI_API_KEY ||
           process.env.OPENAI_API_KEY ||
           (typeof window !== 'undefined' && (window as any).__RUNTIME_CONFIG__?.VITE_OPENAI_API_KEY) ||
           (typeof window !== 'undefined' && (window as any).__RUNTIME_CONFIG__?.OPENAI_API_KEY) ||
           undefined;
  }
  
  // Diagnostic method
  async runDiagnostics(): Promise<any> {
    const diagnostics = {
      environment: {
        isRailway: this.isRailway,
        hasScraperKey: !!this.getScraperAPIKey(),
        hasOpenAIKey: !!this.getOpenAIKey(),
        scraperKeyPrefix: this.getScraperAPIKey()?.substring(0, 5) + '...',
        openAIKeyPrefix: this.getOpenAIKey()?.substring(0, 7) + '...'
      },
      tests: {}
    };
    
    // Test ScraperAPI
    try {
      const scraperTest = await this.callScraperAPI('https://example.com', { 
        timeout: 10000, 
        retries: 1 
      });
      diagnostics.tests.scraperAPI = {
        success: true,
        status: scraperTest.status
      };
    } catch (error: any) {
      diagnostics.tests.scraperAPI = {
        success: false,
        error: error.message
      };
    }
    
    // Test OpenAI
    try {
      const openAITest = await this.callOpenAI([
        { role: 'user', content: 'Say "test"' }
      ], { 
        max_tokens: 5,
        timeout: 10000,
        retries: 1
      });
      diagnostics.tests.openAI = {
        success: true,
        response: openAITest.choices[0]?.message?.content
      };
    } catch (error: any) {
      diagnostics.tests.openAI = {
        success: false,
        error: error.message
      };
    }
    
    return diagnostics;
  }
}

export default RailwayAPIWrapper;