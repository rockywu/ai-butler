import { afterEach, describe, expect, it, vi } from 'vitest';

import { ConfigError } from '../framework/config/config-error';
import { bootstrap, start } from './start';

describe('bootstrap and start', () => {
  let runtime: Awaited<ReturnType<typeof bootstrap>> | undefined;

  afterEach(async () => {
    await runtime?.app.close();
    runtime = undefined;
  });

  it('does not construct the server when configuration is invalid', async () => {
    const listen = vi.fn();

    await expect(
      bootstrap({
        APP_ENV: 'staging',
        HOST: '127.0.0.1',
        LOG_LEVEL: 'info',
        PORT: '3000',
      }),
    ).rejects.toBeInstanceOf(ConfigError);

    await expect(
      start({
        APP_ENV: 'staging',
        HOST: '127.0.0.1',
        LOG_LEVEL: 'info',
        PORT: '3000',
      }),
    ).rejects.toBeInstanceOf(ConfigError);

    expect(listen).not.toHaveBeenCalled();
  });

  it('becomes ready without listening and exposes probe plus health routes', async () => {
    runtime = await bootstrap({
      APP_ENV: 'test',
      HOST: '127.0.0.1',
      LOG_LEVEL: 'fatal',
      PORT: '0',
    });

    expect(runtime.app.server.listening).toBe(false);

    const ping = await runtime.app.inject({ method: 'GET', url: '/poc/ping' });
    const live = await runtime.app.inject({ method: 'GET', url: '/livez' });
    const docs = await runtime.app.inject({
      method: 'GET',
      url: '/documentation/json',
    });

    expect(ping.statusCode).toBe(200);
    expect(live.statusCode).toBe(200);
    expect(docs.statusCode).toBe(200);
    expect(runtime.app.config.appEnv).toBe('test');
    expect(runtime.logger.level).toBe('fatal');
    expect(runtime.app.readinessGate).toBe(runtime.readinessGate);
    expect(runtime.app.resources).toBe(runtime.resources);
  });
});
