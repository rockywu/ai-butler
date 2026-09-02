import type {
  BrowserProgressEvent,
  BrowserSessionApi,
  DesktopBridge,
  PlatformApi,
  PlatformErrorCode,
  PlatformResult,
} from '@ai-butler/platform-api';

import { PLATFORM_PROTOCOL_VERSION } from '@ai-butler/platform-api';

function failure<T>(
  code: PlatformErrorCode,
  message: string,
): PlatformResult<T> {
  return { error: { code, message }, ok: false };
}

function unsupportedBrowserApi(): BrowserSessionApi {
  const unsupported = <T>() =>
    Promise.resolve(
      failure<T>('unsupported', 'Browser sessions require the desktop app'),
    );

  return {
    getState: () => unsupported(),
    onProgress: () => () => {},
    start: () => unsupported(),
    stop: () => unsupported(),
  };
}

function unavailableBrowserApi(): BrowserSessionApi {
  const unavailable = <T>() =>
    Promise.resolve(failure<T>('unavailable', 'Desktop bridge is unavailable'));

  return {
    getState: () => unavailable(),
    onProgress: () => () => {},
    start: () => unavailable(),
    stop: () => unavailable(),
  };
}

export function createWebPlatformApi(appVersion: string): PlatformApi {
  return {
    browser: unsupportedBrowserApi(),
    protocolVersion: PLATFORM_PROTOCOL_VERSION,
    runtime: {
      getInfo: async () => ({
        data: {
          appVersion,
          arch: 'unknown',
          capabilities: ['runtime.info'],
          platform: 'web',
          protocolVersion: PLATFORM_PROTOCOL_VERSION,
          target: 'web',
        },
        ok: true,
      }),
    },
  };
}

export function createDesktopPlatformApi(
  bridge: DesktopBridge | undefined,
): PlatformApi {
  return {
    browser: bridge
      ? {
          getState: () => bridge.browser.getState(),
          onProgress: (handler: (event: BrowserProgressEvent) => void) =>
            bridge.browser.onProgress(handler),
          start: (request) => bridge.browser.start(request),
          stop: () => bridge.browser.stop(),
        }
      : unavailableBrowserApi(),
    protocolVersion: PLATFORM_PROTOCOL_VERSION,
    runtime: {
      getInfo: async () => {
        if (!bridge) {
          return failure('unavailable', 'Desktop bridge is unavailable');
        }
        if (bridge.protocolVersion !== PLATFORM_PROTOCOL_VERSION) {
          return failure('conflict', 'Desktop bridge protocol mismatch');
        }

        const result = await bridge.runtime.getInfo();
        if (
          result.ok &&
          result.data.protocolVersion !== PLATFORM_PROTOCOL_VERSION
        ) {
          return failure('conflict', 'Desktop runtime protocol mismatch');
        }
        return result;
      },
    },
  };
}
