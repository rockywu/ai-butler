# 桌面插件宿主与 browser 模块设计规格

## 1. 文档状态

- 日期：2026-09-02
- 状态：已确认，作为实现计划输入
- 前置文档：[AI Butler Web 与 Electron 桌面端设计规格](./2026-09-02-ai-butler-desktop-design.md)
- 目标平台：Windows x64、macOS x64/arm64

## 2. 背景与目标

桌面端需要一批只能在客户端完成的能力（网页自动化、后续可能的本地外设等）。这些能力不能写进 Vue Renderer，也不能全部堆进 Electron 主进程。

本规格建立：

- `apps/desktop-plugins/`：按模块存放需要客户端支持的插件；
- 第一个插件 `browser`：用 Playwright 驱动本机已安装的 Chrome 或 Edge，执行自动化任务；
- 编译期配置把启用的插件打进 `apps/desktop`；
- Renderer 只通过 `platformApi` 白名单会话接口调用，不能下发任意 Playwright 方法。

## 3. 已确认的产品决策

| 决策 | 选择 |
| --- | --- |
| 插件运行方式 | 宿主主进程 + 独立插件进程（方案 2） |
| Playwright 对谁可见 | 仅插件进程内部的任务引擎；页面不可见 |
| 任务循环 | 混合：主命令流走稳定路径；核验失败或步骤报错时 AI 生成补救 RPC，再接回主流程 |
| 命令流来源 | 插件内置样例任务 + 预留按 `taskId` 向后端拉取的接口 |
| 系统浏览器 | 第一版打通 Chrome 与 Edge；Firefox 类型可声明，实现返回 `unsupported` |
| 登录态 | 复制系统 profile 到应用数据目录，再 `launchPersistentContext` |
| 未安装浏览器 | 不回退 Playwright 自带 Chromium；返回 `unavailable`，桌面提示安装 |
| 并发 | 同时只允许一个 browser 会话 |
| 窗口 | headed（有界面） |
| 首次复制 profile | 主进程原生对话框征求同意；拒绝则 `user_cancelled` |

## 4. 非目标

本轮不做：

- Firefox 抽取、复制或启动；
- 把 Playwright 自带 Chromium 打进安装包；
- 运行时应用市场 / 热插拔下载插件；
- 智能获客页面接入（只提供 `platformApi`，页面可后接）；
- 完整反检测策略调参（除沿用原型中的 `webdriver` 清理脚本）；
- 通用 `invoke(channel, payload)`；
- 让 Renderer 读取 cookie、profile 路径、截图原图或 Playwright handle；
- 同时运行多个自动化浏览器会话；
- Linux 桌面。

## 5. 目录与打包

```text
apps/desktop-plugins/
  protocol/     # @ai-butler/desktop-plugin-protocol
  browser/      # @ai-butler/desktop-plugin-browser
apps/desktop/
  plugins.json
  src/main/plugins/   # PluginHost
```

`pnpm-workspace.yaml` 增加 `apps/desktop-plugins/*`。每个插件是独立 package。

### 5.1 Manifest

每个插件 `package.json` 的 `aiButlerPlugin` 字段：

```json
{
  "id": "browser",
  "protocolVersion": 1,
  "entry": "dist/index.js"
}
```

### 5.2 `plugins.json`

编译期开关，不是运行时市场：

```json
{
  "plugins": ["browser"]
}
```

未列出的插件不进入安装包，Desktop `runtime.getInfo()` 也不报告对应 capability。

### 5.3 产物

- `browser` 包用 esbuild 打成单文件 `apps/desktop/out/plugins/browser/index.js`，`playwright` / `electron` 保持 external。
- PluginHost 无论开发还是生产都 `fork` 该文件（相对 main 为 `../plugins/browser/index.js`）。
- `@ai-butler/desktop` 声明 `playwright` 依赖，供插件进程解析模块。
- `electron-builder` 对 `playwright`、`playwright-core` 以及 `out/plugins/browser/**` 做 `asarUnpack`。不打包 Chromium 二进制。
- 插件进程是普通 Node 入口，不创建 BrowserWindow，不加载 Vue。
- `plugins.json` 仍控制是否执行上述插件构建与 unpack；未启用则不生成 `out/plugins/browser`，也不报告 capability。

### 5.4 依赖方向

```text
web-antd → @ai-butler/platform-api
apps/desktop main → protocol + 拉起插件进程
browser 插件 → protocol + playwright
插件不得依赖 Vue、web-antd 或 @ai-butler/desktop
```

`packages/platform-api` 仍然不得依赖 Node、Electron 或 Playwright。

## 6. 进程、通道与 platformApi

### 6.1 三条通道

