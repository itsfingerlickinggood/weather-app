import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // maplibre-gl is ~600KB — isolate it so the main bundle stays small
          'vendor-map': ['maplibre-gl'],
          // React core split from the rest of vendor
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Data-fetching layer
          'vendor-query': ['@tanstack/react-query'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.js'],
  },
})
