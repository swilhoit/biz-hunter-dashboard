import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

// Comprehensive diagnostics endpoint
app.get('/api/diagnostics', async (req, res) => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      PORT: process.env.PORT || 'not set',
      RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT || 'not set',
      RAILWAY_PROJECT_ID: process.env.RAILWAY_PROJECT_ID || 'not set',
      IS_RAILWAY: !!process.env.RAILWAY_ENVIRONMENT
    },
    apiKeys: {
      SCRAPER_API_KEY: {
        present: !!process.env.SCRAPER_API_KEY,
        length: process.env.SCRAPER_API_KEY?.length || 0,
        prefix: process.env.SCRAPER_API_KEY ? process.env.SCRAPER_API_KEY.substring(0, 5) + '...' : 'not set'
      },
      VITE_OPENAI_API_KEY: {
        present: !!process.env.VITE_OPENAI_API_KEY,
        length: process.env.VITE_OPENAI_API_KEY?.length || 0,
        prefix: process.env.VITE_OPENAI_API_KEY ? process.env.VITE_OPENAI_API_KEY.substring(0, 7) + '...' : 'not set'
      },
      OPENAI_API_KEY: {
        present: !!process.env.OPENAI_API_KEY,
        length: process.env.OPENAI_API_KEY?.length || 0,
        prefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 7) + '...' : 'not set'
      }
    },
    supabase: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? 'set' : 'not set',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ? 'set' : 'not set'
    },
    tests: {}
  };

  // Test ScraperAPI connectivity
  try {
    console.log('Testing ScraperAPI...');
    const scraperApiKey = process.env.SCRAPER_API_KEY;
    if (scraperApiKey) {
      const testUrl = `https://api.scraperapi.com/account?api_key=${scraperApiKey}`;
      const scraperResponse = await fetch(testUrl, { 
        method: 'GET',
        timeout: 10000 
      });
      
      if (scraperResponse.ok) {
        const accountData = await scraperResponse.json();
        diagnostics.tests.scraperAPI = {
          status: 'success',
          accountStatus: accountData.is_active ? 'active' : 'inactive',
          requestsRemaining: accountData.requestLimit - accountData.requestCount,
          requestLimit: accountData.requestLimit
        };
      } else {
        diagnostics.tests.scraperAPI = {
          status: 'failed',
          error: `HTTP ${scraperResponse.status}: ${scraperResponse.statusText}`,
          message: 'Check if API key is valid'
        };
      }
    } else {
      diagnostics.tests.scraperAPI = {
        status: 'skipped',
        reason: 'No API key configured'
      };
    }
  } catch (error) {
    diagnostics.tests.scraperAPI = {
      status: 'error',
      error: error.message,
      type: error.constructor.name
    };
  }

  // Test OpenAI connectivity
  try {
    console.log('Testing OpenAI API...');
    const openaiKey = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    if (openaiKey) {
      const openaiResponse = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      if (openaiResponse.ok) {
        const models = await openaiResponse.json();
        diagnostics.tests.openAI = {
          status: 'success',
          modelsAvailable: models.data.length,
          hasGPT4Mini: models.data.some(m => m.id.includes('gpt-4o-mini'))
        };
      } else {
        const errorData = await openaiResponse.text();
        diagnostics.tests.openAI = {
          status: 'failed',
          error: `HTTP ${openaiResponse.status}: ${openaiResponse.statusText}`,
          details: errorData,
          message: 'Check if API key is valid and has proper permissions'
        };
      }
    } else {
      diagnostics.tests.openAI = {
        status: 'skipped',
        reason: 'No API key configured'
      };
    }
  } catch (error) {
    diagnostics.tests.openAI = {
      status: 'error',
      error: error.message,
      type: error.constructor.name
    };
  }

  // Test basic network connectivity
  try {
    console.log('Testing network connectivity...');
    const googleResponse = await fetch('https://www.google.com', { 
      method: 'HEAD',
      timeout: 5000 
    });
    diagnostics.tests.network = {
      status: 'success',
      googleReachable: googleResponse.ok
    };
  } catch (error) {
    diagnostics.tests.network = {
      status: 'error',
      error: error.message,
      message: 'Basic network connectivity issue detected'
    };
  }

  // Test DNS resolution
  try {
    console.log('Testing DNS resolution...');
    const dnsTests = await Promise.all([
      fetch('https://api.scraperapi.com', { method: 'HEAD', timeout: 5000 }).then(() => true).catch(() => false),
      fetch('https://api.openai.com', { method: 'HEAD', timeout: 5000 }).then(() => true).catch(() => false)
    ]);
    
    diagnostics.tests.dns = {
      status: 'success',
      scraperApiReachable: dnsTests[0],
      openAiReachable: dnsTests[1]
    };
  } catch (error) {
    diagnostics.tests.dns = {
      status: 'error',
      error: error.message
    };
  }

  res.json(diagnostics);
});

// Test endpoint for ScraperAPI
app.post('/api/test-scraper', async (req, res) => {
  try {
    const { url = 'https://example.com' } = req.body;
    const scraperApiKey = process.env.SCRAPER_API_KEY;
    
    if (!scraperApiKey) {
      return res.status(400).json({
        success: false,
        error: 'SCRAPER_API_KEY not configured'
      });
    }

    const scraperApiUrl = new URL('https://api.scraperapi.com/');
    scraperApiUrl.searchParams.append('api_key', scraperApiKey);
    scraperApiUrl.searchParams.append('url', url);
    
    const response = await fetch(scraperApiUrl.toString(), {
      method: 'GET',
      timeout: 30000
    });

    if (response.ok) {
      const html = await response.text();
      res.json({
        success: true,
        htmlLength: html.length,
        statusCode: response.status,
        headers: Object.fromEntries(response.headers.entries())
      });
    } else {
      res.json({
        success: false,
        statusCode: response.status,
        statusText: response.statusText,
        error: await response.text()
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// Test endpoint for OpenAI
app.post('/api/test-openai', async (req, res) => {
  try {
    const openaiKey = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    
    if (!openaiKey) {
      return res.status(400).json({
        success: false,
        error: 'OpenAI API key not configured (tried VITE_OPENAI_API_KEY and OPENAI_API_KEY)'
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "API test successful" and nothing else.' }
        ],
        max_tokens: 10
      }),
      timeout: 30000
    });

    if (response.ok) {
      const data = await response.json();
      res.json({
        success: true,
        response: data.choices[0]?.message?.content || 'No response',
        model: data.model,
        usage: data.usage
      });
    } else {
      const errorData = await response.text();
      res.json({
        success: false,
        statusCode: response.status,
        statusText: response.statusText,
        error: errorData
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

app.listen(PORT, () => {
  console.log(`🔍 Railway Diagnostics Server running on port ${PORT}`);
  console.log(`📊 Visit http://localhost:${PORT}/api/diagnostics for full diagnostics`);
  console.log(`🧪 POST to /api/test-scraper to test ScraperAPI`);
  console.log(`🤖 POST to /api/test-openai to test OpenAI API`);
});