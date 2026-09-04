import { afterEach, describe, expect, it } from 'vitest';

import { createApp } from '../../app/create-app';
import { testConfig } from '../testing/test-config';

describe('openAPI UI', () => {
  let app: Awaited<ReturnType<typeof createApp>> | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it('serves the UI and JSON document when enabled', async () => {
    app = await createApp({
      config: testConfig({ openapiUiEnabled: true }),
      logger: false,
    });

    const ui = await app.inject({ method: 'GET', url: '/documentation/' });
    const json = await app.inject({
      method: 'GET',
      url: '/documentation/json',
    });

    expect(ui.statusCode).toBe(200);
    expect(String(ui.headers['content-type'])).toMatch(/html/);
    expect(json.statusCode).toBe(200);
    expect(json.json().paths?.['/poc/ping']?.get).toBeDefined();
  });

  it('keeps JSON and hides the UI when disabled for production', async () => {
    app = await createApp({
      config: testConfig({
        appEnv: 'production',
        openapiUiEnabled: false,
      }),
      logger: false,
    });

    const ui = await app.inject({ method: 'GET', url: '/documentation/' });
    const json = await app.inject({
      method: 'GET',
      url: '/documentation/json',
    });

    expect(ui.statusCode).toBe(404);
    expect(json.statusCode).toBe(200);
    expect(json.json().info?.title).toBe('AI Butler Backend');
    expect(json.json().paths?.['/poc/echo']?.post).toBeDefined();
  });
});
