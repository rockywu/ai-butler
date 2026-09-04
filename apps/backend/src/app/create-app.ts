import { createHttpServer } from '../framework/http/fastify';
import { registerModules } from './register-modules';

export interface CreateAppOptions {
  logger?: boolean;
}

export async function createApp(options: CreateAppOptions = {}) {
  const app = createHttpServer({ logger: options.logger ?? false });
  await registerModules(app);
  return app;
}
