import type {
  BrowserProgressEvent,
  BrowserStartRequest,
  DesktopBridge,
} from '@ai-butler/platform-api';

import type { DesktopBootstrapConfig } from '../shared/channels';

import { PLATFORM_PROTOCOL_VERSION } from '@ai-butler/platform-api';
import { contextBridge, ipcRenderer, webFrame } from 'electron';

import { createApiUrlInterceptorScript } from '../shared/api-url-interceptor';
import {
  BOOTSTRAP_GET_CONFIG_CHANNEL,
  BROWSER_GET_STATE_CHANNEL,
  BROWSER_PROGRESS_CHANNEL,
  BROWSER_START_CHANNEL,
  BROWSER_STOP_CHANNEL,
  RUNTIME_GET_INFO_CHANNEL,
} from '../shared/channels';

const bootstrap = ipcRenderer.sendSync(
  BOOTSTRAP_GET_CONFIG_CHANNEL,
) as DesktopBootstrapConfig | null;

// contextIsolation 下 preload 的 globalThis 不是页面主世界；
// 用 webFrame 把拦截器注入主世界（打包态还会在 index.html 再注一份兜底）。
if (bootstrap?.apiURL) {
  void webFrame.executeJavaScript(
    createApiUrlInterceptorScript(bootstrap.apiURL),
  );
}

const bridge: DesktopBridge = Object.freeze({
  browser: Object.freeze({
    getState: () => ipcRenderer.invoke(BROWSER_GET_STATE_CHANNEL),
    onProgress: (handler: (event: BrowserProgressEvent) => void) => {
      const listener = (_event: unknown, payload: BrowserProgressEvent) => {
        handler(payload);
      };
      ipcRenderer.on(BROWSER_PROGRESS_CHANNEL, listener);
      return () => {
        ipcRenderer.off(BROWSER_PROGRESS_CHANNEL, listener);
      };
    },
    start: (request: BrowserStartRequest) =>
      ipcRenderer.invoke(BROWSER_START_CHANNEL, request),
    stop: () => ipcRenderer.invoke(BROWSER_STOP_CHANNEL),
  }),
  protocolVersion: PLATFORM_PROTOCOL_VERSION,
  runtime: Object.freeze({
    getInfo: () => ipcRenderer.invoke(RUNTIME_GET_INFO_CHANNEL),
  }),
});

contextBridge.exposeInMainWorld('desktop', bridge);
