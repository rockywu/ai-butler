# 桌面插件宿主与 browser 模块实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 在 monorepo 中落地桌面插件宿主与第一个 `browser` 插件：独立进程跑 Playwright，复制系统 Chrome/Edge profile 后 headed 启动，Renderer 只能通过白名单会话 IPC 调用。

**架构：** `apps/desktop-plugins/protocol` 定义宿主↔插件 JSON 信封；`apps/desktop` 的 PluginHost 用 `utilityProcess` 拉起插件；`browser` 包负责检测浏览器、复制 profile、内部 Playwright RPC 与混合任务引擎。页面只接触 `platformApi.browser`。

**技术栈：** Electron 44 `utilityProcess`、Playwright（`channel: 'chrome' | 'msedge'`）、Vitest、esbuild、pnpm workspace、`@ai-butler/platform-api`

**规格：** [2026-09-02-desktop-plugins-browser-design.md](../specs/2026-09-02-desktop-plugins-browser-design.md)

## 全局约束

- Renderer 禁止通用 `invoke`，禁止拿到 Playwright handle、profile 绝对路径、cookie、截图。
- Playwright RPC 只存在于插件进程内部；宿主协议仅 `ping` / `session.start` / `session.stop` / `session.getState`。
- 第一版只实现 Chrome 与 Edge；`firefox` 返回 `unsupported`。
- 未安装指定浏览器时不得启动 Playwright 自带 Chromium。
- 同时只允许一个 browser 会话。
- CI 单测不得启动真实 Chrome/Edge。
- 提交信息使用 Conventional Commits，scope 必须是 commitlint 允许的包名或 `project`。新增 workspace 包之后才能用新包名做 scope。
- 不要改 `apps/desktop copy/`，不要提交 `out/` 或 `release/`。

## 文件结构

- 修改：`pnpm-workspace.yaml` — 增加 `apps/desktop-plugins/*`
- 创建：`apps/desktop-plugins/protocol/` — 信封、`PluginClient`、`PluginTransport`
- 创建：`apps/desktop-plugins/browser/` — 检测、复制、引擎、进程入口、样例任务
- 创建：`apps/desktop/plugins.json` — 编译期启用列表
- 创建：`apps/desktop/scripts/emit-browser-plugin.mjs` — esbuild 插件入口到 `out/plugins/browser/index.js`
- 创建：`apps/desktop/src/main/plugins/plugin-host.ts` — 启停插件进程、转发会话
- 创建：`apps/desktop/src/main/plugins/consent-store.ts` — 同意文件读写
- 修改：`apps/desktop/src/shared/channels.ts` — browser 通道
- 修改：`apps/desktop/src/main/index.ts`、`src/preload/index.ts`、`electron-vite.config.ts`、`electron-builder.yml`、`package.json`
- 修改：`packages/platform-api/src/index.ts` — `BrowserSessionApi`
- 修改：`apps/web-antd/src/platform/adapters.ts` 与 `adapters.test.ts`
- 修改：`CLAUDE.md` — 插件目录说明

---

### 任务 1：协议包与信封编解码

**文件：**
- 修改：`pnpm-workspace.yaml`
- 创建：`apps/desktop-plugins/protocol/package.json`
- 创建：`apps/desktop-plugins/protocol/tsconfig.json`
- 创建：`apps/desktop-plugins/protocol/src/envelope.ts`
- 创建：`apps/desktop-plugins/protocol/src/envelope.test.ts`
- 创建：`apps/desktop-plugins/protocol/src/index.ts`

- [ ] **步骤 1：写入失败的信封测试**

创建 `apps/desktop-plugins/protocol/src/envelope.test.ts`：

```ts
import { describe, expect, it } from 'vitest';

import {
  PLUGIN_PROTOCOL_VERSION,
  encodeEnvelope,
  parseEnvelope,
} from './envelope';

describe('plugin envelope', () => {
  it('round-trips a request', () => {
    const encoded = encodeEnvelope({
      id: '1',
      kind: 'request',
      method: 'ping',
      params: {},
      v: PLUGIN_PROTOCOL_VERSION,
    });
    expect(parseEnvelope(JSON.parse(encoded))).toEqual({
      id: '1',
      kind: 'request',
      method: 'ping',
      params: {},
      v: PLUGIN_PROTOCOL_VERSION,
    });
  });

  it('rejects a missing version', () => {
    expect(parseEnvelope({ id: '1', kind: 'request', method: 'ping' })).toBeNull();
  });

  it('rejects a mismatched version', () => {
    expect(
      parseEnvelope({
        id: '1',
        kind: 'request',
        method: 'ping',
        params: {},
        v: PLUGIN_PROTOCOL_VERSION + 1,
      }),
    ).toBeNull();
  });

  it('parses an error response', () => {
    const encoded = encodeEnvelope({
      error: { code: 'unavailable', message: 'plugin crashed' },
      id: '1',
      kind: 'response',
      ok: false,
      v: PLUGIN_PROTOCOL_VERSION,
    });
    expect(parseEnvelope(JSON.parse(encoded))).toMatchObject({
      ok: false,
      kind: 'response',
    });
  });
});
```

