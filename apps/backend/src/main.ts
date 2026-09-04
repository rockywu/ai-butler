import process from 'node:process';

import { createApp } from './app/create-app';
import { ResourceRegistry } from './framework/core/resource-registry';
import { createShutdown } from './framework/core/shutdown';

const app = await createApp({ logger: true });
const resources = new ResourceRegistry();
resources.register('fastify', () => app.close());

const shutdown = createShutdown({
  close: () => resources.closeAll(),
  timeoutMs: 10_000,
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
  host: '0.0.0.0',
  port: Number.parseInt(process.env.PORT ?? '3000', 10),
});
