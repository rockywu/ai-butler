import type { ReadinessGate } from './readiness';
import type { ResourceRegistry } from './resource-registry';

import { createShutdown } from './shutdown';

export function createAppShutdown(options: {
  readinessGate: ReadinessGate;
  resources: ResourceRegistry;
  timeoutMs?: number;
}) {
  return createShutdown({
    async close() {
      options.readinessGate.markNotReady();
      await options.resources.closeAll();
    },
    timeoutMs: options.timeoutMs ?? 10_000,
  });
}
