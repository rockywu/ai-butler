import { afterEach, describe, expect, it } from 'vitest';

import { createApp } from '../../app/create-app';
import { testConfig } from '../testing/test-config';
import { createAppShutdown } from './app-shutdown';
import { createReadinessGate } from './readiness';
import { ResourceRegistry } from './resource-registry';

describe('createAppShutdown', () => {
  let app: Awaited<ReturnType<typeof createApp>> | undefined;

  afterEach(async () => {
    if (app && !app.resources) {
      await app.close();
      return;
    }
    if (app) {
      await app.close().catch(() => undefined);
    }
  });

  it('marks not-ready before closing Fastify', async () => {
    const order: string[] = [];
    const readinessGate = createReadinessGate();
    const markNotReady = readinessGate.markNotReady.bind(readinessGate);
    readinessGate.markNotReady = () => {
      order.push('not-ready');
      markNotReady();
    };

    const resources = new ResourceRegistry();
    resources.register('fastify', async () => {
      order.push('close');
    });

    const shutdown = createAppShutdown({
      readinessGate,
      resources,
      timeoutMs: 200,
    });
    await shutdown();

    expect(order).toEqual(['not-ready', 'close']);
  });

  it('lets inject observe not-ready without a process-level e2e', async () => {
    const readinessGate = createReadinessGate();
    const resources = new ResourceRegistry();
    app = await createApp({
      config: testConfig(),
      logger: false,
      readinessGate,
      resources,
    });

    const before = await app.inject({ method: 'GET', url: '/readyz' });
    expect(before.statusCode).toBe(200);

    readinessGate.markNotReady();
    const after = await app.inject({ method: 'GET', url: '/readyz' });
    const live = await app.inject({ method: 'GET', url: '/livez' });

    expect(after.statusCode).toBe(503);
    expect(live.statusCode).toBe(200);
    expect(app.resources).toBe(resources);
  });
});
