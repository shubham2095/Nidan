import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  // Read PORT from the repo-root .env so the proxy always matches the API server.
  const env = loadEnv(mode, path.resolve(import.meta.dirname, '..'), '');
  const apiTarget = `http://localhost:${env.PORT || 5000}`;

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      proxy: {
        '/api': apiTarget,
        '/uploads': apiTarget,
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  };
});
