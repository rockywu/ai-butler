import { afterEach, describe, expect, it } from 'vitest';

import { createApp } from '../../app/create-app';
import { createReadinessGate } from '../core/readiness';
import { testConfig } from '../testing/test-config';

describe('health checks', () => {
  let app: Awaited<ReturnType<typeof createApp>> | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it('keeps liveness independent of injected checkers', async () => {
    app = await createApp({
      checkers: [
        {
          async check() {
            throw new Error('database is down');
          },
          name: 'database',
        },
      ],
      config: testConfig(),
      logger: false,
    });

    const live = await app.inject({ method: 'GET', url: '/livez' });
    const ready = await app.inject({ method: 'GET', url: '/readyz' });

    expect(live.statusCode).toBe(200);
    expect(live.json()).toEqual({
      code: 0,
      data: { status: 'live' },
      message: 'success',
    });
    expect(ready.statusCode).toBe(503);
    expect(ready.json()).toEqual({
      code: 5030,
      data: null,
      message: 'not ready',
    });
  });

  it('fails readiness immediately after shutdown starts', async () => {
    const readinessGate = createReadinessGate();
    app = await createApp({
      config: testConfig(),
      logger: false,
      readinessGate,
    });

    const before = await app.inject({ method: 'GET', url: '/readyz' });
    expect(before.statusCode).toBe(200);
    expect(before.json()).toEqual({
      code: 0,
      data: { status: 'ready' },
      message: 'success',
    });

    readinessGate.markNotReady();

    const after = await app.inject({ method: 'GET', url: '/readyz' });
    const live = await app.inject({ method: 'GET', url: '/livez' });
    expect(after.statusCode).toBe(503);
    expect(live.statusCode).toBe(200);
  });

  it('does not leak connection strings from a failing checker', async () => {
    app = await createApp({
      checkers: [
        {
          async check() {
            throw new Error(
              'connect failed postgresql://user:secret@localhost:5432/app DATABASE_URL=postgresql://user:secret@localhost:5432/app',
            );
          },
          name: 'database',
        },
      ],
      config: testConfig(),
      logger: false,
    });

    const response = await app.inject({ method: 'GET', url: '/readyz' });

    expect(response.statusCode).toBe(503);
    expect(response.body).not.toContain('postgresql://');
    expect(response.body).not.toContain('secret');
    expect(response.body).not.toContain('DATABASE_URL=');
    expect(response.json()).toEqual({
      code: 5030,
      data: null,
      message: 'not ready',
    });
  });
});