- [ ] **步骤 2：运行测试确认失败**

运行：`pnpm exec vitest run --dom apps/desktop-plugins/protocol/src/envelope.test.ts`

预期：FAIL，找不到模块 `./envelope`。

- [ ] **步骤 3：加入 workspace 与最少实现**

在 `pnpm-workspace.yaml` 的 `packages:` 列表中、`apps/*` 下一行增加：

```yaml
  - apps/desktop-plugins/*
```

创建 `apps/desktop-plugins/protocol/package.json`：

```json
{
  "name": "@ai-butler/desktop-plugin-protocol",
  "version": "0.1.0",
  "private": true,
  "license": "UNLICENSED",
  "type": "module",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    }
  },
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@types/node": "catalog:",
    "@vben/tsconfig": "workspace:*",
    "typescript": "catalog:"
  }
}
```

创建 `apps/desktop-plugins/protocol/tsconfig.json`：

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@vben/tsconfig/node.json",
  "compilerOptions": {
    "types": ["node"]
  },
  "include": ["src/**/*.ts"]
}
```

创建 `apps/desktop-plugins/protocol/src/envelope.ts`（按测试导出符号，`parseEnvelope` 对非对象、错误 `v`、未知 `kind` 返回 `null`）。`PluginMethod` 联合类型仅包含 `'ping' | 'session.start' | 'session.stop' | 'session.getState'`。

创建 `apps/desktop-plugins/protocol/src/index.ts`：

```ts
export {
  PLUGIN_PROTOCOL_VERSION,
  encodeEnvelope,
  parseEnvelope,
} from './envelope';
export type {
  PluginEnvelope,
  PluginError,
  PluginEvent,
  PluginMethod,
  PluginRequest,
  PluginResponse,
} from './envelope';
```

运行：`pnpm install`

- [ ] **步骤 4：运行测试确认通过**

运行：`pnpm exec vitest run --dom apps/desktop-plugins/protocol/src/envelope.test.ts`

预期：PASS。

- [ ] **步骤 5：Commit**

```bash
git add pnpm-workspace.yaml pnpm-lock.yaml apps/desktop-plugins/protocol
git commit -m "$(cat <<'EOF'
feat(project): 添加桌面插件进程协议包

EOF
)"
```

---

### 任务 2：PluginClient 与内存传输

**文件：**
- 创建：`apps/desktop-plugins/protocol/src/client.ts`
- 创建：`apps/desktop-plugins/protocol/src/client.test.ts`
- 修改：`apps/desktop-plugins/protocol/src/index.ts`

- [ ] **步骤 1：写入失败的客户端测试**

创建 `apps/desktop-plugins/protocol/src/client.test.ts`：

```ts
import { describe, expect, it } from 'vitest';

import { PluginClient } from './client';
import { encodeEnvelope, parseEnvelope } from './envelope';
import type { PluginTransport } from './client';

function createLoopback(): {
  clientTransport: PluginTransport;
  emitEvent: (event: string, payload: unknown) => void;
  handle: (handler: (request: { id: string; method: string; params: unknown }) => unknown) => void;
} {
  let onMessage: ((message: unknown) => void) | undefined;
  const clientTransport: PluginTransport = {
    kill() {},
    onExit() {
      return () => {};
    },
    onMessage(handler) {
      onMessage = handler;
      return () => {
        onMessage = undefined;
      };
    },
    send(message) {
      const envelope = parseEnvelope(message);
      if (!envelope || envelope.kind !== 'request') return;
      const result = currentHandler?.(envelope);
      onMessage?.(
        JSON.parse(
          encodeEnvelope({
            data: result,
            id: envelope.id,
            kind: 'response',
            ok: true,
            v: envelope.v,
          }),
        ),
      );
    },
  };
  let currentHandler: ((request: { id: string; method: string; params: unknown }) => unknown) | undefined;
  return {
    clientTransport,
    emitEvent(event, payload) {
      onMessage?.(
        JSON.parse(
          encodeEnvelope({
            event,
            kind: 'event',
            payload,
            v: 1,
          }),
        ),
      );
    },
    handle(handler) {
      currentHandler = handler;
    },
  };
}

