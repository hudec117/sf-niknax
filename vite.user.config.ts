import { fileURLToPath, URL } from 'node:url';
import path from 'node:path';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src-user', import.meta.url)),
      'slds': path.resolve(__dirname, 'node_modules/@salesforce-ux/design-system')
    }
  },
  build: {
    minify: false,
    sourcemap: true,
    rollupOptions: {
      input: {
        app: './sf-user.html'
      },
      output: {
        assetFileNames: 'sf-user-assets/[name]-[hash][extname]',
        chunkFileNames: 'sf-user-assets/[name]-[hash].js',
        entryFileNames: 'sf-user-assets/[name]-[hash].js'
      }
    }
  }
});