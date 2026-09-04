import { defineConfig } from 'tsdown';

export default defineConfig({
  clean: true,
  dts: false,
  entry: ['src/main.ts'],
  fixedExtension: false,
  format: ['esm'],
  platform: 'node',
  sourcemap: true,
});
