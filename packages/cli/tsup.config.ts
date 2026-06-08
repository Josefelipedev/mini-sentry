import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  platform: 'node',
  target: 'node18',
  clean: true,
  minify: false,
  banner: {
    js: '#!/usr/bin/env node',
  },
});
