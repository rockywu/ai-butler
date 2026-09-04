import type { AppDependencies } from './dependencies';

import requestContextPlugin from '../framework/core/request-context.plugin';
import errorHandlerPlugin from '../framework/http/error-handler.plugin';
import { createHttpServer } from '../framework/http/fastify';
import openApiPlugin from '../framework/http/openapi.plugin';
import { createDependencies } from './dependencies';
import { registerModules } from './register-modules';

export interface CreateAppOptions {
  dependencies?: Partial<AppDependencies>;
  logger?: boolean;
}

export async function createApp(options: CreateAppOptions = {}) {
  const app = createHttpServer({ logger: options.logger ?? false });
  await app.register(errorHandlerPlugin);
  await app.register(openApiPlugin);
  await app.register(requestContextPlugin);
  await registerModules(app, createDependencies(options.dependencies));
  return app;
}
