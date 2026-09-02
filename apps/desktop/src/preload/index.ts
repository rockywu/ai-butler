import type { DesktopBridge } from '@ai-butler/platform-api';

import { PLATFORM_PROTOCOL_VERSION } from '@ai-butler/platform-api';
import { contextBridge, ipcRenderer } from 'electron';

import { RUNTIME_GET_INFO_CHANNEL } from '../shared/channels';

const bridge: DesktopBridge = Object.freeze({
  protocolVersion: PLATFORM_PROTOCOL_VERSION,
  runtime: Object.freeze({
    getInfo: () => ipcRenderer.invoke(RUNTIME_GET_INFO_CHANNEL),
  }),
});

contextBridge.exposeInMainWorld('desktop', bridge);
