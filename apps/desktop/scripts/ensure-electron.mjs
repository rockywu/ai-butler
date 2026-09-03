import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const desktopRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const requireFromDesktop = createRequire(resolve(desktopRoot, 'package.json'));
const electronDir = dirname(requireFromDesktop.resolve('electron'));
const pathFile = join(electronDir, 'path.txt');

function isElectronInstalled() {
  if (!existsSync(pathFile)) return false;
  const executablePath = readFileSync(pathFile, 'utf8').trim();
  if (!executablePath) return false;
  return existsSync(join(electronDir, 'dist', executablePath));
}

const ELECTRON_MIRROR =
  process.env.ELECTRON_MIRROR ||
  process.env.npm_config_electron_mirror ||
  'https://cdn.npmmirror.com/binaries/electron/';

if (!isElectronInstalled()) {
  console.warn('Electron binary missing; downloading via electron/install.js');
  const result = spawnSync(
    process.execPath,
    [join(electronDir, 'install.js')],
    {
      cwd: electronDir,
      env: {
        ...process.env,
        ELECTRON_MIRROR,
        npm_config_electron_mirror: ELECTRON_MIRROR,
      },
      stdio: 'inherit',
    },
  );
  if (result.status !== 0) {
    throw new Error(
      'Failed to download the Electron binary. Check network access or electron_mirror in .npmrc.',
    );
  }
  if (!isElectronInstalled()) {
    throw new Error(
      'Electron install finished but path.txt or dist is still missing',
    );
  }
}
