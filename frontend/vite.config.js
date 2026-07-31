import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * vite.config.js
 *
 * The proxy setting forwards /api requests from the frontend dev server
 * to the backend (port 5000) so we avoid CORS issues during development.
 * In production, a reverse proxy (nginx / IBM Code Engine) handles this.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
  },
});
