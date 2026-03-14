import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
// Updated config
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Tauri expects a fixed port, fail if that port is not available
  server: {
    port: 32744,
    strictPort: true,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  build: {
    // Improve chunking for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-error-boundary'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
          'data-vendor': ['recharts', 'd3-array', 'd3-scale', 'd3-shape', 'd3-time-format', 'd3-time'],
          'editor-vendor': ['react-markdown', 'react-syntax-highlighter', 'remark-gfm', 'remark-math', 'rehype-katex', 'rehype-raw'],
          'i18n-vendor': ['i18next', 'react-i18next'],
        },
      },
    },
    // Increase chunk size warning limit to 1MB (current main bundle is 2.2MB which is acceptable for this app)
    chunkSizeWarningLimit: 1000,
  },
})
