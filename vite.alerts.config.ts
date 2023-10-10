import { fileURLToPath, URL } from 'node:url';
import path from 'node:path';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src-alerts', import.meta.url)),
      'slds': path.resolve(__dirname, 'node_modules/@salesforce-ux/design-system')
    }
  },
  build: {
    minify: false,
    sourcemap: true,
    rollupOptions: {
      input: {
        app: './sf-alerts.html'
      },
      output: {
        assetFileNames: 'sf-alerts-assets/[name]-[hash][extname]',
        chunkFileNames: 'sf-alerts-assets/[name]-[hash].js',
        entryFileNames: 'sf-alerts-assets/[name]-[hash].js'
      }
    }
  }
});