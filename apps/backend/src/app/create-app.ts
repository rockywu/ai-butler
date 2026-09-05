import type { Logger } from 'pino';

import type { AppConfig } from '../framework/config/schema';
import type { ReadinessGate } from '../framework/core/readiness';
import type { HealthChecker } from '../framework/http/health.plugin';
import type { AppDependencies } from './dependencies';

import { createReadinessGate } from '../framework/core/readiness';
import requestContextPlugin from '../framework/core/request-context.plugin';
import { ResourceRegistry } from '../framework/core/resource-registry';
import errorHandlerPlugin from '../framework/http/error-handler.plugin';
import { createHttpServer } from '../framework/http/fastify';
import healthPlugin from '../framework/http/health.plugin';
import openApiUiPlugin from '../framework/http/openapi-ui.plugin';
import openApiPlugin from '../framework/http/openapi.plugin';
import { testConfig } from '../framework/testing/test-config';
import { createDependencies } from './dependencies';
import { registerModules } from './register-modules';

export interface CreateAppOptions {
  checkers?: HealthChecker[];
  config?: AppConfig;
  dependencies?: Partial<AppDependencies>;
  logger?: boolean | Logger;
  readinessGate?: ReadinessGate;
  resources?: ResourceRegistry;
}

function httpOptions(logger: CreateAppOptions['logger']) {
  if (logger && typeof logger === 'object') {
    return { loggerInstance: logger };
  }
  return { logger: logger ?? false };
}

export async function createApp(options: CreateAppOptions = {}) {
  const config = options.config ?? testConfig();
  const readinessGate = options.readinessGate ?? createReadinessGate();
  const resources = options.resources ?? new ResourceRegistry();
  const checkers = options.checkers ?? [];
  const app = createHttpServer(httpOptions(options.logger));

  app.decorate('config', config);
  app.decorate('readinessGate', readinessGate);
  app.decorate('resources', resources);

  await app.register(errorHandlerPlugin);
  await app.register(requestContextPlugin);
  await app.register(openApiPlugin);
  await registerModules(app, createDependencies(options.dependencies));
  await app.register(healthPlugin, { checkers, readinessGate });
  await app.register(openApiUiPlugin, { enabled: config.openapiUiEnabled });
  return app;
}
