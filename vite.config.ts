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
      '@/integrations': path.resolve(__dirname, './src/integrations'),
      '@tailwindConfig': path.resolve(__dirname, './tailwind.config.js')
    },
  },
  server: {
    port: 5173
  },
  preview: {
    host: '0.0.0.0',
    port: process.env.PORT ? parseInt(process.env.PORT) : 4173
  },
  worker: {
    format: 'es'
  },
  optimizeDeps: {
    exclude: ['pdfjs-dist'],
    include: ['pdfjs-dist/build/pdf.min.js']
  },
  define: {
    // Disable PDF.js worker in development to avoid CORS issues
    global: 'globalThis',
  }
})
