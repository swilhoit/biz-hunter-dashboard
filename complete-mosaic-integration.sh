#!/bin/bash

echo "Completing Mosaic React Integration..."

# 1. Backup current structure
echo "Creating backup of current project structure..."
mkdir -p backup_$(date +%Y%m%d_%H%M%S)
cp -r src backup_$(date +%Y%m%d_%H%M%S)/
cp -r public backup_$(date +%Y%m%d_%H%M%S)/
cp package.json backup_$(date +%Y%m%d_%H%M%S)/
cp vite.config.ts backup_$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || cp vite.config.js backup_$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true

# 2. Copy mosaic-react src to main project
echo "Replacing current src with mosaic-react src..."
rm -rf src
cp -r mosaic-react/src .

# 3. Copy mosaic-react public files
echo "Updating public files..."
cp -r mosaic-react/public/* public/ 2>/dev/null || true

# 4. Update package.json with mosaic dependencies
echo "Updating package.json..."
node << 'EOF'
const fs = require('fs');
const mainPkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const mosaicPkg = JSON.parse(fs.readFileSync('mosaic-react/package.json', 'utf8'));

// Merge dependencies
mainPkg.dependencies = {
  ...mainPkg.dependencies,
  ...mosaicPkg.dependencies
};

// Merge devDependencies
mainPkg.devDependencies = {
  ...mainPkg.devDependencies,
  ...mosaicPkg.devDependencies
};

// Update scripts if needed
if (mosaicPkg.scripts.dev) {
  mainPkg.scripts.dev = mosaicPkg.scripts.dev;
}

fs.writeFileSync('package.json', JSON.stringify(mainPkg, null, 2));
EOF

# 5. Update vite.config to handle the new structure
echo "Updating Vite configuration..."
cat > vite.config.ts << 'EOL'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/integrations': path.resolve(__dirname, './src/integrations')
    },
  },
  server: {
    port: 5173
  }
})
EOL

# 6. Copy environment variables
echo "Copying environment configuration..."
cp .env src/ 2>/dev/null || true

# 7. Install dependencies
echo "Installing updated dependencies..."
npm install

# 8. Update index.html if needed
echo "Updating index.html..."
cp mosaic-react/index.html . 2>/dev/null || true

# 9. Update tailwind.config.js
echo "Updating Tailwind configuration..."
cp mosaic-react/tailwind.config.js . 2>/dev/null || true

# 10. Create integrations folder and copy Supabase client
echo "Setting up integrations..."
mkdir -p src/integrations/supabase
cat > src/integrations/supabase/client.ts << 'EOL'
// Re-export from main supabase client
export { supabase } from '@/lib/supabase';
export type { Database } from '@/lib/database.types';
EOL

echo "Integration completed successfully!"
echo ""
echo "Next steps:"
echo "1. npm run dev - to start the development server"
echo "2. Review the new frontend at http://localhost:5173"
echo "3. Test all functionality to ensure proper integration"
echo ""
echo "The original files have been backed up in backup_$(date +%Y%m%d_%H%M%S)/"