import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The dev proxy must point at the API's PORT from the repo-root .env. The file is read by hand on purpose:
// Vite's loadEnv() also adopts NODE_ENV=development from it, which silently turns `vite build` into a
// development build (unminified React, double effects).
const apiPort = () => {
  if (process.env.PORT) return process.env.PORT;
  try {
    const text = fs.readFileSync(path.resolve(import.meta.dirname, '..', '.env'), 'utf8');
    return text.match(/^\s*PORT\s*=\s*(\d+)/m)?.[1] || 5000;
  } catch {
    return 5000;
  }
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': `http://localhost:${apiPort()}`,
      '/uploads': `http://localhost:${apiPort()}`,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
