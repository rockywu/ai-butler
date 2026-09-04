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

  it('keeps request context after a handler throws', async () => {
    app = await createApp({ logger: false });

    const seen: string[] = [];
    app.addHook('onError', (_request, _reply, _error, done) => {
      seen.push(getRequestContext().requestId);
      done();
    });

    const response = await app.inject({
      headers: { 'x-request-id': 'request-error' },
      method: 'GET',
      url: '/poc/errors/business',
    });

    expect(response.statusCode).toBe(409);
    expect(seen).toEqual(['request-error']);
  });
});
