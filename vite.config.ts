import { defineConfig } from 'vitest/config';
import dts from 'vite-plugin-dts';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [
    dts({
      entryRoot: 'src',
      insertTypesEntry: true,
      rollupTypes: false
    })
  ],
  build: {
    sourcemap: true,
    minify: 'esbuild',
    cssCodeSplit: false,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'HtmlVisualDiff',
      formats: ['es', 'cjs', 'iife'],
      fileName: (format) => {
        if (format === 'iife') return 'sdk.js';
        if (format === 'cjs') return 'html-visual-diff.cjs';
        return 'html-visual-diff.js';
      }
    },
    rollupOptions: {
      output: {
        exports: 'named',
        assetFileNames: (assetInfo) => assetInfo.name === 'style.css' ? 'style.css' : 'assets/[name]-[hash][extname]'
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['test/**/*.test.ts']
  }
});
