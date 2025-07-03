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

// Helper function to get a specific config value
export function getConfigValue(key: keyof RuntimeConfig): string | undefined {
  const config = getRuntimeConfig();
  return config[key] || import.meta.env[key];
}