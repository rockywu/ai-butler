import type { AppConfig, AppEnv, LogLevel } from './schema';

import process from 'node:process';

import { Value } from 'typebox/value';

import { ConfigError } from './config-error';
import { AppConfigSchema } from './schema';

const REQUIRED_KEYS = ['APP_ENV', 'HOST', 'PORT', 'LOG_LEVEL'] as const;
const APP_ENVS = new Set<AppEnv>(['development', 'production', 'test']);
const LOG_LEVELS = new Set<LogLevel>([
  'debug',
  'error',
  'fatal',
  'info',
  'silent',
  'trace',
  'warn',
]);

function readRequired(
  env: NodeJS.ProcessEnv,
  key: (typeof REQUIRED_KEYS)[number],
): string | undefined {
  const value = env[key];
  return value === undefined || value === '' ? undefined : value;
}

function requireValue(
  env: NodeJS.ProcessEnv,
  key: (typeof REQUIRED_KEYS)[number],
): string {
  const value = readRequired(env, key);
  if (value === undefined) {
    throw new ConfigError([key], `Missing required configuration: ${key}`);
  }
  return value;
}

function parseOpenApiUi(env: NodeJS.ProcessEnv, appEnv: AppEnv): boolean {
  const raw = env.OPENAPI_UI;
  if (raw === undefined || raw === '') {
    return appEnv !== 'production';
  }
  if (raw === 'true') {
    return true;
  }
  if (raw === 'false') {
    return false;
  }
  throw new ConfigError(['OPENAPI_UI'], 'Invalid configuration: OPENAPI_UI');
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const missing = REQUIRED_KEYS.filter(
    (key) => readRequired(env, key) === undefined,
  );
  if (missing.length > 0) {
    throw new ConfigError(
      [...missing],
      `Missing required configuration: ${missing.join(', ')}`,
    );
  }

  const appEnvRaw = requireValue(env, 'APP_ENV');
  if (!APP_ENVS.has(appEnvRaw as AppEnv)) {
    throw new ConfigError(['APP_ENV'], 'Invalid configuration: APP_ENV');
  }

  const logLevelRaw = requireValue(env, 'LOG_LEVEL');
  if (!LOG_LEVELS.has(logLevelRaw as LogLevel)) {
    throw new ConfigError(['LOG_LEVEL'], 'Invalid configuration: LOG_LEVEL');
  }

  const port = Number.parseInt(requireValue(env, 'PORT'), 10);
  if (!Number.isInteger(port) || port < 0 || port > 65_535) {
    throw new ConfigError(['PORT'], 'Invalid configuration: PORT');
  }

  const host = requireValue(env, 'HOST');
  const databaseUrl = env.DATABASE_URL;
  const candidate = {
    appEnv: appEnvRaw as AppEnv,
    host,
    logLevel: logLevelRaw as LogLevel,
    openapiUiEnabled: parseOpenApiUi(env, appEnvRaw as AppEnv),
    port,
    ...(databaseUrl === undefined || databaseUrl === '' ? {} : { databaseUrl }),
  };

  if (!Value.Check(AppConfigSchema, candidate)) {
    throw new ConfigError(['config'], 'Invalid configuration: config');
  }

  return Object.freeze(candidate);
}
