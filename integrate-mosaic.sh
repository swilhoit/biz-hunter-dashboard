#!/bin/bash

# Integration script for Mosaic React frontend

echo "Starting Mosaic React integration..."

# 1. Install dependencies in mosaic-react
echo "Installing dependencies in mosaic-react..."
cd mosaic-react
npm install

# 2. Update import paths in mosaic-react to use @ alias
echo "Updating TypeScript config..."
cat > tsconfig.json << 'EOL'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "allowJs": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"],
      "@/integrations/*": ["../src/integrations/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/utils/*": ["./src/utils/*"],
      "@/hooks/*": ["../src/hooks/*"],
      "@/services/*": ["../src/services/*"],
      "@/types/*": ["./src/types/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOL

# 3. Update vite.config.js to handle @ alias
echo "Updating Vite config..."
cat > vite.config.js << 'EOL'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/integrations': path.resolve(__dirname, '../src/integrations'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/hooks': path.resolve(__dirname, '../src/hooks'),
      '@/services': path.resolve(__dirname, '../src/services'),
      '@/types': path.resolve(__dirname, './src/types')
    },
  },
})
EOL

# 4. Create a bridge file to connect to existing Supabase client
echo "Creating Supabase bridge..."
mkdir -p src/integrations
cat > src/integrations/supabase.ts << 'EOL'
// Bridge to existing Supabase configuration
export { supabase } from '@/lib/supabase';
export type { Database } from '@/lib/database.types';
EOL

echo "Integration script complete!"
echo ""
echo "Next steps:"
echo "1. Run 'cd mosaic-react && npm run dev' to test the Mosaic frontend"
echo "2. Once verified, we can move the mosaic-react files to replace the current src directory"
echo "3. Update the package.json to use the Mosaic dependencies"