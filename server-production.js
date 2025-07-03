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
console.log('Environment variables:');
Object.keys(process.env).forEach(key => {
  if (key.startsWith('VITE_') || key === 'PORT' || key === 'NODE_ENV') {
    console.log(`  ${key}: ${process.env[key] ? 'SET' : 'NOT SET'}`);
  }
});

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
    if (key.startsWith('VITE_') || key.startsWith('RAILWAY_') || key === 'PORT' || key === 'NODE_ENV') {
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
    env: {
      VITE_OPENAI_API_KEY: process.env.VITE_OPENAI_API_KEY ? 'SET' : 'NOT SET',
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'not set',
      PORT: process.env.PORT || 'not set'
    },
    debug: envVars
  });
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
    VITE_OPENAI_API_KEY: process.env.VITE_OPENAI_API_KEY || '',
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || '',
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || ''
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
    VITE_OPENAI_API_KEY: process.env.VITE_OPENAI_API_KEY || '',
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || '',
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || ''
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