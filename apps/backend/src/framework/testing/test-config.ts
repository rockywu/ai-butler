import type { AppConfig } from '../config/schema';

export function testConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return Object.freeze({
    appEnv: 'test',
    host: '127.0.0.1',
    logLevel: 'fatal',
    openapiUiEnabled: true,
    port: 0,
    ...overrides,
  });
}
