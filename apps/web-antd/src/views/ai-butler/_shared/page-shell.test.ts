import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, '../../..');

function read(relativeFromHere: string) {
  return readFileSync(join(here, relativeFromHere), 'utf8');
}

describe('pageShell', () => {
  it('uses the unified layout shell with page-content p-4', () => {
    const shell = read('page-shell.vue');
    expect(shell).toContain('class="relative flex h-full min-h-0 flex-col"');
    expect(shell).toContain('data-layout-region="page-content"');
    expect(shell).toContain('class="flex-1 p-4"');
  });

  it('does not pad the route transition container', () => {
    const bootstrap = readFileSync(join(srcDir, 'bootstrap.ts'), 'utf8');
    expect(bootstrap).not.toMatch(/page-padding\.css/);
  });
});
