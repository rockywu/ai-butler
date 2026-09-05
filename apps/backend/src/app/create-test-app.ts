import type { Logger } from 'pino';

import type { AppConfig } from '../framework/config/schema';
import type { ReadinessGate } from '../framework/core/readiness';
import type { ResourceRegistry } from '../framework/core/resource-registry';
import type { HealthChecker } from '../framework/http/health.plugin';
import type { CreateAppOptions } from './create-app';
import type { AppDependencies } from './dependencies';

import { testConfig } from '../framework/testing/test-config';
import { createApp } from './create-app';

export interface CreateTestAppOptions {
  checkers?: HealthChecker[];
  config?: AppConfig;
  dependencies?: Partial<AppDependencies>;
  logger?: boolean | Logger;
  readinessGate?: ReadinessGate;
  resources?: ResourceRegistry;
}

export async function createTestApp(options: CreateTestAppOptions = {}) {
  const createOptions: CreateAppOptions = {
    checkers: options.checkers,
    config: options.config ?? testConfig(),
    dependencies: options.dependencies,
    logger: options.logger ?? false,
    readinessGate: options.readinessGate,
    resources: options.resources,
    skipDatabase: true,
  };
  return createApp(createOptions);
}
