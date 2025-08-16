import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'zustand',
      '@supabase/supabase-js',
      'framer-motion',
      'date-fns',
      'lucide-react'
    ]
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-accordion', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          supabase: ['@supabase/supabase-js'],
          animations: ['framer-motion'],
          utils: ['date-fns', 'clsx', 'class-variance-authority']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    hmr: {
      overlay: false
    }
  }
});
