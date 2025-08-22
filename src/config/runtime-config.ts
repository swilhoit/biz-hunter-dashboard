// Runtime configuration that can read environment variables
// This allows us to use environment variables that are set at runtime (like in Railway)
// rather than only at build time

interface RuntimeConfig {
  VITE_OPENAI_API_KEY?: string;
  OPENAI_API_KEY?: string;
  VITE_FIREBASE_API_KEY?: string;
  VITE_FIREBASE_AUTH_DOMAIN?: string;
  VITE_FIREBASE_PROJECT_ID?: string;
  VITE_FIREBASE_STORAGE_BUCKET?: string;
  VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  VITE_FIREBASE_APP_ID?: string;
  [key: string]: string | undefined;
}

// Function to get runtime config from window object or environment
export function getRuntimeConfig(): RuntimeConfig {
  // In production, we'll inject these values
  if (typeof window !== 'undefined' && (window as any).__RUNTIME_CONFIG__) {
    return (window as any).__RUNTIME_CONFIG__;
  }

  // Fallback to build-time environment variables
  return {
    VITE_OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY,
    VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
  };
}

// Helper function to get a specific config value with multiple fallbacks
export function getConfigValue(key: keyof RuntimeConfig): string | undefined {
  // Debug logging
  if (key.includes('OPENAI')) {
    console.log(`[getConfigValue] Looking for ${key}`);
    if (typeof window !== 'undefined') {
      console.log(`[getConfigValue] window.__RUNTIME_CONFIG__:`, (window as any).__RUNTIME_CONFIG__);
      console.log(`[getConfigValue] window.__RUNTIME_CONFIG__[${key}]:`, (window as any).__RUNTIME_CONFIG__?.[key]);
    }
  }
  
  // First try runtime config - check for non-empty string
  if (typeof window !== 'undefined' && (window as any).__RUNTIME_CONFIG__) {
    const value = (window as any).__RUNTIME_CONFIG__[key];
    if (value && value.trim() !== '') {
      return value;
    }
  }
  
  // Then try import.meta.env
  if (import.meta.env[key]) {
    return import.meta.env[key];
  }
  
  // Try without VITE_ prefix for backward compatibility
  const keyWithoutPrefix = key.replace('VITE_', '');
  if (import.meta.env[keyWithoutPrefix]) {
    return import.meta.env[keyWithoutPrefix];
  }
  
  // Also try with VITE_ prefix if not already present
  if (!key.startsWith('VITE_')) {
    const keyWithPrefix = `VITE_${key}`;
    if (typeof window !== 'undefined' && (window as any).__RUNTIME_CONFIG__?.[keyWithPrefix]) {
      const value = (window as any).__RUNTIME_CONFIG__[keyWithPrefix];
      if (value && value.trim() !== '') {
        return value;
      }
    }
    if (import.meta.env[keyWithPrefix]) {
      return import.meta.env[keyWithPrefix];
    }
  }
  
  // Last resort - check if we're in development and log warning
  if (import.meta.env.DEV) {
    console.warn(`Config value ${key} not found in runtime or build-time config`);
  }
  
  return undefined;
}