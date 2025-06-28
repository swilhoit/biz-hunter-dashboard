import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    exclude: ['playwright', 'playwright-core'],
  },
  build: {
    rollupOptions: {
      external: ['playwright', 'playwright-core'],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    conditions: ['import', 'module', 'browser', 'default'],
  },
}));
