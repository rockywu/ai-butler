import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const srcRoot = fileURLToPath(new URL('../../', import.meta.url));

const allowed = new Set([
  path.join(srcRoot, 'app/start.ts'),
  path.join(srcRoot, 'framework/config/load-config.ts'),
  path.join(srcRoot, 'main.ts'),
]);

async function collectTsFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return collectTsFiles(fullPath);
      }
      return fullPath.endsWith('.ts') && !fullPath.endsWith('.test.ts')
        ? [fullPath]
        : [];
    }),
  );
  return files.flat();
}

describe('process.env boundary', () => {
  it('keeps process.env out of business and framework runtime code', async () => {
    const allFiles = await collectTsFiles(srcRoot);
    const files = allFiles.filter((file) => !allowed.has(file));
    const offenders: string[] = [];

    for (const file of files) {
      const source = await readFile(file, 'utf8');
      if (source.includes('process.env')) {
        offenders.push(path.relative(srcRoot, file));
      }
    }

    expect(offenders).toEqual([]);
  });
});
