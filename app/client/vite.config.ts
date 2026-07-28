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
  build: {
    // The lazy-loaded editor bundle (grapesjs + grapesjs-mjml + mjml-browser) is
    // intrinsically ~1MB gzip — a client-side MJML editor cannot be smaller. The 500kB
    // default warning is noise here, so raise it rather than disable it (260714-dq7).
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // Split each heavy lib into its own vendor chunk. Does NOT reduce total payload
        // (all three are needed on first editor open to render the canvas) — it lets the
        // browser cache each lib independently across deploys, so repeat editor opens
        // re-download only our app code, and the three download in parallel on first open.
        // rolldown-vite (Vite 8) requires the FUNCTION form of manualChunks — the object
        // form throws "manualChunks is not a function". Match longest/most-specific package
        // path first so grapesjs-mjml is not swallowed by the grapesjs rule.
        manualChunks(id) {
          if (id.includes('node_modules/mjml-browser')) {
            return 'mjml-browser';
          }
          if (id.includes('node_modules/grapesjs-mjml')) {
            return 'grapesjs-mjml';
          }
          if (id.includes('node_modules/grapesjs')) {
            return 'grapesjs';
          }
        },
      },
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
