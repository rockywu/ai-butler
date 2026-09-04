import { afterEach, describe, expect, it } from 'vitest';

import { createApp } from '../../app/create-app';

describe('error handler', () => {
  let app: Awaited<ReturnType<typeof createApp>> | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it.each([
    ['/poc/errors/business', 409, 2001, 'Probe conflict'],
    ['/poc/errors/system', 500, 5000, 'Internal server error'],
  ] as const)(
    'maps %s to a safe envelope',
    async (url, status, code, message) => {
      app = await createApp({ logger: false });
      const response = await app.inject({ method: 'GET', url });

      expect(response.statusCode).toBe(status);
      expect(response.json()).toEqual({ code, data: null, message });
      expect(response.body).not.toContain('database-password');
    },
  );

  it('maps Fastify validation failures to code 1000', async () => {
    app = await createApp({ logger: false });
    const response = await app.inject({
      method: 'POST',
      payload: { value: 42 },
      url: '/poc/echo',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      code: 1000,
      data: null,
      message: 'Request validation failed',
    });
  });
});