describe('PluginClient', () => {
  it('invokes ping and returns data', async () => {
    const loopback = createLoopback();
    loopback.handle(() => ({ pong: true }));
    const client = new PluginClient(loopback.clientTransport);
    await expect(client.invoke('ping', {})).resolves.toEqual({ pong: true });
  });

  it('rejects when the child exits before responding', async () => {
    const listeners: Array<(code: number | null) => void> = [];
    const transport: PluginTransport = {
      kill() {},
      onExit(handler) {
        listeners.push(handler);
        return () => {};
      },
      onMessage() {
        return () => {};
      },
      send() {},
    };
    const client = new PluginClient(transport);
    const pending = client.invoke('ping', {});
    listeners[0]?.(1);
    await expect(pending).rejects.toMatchObject({ code: 'unavailable' });
  });
});
```

测试里 `v: 1` 必须与 `PLUGIN_PROTOCOL_VERSION` 相同；实现后把字面量换成导入的常量。

- [ ] **步骤 2：运行测试确认失败**

运行：`pnpm exec vitest run --dom apps/desktop-plugins/protocol/src/client.test.ts`

预期：FAIL，`PluginClient` 未导出。

- [ ] **步骤 3：实现 PluginClient**

`PluginTransport`：

```ts
export interface PluginTransport {
  send: (message: unknown) => void;
  onMessage: (handler: (message: unknown) => void) => () => void;
  onExit: (handler: (code: number | null) => void) => () => void;
  kill: () => void;
}
```

`PluginClient.invoke(method, params)`：生成递增字符串 id，`send` 已解析对象（不要双重 JSON 字符串化；`encodeEnvelope` 用于需要字符串的边界，客户端与传输默认直接传对象）。匹配 `kind: 'response'` 且 id 相同的信封。子进程 `onExit` 时所有挂起 Promise reject `{ code: 'unavailable', message: 'plugin process exited' }`。默认超时 30_000 ms，超时 `{ code: 'timeout', message: 'plugin request timed out' }`。

`onEvent(event, handler)` 订阅 `kind: 'event'`，返回 unsubscribe。

从 `src/index.ts` 导出 `PluginClient` 与 `PluginTransport`。

- [ ] **步骤 4：运行测试确认通过**

运行：`pnpm exec vitest run --dom apps/desktop-plugins/protocol/src`

预期：PASS。

- [ ] **步骤 5：Commit**

```bash
git add apps/desktop-plugins/protocol
git commit -m "$(cat <<'EOF'
feat(@ai-butler/desktop-plugin-protocol): 添加插件进程客户端

