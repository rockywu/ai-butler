import type { Browser, BrowserContext, Page } from 'playwright';

import type { PlaywrightDriver } from './task-engine';
import type { TaskTarget } from './task-types';

export interface PlaywrightHandles {
  browser?: Browser;
  context: BrowserContext;
  page?: Page;
}

function resolvePlaywrightTarget(
  handles: PlaywrightHandles,
  target: TaskTarget,
): Browser | BrowserContext | Page | undefined {
  if (target === 'context') {
    return handles.context;
  }
  if (target === 'page') {
    return handles.page;
  }
  return handles.browser;
}

export function createPlaywrightDriver(
  handles: PlaywrightHandles,
): PlaywrightDriver {
  return {
    async invoke(target: TaskTarget, method: string, args: unknown[]) {
      const object = resolvePlaywrightTarget(handles, target);
      if (!object) {
        throw new Error(`Playwright ${target} is not available`);
      }
      const candidate = (object as unknown as Record<string, unknown>)[method];
      if (typeof candidate !== 'function') {
        throw new TypeError(`Playwright ${target}.${method} is not a function`);
      }
      const result = await (
        candidate as (...parameters: unknown[]) => Promise<unknown>
      ).apply(object, args);
      if (target === 'context' && method === 'newPage') {
        handles.page = result as Page;
      }
      return result;
    },
  };
}
