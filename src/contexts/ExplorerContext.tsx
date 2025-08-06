import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types
interface ExplorerSettings {
  apiProvider: 'junglescout' | 'dataforseo';
  featureBatchSize: number;
  maxTokens: number;
  cacheEnabled: boolean;
  marketplace: string;
}

interface ExplorerContextType {
  settings: ExplorerSettings;
  updateSettings: (newSettings: Partial<ExplorerSettings>) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

// Default settings
const defaultSettings: ExplorerSettings = {
  apiProvider: 'junglescout',
  featureBatchSize: 25,
  maxTokens: 2000,
  cacheEnabled: true,
  marketplace: 'us'
};

// Create context
const ExplorerContext = createContext<ExplorerContextType | undefined>(undefined);

// Provider component
export const ExplorerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ExplorerSettings>(() => {
    // Load settings from localStorage if available
    const savedSettings = localStorage.getItem('explorerSettings');
    if (savedSettings) {
      try {
        return { ...defaultSettings, ...JSON.parse(savedSettings) };
      } catch (error) {
        console.error('Error parsing saved settings:', error);
      }
    }
    return defaultSettings;
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateSettings = (newSettings: Partial<ExplorerSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      // Save to localStorage
      localStorage.setItem('explorerSettings', JSON.stringify(updated));
      return updated;
    });
  };

  const value: ExplorerContextType = {
    settings,
    updateSettings,
    isLoading,
    setIsLoading,
    error,
    setError
  };

  return (
    <ExplorerContext.Provider value={value}>
      {children}
    </ExplorerContext.Provider>
  );
};

// Hook to use the context
export const useExplorer = (): ExplorerContextType => {
  const context = useContext(ExplorerContext);
  if (!context) {
    throw new Error('useExplorer must be used within an ExplorerProvider');
  }
  return context;
};