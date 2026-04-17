import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { apiDevOrigin } from "../dev/getApiDevOrigin";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 3000,
    allowedHosts: [
      "localhost",
      "dev-m.pouchcare.com",
    ],
    proxy: {
      "/v1": {
        target: apiDevOrigin(),
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
