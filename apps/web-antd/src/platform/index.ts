import type { DesktopBridge, PlatformApi } from '@ai-butler/platform-api';

import { createDesktopPlatformApi, createWebPlatformApi } from './adapters';

declare global {
  interface Window {
    desktop?: DesktopBridge;
  }
}

let platformApi: PlatformApi | undefined;

export function initializePlatformApi(): PlatformApi {
  platformApi =
    import.meta.env.VITE_RUNTIME_TARGET === 'desktop'
      ? createDesktopPlatformApi(window.desktop)
      : createWebPlatformApi(import.meta.env.VITE_APP_VERSION || '0.1.0');
  return platformApi;
}

export function getPlatformApi(): PlatformApi {
  if (!platformApi) {
    throw new Error('platformApi must be initialized before use');
  }
  return platformApi;
}

export type { PlatformApi };
