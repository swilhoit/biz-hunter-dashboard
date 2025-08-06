// Centralized configuration for port numbers
const CONFIG = {
  // Server port - used by backend
  SERVER_PORT: process.env.PORT || 3002,
  
  // API URL - used by frontend
  get API_BASE_URL() {
    // In production, use relative URLs
    if (process.env.NODE_ENV === 'production') {
      return '';
    }
    // In development, use the server port
    return `http://localhost:${this.SERVER_PORT}`;
  }
};

// For CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}

// For ES6 modules
export default CONFIG;