import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        // Important : réécrit le Domain/SameSite des cookies pour qu'ils soient vus
        // comme "premier parti" par le navigateur, quelle que soit sa politique de cookies.
        cookieDomainRewrite: 'localhost'
      }
    }
  }
});
