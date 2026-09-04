import { describe, expect, it } from 'vitest';

import { createShutdown } from './shutdown';

describe('createShutdown', () => {
  it('returns one promise and rejects when closing times out', async () => {
    let releaseClose: (() => void) | undefined;
    const closePromise = new Promise<void>((resolve) => {
      releaseClose = resolve;
    });
    const shutdown = createShutdown({
      close: () => closePromise,
      timeoutMs: 25,
    });

    const first = shutdown();
    const second = shutdown();

    expect(first).toBe(second);
    await expect(first).rejects.toThrow('Shutdown timed out after 25ms');
    releaseClose?.();
  });
});
