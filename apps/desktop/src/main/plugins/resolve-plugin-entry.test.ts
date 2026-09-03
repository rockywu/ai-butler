import { describe, expect, it } from 'vitest';

import { resolvePluginEntry } from './resolve-plugin-entry';

describe('resolvePluginEntry', () => {
  it('resolves the plugin next to main in development and production', () => {
    expect(resolvePluginEntry({ currentDirectory: '/app/out/main' })).toBe(
      '/app/out/plugins/browser/index.js',
    );
  });
});
