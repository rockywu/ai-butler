import { createHttpServer } from '../framework/http/fastify';
import openApiPlugin from '../framework/http/openapi.plugin';
import { registerModules } from './register-modules';

export interface CreateAppOptions {
  logger?: boolean;
}

export async function createApp(options: CreateAppOptions = {}) {
  const app = createHttpServer({ logger: options.logger ?? false });
  await app.register(openApiPlugin);
  await registerModules(app);
  return app;
}
