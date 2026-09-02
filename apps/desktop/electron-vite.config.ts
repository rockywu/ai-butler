import { defineConfig } from 'electron-vite';

const platformApiEntry = new URL(
  '../../packages/platform-api/src/index.ts',
  import.meta.url,
).pathname;

export default defineConfig({
  main: {
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
  renderer: {
    build: {
      outDir: 'out/renderer-placeholder',
    },
  },
});
