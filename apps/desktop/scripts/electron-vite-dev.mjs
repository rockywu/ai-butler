import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

delete process.env.ELECTRON_RUN_AS_NODE;

const desktopRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const requireFromDesktop = createRequire(resolve(desktopRoot, 'package.json'));
const electronViteBin = resolve(
  dirname(requireFromDesktop.resolve('electron-vite/package.json')),
  'bin/electron-vite.js',
);

const child = spawn(process.execPath, [electronViteBin, 'dev'], {
  cwd: desktopRoot,
  env: {
    ...process.env,
    AI_BUTLER_RENDERER_URL:
      process.env.AI_BUTLER_RENDERER_URL || 'http://127.0.0.1:5666',
  },
  stdio: 'inherit',
});

const exitCode = await new Promise((resolve, reject) => {
  child.on('error', reject);
  child.on('exit', (code, signal) => {
    if (signal) {
      reject(new Error(`electron-vite terminated by ${signal}`));
      return;
    }
    resolve(code ?? 1);
  });
});

if (exitCode !== 0) {
  throw new Error(`electron-vite exited with ${exitCode}`);
}
