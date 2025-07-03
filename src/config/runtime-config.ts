// Runtime configuration that can read environment variables
// This allows us to use environment variables that are set at runtime (like in Railway)
// rather than only at build time

interface RuntimeConfig {
  VITE_OPENAI_API_KEY?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
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
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };
}

// Helper function to get a specific config value with multiple fallbacks
export function getConfigValue(key: keyof RuntimeConfig): string | undefined {
  // First try runtime config
  if (typeof window !== 'undefined' && (window as any).__RUNTIME_CONFIG__ && (window as any).__RUNTIME_CONFIG__[key]) {
    return (window as any).__RUNTIME_CONFIG__[key];
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
  
  // Last resort - check if we're in development and log warning
  if (import.meta.env.DEV) {
    console.warn(`Config value ${key} not found in runtime or build-time config`);
  }
  
  return undefined;
}