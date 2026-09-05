import type { AppInstance } from '../framework/http/fastify';
import type { AppDependencies } from './dependencies';

import { probePlugin } from '../modules/probe/probe.plugin';
import { testPlugin } from '../modules/test/test.plugin';

export async function registerModules(
  app: AppInstance,
  dependencies: AppDependencies,
): Promise<void> {
  await app.register(probePlugin, {
    service: dependencies.probeService,
  });
  await app.register(testPlugin, {
    service: dependencies.testService,
  });
}
