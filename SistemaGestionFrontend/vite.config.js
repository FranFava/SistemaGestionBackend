import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const API_URL = process.env.VITE_API_URL || 'http://localhost:5000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: API_URL,
        changeOrigin: true,
        secure: false,
        timeout: 30000,
        onProxyReq: (proxyReq, req, res) => {
          console.log(`[Proxy] ${req.method} ${req.url} -> ${proxyReq.path}`);
        },
        onError: (err, req, res) => {
          console.error('═══════════════════════════════════════════');
          console.error('❌ ERROR DE CONEXIÓN AL BACKEND');
          console.error('URL solicitada:', req.url);
          console.error('Backend objetivo:', API_URL);
          console.error('Error:', err.message);
          console.error('═══════════════════════════════════════════');
        },
        onProxyRes: (proxyRes, req, res) => {
          if (proxyRes.statusCode >= 500) {
            console.error(`[Proxy] Error ${proxyRes.statusCode} en ${req.url}`);
          }
        }
      }
    }
  }
})
