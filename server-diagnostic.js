import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('=== DIAGNOSTIC SERVER STARTING ===');
console.log('Current directory:', process.cwd());
console.log('Script directory:', __dirname);
console.log('Node version:', process.version);
console.log('Platform:', process.platform);

// Check for key files
const filesToCheck = [
  'package.json',
  'server-production-with-api.js',
  'enhanced-multi-scraper.js',
  'dist/index.html'
];

console.log('\nChecking for key files:');
filesToCheck.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  console.log(`  ${file}: ${exists ? '✓' : '✗'}`);
});

// Check environment variables
console.log('\nEnvironment variables:');
const envVars = [
  'PORT',
  'NODE_ENV',
  'RENDER',
  'RENDER_SERVICE_NAME',
  'OPENAI_API_KEY',
  'OPEN_AI_API_KEY',
  'VITE_OPENAI_API_KEY',
  'SCRAPER_API_KEY',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

envVars.forEach(key => {
  const value = process.env[key];
  if (value) {
    console.log(`  ${key}: ${key.includes('KEY') ? 'SET' : value}`);
  } else {
    console.log(`  ${key}: NOT SET`);
  }
});

// Simple server
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Diagnostic server is running',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`\nDiagnostic server running on port ${PORT}`);
}).on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});