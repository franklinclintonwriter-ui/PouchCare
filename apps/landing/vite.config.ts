import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

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
    ],
    proxy: {
      '/v1': {
        target: 'http://localhost:7000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
