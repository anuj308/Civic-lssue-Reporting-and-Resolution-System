import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'build',
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // UI library
          'mui-vendor': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          // State management
          'redux-vendor': ['@reduxjs/toolkit', 'react-redux', 'redux-persist'],
          // API and utilities
          'api-vendor': ['@tanstack/react-query', 'axios', 'react-toastify'],
          // Form handling
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'yup'],
        },
      },
    },
  },
})