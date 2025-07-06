import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => {
          const newPath = path.replace(/^\/api/, '');
          console.log(`Proxying ${path} to ${newPath}`);
          return newPath;
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          // Log proxy events
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`Proxying request: ${req.method} ${req.url}`);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log(`Proxy response: ${proxyRes.statusCode} for ${req.url}`);
          });
        },
      },
    },
    // Add a console message when server starts
    hmr: {
      overlay: true,
    },
  },
  // Add clear error overlay
  clearScreen: false,
});
