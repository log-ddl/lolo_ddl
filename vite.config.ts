import { defineConfig } from 'vite'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { handleCliDevRequest } from './src/features/video-studio/lib/cli-dev-server'
import { apiCorsProxyPlugin } from './vite.api-cors-proxy'

// https://vitejs.dev/config/
export default defineConfig({
  cacheDir: path.resolve(__dirname, '.vite-cache'),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@opencut/ai-core/services/prompt-compiler': path.resolve(__dirname, './src/features/video-studio/packages/ai-core/services/prompt-compiler.ts'),
      '@opencut/ai-core/api/task-poller': path.resolve(__dirname, './src/features/video-studio/packages/ai-core/api/task-poller.ts'),
      '@opencut/ai-core/protocol': path.resolve(__dirname, './src/features/video-studio/packages/ai-core/protocol/index.ts'),
      '@opencut/ai-core': path.resolve(__dirname, './src/features/video-studio/packages/ai-core/index.ts'),
    },
  },
  plugins: [
    apiCorsProxyPlugin({ handleRequest: handleCliDevRequest }),
    react(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          'radix-ui': ['radix-ui'],
          'lucide-react': ['lucide-react'],
          zustand: ['zustand'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
})
