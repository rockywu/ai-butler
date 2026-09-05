import type { Database } from '../infrastructure/database/client';
import type { ProbeService } from '../modules/probe/probe.service';
import type { TestService } from '../modules/test/test.service';

import { createPgTestRepository } from '../infrastructure/database/test.repository';
import { createProbeService } from '../modules/probe/probe.service';
import { createMemoryTestRepository } from '../modules/test/test.repository.memory';
import { createTestService } from '../modules/test/test.service';

export interface AppDependencies {
  probeService: ProbeService;
  testService: TestService;
}

export function createDependencies(
  overrides: Partial<AppDependencies> = {},
  context: { database?: Database } = {},
): AppDependencies {
  const testRepository = context.database
    ? createPgTestRepository(context.database)
    : createMemoryTestRepository();

  return {
    probeService: overrides.probeService ?? createProbeService(),
    testService: overrides.testService ?? createTestService(testRepository),
  };
}
