import { describe, expect, it } from 'vitest';

import { calcVideoCost } from './video-cost';

describe('calcVideoCost', () => {
  it('returns 10 for Seedance 5s 720P', () => {
    expect(
      calcVideoCost({
        engine: 'Seedance',
        duration: '5s',
        quality: '720P',
      }),
    ).toBe(10);
  });

  it('adds grok veo duration and quality', () => {
    expect(
      calcVideoCost({
        engine: 'Grok',
        duration: '10s',
        quality: '1080P',
      }),
    ).toBe(25);
    expect(
      calcVideoCost({
        engine: 'VEO',
        duration: '5s',
        quality: '720P',
      }),
    ).toBe(18);
  });
});
