import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const desktopRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const requireFromDesktop = createRequire(resolve(desktopRoot, 'package.json'));
const requireFromElectronVite = createRequire(
  requireFromDesktop.resolve('electron-vite/package.json'),
);
const esbuild = requireFromElectronVite('esbuild');

const platformApiEntry = resolve(
  desktopRoot,
  '../../packages/platform-api/src/index.ts',
);

await esbuild.build({
  absWorkingDir: desktopRoot,
  alias: {
    '@ai-butler/platform-api': platformApiEntry,
  },
  bundle: true,
  entryPoints: [resolve(desktopRoot, 'src/preload/index.ts')],
  external: ['electron'],
  format: 'cjs',
  outfile: resolve(desktopRoot, 'out/preload/index.cjs'),
  platform: 'node',
  target: 'node20',
});

 
console.log('sandbox preload cjs emitted: out/preload/index.cjs');
