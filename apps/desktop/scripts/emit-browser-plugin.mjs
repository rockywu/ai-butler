import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const desktopRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pluginsConfig = JSON.parse(
  await readFile(resolve(desktopRoot, 'plugins.json'), 'utf8'),
);

if (pluginsConfig.plugins.includes('browser')) {
  const requireFromDesktop = createRequire(
    resolve(desktopRoot, 'package.json'),
  );
  const requireFromElectronVite = createRequire(
    requireFromDesktop.resolve('electron-vite/package.json'),
  );
  const esbuild = requireFromElectronVite('esbuild');

  const protocolEntry = resolve(
    desktopRoot,
    '../desktop-plugins/protocol/src/index.ts',
  );
  const outDir = resolve(desktopRoot, 'out/plugins/browser');

  await mkdir(outDir, { recursive: true });
  await esbuild.build({
    absWorkingDir: desktopRoot,
    alias: {
      '@ai-butler/desktop-plugin-protocol': protocolEntry,
    },
    bundle: true,
    entryPoints: [
      resolve(desktopRoot, '../desktop-plugins/browser/src/process-main.ts'),
    ],
    external: ['electron', 'playwright', 'playwright-core'],
    format: 'esm',
    outfile: resolve(outDir, 'index.js'),
    platform: 'node',
    target: 'node20',
  });
  await writeFile(
    resolve(outDir, 'package.json'),
    `${JSON.stringify({ type: 'module' }, null, 2)}\n`,
  );

  console.warn('browser plugin emitted: out/plugins/browser/index.js');
} else {
  console.warn('browser plugin disabled in plugins.json, skip emit');
}
