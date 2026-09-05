import process from 'node:process';

import { createApp } from './app/create-app';
import { loadConfig } from './framework/config/load-config';
import { createAppShutdown } from './framework/core/app-shutdown';
import { createReadinessGate } from './framework/core/readiness';
import { ResourceRegistry } from './framework/core/resource-registry';
import { createLogger } from './framework/observability/logger';

const config = loadConfig(process.env);
const logger = createLogger(config);
const readinessGate = createReadinessGate();
const resources = new ResourceRegistry();
const app = await createApp({
  config,
  logger,
  readinessGate,
  resources,
});

const shutdown = createAppShutdown({
  readinessGate,
  resources,
});

async function handleSignal(signal: NodeJS.Signals): Promise<void> {
  app.log.info({ signal }, 'shutdown started');
  try {
    await shutdown();
    process.exitCode = 0;
  } catch (error) {
    app.log.error({ err: error, signal }, 'shutdown failed');
    process.exitCode = 1;
  }
}

process.once('SIGINT', () => void handleSignal('SIGINT'));
process.once('SIGTERM', () => void handleSignal('SIGTERM'));

await app.listen({
  host: config.host,
  port: config.port,
});
