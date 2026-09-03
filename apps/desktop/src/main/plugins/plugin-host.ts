import type { PluginTransport } from '@ai-butler/desktop-plugin-protocol';
import type {
  BrowserProgressEvent,
  BrowserSessionSnapshot,
  BrowserStartRequest,
  PlatformResult,
} from '@ai-butler/platform-api';
import type { BrowserWindow, IpcMainInvokeEvent } from 'electron';

import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { PluginClient } from '@ai-butler/desktop-plugin-protocol';
import { app, dialog, ipcMain, utilityProcess } from 'electron';

import {
  BROWSER_GET_STATE_CHANNEL,
  BROWSER_PROGRESS_CHANNEL,
  BROWSER_START_CHANNEL,
  BROWSER_STOP_CHANNEL,
} from '../../shared/channels';
import { FileConsentStore } from './consent-store';
import { PLAYWRIGHT_PACKAGE } from './playwright-runtime-dep';
import { ENABLED_PLUGINS } from './plugins-config';
import { resolvePluginEntry } from './resolve-plugin-entry';

void PLAYWRIGHT_PACKAGE;

const idleSnapshot = (): BrowserSessionSnapshot => ({
  browserType: null,
  sessionId: null,
  state: 'idle',
  taskId: null,
});

const enabledPlugins = new Set<string>(ENABLED_PLUGINS);

function isBrowserPluginEnabled(): boolean {
  return enabledPlugins.has('browser');
}

function createUtilityTransport(
  child: Electron.UtilityProcess,
): PluginTransport {
  return {
    kill() {
      child.kill();
    },
    onExit(handler) {
      const listener = (code: number) => {
        handler(code);
      };
      child.on('exit', listener);
      return () => {
        child.off('exit', listener);
      };
    },
    onMessage(handler) {
      const listener = (message: unknown) => {
        handler(message);
      };
      child.on('message', listener);
      return () => {
        child.off('message', listener);
      };
    },
    send(message) {
      // Electron UtilityProcess.postMessage 是 Node MessagePort，没有 targetOrigin。
      // oxlint-disable-next-line unicorn/require-post-message-target-origin
      child.postMessage(message);
    },
  };
}

export function registerBrowserHandlers(options: {
  currentDirectory: string;
  getMainWindow: () => BrowserWindow | null;
  isTrustedSender: (url: string) => boolean;
}): { isBrowserSessionAvailable: () => boolean } {
  const pluginEntry = resolvePluginEntry({
    currentDirectory: options.currentDirectory,
  });
  const isBrowserSessionAvailable = () =>
    isBrowserPluginEnabled() && existsSync(pluginEntry);

  let client: PluginClient | undefined;

  const ensureClient = (): PluginClient | undefined => {
    if (!isBrowserSessionAvailable()) return undefined;
    if (client) return client;
    const child = utilityProcess.fork(pluginEntry, [], {
      serviceName: 'ai-butler-browser-plugin',
    });
    const transport = createUtilityTransport(child);
    client = new PluginClient(transport);
    client.onEvent('session.progress', (payload) => {
      const window = options.getMainWindow();
      window?.webContents.send(
        BROWSER_PROGRESS_CHANNEL,
        payload as BrowserProgressEvent,
      );
    });
    transport.onExit(() => {
      client = undefined;
    });
    return client;
  };

  const deny = <T>(
    code:
      | 'invalid_argument'
      | 'permission_denied'
      | 'unavailable'
      | 'user_cancelled',
    message: string,
  ): PlatformResult<T> => ({
    error: { code, message },
    ok: false,
  });

  const guard = (
    event: IpcMainInvokeEvent,
  ): PlatformResult<never> | undefined => {
    if (!event.senderFrame || !options.isTrustedSender(event.senderFrame.url)) {
      return deny('permission_denied', 'Untrusted browser session request');
    }
    return undefined;
  };

  ipcMain.handle(
    BROWSER_GET_STATE_CHANNEL,
    async (event): Promise<PlatformResult<BrowserSessionSnapshot>> => {
      const blocked = guard(event);
      if (blocked) return blocked;
      if (!isBrowserSessionAvailable()) {
        return { data: idleSnapshot(), ok: true };
      }
      const plugin = ensureClient();
      if (!plugin) return { data: idleSnapshot(), ok: true };
      const data = (await plugin.invoke(
        'session.getState',
        {},
      )) as BrowserSessionSnapshot;
      return { data, ok: true };
    },
  );

  ipcMain.handle(
    BROWSER_STOP_CHANNEL,
    async (event): Promise<PlatformResult<{ stopped: true }>> => {
      const blocked = guard(event);
      if (blocked) return blocked;
      if (!client) {
        return { data: { stopped: true }, ok: true };
      }
      await client.invoke('session.stop', {});
      return { data: { stopped: true }, ok: true };
    },
  );

  ipcMain.handle(
    BROWSER_START_CHANNEL,
    async (
      event,
      request: BrowserStartRequest,
    ): Promise<PlatformResult<BrowserSessionSnapshot>> => {
      const blocked = guard(event);
      if (blocked) return blocked;
      if (!isBrowserSessionAvailable()) {
        return deny(
          'unavailable',
          'Browser plugin is not packaged in this build',
        );
      }
      if (request.browserType !== 'chrome' && request.browserType !== 'edge') {
        return deny('invalid_argument', 'browserType must be chrome or edge');
      }
      if (typeof request.taskId !== 'string' || request.taskId.length === 0) {
        return deny('invalid_argument', 'taskId is required');
      }

      const consentPath = join(
        app.getPath('userData'),
        'browser-plugin-consent.json',
      );
      const consent = new FileConsentStore(consentPath);
      if (!consent.hasConsent(request.browserType)) {
        const result = await dialog.showMessageBox({
          buttons: ['取消', '允许'],
          cancelId: 0,
          defaultId: 1,
          message:
            'AI Butler 将复制系统 Chrome/Edge 用户数据到应用目录以保留登录态',
          type: 'question',
        });
        if (result.response !== 1) {
          return deny('user_cancelled', 'Profile copy was cancelled');
        }
        consent.grant(request.browserType);
      }

      const plugin = ensureClient();
      if (!plugin) {
        return deny('unavailable', 'Failed to start browser plugin');
      }

      try {
        const data = (await plugin.invoke('session.start', {
          browserType: request.browserType,
          taskId: request.taskId,
          userDataRoot: join(app.getPath('userData'), 'browser-profiles'),
        })) as BrowserSessionSnapshot;
        return { data, ok: true };
      } catch (error) {
        const code =
          error && typeof error === 'object' && 'code' in error
            ? (error as { code: string }).code
            : 'internal';
        const message =
          error instanceof Error ? error.message : 'Browser session failed';
        if (
          code === 'conflict' ||
          code === 'unavailable' ||
          code === 'invalid_argument' ||
          code === 'internal'
        ) {
          return {
            error: {
              code,
              message,
            },
            ok: false,
          };
        }
        return deny('unavailable', message);
      }
    },
  );

  return { isBrowserSessionAvailable };
}
