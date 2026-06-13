import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cloudflare()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) return 'vendor-react';
          if (id.includes('node_modules/@supabase')) return 'vendor-supabase';
          if (id.includes('node_modules/lucide-react')) return 'vendor-lucide';
          if (id.includes('node_modules/qrcode.react')) return 'vendor-qrcode';
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/shared/test/setup.ts'],
    globals: true,
    exclude: ['e2e/**', 'node_modules/**', '.opencode/**'],
  },
})