```text
Renderer --固定 IPC--> Electron main (PluginHost)
PluginHost --JSON 信封--> browser 插件进程
插件进程 --HTTP--> 可选的任务 API / AI 核验 API
```

三种通道的消息类型不共用。页面不能把 Playwright 方法名塞进 IPC。

### 6.2 Renderer ↔ main

沿用现有固定通道模型。新增：

| 通道 | 方向 | 作用 |
| --- | --- | --- |
| `browser:start` | invoke | 启动会话 |
| `browser:stop` | invoke | 停止会话 |
| `browser:get-state` | invoke | 查询快照 |
| `browser:progress` | main → renderer | 进度事件 |

`start` 入参：

```ts
{ taskId: string; browserType: 'chrome' | 'edge' }
```

`taskId` 以 `sample.` 开头时走内置样例；否则走后端任务接口。

出参一律 `PlatformResult<T>`。页面拿不到 Playwright handle、profile 绝对路径、cookie、截图。

进度事件只含：`sessionId`、`state`、`taskId`、`stepId`（可选）、`message`（脱敏短句）。

### 6.3 main ↔ 插件进程

Electron `utilityProcess.fork`（测试用可注入的 `PluginTransport` 替代）。消息是带 `v`、`kind`、`id` 的 JSON 信封。

宿主可调用的方法仅限：

- `ping`
- `session.start`
- `session.stop`
- `session.getState`

完整 Playwright RPC（对象 handle + 方法名 + JSON 参数）只存在于插件进程内部，不出现在这条协议上。

插件崩溃：宿主把会话标为 `failed`，错误码 `unavailable`，不重启主窗口。用户可再次 `start`。

manifest 的 `protocolVersion` 与宿主常量不一致则不拉起插件，capability 不出现。

### 6.4 platformApi

`PlatformApi` 与 `DesktopBridge` 增加 `browser: BrowserSessionApi`。

```ts
interface BrowserSessionApi {
  start: (request: BrowserStartRequest) => Promise<PlatformResult<BrowserSessionSnapshot>>;
  stop: () => Promise<PlatformResult<{ stopped: true }>>;
  getState: () => Promise<PlatformResult<BrowserSessionSnapshot>>;
  onProgress: (handler: (event: BrowserProgressEvent) => void) => () => void;
}
```

会话状态：`idle | preparing | running | verifying | stopping | failed`。

`idle` 时 `getState` 返回 `{ sessionId: null, state: 'idle', taskId: null, browserType: null }`。

capability 名：`browser.session`。

- Web Adapter：`start` / `stop` / `getState` 返回 `unsupported`；`onProgress` 返回空 unsubscribe。
- Desktop 未打包 browser 或协议不匹配：同样视为无此 capability，调用返回 `unavailable`。
- 本轮 `PLATFORM_PROTOCOL_VERSION` 保持 `1`（应用尚未对外发布，桥接与 Adapter 同步增加字段）。

## 7. 检测、同意、复制 profile、启动

启动顺序固定，任一步失败都不得启动浏览器：

1. 校验 `browserType` 与是否已有会话（已有则 `conflict`）。
2. 检测本机是否安装对应浏览器可执行文件。未找到 → `unavailable`，message 写明要安装 Chrome 还是 Edge。
3. 若该浏览器类型尚未同意复制 profile：主进程 `dialog.showMessageBox` 说明将复制系统用户数据到应用目录。取消 → `user_cancelled`。同意写入 `userData/browser-plugin-consent.json`。
4. 将系统 user data 目录复制到 `userData/browser-profiles/<browserType>/`。跳过锁文件与 GPU 缓存：`SingletonLock`、`SingletonCookie`、`SingletonSocket`、`GrShaderCache`、`ShaderCache`、`GraphiteDawnCache`。已有副本则覆盖复制（与 `launch-browser.mjs` 的固定副本一致，保证登录态更新可刷新）。
5. 插件进程用 Playwright `chromium.launchPersistentContext(copiedDir, { channel, headless: false })`。`chrome` → `channel: 'chrome'`；`edge` → `channel: 'msedge'`。`ignoreDefaultArgs` 包含 `--no-sandbox`。locale `zh-CN`，timezone `Asia/Shanghai`。
6. 对 context `addInitScript` 注入与 `ui-demo/launch-browser.mjs` 相同原则的 `webdriver` 清理脚本（只清自动化痕迹，不改指纹）。
7. 进入任务引擎。

系统 profile 路径：

| 系统 | Chrome user data | Edge user data |
| --- | --- | --- |
| macOS | `~/Library/Application Support/Google/Chrome` | `~/Library/Application Support/Microsoft Edge` |
| Windows | `%LOCALAPPDATA%/Google/Chrome/User Data` | `%LOCALAPPDATA%/Microsoft/Edge/User Data` |

