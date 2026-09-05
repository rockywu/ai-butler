import process from 'node:process';

import { loadConfig } from '../framework/config/load-config';
import { createAppShutdown } from '../framework/core/app-shutdown';
import { createReadinessGate } from '../framework/core/readiness';
import { ResourceRegistry } from '../framework/core/resource-registry';
import { createLogger } from '../framework/observability/logger';
import { createApp } from './create-app';

export async function bootstrap(env: NodeJS.ProcessEnv = process.env) {
  const config = loadConfig(env);
  const logger = createLogger(config);
  const readinessGate = createReadinessGate();
  const resources = new ResourceRegistry();
  const app = await createApp({
    config,
    logger,
    readinessGate,
    resources,
  });
  await app.ready();
  return { app, config, logger, readinessGate, resources };
}

export async function start(env: NodeJS.ProcessEnv = process.env) {
  const runtime = await bootstrap(env);
  const shutdown = createAppShutdown({
    readinessGate: runtime.readinessGate,
    resources: runtime.resources,
  });

  async function handleSignal(signal: NodeJS.Signals): Promise<void> {
    runtime.logger.info({ signal }, 'shutdown started');
    try {
      await shutdown();
      process.exitCode = 0;
    } catch (error) {
      runtime.logger.error({ err: error, signal }, 'shutdown failed');
      process.exitCode = 1;
    }
  }

  process.once('SIGINT', () => void handleSignal('SIGINT'));
  process.once('SIGTERM', () => void handleSignal('SIGTERM'));

  await runtime.app.listen({
    host: runtime.config.host,
    port: runtime.config.port,
  });

  return runtime;
}
