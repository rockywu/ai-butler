import { describe, expect, it } from 'vitest';

import { shouldCopyProfileEntry } from './copy-profile';

describe('shouldCopyProfileEntry', () => {
  it('skips singleton locks and GPU caches', () => {
    expect(shouldCopyProfileEntry('/tmp/Chrome/SingletonLock')).toBe(false);
    expect(shouldCopyProfileEntry('/tmp/Chrome/ShaderCache')).toBe(false);
    expect(shouldCopyProfileEntry('/tmp/Chrome/Default/Cookies')).toBe(true);
  });
});
