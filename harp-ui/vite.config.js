import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'https://harp-api.ekskog.net',
        changeOrigin: true,
        secure: false,
        // Keep the /api prefix (including /api/v1) when proxying to the backend
        rewrite: (path) => path,
      },
    },
  },
  // Ensure base path is set correctly
  base: '/',
});