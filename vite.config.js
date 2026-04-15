import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const base = process.env.VITE_APP_BASE_PATH || '/';

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
      '/uploads': 'http://localhost:8787',
      '/thumbnails': 'http://localhost:8787',
    },
  },
});
