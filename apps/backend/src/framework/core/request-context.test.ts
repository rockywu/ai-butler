import { afterEach, describe, expect, it } from 'vitest';

import { createApp } from '../../app/create-app';
import { getRequestContext } from './request-context';

describe('request context', () => {
  let app: Awaited<ReturnType<typeof createApp>> | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it('keeps request ids isolated across concurrent async work', async () => {
    app = await createApp({ logger: false });

    const [first, second] = await Promise.all([
      app.inject({
        headers: { 'x-request-id': 'request-a' },
        method: 'GET',
        url: '/poc/context',
      }),
      app.inject({
        headers: { 'x-request-id': 'request-b' },
        method: 'GET',
        url: '/poc/context',
      }),
    ]);

    expect(first.json().data.requestId).toBe('request-a');
    expect(second.json().data.requestId).toBe('request-b');
    expect(first.headers['x-request-id']).toBe('request-a');
    expect(second.headers['x-request-id']).toBe('request-b');
  });

  it('throws when accessed outside a request', () => {
    expect(() => getRequestContext()).toThrow('Request context is unavailable');
  });
});
