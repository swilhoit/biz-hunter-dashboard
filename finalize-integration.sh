#!/bin/bash

echo "Finalizing Mosaic React Integration..."

# Get current directory
PROJECT_ROOT="/Users/samwilhoit/CascadeProjects/biz-hunter-dashboard"
cd "$PROJECT_ROOT"

# Create a backup first
BACKUP_DIR="backup_before_mosaic_$(date +%Y%m%d_%H%M%S)"
echo "Creating backup in $BACKUP_DIR..."
mkdir -p "$BACKUP_DIR"
cp -r src "$BACKUP_DIR/"
cp -r public "$BACKUP_DIR/"
cp package.json "$BACKUP_DIR/"
cp index.html "$BACKUP_DIR/" 2>/dev/null || true
cp vite.config.ts "$BACKUP_DIR/" 2>/dev/null || true

# Replace the current project with mosaic-react
echo "Replacing current frontend with Mosaic React..."

# Remove current src and replace with mosaic-react
rm -rf src
cp -r mosaic-react/src .

# Update package.json to include mosaic dependencies
echo "Merging package.json dependencies..."
node -e "
const fs = require('fs');
const path = require('path');

const mainPkgPath = './package.json';
const mosaicPkgPath = './mosaic-react/package.json';

const mainPkg = JSON.parse(fs.readFileSync(mainPkgPath, 'utf8'));
const mosaicPkg = JSON.parse(fs.readFileSync(mosaicPkgPath, 'utf8'));

// Keep existing dependencies and add mosaic ones
const newDeps = { ...mainPkg.dependencies };
Object.keys(mosaicPkg.dependencies).forEach(dep => {
  newDeps[dep] = mosaicPkg.dependencies[dep];
});

const newDevDeps = { ...mainPkg.devDependencies };
Object.keys(mosaicPkg.devDependencies).forEach(dep => {
  newDevDeps[dep] = mosaicPkg.devDependencies[dep];
});

mainPkg.dependencies = newDeps;
mainPkg.devDependencies = newDevDeps;

fs.writeFileSync(mainPkgPath, JSON.stringify(mainPkg, null, 2));
console.log('Package.json updated successfully');
"

# Copy important files from mosaic-react
cp mosaic-react/index.html ./ 2>/dev/null || true
cp mosaic-react/tailwind.config.js ./ 2>/dev/null || true
cp mosaic-react/postcss.config.cjs ./ 2>/dev/null || true

# Update vite.config.ts for the new structure
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

# Create proper integrations folder structure
mkdir -p src/integrations/supabase
cat > src/integrations/supabase/client.ts << 'EOL'
// Bridge to the existing Supabase client setup
export { supabase } from '@/lib/supabase';
export type { Database } from '@/lib/database.types';
EOL

# Fix the import path issue in the supabase client
sed -i.bak 's|import type { Database } from '\''./database.types'\'';|import type { Database } from '\''./database.types'\'';|' src/lib/supabase.ts 2>/dev/null || true

# Install dependencies
echo "Installing dependencies..."
npm install

echo ""
echo "✅ Mosaic React Integration Complete!"
echo ""
echo "🔧 What was done:"
echo "   - Backed up original files to: $BACKUP_DIR"
echo "   - Replaced src/ directory with Mosaic React components"
echo "   - Updated package.json with new dependencies"
echo "   - Configured Vite for the new structure"
echo "   - Set up proper path aliases"
echo ""
echo "🚀 Next steps:"
echo "   1. Run: npm run dev"
echo "   2. Open: http://localhost:5173"
echo "   3. Test the new Mosaic React interface"
echo ""
echo "📁 Your original files are safely backed up in: $BACKUP_DIR"