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
  resolve: {
    // 'lucide-react' means src/icons.js, which lists only the icons the site uses. The library's own entry point
    // pulls in all 1,900 icons (5 MB for the development server on every first load).
    alias: [{ find: /^lucide-react$/, replacement: path.resolve(import.meta.dirname, 'src/icons.js') }],
  },
  server: {
    port: 5173,
    // transform the files of the first screens as soon as the server starts, so the first page load is not slower
    warmup: {
      clientFiles: ['./src/main.jsx', './src/App.jsx', './src/layouts/PublicLayout.jsx', './src/pages/public/*.jsx', './src/components/public/*.jsx'],
    },
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
