import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const base = process.env.VITE_BASE_PATH || '/';

export default defineConfig({
  base,
  root: resolve(__dirname, 'demo'),
  build: {
    outDir: resolve(__dirname, 'dist-pages'),
    emptyOutDir: true
  }
});
