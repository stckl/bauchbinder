import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import renderer from 'vite-plugin-electron-renderer';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  plugins: [
    vue(),
    renderer({
      nodeIntegration: true,
    }),
  ],
  build: {
    rollupOptions: {
      external: ['font-list', 'electron'],
      input: {
        main: resolve(__dirname, 'index.html'),
        key: resolve(__dirname, 'bauchbinde_key.html'),
        fill: resolve(__dirname, 'bauchbinde_fill.html'),
        h5: resolve(__dirname, 'bauchbinde_h5.html'),
      },
    },
  },
  optimizeDeps: {
    exclude: ['font-list'],
  },
  server: {
    port: 3000,
    strictPort: true,
  },
});