可执行文件检测按常见安装路径 + `existsSync`；测不到则视为未安装，即使 Playwright 稍后可能自己找到。

复制与启动都在插件进程做，避免主进程被几百 MB 拷贝卡住。同意对话框必须在主进程，因为只有它能弹原生 UI。

## 8. 任务引擎与 AI 核验

### 8.1 任务文档

```ts
interface TaskDocument {
  id: string;
  browserType?: 'chrome' | 'edge';
  steps: TaskStep[];
}

interface TaskStep {
  id: string;
  target: 'browser' | 'context' | 'page';
  method: string;
  args: unknown[];
  verify?: boolean;
}
```

`target` 映射到引擎持有的 Playwright 对象。`newPage` 成功后把返回值登记为当前 `page`。`evaluate` 的函数参数只允许字符串源码，不允许传递闭包。

第一版内置一份样例：`sample.blank`，步骤为 `context.newPage` + `page.goto('about:blank')`，第二步 `verify: true`。

非 `sample.` 前缀的 `taskId` 由 `HttpTaskSource` 向配置 URL 拉取（`GET {base}/desktop-plugins/browser/tasks/{taskId}`，响应仍是 `{ code, data, message }`，`successCode = 0`）。未配置 base URL 时返回 `unavailable`。

### 8.2 混合循环

1. 按 `steps` 顺序调用内部 Playwright RPC。
2. 步骤成功且 `verify === true`：进入 `verifying`，调用 `AiVerifier.verify`。
3. 步骤抛错：同样进入核验，把错误消息交给 verifier。
4. verifier 返回：
   - `continue`：继续下一步；
   - `abort`：会话 `failed`，`user_cancelled` 或 `internal`（按 verifier 的 `code`）；
   - `patch`：把 `patchSteps` 插入到当前步之后、原后续步骤之前，执行完补救再继续主流程。
5. 全部完成：`stop` 浏览器 context，状态回到 `idle`（正常结束不保持僵尸 Chrome）。

`AiVerifier` 是端口：

- `MockAiVerifier`：永远 `continue`，供样例和单元测试。
- `HttpAiVerifier`：POST 配置 URL，body 只含 `url`、`stepId`、`errorMessage`（可选）。**不发送 cookie、profile 路径、完整 DOM、截图原图。** 未配置 URL 时行为与 Mock 相同。

本轮不把真实模型供应商写进桌面壳。

## 9. 错误处理

沿用 `PlatformError.code`。映射：

| 场景 | code |
| --- | --- |
| Web 或未打包插件 | `unsupported` / `unavailable` |
| 未安装 Chrome/Edge | `unavailable` |
| 已有会话未结束 | `conflict` |
| `browserType` 非法或 `firefox` | `invalid_argument` / `unsupported` |
| 用户拒绝复制 profile | `user_cancelled` |
| 复制失败、Playwright 启动失败、插件崩溃 | `unavailable` 或 `internal` |
| 任务拉取超时 | `timeout` |
| 后端任务不存在 | `invalid_argument` |

错误 `message` 给用户看，不包含本机绝对路径、cookie、token。主进程日志可含 correlation id，不含完整 profile 路径中的用户名以外的敏感文件内容。

`stop` 在 `idle` 时仍返回 `ok: true`（幂等）。

## 10. 测试

必须覆盖、且不依赖本机真的装了 Chrome：

- 协议信封编解码与拒绝错误版本；
- PluginClient 请求/响应/超时/子进程退出；
- Web Adapter 对 `browser.*` 返回 `unsupported`；
- Desktop Adapter 在无 bridge / 协议不匹配时失败；
- Chrome/Edge 路径检测（注入 `exists` 与 `env`）；
- profile 复制过滤锁文件与缓存目录名；
- 任务引擎：成功路径、步骤失败走 verifier、`patch` 插入、`abort`；
- Mock verifier；HttpTaskSource 在未配置 URL 时 `unavailable`。

不在 CI 里启动真实 Chrome/Edge。有系统浏览器的手工验收：`sample.blank` 能打开窗口并访问 `about:blank`。

## 11. 验收标准

- `apps/desktop-plugins/protocol` 与 `browser` 存在且为 workspace 包。
- `plugins.json` 可控制是否把 browser 打进 Desktop。
- Renderer 只能 `start` / `stop` / `getState` / `onProgress`。
- 未安装指定浏览器时不启动 Playwright 自带浏览器，并返回可展示的 `unavailable`。
- 同意后复制系统 Chrome 或 Edge profile，再 headed 启动对应系统浏览器。
- 内置 `sample.blank` 可跑通；后端任务接口存在但无 URL 时不误调用。
- Playwright 崩溃不拖垮 Electron 主窗口。
- Web 构建不含 Playwright、不含插件进程。
