import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'electron-vite';

const desktopRoot = dirname(fileURLToPath(import.meta.url));
const platformApiEntry = resolve(
  desktopRoot,
  '../../packages/platform-api/src/index.ts',
);
const pluginProtocolEntry = resolve(
  desktopRoot,
  '../desktop-plugins/protocol/src/index.ts',
);

export default defineConfig({
  main: {
    build: {
      externalizeDeps: {
        exclude: [
          '@ai-butler/platform-api',
          '@ai-butler/desktop-plugin-protocol',
        ],
      },
    },
    plugins: [
      {
        enforce: 'pre',
        name: 'bundle-desktop-plugin-protocol',
        resolveId(id) {
          if (id === '@ai-butler/desktop-plugin-protocol') {
            return pluginProtocolEntry;
          }
          return undefined;
        },
      },
    ],
    ssr: {
      noExternal: [
        '@ai-butler/platform-api',
        '@ai-butler/desktop-plugin-protocol',
      ],
    },
    resolve: {
      alias: {
        '@ai-butler/desktop-plugin-protocol': pluginProtocolEntry,
        '@ai-butler/platform-api': platformApiEntry,
      },
    },
  },
  preload: {
    build: {
      externalizeDeps: { exclude: ['@ai-butler/platform-api'] },
    },
    ssr: {
      noExternal: ['@ai-butler/platform-api'],
    },
    resolve: {
      alias: {
        '@ai-butler/platform-api': platformApiEntry,
      },
    },
  },
  // electron-vite 5 要求 renderer 入口；产品 Renderer 仍由 web-antd 构建，
  // 此占位入口不会被 BrowserWindow 加载，也不会进入安装包。
  // Sandbox preload 的 CJS 产物由 scripts/emit-preload-cjs.mjs 在 build 后生成。
  renderer: {
    build: {
      outDir: 'out/renderer-placeholder',
    },
  },
});
