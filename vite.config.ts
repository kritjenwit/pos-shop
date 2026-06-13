import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cloudflare()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/shared/test/setup.ts'],
    globals: true,
    exclude: ['e2e/**', 'node_modules/**', '.opencode/**'],
  },
})