EOF
)"
```

---

### 任务 3：platformApi 会话契约与 Adapter

**文件：**
- 修改：`packages/platform-api/src/index.ts`
- 修改：`apps/web-antd/src/platform/adapters.ts`
- 修改：`apps/web-antd/src/platform/adapters.test.ts`
- 修改：`apps/desktop/src/shared/channels.ts`
- 修改：`apps/desktop/src/preload/index.ts`

- [ ] **步骤 1：扩展 Adapter 测试**

在 `adapters.test.ts` 追加：

```ts
describe('browser session adapters', () => {
  it('marks browser sessions unsupported on web', async () => {
    const api = createWebPlatformApi('0.1.0');
    const result = await api.browser.start({
      browserType: 'chrome',
      taskId: 'sample.blank',
    });
    expect(result).toEqual({
      error: { code: 'unsupported', message: 'Browser sessions require the desktop app' },
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
```

Web `getInfo` 的 capabilities 保持 `['runtime.info']`。Desktop 测试里的 `desktopInfo.capabilities` 暂不改。

- [ ] **步骤 2：运行测试确认失败**

运行：`pnpm exec vitest run --dom apps/web-antd/src/platform/adapters.test.ts`

预期：FAIL，`api.browser` 不存在。

- [ ] **步骤 3：实现契约、Adapter、preload 通道**

在 `packages/platform-api/src/index.ts` 增加（`PLATFORM_PROTOCOL_VERSION` 仍为 `1`）：

```ts
export type BrowserKind = 'chrome' | 'edge';
export type BrowserSessionState =
  | 'failed'
  | 'idle'
  | 'preparing'
  | 'running'
  | 'stopping'
  | 'verifying';

export interface BrowserStartRequest {
  browserType: BrowserKind;
  taskId: string;
}

export interface BrowserSessionSnapshot {
  browserType: BrowserKind | null;
  sessionId: string | null;
  state: BrowserSessionState;
  taskId: string | null;
}

export interface BrowserProgressEvent {
  message: string;
  sessionId: string;
  state: BrowserSessionState;
  stepId?: string;
  taskId: string;
}

export interface BrowserSessionApi {
  getState: () => Promise<PlatformResult<BrowserSessionSnapshot>>;
  onProgress: (handler: (event: BrowserProgressEvent) => void) => () => void;
  start: (request: BrowserStartRequest) => Promise<PlatformResult<BrowserSessionSnapshot>>;
  stop: () => Promise<PlatformResult<{ stopped: true }>>;
}
```

`PlatformApi` 与 `DesktopBridge` 都加上 `browser: BrowserSessionApi`。

Web Adapter：`browser.start/stop/getState` 返回 `unsupported`，文案为 `Browser sessions require the desktop app`；`onProgress` 返回 `() => {}`。

Desktop Adapter：无 bridge 时 `browser.*` 与 runtime 一样 `unavailable`；有 bridge 则转发 `bridge.browser`。

`channels.ts` 增加：

```ts
export const BROWSER_START_CHANNEL = 'browser:start';
export const BROWSER_STOP_CHANNEL = 'browser:stop';
export const BROWSER_GET_STATE_CHANNEL = 'browser:get-state';
export const BROWSER_PROGRESS_CHANNEL = 'browser:progress';
```

preload 的 `bridge` 增加：

```ts
browser: Object.freeze({
  getState: () => ipcRenderer.invoke(BROWSER_GET_STATE_CHANNEL),
  onProgress: (handler) => {
    const listener = (_event: unknown, payload: BrowserProgressEvent) => {
      handler(payload);
    };
    ipcRenderer.on(BROWSER_PROGRESS_CHANNEL, listener);
    return () => {
      ipcRenderer.off(BROWSER_PROGRESS_CHANNEL, listener);
    };
  },
  start: (request) => ipcRenderer.invoke(BROWSER_START_CHANNEL, request),
  stop: () => ipcRenderer.invoke(BROWSER_STOP_CHANNEL),
}),
```

本任务不要在 main 里注册这些 handler（下一任务）。此时 preload 会 invoke 未注册通道，仅桌面运行时才会碰到；单测不启动 Electron。

- [ ] **步骤 4：运行测试确认通过**

运行：

```bash
pnpm exec vitest run --dom apps/web-antd/src/platform/adapters.test.ts
pnpm --filter @ai-butler/platform-api typecheck
pnpm --filter @ai-butler/desktop typecheck
```

预期：Adapter 测试 PASS。desktop typecheck 可能因 preload 使用了尚未在 main 注册的通道而仍通过（通道只是字符串）。若 preload 因 `BrowserProgressEvent` 类型导入失败则补上 `import type`。

- [ ] **步骤 5：Commit**

```bash
git add packages/platform-api/src/index.ts apps/web-antd/src/platform apps/desktop/src/shared/channels.ts apps/desktop/src/preload/index.ts
git commit -m "$(cat <<'EOF'
feat(@ai-butler/platform-api): 添加 browser 会话契约

EOF
)"
```

---

### 任务 4：检测系统 Chrome/Edge 与复制 profile 过滤

**文件：**
- 创建：`apps/desktop-plugins/browser/package.json`
- 创建：`apps/desktop-plugins/browser/tsconfig.json`
- 创建：`apps/desktop-plugins/browser/src/detect-browser.ts`
- 创建：`apps/desktop-plugins/browser/src/detect-browser.test.ts`
- 创建：`apps/desktop-plugins/browser/src/copy-profile.ts`
- 创建：`apps/desktop-plugins/browser/src/copy-profile.test.ts`
- 创建：`apps/desktop-plugins/browser/src/index.ts`（先只 re-export 检测与复制，进程入口在任务 6）

- [ ] **步骤 1：写入失败的检测与过滤测试**

`detect-browser.test.ts`：

```ts
import { describe, expect, it } from 'vitest';

import { findInstalledBrowser } from './detect-browser';

describe('findInstalledBrowser', () => {
  it('finds macOS Chrome when the app bundle exists', () => {
    const found = findInstalledBrowser('chrome', {
      env: {},
      exists: (filePath) => filePath === '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      homedir: '/Users/demo',
      platform: 'darwin',
    });
    expect(found).toEqual({
      channel: 'chrome',
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      type: 'chrome',
      userDataDir: '/Users/demo/Library/Application Support/Google/Chrome',
    });
  });

  it('returns null when Edge is missing on Windows', () => {
    const found = findInstalledBrowser('edge', {
      env: { LOCALAPPDATA: 'C:\\Users\\demo\\AppData\\Local' },
      exists: () => false,
      homedir: 'C:\\Users\\demo',
      platform: 'win32',
    });
    expect(found).toBeNull();
  });
});
```

`copy-profile.test.ts`：

```ts
import { describe, expect, it } from 'vitest';

import { shouldCopyProfileEntry } from './copy-profile';

describe('shouldCopyProfileEntry', () => {
  it('skips singleton locks and GPU caches', () => {
    expect(shouldCopyProfileEntry('/tmp/Chrome/SingletonLock')).toBe(false);
    expect(shouldCopyProfileEntry('/tmp/Chrome/ShaderCache')).toBe(false);
    expect(shouldCopyProfileEntry('/tmp/Chrome/Default/Cookies')).toBe(true);
  });
});
```

- [ ] **步骤 2：运行测试确认失败**

运行：`pnpm exec vitest run --dom apps/desktop-plugins/browser/src/detect-browser.test.ts apps/desktop-plugins/browser/src/copy-profile.test.ts`

预期：FAIL。

- [ ] **步骤 3：实现检测与过滤，并创建 browser 包**

`package.json` name 为 `@ai-butler/desktop-plugin-browser`，依赖 `@ai-butler/desktop-plugin-protocol`（workspace）与 `playwright`（catalog），devDependencies 与 protocol 包相同，另加 `@types/node`。`aiButlerPlugin`：

```json
{
  "id": "browser",
  "protocolVersion": 1,
  "entry": "dist/index.js"
}
```

macOS Chrome 可执行文件：`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`；userData：`join(homedir, 'Library/Application Support/Google/Chrome')`。

macOS Edge：`/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge`；userData：`join(homedir, 'Library/Application Support/Microsoft Edge')`。

Windows Chrome：`join(env.LOCALAPPDATA || join(homedir, 'AppData/Local'), 'Google/Chrome/Application/chrome.exe')`，若 `exists` 为 false，再试 `join(env.PROGRAMFILES || 'C:\\Program Files', 'Google/Chrome/Application/chrome.exe')`。userData：`join(localAppData, 'Google/Chrome/User Data')`。

Windows Edge：`join(env.PROGRAMFILES_X86 || env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Microsoft/Edge/Application/msedge.exe')`，再试 `PROGRAMFILES`。userData：`join(localAppData, 'Microsoft/Edge/User Data')`。

`channel`：chrome → `'chrome'`，edge → `'msedge'`。

`shouldCopyProfileEntry` 对 basename 属于 `SingletonLock`、`SingletonCookie`、`SingletonSocket`、`GrShaderCache`、`ShaderCache`、`GraphiteDawnCache` 返回 false。

`copyProfile(source, dest, deps)`：用注入的 `rm`、`mkdir`、`cp`（签名与 `node:fs` 的 `cpSync`/`rmSync`/`mkdirSync` 一致即可）。实现里先 `rm(dest, { recursive: true, force: true })`，再 `cp(source, dest, { recursive: true, filter: (src) => shouldCopyProfileEntry(src) })`。本任务测试只覆盖 `shouldCopyProfileEntry`；`copyProfile` 仍要实现，供任务 6 调用。

运行：`pnpm install`

- [ ] **步骤 4：运行测试确认通过**

运行：`pnpm exec vitest run --dom apps/desktop-plugins/browser/src/detect-browser.test.ts apps/desktop-plugins/browser/src/copy-profile.test.ts`

预期：PASS。

- [ ] **步骤 5：Commit**

```bash
git add apps/desktop-plugins/browser pnpm-lock.yaml pnpm-workspace.yaml
git commit -m "$(cat <<'EOF'
feat(@ai-butler/desktop-plugin-browser): 添加浏览器检测与 profile 过滤

EOF
)"
```

---

### 任务 5：任务引擎、样例任务与 Mock 核验

**文件：**
- 创建：`apps/desktop-plugins/browser/src/task-types.ts`
- 创建：`apps/desktop-plugins/browser/src/task-engine.ts`
- 创建：`apps/desktop-plugins/browser/src/task-engine.test.ts`
- 创建：`apps/desktop-plugins/browser/src/ai-verifier.ts`
- 创建：`apps/desktop-plugins/browser/src/task-source.ts`
- 创建：`apps/desktop-plugins/browser/src/task-source.test.ts`
- 创建：`apps/desktop-plugins/browser/src/tasks/sample.blank.json`

- [ ] **步骤 1：写入失败的引擎与任务源测试**

`task-engine.test.ts` 使用假 driver：记录 `{ target, method, args }`，`newPage` 返回 `'page-1'`。`MockAiVerifier` 可在测试里换成自定义实现。

用例：

1. 两步 `context.newPage` + `page.goto(['about:blank'])` 且第二步 `verify: true` → driver 被调用两次，verifier 被调用一次，结果 `{ ok: true }`。
2. `goto` throw `new Error('boom')`，verifier 返回 `{ action: 'abort', code: 'internal' }` → `{ ok: false, error: { code: 'internal', message: 'boom' } }`。
3. `goto` throw，verifier 返回 `{ action: 'patch', patchSteps: [{ id: 'retry', target: 'page', method: 'goto', args: ['about:blank'] }] }` → 最终 `ok: true`，driver 调用含补救 `goto`。

`task-source.test.ts`：

- `BuiltinTaskSource.getTask('sample.blank')` 返回 id 为 `sample.blank` 的文档。
- `HttpTaskSource` 在 `baseUrl` 为 `null` 时 `getTask('remote-1')` 得到 `unavailable`。

- [ ] **步骤 2：运行测试确认失败**

运行：`pnpm exec vitest run --dom apps/desktop-plugins/browser/src/task-engine.test.ts apps/desktop-plugins/browser/src/task-source.test.ts`

预期：FAIL。

- [ ] **步骤 3：实现引擎与任务源**

`PlaywrightDriver`：

```ts
export interface PlaywrightDriver {
  invoke: (target: 'browser' | 'context' | 'page', method: string, args: unknown[]) => Promise<unknown>;
}
```

`AiVerifier`：

```ts
export interface VerifyInput {
  errorMessage?: string;
  stepId: string;
  url?: string;
}

export type VerifyResult =
  | { action: 'abort'; code: 'internal' | 'user_cancelled' }
  | { action: 'continue' }
  | { action: 'patch'; patchSteps: TaskStep[] };

export interface AiVerifier {
  verify: (input: VerifyInput) => Promise<VerifyResult>;
}
```

`MockAiVerifier.verify` 永远 `{ action: 'continue' }`。

`runTask({ task, driver, verifier })`：

- 对每个 step 调用 `driver.invoke`。
- `target === 'context' && method === 'newPage'` 且成功时，后续 `page` 目标可用（假 driver 不需要真对象，引擎只要继续把 `page` 传下去）。
- 步骤成功且 `verify === true`：`verifier.verify({ stepId })`。
- 步骤 throw：先 `verify({ stepId, errorMessage })`，再按结果 abort / patch / continue（continue 在 throw 之后视为忽略错误并进入下一步，仅当 verifier 明确 continue）。
- patch 把步骤插入当前失败步之后立即执行，执行完再继续原后续步骤；patch 步默认 `verify: false`。

`sample.blank.json`：

```json
{
  "id": "sample.blank",
  "steps": [
    { "id": "new-page", "target": "context", "method": "newPage", "args": [] },
    {
      "id": "goto-blank",
      "target": "page",
      "method": "goto",
      "args": ["about:blank"],
      "verify": true
    }
  ]
}
```

`BuiltinTaskSource` 构造时注入 `Record<string, TaskDocument>`（测试传入对象字面量；`process-main.ts` 把 `sample.blank.json` 解析后传入，esbuild 会把 JSON 打进插件 bundle）。`getTask` 只认识 map 里的 id，其它返回 `invalid_argument`。

`HttpTaskSource({ baseUrl, fetchFn })`：`baseUrl` 空则所有请求返回 `unavailable`。非空则 `GET ${baseUrl}/desktop-plugins/browser/tasks/${taskId}`，解析 `{ code, data }`，`code !== 0` 当 `invalid_argument`。

- [ ] **步骤 4：运行测试确认通过**

运行：`pnpm exec vitest run --dom apps/desktop-plugins/browser/src`

预期：PASS。

- [ ] **步骤 5：Commit**

```bash
git add apps/desktop-plugins/browser
git commit -m "$(cat <<'EOF'
feat(@ai-butler/desktop-plugin-browser): 添加混合任务引擎与样例任务

EOF
)"
```

---

### 任务 6：插件进程、PluginHost、打包与 capability

**文件：**
- 创建：`apps/desktop-plugins/browser/src/process-main.ts`
- 创建：`apps/desktop-plugins/browser/src/playwright-driver.ts`
- 创建：`apps/desktop-plugins/browser/src/stealth.ts`
- 创建：`apps/desktop/plugins.json`
- 创建：`apps/desktop/scripts/emit-browser-plugin.mjs`
- 创建：`apps/desktop/src/main/plugins/consent-store.ts`
- 创建：`apps/desktop/src/main/plugins/consent-store.test.ts`
- 创建：`apps/desktop/src/main/plugins/plugin-host.ts`
- 创建：`apps/desktop/src/main/plugins/resolve-plugin-entry.ts`
- 创建：`apps/desktop/src/main/plugins/resolve-plugin-entry.test.ts`
- 修改：`apps/desktop/src/main/index.ts`
- 修改：`apps/desktop/package.json`
- 修改：`apps/desktop/electron-vite.config.ts`
- 修改：`apps/desktop/electron-builder.yml`
- 修改：`apps/desktop/scripts/emit-preload-cjs.mjs`（无需改逻辑，除非 preload 类型构建失败）
- 修改：`CLAUDE.md`

- [ ] **步骤 1：写入失败的同意存储与插件路径测试**

`consent-store.test.ts`：内存 map 实现 `ConsentStore`。`hasConsent('chrome')` 初始 false；`grant('chrome')` 后 true。JSON 文件后端：写入临时目录 `browser-plugin-consent.json` 为 `{ "chrome": true }` 后再读出来为 true。

`resolve-plugin-entry.test.ts`：开发与生产都用相对 main 的同一路径，不要分 asar.unpacked 特例（Electron 会把 `asarUnpack` 的文件映射到该相对路径）：

```ts
it('resolves the plugin next to main in development and production', () => {
  expect(
    resolvePluginEntry({ currentDirectory: '/app/out/main' }),
  ).toBe('/app/out/plugins/browser/index.js');
});
```

- [ ] **步骤 2：运行测试确认失败**

运行：`pnpm exec vitest run --dom apps/desktop/src/main/plugins`

预期：FAIL。

- [ ] **步骤 3：实现宿主、插件入口、构建与 IPC**

**同意：** `userData/browser-plugin-consent.json`。主进程 `session.start` 前若无同意，调用可注入的 `askConsent(): Promise<boolean>`（生产里 `dialog.showMessageBox`，message 为「AI Butler 将复制系统 Chrome/Edge 用户数据到应用目录以保留登录态」）。false → 给 Renderer `{ ok: false, error: { code: 'user_cancelled', message: 'Profile copy was cancelled' } }`。

**PluginHost：** 读取 `plugins.json`；若不含 `"browser"` 则所有 browser IPC 返回 `unavailable`。否则 `utilityProcess.fork(resolvePluginEntry())`，用 Electron `MessagePort`/`postMessage` 适配为 `PluginTransport`（`send` → `child.postMessage`，`onMessage` → `child.on('message')`）。将 Renderer `browser:start` 转为 `session.start` 参数 `{ taskId, browserType }`，不要传绝对路径给 Renderer。插件需要的 `userDataRoot` 由宿主放进 `session.start` 的 params（仅插件进程使用）：`join(app.getPath('userData'), 'browser-profiles')`。

**IPC 校验：** 复用 `isTrustedSender`。`browserType` 只允许 `chrome` | `edge`，否则 `invalid_argument`。已有非 idle 会话再 start → `conflict`。`stop` 在 idle 时 `{ ok: true, data: { stopped: true } }`。

**capability：** `registerRuntimeHandler` 的 `capabilities` 在插件已启用且进程能解析到入口文件时包含 `'runtime.info'` 与 `'browser.session'`，否则只有 `'runtime.info'`。

**插件 `process-main.ts`：** 监听 parent message，`parseEnvelope`，处理：

- `ping` → `{ pong: true }`
- `session.start`：`findInstalledBrowser`（真实 `existsSync`/`homedir`/`platform`）；null → `unavailable`，message `Install Google Chrome to continue` 或 `Install Microsoft Edge to continue`。然后 `copyProfile` 到 `join(userDataRoot, browserType)`。然后 `chromium.launchPersistentContext`（`channel`、`headless: false`、`ignoreDefaultArgs: ['--no-sandbox']`、`locale: 'zh-CN'`、`timezoneId: 'Asia/Shanghai'`），`addInitScript` 使用 `stealth.ts` 导出的脚本（内容对齐 `ui-demo/launch-browser.mjs` 的 `STEALTH_SCRIPT`：去掉 `webdriver`、删除 `cdc_` / `__playwright` 全局）。构造 `PlaywrightDriver` 调真实 context/page。`BuiltinTaskSource` 处理 `sample.*`，其它走 `HttpTaskSource`（`process.env.AI_BUTLER_BROWSER_TASK_API || null`）。Verifier：`process.env.AI_BUTLER_BROWSER_VERIFY_API` 为空则 Mock。跑完 `context.close()`。
- `session.stop`：关闭 context（已关则忽略）。
- `session.getState`：返回当前快照。

进程内同时只接受一个 session。

**esbuild 脚本** `apps/desktop/scripts/emit-browser-plugin.mjs`：入口 `apps/desktop-plugins/browser/src/process-main.ts`，outfile `apps/desktop/out/plugins/browser/index.js`，`platform: 'node'`，`format: 'esm'`，`bundle: true`，`external: ['playwright', 'playwright-core', 'electron']`。JSON 样例打进 bundle。

desktop `package.json`：

- `dependencies`: `"playwright": "catalog:"`、`"@ai-butler/desktop-plugin-protocol": "workspace:*"`
- `scripts.dev` 在 wait-on 之前加上 `node ./scripts/emit-browser-plugin.mjs`
- `scripts.build` 在 electron-vite 之前加上同一句

`electron-vite.config.ts`：main 增加 alias `@ai-butler/desktop-plugin-protocol` 指向 `apps/desktop-plugins/protocol/src/index.ts`，并 `ssr.noExternal` / `externalizeDeps.exclude` 同样列入。

`electron-builder.yml`：

```yaml
asarUnpack:
  - out/plugins/browser/**/*
  - '**/node_modules/playwright/**'
  - '**/node_modules/playwright-core/**'
```

`plugins.json`：`{ "plugins": ["browser"] }`。

`index.ts`：`whenReady` 里在现有 handler 之后 `registerBrowserHandlers()`。

**CLAUDE.md** 仓库表增加一行：`apps/desktop-plugins/` 存放桌面原生插件；`browser` 用 Playwright 驱动系统 Chrome/Edge。说明页面只走 `platformApi.browser`，未安装浏览器不会回退内置 Chromium。

- [ ] **步骤 4：运行测试与类型检查**

```bash
pnpm exec vitest run --dom apps/desktop-plugins/protocol apps/desktop-plugins/browser apps/desktop/src apps/web-antd/src/platform
pnpm --filter @ai-butler/desktop-plugin-protocol typecheck
pnpm --filter @ai-butler/desktop-plugin-browser typecheck
pnpm --filter @ai-butler/desktop typecheck
pnpm --filter @ai-butler/platform-api typecheck
pnpm --filter @ai-butler/desktop build
```

预期：单测 PASS；desktop build 生成 `apps/desktop/out/plugins/browser/index.js` 与 preload cjs。不要跑 `dist:mac`。不要在 CI 单测里启动 Chrome。

若 `check:dep` 报 desktop 的 playwright 未使用：插件进程在运行时 `import('playwright')`，desktop 源码可能没有静态 import。在 `apps/desktop/src/main/plugins/playwright-runtime-dep.ts` 写：

```ts
/** 声明打包依赖，供插件进程解析。 */
export const PLAYWRIGHT_PACKAGE = 'playwright' as const;
```

并在 `plugin-host.ts` 导入该常量（不必动态 import 模块）。

- [ ] **步骤 5：Commit**

```bash
git add apps/desktop apps/desktop-plugins/browser packages/platform-api CLAUDE.md pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
feat(@ai-butler/desktop): 接入 browser 插件进程与会话 IPC

EOF
)"
```

---

## 手工验收（实现完成后由开发者在本机执行，不写入 CI）

```bash
pnpm dev:desktop
```

在桌面端开发窗口的 DevTools 执行：

```js
await window.desktop.browser.start({ taskId: 'sample.blank', browserType: 'chrome' })
```

- 本机无 Chrome：返回 `unavailable`，文案要求安装 Google Chrome。
- 有 Chrome：原生同意框 → 复制 profile → 弹出系统 Chrome 并打开 `about:blank`。
- 重复 start：`conflict`。
- `await window.desktop.browser.stop()` 后窗口关闭，可再次 start。

Edge 将 `browserType` 换成 `'edge'` 再测一次。

## 自检

| 规格章节 | 任务 |
| --- | --- |
| 目录与 workspace | 1、4 |
| 协议信封 / 宿主方法白名单 | 1、2、6 |
| platformApi 与 Web unsupported | 3 |
| Chrome/Edge 检测、未安装不回退 | 4、6 |
| profile 复制过滤与同意 | 4、6 |
| 混合引擎、sample.blank、HTTP 任务源占位 | 5 |
| utilityProcess、打包、capability、CLAUDE.md | 6 |
| Firefox / 获客页面 / 应用市场 | 刻意不做 |
