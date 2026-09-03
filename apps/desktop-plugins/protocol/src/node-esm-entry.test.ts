import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { describe, expect, it } from 'vitest';

describe('protocol node esm entry', () => {
  it('loads PluginClient through node native typescript', () => {
    const entry = pathToFileURL(
      join(process.cwd(), 'apps/desktop-plugins/protocol/src/index.ts'),
    ).href;
    const output = execFileSync(
      process.execPath,
      [
        '--input-type=module',
        `--eval=import(${JSON.stringify(entry)}).then((mod) => {
  if (typeof mod.PluginClient !== 'function') {
    process.exit(2);
  }
  process.stdout.write('ok');
})`,
      ],
      { encoding: 'utf8' },
    );
    expect(output).toContain('ok');
  });
});
