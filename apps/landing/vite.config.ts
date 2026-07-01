import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { apiDevOrigin } from '../dev/getApiDevOrigin';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 3001,
    allowedHosts: [
      "localhost",
      "dev-pouchcare.com",
      "dev.pouchcare.com",
      "pouchcare.com.bd",
      "www.pouchcare.com.bd",
    ],
    proxy: {
      '/v1': {
        target: apiDevOrigin(),
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
