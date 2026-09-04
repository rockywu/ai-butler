import type { Logger } from 'pino';

import type { AppConfig } from '../framework/config/schema';
import type { AppDependencies } from './dependencies';

import requestContextPlugin from '../framework/core/request-context.plugin';
import errorHandlerPlugin from '../framework/http/error-handler.plugin';
import { createHttpServer } from '../framework/http/fastify';
import openApiUiPlugin from '../framework/http/openapi-ui.plugin';
import openApiPlugin from '../framework/http/openapi.plugin';
import { testConfig } from '../framework/testing/test-config';
import { createDependencies } from './dependencies';
import { registerModules } from './register-modules';

export interface CreateAppOptions {
  config?: AppConfig;
  dependencies?: Partial<AppDependencies>;
  logger?: boolean | Logger;
}

function httpOptions(logger: CreateAppOptions['logger']) {
  if (logger && typeof logger === 'object') {
    return { loggerInstance: logger };
  }
  return { logger: logger ?? false };
}

export async function createApp(options: CreateAppOptions = {}) {
  const config = options.config ?? testConfig();
  const app = createHttpServer(httpOptions(options.logger));
  app.decorate('config', config);

  await app.register(errorHandlerPlugin);
  await app.register(requestContextPlugin);
  await app.register(openApiPlugin);
  await registerModules(app, createDependencies(options.dependencies));
  await app.register(openApiUiPlugin, { enabled: config.openapiUiEnabled });
  return app;
}
