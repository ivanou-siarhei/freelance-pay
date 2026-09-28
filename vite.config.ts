import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    // Только переменные с префиксом VITE_ попадают в браузер. Секреты сервера (DATABASE_URL, SESSION_SECRET) туда не утекают.
    envPrefix: 'VITE_',
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': { target: 'http://localhost:3001', changeOrigin: false },
      },
    },
    build: {
      sourcemap: false,
    },
  };
});
