import type { AppInstance } from '../framework/http/fastify';

import { probePlugin } from '../modules/probe/probe.plugin';

export async function registerModules(app: AppInstance): Promise<void> {
  await app.register(probePlugin);
}
