import { afterEach, describe, expect, it, vi } from 'vitest';

import { testConfig } from '../framework/testing/test-config';
import { createTestApp } from './create-test-app';

describe('createTestApp', () => {
  let app: Awaited<ReturnType<typeof createTestApp>> | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it('defaults to a disabled logger and supports inject without TCP', async () => {
    const read = vi.fn().mockReturnValue({ pong: true, source: 'factory' });
    app = await createTestApp({
      dependencies: { probeService: { read } },
    });

    const response = await app.inject({ method: 'GET', url: '/poc/ping' });

    expect(app.server.listening).toBe(false);
    expect(read).toHaveBeenCalledOnce();
    expect(response.json().data).toEqual({ pong: true, source: 'factory' });
  });

  it('overrides config and readiness checkers', async () => {
    app = await createTestApp({
      checkers: [
        {
          async check() {
            throw new Error('cache unavailable');
          },
          name: 'cache',
        },
      ],
      config: testConfig({ openapiUiEnabled: false }),
    });

    const ready = await app.inject({ method: 'GET', url: '/readyz' });
    const json = await app.inject({
      method: 'GET',
      url: '/documentation/json',
    });
    const ui = await app.inject({ method: 'GET', url: '/documentation/' });

    expect(ready.statusCode).toBe(503);
    expect(json.statusCode).toBe(200);
    expect(ui.statusCode).toBe(404);
    expect(app.config.openapiUiEnabled).toBe(false);
  });
});
