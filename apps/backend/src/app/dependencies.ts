import type { ProbeService } from '../modules/probe/probe.service';

import { createProbeService } from '../modules/probe/probe.service';

export interface AppDependencies {
  probeService: ProbeService;
}

export function createDependencies(
  overrides: Partial<AppDependencies> = {},
): AppDependencies {
  return {
    probeService: overrides.probeService ?? createProbeService(),
  };
}
