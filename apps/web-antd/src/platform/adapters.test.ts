import type { DesktopBridge, RuntimeInfo } from '@ai-butler/platform-api';

import { PLATFORM_PROTOCOL_VERSION } from '@ai-butler/platform-api';
import { describe, expect, it } from 'vitest';

import { createDesktopPlatformApi, createWebPlatformApi } from './adapters';

const desktopInfo: RuntimeInfo = {
  appVersion: '0.1.0',
  arch: 'arm64',
  capabilities: ['runtime.info'],
  platform: 'darwin',
  protocolVersion: PLATFORM_PROTOCOL_VERSION,
  target: 'desktop',
};

describe('platform adapters', () => {
  it('returns web runtime information', async () => {
    const result = await createWebPlatformApi('0.1.0').runtime.getInfo();

    expect(result).toEqual({
      data: expect.objectContaining({
        appVersion: '0.1.0',
        platform: 'web',
        target: 'web',
      }),
      ok: true,
    });
  });

  it('fails closed when the desktop bridge is missing', async () => {
    const result = await createDesktopPlatformApi(undefined).runtime.getInfo();

    expect(result).toEqual({
      error: {
        code: 'unavailable',
        message: 'Desktop bridge is unavailable',
      },
      ok: false,
    });
  });

  it('rejects a desktop bridge protocol mismatch', async () => {
    const bridge: DesktopBridge = {
      protocolVersion: PLATFORM_PROTOCOL_VERSION + 1,
      runtime: {
        getInfo: async () => ({ data: desktopInfo, ok: true }),
      },
    };

    const result = await createDesktopPlatformApi(bridge).runtime.getInfo();

    expect(result).toEqual({
      error: {
        code: 'conflict',
        message: 'Desktop bridge protocol mismatch',
      },
      ok: false,
    });
  });
});
