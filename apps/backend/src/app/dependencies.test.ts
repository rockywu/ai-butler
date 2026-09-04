import { afterEach, describe, expect, it, vi } from 'vitest';

import { createApp } from './create-app';
import { createDependencies } from './dependencies';

describe('explicit dependencies', () => {
  let app: Awaited<ReturnType<typeof createApp>> | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it('creates one service instance per dependency graph', () => {
    const first = createDependencies();
    const second = createDependencies();

    expect(first.probeService).toBe(first.probeService);
    expect(first.probeService).not.toBe(second.probeService);
  });

  it('replaces a dependency without a global container or TCP server', async () => {
    const read = vi.fn().mockReturnValue({ pong: true, source: 'fake' });
    app = await createApp({
      dependencies: { probeService: { read } },
      logger: false,
    });

    const response = await app.inject({ method: 'GET', url: '/poc/ping' });

    expect(read).toHaveBeenCalledOnce();
    expect(response.json().data).toEqual({ pong: true, source: 'fake' });
  });
});
