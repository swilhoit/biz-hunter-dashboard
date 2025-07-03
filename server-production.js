const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

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