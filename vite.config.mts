import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@components/': path.resolve(__dirname, './src/components/'),
      '@redux': path.resolve(__dirname, './src/redux'),
      '@redux/': path.resolve(__dirname, './src/redux/'),
      '@api': path.resolve(__dirname, './src/api/index.ts'),
      '@api/': path.resolve(__dirname, './src/api/'),
      '@hooks': path.resolve(__dirname, './src/hooks/index.ts'),
      '@hooks/': path.resolve(__dirname, './src/hooks/'),
      '@utils': path.resolve(__dirname, './src/utils/index.ts'),
      '@utils/': path.resolve(__dirname, './src/utils/'),
      '@types': path.resolve(__dirname, './src/types/index.ts'),
      '@types/': path.resolve(__dirname, './src/types/'),
    },
  },
  server: {
    port: 3000,
    strictPort: false,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'redux': ['@reduxjs/toolkit', 'react-redux'],
          'axios': ['axios'],
        }
      }
    }
  }
})
