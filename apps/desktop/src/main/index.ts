import type { PlatformResult, RuntimeInfo } from '@ai-butler/platform-api';

import type { DesktopBootstrapConfig } from '../shared/channels';

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { PLATFORM_PROTOCOL_VERSION } from '@ai-butler/platform-api';
import { app, BrowserWindow, ipcMain, net, protocol } from 'electron';

import { injectApiUrlInterceptorIntoHtml } from '../shared/api-url-interceptor';
import {
  BOOTSTRAP_GET_CONFIG_CHANNEL,
  RUNTIME_GET_INFO_CHANNEL,
} from '../shared/channels';
import { parseApiUrlFromArgv } from './parse-api-url';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const developmentUrl =
  process.env.AI_BUTLER_RENDERER_URL || 'http://localhost:5666';
/**
 * 打包应用没有 Vite `/api` 代理。未传 `--api-url` 时默认直连本地独立 Mock，
 * 便于 macOS 本地点登录验证；正式环境用 `--api-url=https://...` 覆盖。
 */
const bootstrapConfig: DesktopBootstrapConfig = {
  apiURL:
    parseApiUrlFromArgv(process.argv) ??
    (app.isPackaged ? 'http://localhost:5320/api' : null),
};

function resolvePreloadPath(): string {
  // Sandbox preload 必须是 CJS；兼容本地历史产物的 .mjs / .js。
  const candidates = ['index.cjs', 'index.js', 'index.mjs'];
  for (const fileName of candidates) {
    const filePath = resolve(currentDirectory, '../preload', fileName);
    if (existsSync(filePath)) {
      return filePath;
    }
  }
  return resolve(currentDirectory, '../preload/index.cjs');
}

let mainWindow: BrowserWindow | null = null;

protocol.registerSchemesAsPrivileged([
  {
    privileges: {
      corsEnabled: true,
      secure: true,
      standard: true,
      supportFetchAPI: true,
    },
    scheme: 'app',
  },
]);

function isTrustedSender(url: string): boolean {
  if (app.isPackaged) {
    return url.startsWith('app://bundle/');
  }
  try {
    return new URL(url).origin === new URL(developmentUrl).origin;
  } catch {
    return false;
  }
}

function registerBootstrapHandler(): void {
  ipcMain.on(BOOTSTRAP_GET_CONFIG_CHANNEL, (event) => {
    event.returnValue = bootstrapConfig;
  });
}

function registerRuntimeHandler(): void {
  ipcMain.handle(
    RUNTIME_GET_INFO_CHANNEL,
    (event): PlatformResult<RuntimeInfo> => {
      if (!event.senderFrame || !isTrustedSender(event.senderFrame.url)) {
        return {
          error: {
            code: 'permission_denied',
            message: 'Untrusted runtime information request',
          },
          ok: false,
        };
      }

      if (process.platform !== 'darwin' && process.platform !== 'win32') {
        return {
          error: {
            code: 'unsupported',
            message: 'This desktop platform is not supported',
          },
          ok: false,
        };
      }

      return {
        data: {
          appVersion: app.getVersion(),
          arch: process.arch,
          capabilities: ['runtime.info'],
          platform: process.platform,
          protocolVersion: PLATFORM_PROTOCOL_VERSION,
          target: 'desktop',
        },
        ok: true,
      };
    },
  );
}

function registerRendererProtocol(): void {
  const rendererRoot = resolve(process.resourcesPath, 'renderer');

  protocol.handle('app', async (request) => {
    const requestUrl = new URL(request.url);
    if (requestUrl.host !== 'bundle') {
      return new Response('Not found', { status: 404 });
    }

    let requestedPath: string;
    try {
      requestedPath =
        decodeURIComponent(requestUrl.pathname).replace(/^\/+/, '') ||
        'index.html';
    } catch {
      return new Response('Invalid path', { status: 400 });
    }

    const filePath = resolve(rendererRoot, requestedPath);
    const relativePath = relative(rendererRoot, filePath);
    if (
      relativePath === '..' ||
      relativePath.startsWith(`..${sep}`) ||
      resolve(filePath) === rendererRoot
    ) {
      return new Response('Forbidden', { status: 403 });
    }

    // 打包页没有 Vite 代理；带 --api-url 时在 index.html 主世界注入覆盖脚本。
    if (
      bootstrapConfig.apiURL &&
      (requestedPath === 'index.html' || requestedPath === '')
    ) {
      const html = await readFile(filePath, 'utf8');
      return new Response(
        injectApiUrlInterceptorIntoHtml(html, bootstrapConfig.apiURL),
        {
          headers: {
            'content-type': 'text/html; charset=utf-8',
          },
        },
      );
    }

    return net.fetch(pathToFileURL(filePath).toString());
  });
}

async function createMainWindow(): Promise<BrowserWindow> {
  const window = new BrowserWindow({
    backgroundColor: '#f5f5f5',
    height: 900,
    minHeight: 700,
    minWidth: 1100,
    show: false,
    title: 'AI Butler（阿斯系统）',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: resolvePreloadPath(),
      sandbox: true,
      webSecurity: true,
    },
    width: 1440,
  });

  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => {
    event.preventDefault();
  });
  window.once('ready-to-show', () => window.show());
  window.on('closed', () => {
    if (mainWindow === window) {
      mainWindow = null;
    }
  });

  await window.loadURL(
    app.isPackaged ? 'app://bundle/index.html' : developmentUrl,
  );

  return window;
}

async function showMainWindow(): Promise<void> {
  if (!mainWindow || mainWindow.isDestroyed()) {
    mainWindow = await createMainWindow();
    return;
  }
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  mainWindow.show();
  mainWindow.focus();
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (hasSingleInstanceLock) {
  app.on('second-instance', () => {
    void showMainWindow();
  });

  app.whenReady().then(async () => {
    app.setName('AI Butler');
    if (app.isPackaged) {
      registerRendererProtocol();
    }
    registerBootstrapHandler();
    registerRuntimeHandler();
    await showMainWindow();
  });

  app.on('activate', () => {
    void showMainWindow();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
} else {
  app.quit();
}
