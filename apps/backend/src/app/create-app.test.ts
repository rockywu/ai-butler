import { afterEach, describe, expect, it } from 'vitest';

import { createApp } from './create-app';

describe('createApp', () => {
  let app: Awaited<ReturnType<typeof createApp>> | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it('registers a probe module through a Fastify plugin', async () => {
    app = await createApp({ logger: false });

    const response = await app.inject({ method: 'GET', url: '/poc/ping' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      code: 0,
      data: { pong: true },
      message: 'success',
    });
  });
});
