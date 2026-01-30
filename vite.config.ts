import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
  css: {
    devSourcemap: true, // Better CSS error reporting
  },
  optimizeDeps: {
    exclude: [], // Ensure all deps are optimized
  },
  build: {
    chunkSizeWarningLimit: 2000000,
  },
});
