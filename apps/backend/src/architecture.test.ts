import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

describe('backend architecture', () => {
  it('satisfies dependency-cruiser rules', async () => {
    const result = await execFileAsync(
      'pnpm',
      ['exec', 'depcruise', '--config', '.dependency-cruiser.cjs', 'src'],
      { cwd: new URL('../', import.meta.url) },
    );

    expect(result).toBeDefined();
  }, 15_000);
});
