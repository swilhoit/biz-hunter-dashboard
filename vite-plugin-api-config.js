import CONFIG from './config.js';

// Vite plugin to inject API configuration
export function apiConfigPlugin() {
  return {
    name: 'api-config',
    config: () => ({
      define: {
        // Inject the API URL at build time
        'import.meta.env.VITE_API_BASE_URL': JSON.stringify(CONFIG.API_BASE_URL),
        'import.meta.env.VITE_SERVER_PORT': JSON.stringify(CONFIG.SERVER_PORT)
      }
    })
  };
}