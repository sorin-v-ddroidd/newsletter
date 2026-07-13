import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  // jsdom REQUIRED: editorConfig.ts imports grapesjs-mjml at module top-level, which reads
  // `window` at import time (mjml-browser bundled dep) — the default node test environment
  // throws ReferenceError before any test body runs (testing.md: Vitest only, no jsdom setup
  // existed yet in this project — added here for the first test file, 260713-mxb).
  test: {
    environment: 'jsdom',
  },
  server: {
    // Dead since compile moved in-browser (app/client/src/lib/compile.ts) -- kept as a
    // harmless no-op in case a future server-only route is reintroduced.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
