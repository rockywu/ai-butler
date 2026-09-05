import type { Logger } from 'pino';
import type { Sql } from 'postgres';

import type { AppConfig } from '../framework/config/schema';
import type { ReadinessGate } from '../framework/core/readiness';
import type { HealthChecker } from '../framework/http/health.plugin';
import type { Database } from '../infrastructure/database/client';
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
import {
  createDatabase,
  createSqlClient,
} from '../infrastructure/database/client';
import { createDependencies } from './dependencies';
import { registerModules } from './register-modules';

export interface CreateAppOptions {
  checkers?: HealthChecker[];
  config?: AppConfig;
  dependencies?: Partial<AppDependencies>;
  logger?: boolean | Logger;
  readinessGate?: ReadinessGate;
  resources?: ResourceRegistry;
  skipDatabase?: boolean;
}

function httpOptions(logger: CreateAppOptions['logger']) {
  if (logger && typeof logger === 'object') {
    return { loggerInstance: logger };
  }
  return { logger: logger ?? false };
}

function createDatabaseChecker(client: Sql): HealthChecker {
  return {
    async check() {
      await client`select 1`;
    },
    name: 'postgres',
  };
}

async function connectDatabase(
  databaseUrl: string,
  resources: ResourceRegistry,
): Promise<{ checkers: HealthChecker[]; database: Database }> {
  const client = createSqlClient(databaseUrl);
  await client`select 1`;
  resources.register('postgres', () => client.end({ timeout: 5 }));
  return {
    checkers: [createDatabaseChecker(client)],
    database: createDatabase(client),
  };
}

export async function createApp(options: CreateAppOptions = {}) {
  const config = options.config ?? testConfig();
  const readinessGate = options.readinessGate ?? createReadinessGate();
  const resources = options.resources ?? new ResourceRegistry();
  const checkers = [...(options.checkers ?? [])];
  const app = createHttpServer(httpOptions(options.logger));
  let database: Database | undefined;

  if (!options.skipDatabase && config.databaseUrl) {
    const connected = await connectDatabase(config.databaseUrl, resources);
    database = connected.database;
    checkers.unshift(...connected.checkers);
  }

  app.decorate('config', config);
  app.decorate('readinessGate', readinessGate);
  app.decorate('resources', resources);

  await app.register(errorHandlerPlugin);
  await app.register(requestContextPlugin);
  await app.register(openApiPlugin);
  await registerModules(
    app,
    createDependencies(options.dependencies, { database }),
  );
  await app.register(healthPlugin, { checkers, readinessGate });
  await app.register(openApiUiPlugin, { enabled: config.openapiUiEnabled });

  resources.register('fastify', () => app.close());
  return app;
}
