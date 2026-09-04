import { afterEach, describe, expect, it } from 'vitest';

import { createApp } from '../../app/create-app';

describe('typeBox and OpenAPI', () => {
  let app: Awaited<ReturnType<typeof createApp>> | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it('uses one TypeBox schema for validation, serialization and OpenAPI', async () => {
    app = await createApp({ logger: false });

    const valid = await app.inject({
      method: 'POST',
      payload: { value: 'hello' },
      url: '/poc/echo',
    });
    const invalid = await app.inject({
      method: 'POST',
      payload: { value: 42 },
      url: '/poc/echo',
    });

    await app.ready();
    const document = app.swagger();

    expect(valid.json()).toEqual({
      code: 0,
      data: { value: 'hello' },
      message: 'success',
    });
    expect(invalid.statusCode).toBe(400);
    expect(document.paths?.['/poc/echo']?.post).toBeDefined();
  });
});
