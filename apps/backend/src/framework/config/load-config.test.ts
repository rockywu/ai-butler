import { describe, expect, it } from 'vitest';

import { ConfigError } from './config-error';
import { loadConfig } from './load-config';

const validEnv = {
  APP_ENV: 'test',
  HOST: '127.0.0.1',
  LOG_LEVEL: 'info',
  PORT: '3000',
};

function captureConfigError(env: NodeJS.ProcessEnv): ConfigError {
  try {
    loadConfig(env);
    throw new Error('Expected ConfigError');
  } catch (error) {
    if (error instanceof ConfigError) {
      return error;
    }
    throw error;
  }
}

describe('loadConfig', () => {
  it('returns a frozen AppConfig from environment variables', () => {
    const config = loadConfig({
      ...validEnv,
      OPENAPI_UI: 'true',
    });

    expect(config).toEqual({
      appEnv: 'test',
      host: '127.0.0.1',
      logLevel: 'info',
      openapiUiEnabled: true,
      port: 3000,
    });
    expect(Object.isFrozen(config)).toBe(true);
    expect(() => {
      (config as { port: number }).port = 1;
    }).toThrow(TypeError);
  });

  it('maps DATABASE_URL without echoing the raw value on invalid input', () => {
    const config = loadConfig({
      ...validEnv,
      DATABASE_URL: 'postgres://postgres:postgres@127.0.0.1:5432/postgres',
    });

    expect(config.databaseUrl).toBe(
      'postgres://postgres:postgres@127.0.0.1:5432/postgres',
    );
  });

  it('treats an empty DATABASE_URL as absent', () => {
    const config = loadConfig({
      ...validEnv,
      DATABASE_URL: '',
    });

    expect(config.databaseUrl).toBeUndefined();
  });

  it('disables OpenAPI UI by default in production', () => {
    const config = loadConfig({
      ...validEnv,
      APP_ENV: 'production',
    });

    expect(config.openapiUiEnabled).toBe(false);
  });

  it('lists missing keys without echoing raw values', () => {
    expect(() => loadConfig({})).toThrow(ConfigError);

    const error = captureConfigError({});

    expect(error.keys).toEqual(['APP_ENV', 'HOST', 'PORT', 'LOG_LEVEL']);
    expect(error.message).toContain('APP_ENV');
    expect(error.message).toContain('HOST');
    expect(error.message).toContain('PORT');
    expect(error.message).toContain('LOG_LEVEL');
  });

  it('mentions PORT but never the invalid secret-like value', () => {
    const secret = 'super-secret-password-value';

    expect(() =>
      loadConfig({
        ...validEnv,
        PORT: secret,
      }),
    ).toThrow(ConfigError);

    const error = captureConfigError({ ...validEnv, PORT: secret });

    expect(error.keys).toEqual(['PORT']);
    expect(error.message).toContain('PORT');
    expect(error.message).not.toContain(secret);
  });
});
