#!/bin/bash

echo "Setting up Mosaic React as the new frontend..."

# 1. First, let's copy necessary hooks and services from the existing project
echo "Copying existing hooks and services..."
mkdir -p mosaic-react/src/hooks
mkdir -p mosaic-react/src/services

# Copy authentication hook
cp src/hooks/useAuth.ts mosaic-react/src/hooks/

# 2. Create a proper useAuth hook if it doesn't exist
cat > mosaic-react/src/hooks/useAuth.ts << 'EOL'
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
EOL

# 3. Update the main App component to include AuthProvider
cat > mosaic-react/src/main.jsx << 'EOL'
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ThemeProvider from './utils/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  </React.StrictMode>
);
EOL

# 4. Update the App.jsx to use the integrated pipeline
echo "Updating App.jsx to use integrated components..."
sed -i.bak 's|import DealPipeline from '"'"'./pages/DealPipeline'"'"';|import DealPipeline from '"'"'./pages/DealPipelineIntegrated'"'"';|' mosaic-react/src/App.jsx

# 5. Install dependencies
echo "Installing dependencies..."
cd mosaic-react
npm install

# 6. Create a TypeScript declaration for the auth hook path
cat > src/hooks/index.d.ts << 'EOL'
export * from './useAuth';
EOL

echo "Setup complete!"
echo ""
echo "To test the integrated frontend:"
echo "1. cd mosaic-react"
echo "2. npm run dev"
echo ""
echo "The frontend will be available at http://localhost:5173"
echo ""
echo "Once verified, you can replace the main project's src folder with mosaic-react/src"