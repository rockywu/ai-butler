import type {
  DesktopBridge,
  PlatformApi,
  PlatformResult,
  RuntimeInfo,
} from '@ai-butler/platform-api';

import { PLATFORM_PROTOCOL_VERSION } from '@ai-butler/platform-api';

function failure(
  code: 'conflict' | 'unavailable',
  message: string,
): PlatformResult<RuntimeInfo> {
  return { error: { code, message }, ok: false };
}

export function createWebPlatformApi(appVersion: string): PlatformApi {
  return {
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
