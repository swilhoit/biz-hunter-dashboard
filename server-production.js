import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Log all environment variables that start with VITE_ (without showing the values)
console.log('=== Server Starting ===');
console.log('Port:', PORT);
console.log('Node Environment:', process.env.NODE_ENV);
console.log('Server Time:', new Date().toISOString());
console.log('Railway Environment:', process.env.RAILWAY_ENVIRONMENT || 'NOT SET');
console.log('Railway Project ID:', process.env.RAILWAY_PROJECT_ID || 'NOT SET');
console.log('Railway Service ID:', process.env.RAILWAY_SERVICE_ID || 'NOT SET');
console.log('Environment variables:');
Object.keys(process.env).forEach(key => {
  if (key.startsWith('VITE_') || key === 'PORT' || key === 'NODE_ENV' || key === 'OPENAI_API_KEY' || key === 'SCRAPER_API_KEY') {
    console.log(`  ${key}: ${process.env[key] ? 'SET' : 'NOT SET'}`);
  }
});

// Specifically check for critical vars
console.log('\nCritical environment check:');
console.log('  VITE_OPENAI_API_KEY:', process.env.VITE_OPENAI_API_KEY ? 'SET' : 'MISSING!');
console.log('  OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET' : 'MISSING!');
console.log('  SCRAPER_API_KEY:', process.env.SCRAPER_API_KEY ? 'SET' : 'MISSING!');
console.log('  VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'SET' : 'MISSING!');
console.log('  VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'MISSING!');

// Detect Railway environment
const isRailway = !!(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID);
if (isRailway) {
  console.log('\n🚂 Railway deployment detected - using Railway-optimized configuration');
}

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Test endpoint to verify environment variables
app.get('/api/test-env', (req, res) => {
  // More detailed debug info
  const envVars = {};
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('VITE_') || key.startsWith('RAILWAY_') || key === 'PORT' || key === 'NODE_ENV' || key === 'OPENAI_API_KEY' || key === 'SCRAPER_API_KEY') {
      // Show first 10 chars of value for debugging
      const value = process.env[key];
      if (value && value.length > 10) {
        envVars[key] = value.substring(0, 10) + '...' + (value.length) + ' chars';
      } else {
        envVars[key] = value || 'NOT SET';
      }
    }
  });
  
  res.json({
    server: 'production-server',
    timestamp: new Date().toISOString(),
    isRailway: isRailway,
    env: {
      VITE_OPENAI_API_KEY: process.env.VITE_OPENAI_API_KEY ? 'SET' : 'NOT SET',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET',
      SCRAPER_API_KEY: process.env.SCRAPER_API_KEY ? 'SET' : 'NOT SET',
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'not set',
      PORT: process.env.PORT || 'not set'
    },
    debug: envVars,
    distExists: fs.existsSync(path.join(__dirname, 'dist')),
    distIndexExists: fs.existsSync(path.join(__dirname, 'dist', 'index.html'))
  });
});

// API diagnostics endpoint
app.get('/api/diagnostics', async (req, res) => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      isRailway: isRailway,
      NODE_ENV: process.env.NODE_ENV || 'not set',
      PORT: process.env.PORT || 'not set',
      RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT || 'not set'
    },
    apiKeys: {
      SCRAPER_API_KEY: {
        present: !!process.env.SCRAPER_API_KEY,
        length: process.env.SCRAPER_API_KEY?.length || 0
      },
      VITE_OPENAI_API_KEY: {
        present: !!process.env.VITE_OPENAI_API_KEY,
        length: process.env.VITE_OPENAI_API_KEY?.length || 0
      },
      OPENAI_API_KEY: {
        present: !!process.env.OPENAI_API_KEY,
        length: process.env.OPENAI_API_KEY?.length || 0
      }
    },
    tests: {}
  };

  // Test basic connectivity
  try {
    const testResponse = await fetch('https://www.google.com', { 
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    diagnostics.tests.network = {
      status: 'success',
      googleReachable: testResponse.ok
    };
  } catch (error) {
    diagnostics.tests.network = {
      status: 'error',
      error: error.message
    };
  }

  res.json(diagnostics);
});

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist'), {
  // Don't serve index.html as static, we'll handle it separately
  index: false
}));

// Handle the root route and inject runtime config
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  let indexHtml = fs.readFileSync(indexPath, 'utf-8');
  
  // Inject runtime configuration
  const runtimeConfig = {
    VITE_OPENAI_API_KEY: process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '',
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || '',
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || '',
    SCRAPER_API_KEY: process.env.SCRAPER_API_KEY || '',
    IS_RAILWAY: isRailway
  };
  
  // Inject the config into the HTML
  const configScript = `
    <script>
      // Runtime configuration injected by server
      window.__RUNTIME_CONFIG__ = ${JSON.stringify(runtimeConfig)};
    </script>
  `;
  
  // Add the config script before the closing head tag
  indexHtml = indexHtml.replace('</head>', `${configScript}</head>`);
  
  res.send(indexHtml);
});

// Handle all other routes by serving index.html (for client-side routing)
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  let indexHtml = fs.readFileSync(indexPath, 'utf-8');
  
  // Inject runtime configuration
  const runtimeConfig = {
    VITE_OPENAI_API_KEY: process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '',
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || '',
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || '',
    SCRAPER_API_KEY: process.env.SCRAPER_API_KEY || '',
    IS_RAILWAY: isRailway
  };
  
  // Inject the config into the HTML
  const configScript = `
    <script>
      // Runtime configuration injected by server
      window.__RUNTIME_CONFIG__ = ${JSON.stringify(runtimeConfig)};
    </script>
  `;
  
  // Add the config script before the closing head tag
  indexHtml = indexHtml.replace('</head>', `${configScript}</head>`);
  
  res.send(indexHtml);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment variables detected:', {
    VITE_OPENAI_API_KEY: process.env.VITE_OPENAI_API_KEY ? 'SET' : 'NOT SET',
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET',
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'
  });
});