import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // forward /api to backend during dev so no CORS hassle
      '/api': { target: 'https://jobapi.adsdigitalmedia.com', changeOrigin: true },
    },
  },
});
