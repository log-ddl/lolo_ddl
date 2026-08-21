import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { apiCorsProxyPlugin } from './vite.api-cors-proxy'

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        input: {
          index: path.resolve(__dirname, 'electron/main.ts')
        },
        output: {
          format: 'cjs'
        }
      }
    }
  },
  preload: {
    build: {
      rollupOptions: {
        input: {
          index: path.resolve(__dirname, 'electron/preload.ts')
        },
        output: {
          format: 'cjs'
        }
      }
    }
  },
  renderer: {
    root: '.',
    cacheDir: path.resolve(__dirname, '.vite-cache/renderer'),
    build: {
      rollupOptions: {
        input: {
          index: path.resolve(__dirname, 'index.html')
        },
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            'radix-ui': ['radix-ui'],
            'lucide-react': ['lucide-react'],
            zustand: ['zustand'],
            supabase: ['@supabase/supabase-js'],
          }
        }
      }
    },
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
      apiCorsProxyPlugin(),
      react(),
    ],
  },
})
