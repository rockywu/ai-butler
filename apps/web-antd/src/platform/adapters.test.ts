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
      browser: {
        getState: async () => ({
          data: {
            browserType: null,
            sessionId: null,
            state: 'idle',
            taskId: null,
          },
          ok: true,
        }),
        onProgress: () => () => {},
        start: async () => ({
          data: {
            browserType: null,
            sessionId: null,
            state: 'idle',
            taskId: null,
          },
          ok: true,
        }),
        stop: async () => ({ data: { stopped: true as const }, ok: true }),
      },
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

describe('browser session adapters', () => {
  it('marks browser sessions unsupported on web', async () => {
    const api = createWebPlatformApi('0.1.0');
    const result = await api.browser.start({
      browserType: 'chrome',
      taskId: 'sample.blank',
    });
    expect(result).toEqual({
      error: {
        code: 'unsupported',
        message: 'Browser sessions require the desktop app',
      },
      ok: false,
    });
    expect(api.runtime.getInfo).toBeTypeOf('function');
    const info = await api.runtime.getInfo();
    expect(info.ok && info.data.capabilities).not.toContain('browser.session');
  });

  it('forwards browser.start through the desktop bridge', async () => {
    const snapshot = {
      browserType: 'chrome' as const,
      sessionId: 's1',
      state: 'preparing' as const,
      taskId: 'sample.blank',
    };
    const bridge: DesktopBridge = {
      browser: {
        getState: async () => ({ data: snapshot, ok: true }),
        onProgress: () => () => {},
        start: async () => ({ data: snapshot, ok: true }),
        stop: async () => ({ data: { stopped: true as const }, ok: true }),
      },
      protocolVersion: PLATFORM_PROTOCOL_VERSION,
      runtime: {
        getInfo: async () => ({ data: desktopInfo, ok: true }),
      },
    };
    const result = await createDesktopPlatformApi(bridge).browser.start({
      browserType: 'chrome',
      taskId: 'sample.blank',
    });
    expect(result).toEqual({ data: snapshot, ok: true });
  });
});
