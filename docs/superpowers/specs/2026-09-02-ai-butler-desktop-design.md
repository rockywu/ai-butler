# AI Butler Web 与 Electron 桌面端设计规格

## 1. 文档状态

- 日期：2026-09-02
- 状态：设计已确认，等待书面规格审查
- 前置文档：[骨架设计](./骨架设计.md)
- 目标平台：Web、Windows x64、macOS x64/arm64、Linux x64 AppImage

## 2. 背景与目标

AI Butler 当前基于 Vue 3、Vite、Vben Admin 和 Ant Design Vue 开发。业务界面采用定制布局，但仍需要 Vben Form、VXE Table、动态菜单、权限、标签页、偏好设置、状态管理和请求封装。

产品需要同时提供 Web 客户端和 Electron 桌面客户端。桌面端是在线增强型客户端，增加系统托盘、通知、开机启动、自动更新、深链和受控辅助窗口，不承担完整离线业务。

本设计的目标是：

- Web 与 Desktop 复用同一个 Vue Renderer 源码；
- 保留需要的 Vben 基础设施，同时替换默认视觉外壳；
- 通过 `platformApi` 隔离浏览器与 Electron 能力；
- 建立明确的 Electron 安全边界；
- 支持三端可重复构建、签名、灰度和更新；
- 形成可单独测试的模块边界。

## 3. 非目标

首版不实现：

- 完整离线业务和双向数据冲突同步；
- 任意业务路由独立开窗；
- Electron 主窗口直接加载线上 Web；
- Renderer 直接使用 Node.js、Electron 或通用 IPC；
- 将 Vben 拆成若干孤立 npm 组件重新组装；
- Windows arm64、Linux arm64、deb 或 rpm 安装包；
- 自动降级到旧版本；
- 浏览器 SSO（首版明确不支持，仅保留未来扩展边界）。

## 4. 总体架构

采用单一产品 monorepo、单一 Renderer 和独立 Electron 壳：

```text
ai-butler/
├── apps/
│   ├── web-antd/              # Web/Desktop 共用 Renderer
│   └── desktop/               # Electron main、preload、打包
├── packages/
│   ├── platform-api/          # 纯 TypeScript 平台契约
│   ├── @core/                 # Vben 核心包
│   ├── effects/               # Vben 集成层
│   └── 其他 Vben 通用包
├── internal/
├── scripts/
├── ui-demo/
└── docs/
```

依赖方向：

```text
Vue 页面 / Pinia Store / 业务服务
→ platformApi
  → WebPlatformAdapter
    → 浏览器 API 或明确降级
  → DesktopPlatformAdapter
    → window.desktop
    → preload
    → 独立 main service
```

依赖只能沿上述方向流动。Vben Renderer 不导入 Electron；主进程不导入 Vue 页面或 Pinia Store；`packages/platform-api`不依赖 Vue、Node.js 或 Electron。

## 5. Vben 使用边界

继续保留：

- Vben Form；
- VXE Table 及适配器；
- 动态路由、菜单、权限；
- 标签页和偏好设置；
- Pinia、请求拦截器和国际化；
- 通用组件及现有 workspace 分层。

定制或替换：

- 主布局；
- 侧边导航和顶部区域；
- 品牌视觉；
- 业务页面结构；
- Electron 窗口相关入口。

内部 `@vben/*`包名在仓库迁移阶段保持不变，避免与 Electron 建设无关的大规模重命名。

## 6. 构建与产物

### 6.1 工具职责

- `apps/web-antd`继续使用现有 Vben Vite 配置构建 Renderer；
- `apps/desktop`使用 `electron-vite`构建 main 和 preload；
- `electron-builder`组合 Desktop Renderer、main 和 preload，并生成安装包；
- Turbo 负责编排任务依赖和缓存；
- pnpm 是唯一包管理器。

`electron-vite`不创建第二套 Renderer。

### 6.2 开发模式

Desktop 开发流程：

1. 启动 `web-antd` Vite 开发服务器；
2. 启动 main/preload 监听构建；
3. Electron 开发窗口加载配置中的本地 Vite URL；
4. Vue 页面使用 HMR；
5. main/preload 变化时重启 Electron；
6. 开发环境只信任该次配置的本地 Vite origin。

Web 开发继续使用独立的 `dev:web`命令。

### 6.3 生产构建

生产构建顺序：

1. `web-antd`以 `desktop` mode 构建 Renderer；
2. `electron-vite`构建 main 和 preload；
3. `electron-builder`把三类产物打包；
4. 主进程通过注册为 standard、secure 的 `app://`协议加载 Renderer；
5. Desktop 使用 hash 路由；
6. 生产环境不保留远程开发地址回退。

产物目录：

```text
apps/web-antd/dist/web/
apps/web-antd/dist/desktop/
apps/desktop/out/main/
apps/desktop/out/preload/
apps/desktop/release/
```

根命令：

- `dev:web`
- `dev:desktop`
- `build:web`
- `build:desktop`
- `dist:desktop`

桌面打包任务必须依赖 Desktop Renderer、main 和 preload 构建完成。Web 与 Desktop 使用同一运行时配置模型，分别注入 API 地址、运行目标和版本号。业务代码不得通过 User-Agent 判断平台。

## 7. Electron 生命周期

### 7.1 启动顺序

1. 获取 single-instance lock；
2. 若获取失败，把启动参数交给已有实例并退出；
3. 注册 `open-url`、`second-instance`等早期事件；
4. 把早到的深链放入内存队列；
5. `app.whenReady()` 后初始化日志、安全存储和 `app://`协议；
6. 创建 `WindowManager`、主窗口和托盘；
7. Renderer 完成 ready 握手后消费深链队列；
8. 延迟启动更新检查等非关键服务。

### 7.2 退出与恢复

- Windows/Linux 关闭最后一个业务窗口时隐藏到托盘；
- macOS 关闭窗口后保持应用运行；
- 托盘“退出”和系统退出设置 `isQuitting`，然后销毁窗口；
- 系统关机流程不得被隐藏到托盘逻辑阻止；
- 点击托盘、Dock 或再次启动时恢复并聚焦已有主窗口。

## 8. WindowManager 与窗口模型

`WindowManager`是唯一允许创建 `BrowserWindow` 的模块。

首版采用单业务窗口：

- 所有业务页面在主窗口内切换；
- 受控辅助窗口只用于登录或系统交互；
- 不允许任意业务路由独立开窗；
- 视频预览和详情优先使用页面内弹窗或抽屉。

每种窗口类型固定：

- BrowserWindow 安全配置；
- 允许加载的页面；
- preload 能力集合；
- 尺寸和生命周期；
- 是否共享持久化 session partition。

业务调用只提交窗口类型和受限 DTO，不提交 URL。辅助窗口按类型获得最小 preload 能力，不继承主窗口全部权限。

所有窗口共享同一持久化 session partition。Pinia 内存状态不在窗口间直接同步；共享数据来自服务端、主进程安全存储或明确的窗口事件。

## 9. platformApi

### 9.1 契约

`packages/platform-api`定义：

- 接口；
- DTO；
- capability；
- 统一结果和错误；
- 事件订阅契约；
- `protocolVersion`。

核心结构：

```ts
interface PlatformApi {
  readonly protocolVersion: number;
  readonly runtime: RuntimeApi;
  readonly notification: NotificationApi;
  readonly window: WindowApi;
  readonly deepLink: DeepLinkApi;
  readonly updater: UpdaterApi;
  readonly secureStorage: SecureStorageApi;
  readonly app: AppApi;
}
```

所有异步平台调用返回：

```ts
type PlatformResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: PlatformError };
```

`PlatformError.code`限定为：

- `unsupported`
- `invalid_argument`
- `permission_denied`
- `user_cancelled`
- `unavailable`
- `timeout`
- `conflict`
- `internal`

错误不得包含原生堆栈、敏感路径、Token 或 IPC 内部信息。

### 9.2 能力探测

`runtime.getInfo()`返回：

- Web 或 Desktop；
- 操作系统和架构；
- 应用版本；
- `protocolVersion`；
- capability 集合。

页面通过 capability 控制功能入口。Web Adapter 对桌面专属能力返回 `unsupported`，不模拟不存在的能力。

### 9.3 初始化

应用启动时根据构建期 `VITE_RUNTIME_TARGET`创建一次 Adapter。`platformApi`作为普通 TypeScript 单例服务初始化，供组件、Store、路由守卫和业务服务共同使用。

Desktop Adapter 启动时校验 preload 的 `protocolVersion`。不匹配时关闭桌面能力并展示可恢复错误，不继续发送未知 IPC。

所有事件订阅返回幂等 `unsubscribe()`。测试使用 `FakePlatformAdapter`。

## 10. preload 与 IPC

preload 通过 `contextBridge.exposeInMainWorld('desktop', bridge)`暴露冻结后的白名单桥。只有 Desktop Adapter 使用该对象。

IPC 类型：

- 请求/响应：`ipcRenderer.invoke`与 `ipcMain.handle`；
- 主进程事件：`webContents.send`与 preload 白名单订阅函数。

规则：

- 每项能力使用固定通道；
- 禁止通用 `invoke(channel, payload)`；
- 禁止动态拼接通道；
- 通道常量、DTO 和运行时 schema 由共享契约维护；
- preload 校验一次，主进程再次校验；
- 主进程 handler 只负责校验、调用 service 和转换结果；
- service 通过依赖注入获得窗口、存储和日志能力。

主进程必须校验：

- 调用来自顶层 frame；
- 生产环境来源是受信任 `app://` origin；
- 开发环境来源是配置中的本地 Vite origin；
- 参数符合 schema 和大小限制；
- 当前窗口类型和用户状态允许调用。

额外安全策略：

- 开启 `contextIsolation`；
- 关闭 `nodeIntegration`；
- 拒绝非白名单导航和新窗口；
- 权限请求默认拒绝；
- CSP 禁止 `unsafe-eval`；
- Renderer 不可访问任意文件、SQL、Shell 或进程执行；
- 窗口销毁时清理事件订阅；
- 高频事件进行限流；
- IPC 日志不记录完整 payload。

## 11. 托盘、通知与开机启动

### 11.1 托盘

`TrayService`由主进程持有。菜单只包含：

- 打开 AI Butler；
- 当前版本；
- 开机启动开关；
- 检查更新；
- 退出应用。

Renderer 不得传入任意菜单结构。动态状态通过受控模型更新。托盘点击统一交给 `WindowManager`。

### 11.2 通知

只支持预定义业务通知类型，例如：

- `lead.received`
- `chat.handover-required`
- `task.completed`
- `task.failed`
- `update.ready`

每种通知都有独立 payload 类型和运行时 schema。Renderer 只提交通知类型、结构化参数和业务实体 ID。主进程负责：

- 根据当前语言生成标题和正文；
- 过滤、截断敏感字段；
- 节流和去重；
- 根据前台状态决定是否抑制；
- 将点击行为映射到白名单内部页面；
- 避免把正文写入普通日志。

通知不能携带任意 URL 或 HTML。

### 11.3 开机启动

开机启动默认关闭，由用户主动开启。

- Windows/macOS 使用系统登录项；
- Linux AppImage 使用用户级 autostart desktop entry；
- 修改后重新读取系统实际状态；
- AppImage 路径变化时修复启动项；
- 卸载或禁用时清理启动项。

设备级偏好存放在主进程配置存储中，不进入 Pinia 持久化。

## 12. 深链

协议为 `ai-butler://`。首版允许：

```text
ai-butler://open/chat?conversationId=<id>
ai-butler://open/task?taskId=<id>
ai-butler://auth/callback?code=<code>
```

认证回调只预留契约，应用内登录首版不启用该入口。

处理流程：

1. 使用标准 URL parser；
2. 校验 scheme、host、path、参数 schema 和长度；
3. 转换为内部 `NavigationIntent`；
4. 应用未 ready 时排队；
5. Renderer 未 ready 时等待握手；
6. 未登录时保留一个最新且未过期的 intent；
7. 登录完成后导航；
8. 重复、过期、无权限 intent 被丢弃并记录原因。

原始深链永远不直接传给 Vue Router。深链只恢复主窗口，不创建任意业务窗口。

## 13. 本地数据与认证

### 13.1 数据范围

服务端是业务数据唯一权威来源。首版本地只保存：

- 设备级设置；
- 可重建的非敏感 UI 缓存；
- refresh token 的加密表示。

不引入 SQLite。

### 13.2 Token

- access token 生命周期较短，只保存在内存；
- access token 不进入 Pinia 持久化、localStorage、日志或 IPC 事件；
- Web refresh token 使用 `HttpOnly + Secure + SameSite` Cookie；
- Desktop refresh token 交给主进程并使用 `safeStorage`加密；
- 加密结果写入应用数据目录；
- refresh token 不通过读取接口返回 Renderer；
- Desktop 刷新请求由主进程受限认证 service 执行，只向 Renderer 返回新的 access token；
- 登出、refresh 失效和账号切换清除凭证及用户级缓存。

`secureStorage`不是通用键值接口。首版只提供认证模块所需的窄接口：保存 refresh token、刷新 access token、清除凭证和查询凭证状态。

Linux 必须检查 `safeStorage.getSelectedStorageBackend()`。若只有 `basic_text`，不得持久化 refresh token，应用退化为当前会话有效，并提示系统密钥环不可用。

### 13.3 设置与迁移

非敏感设备设置使用带 schema 和版本号的原子 JSON 存储，可使用 `electron-store`。窗口位置恢复前限制到当前可用屏幕。

Renderer 的 IndexedDB/localStorage 只保存非敏感 UI 数据。本地记录具有版本号和迁移函数。迁移失败时记录脱敏诊断信息并重建非敏感数据，不影响服务端业务数据。

## 14. 自动更新与发布

### 14.1 产物

- Windows x64：NSIS 和 blockmap；
- macOS x64/arm64：DMG、ZIP 和更新元数据；
- Linux x64：AppImage 和更新元数据。

### 14.2 更新源

使用 `electron-updater` generic provider，对象存储/CDN 托管不可变产物。

流程：

1. 受保护 tag 触发构建；
2. 上传 CDN staging 路径；
3. 校验签名、哈希和三端冒烟测试；
4. 人工审批；
5. 将同一批产物提升到正式频道；
6. 禁止覆盖相同版本文件。

### 14.3 签名

- Windows 使用受信任代码签名证书；
- macOS 使用 Developer ID 签名并完成 notarization；
- 签名密钥只存在于 CI secret 或签名服务；
- Linux 发布校验和。

### 14.4 更新体验

- 应用 ready 后延迟检查；
- 后台下载；
- 下载完成后提示用户；
- 运行任务期间不强制重启；
- 用户选择立即安装或正常退出时安装；
- 更新失败不阻断业务，并提供完整包下载入口。

更新状态机：

```text
idle → checking → available → downloading → ready
```

错误进入 `error`，处理后可返回 `idle`。

### 14.5 灰度与恢复

- 使用 `beta`和 `stable`频道；
- manifest 提供 staged percentage；
- 设备使用稳定匿名 ID 固定分桶；
- 异常时冻结 manifest；
- 已更新客户端通过更高补丁版本修复；
- 不自动降级。

Linux AppImage 不支持原位更新时返回明确 capability，并引导下载新版本。

## 15. 日志、Sentry 与恢复

使用本地结构化日志和 `@sentry/electron`。Sentry 覆盖 main 和 Renderer；preload 只记录初始化与桥接失败。

日志字段：

- 时间和级别；
- 应用版本、平台、进程和模块；
- 操作名、结果码、耗时；
- correlation ID。

不得记录：

- Token、Cookie、Authorization；
- 完整 IPC payload；
- 聊天正文、联系人信息、生成内容；
- 本地绝对路径；
- 签名密钥和下载鉴权参数。

本地日志轮转并限制总大小和保留时间。诊断包导出前二次脱敏。

Sentry：

- development、staging、production 分环境；
- release 与安装包版本一致；
- source map 由 CI 上传，不公开部署；
- `beforeSend`执行二次脱敏；
- 用户可关闭非必要诊断上报；
- 不上传包含敏感内容的内存转储。

恢复策略：

- API 错误由请求层转换；
- `PlatformError`按错误码降级、重试或提示；
- IPC 错误只返回安全错误和 correlation ID；
- Renderer 崩溃时提供重载；
- 连续崩溃进入安全恢复模式并清理非敏感 Renderer 缓存；
- 主进程未捕获异常刷新日志后退出；
- 更新失败不影响业务启动。

## 16. 测试

### 16.1 单元测试

覆盖：

- 业务工具和 Store；
- `platformApi`契约；
- Web/Desktop Adapter；
- DTO schema 和错误映射；
- 深链解析；
- 通知模板；
- 更新状态机；
- 存储迁移。

业务测试使用 `FakePlatformAdapter`。

### 16.2 主进程服务测试

通过依赖注入测试：

- `WindowManager`；
- `TrayService`；
- `NotificationService`；
- 更新服务；
- 认证存储；
- 生命周期状态。

测试不调用真实系统更新、签名或通知服务。

### 16.3 E2E 与桌面冒烟

Web Playwright 覆盖登录、路由、权限和关键业务。

Desktop Playwright Electron 测试覆盖：

- preload 版本握手；
- 主窗口加载；
- IPC 白名单；
- 关闭到托盘；
- 二次启动；
- 深链排队；
- 更新模拟状态；
- Renderer 崩溃恢复入口。

## 17. GitHub Actions

- `quality.yml`：PR 执行依赖检查、lint、类型检查、单元测试、Web 构建、main/preload 构建；
- `web-e2e.yml`：PR 和主分支执行 Web E2E；
- `desktop-smoke.yml`：主分支和发布候选执行 Windows/macOS/Linux 桌面冒烟；
- `release-desktop.yml`：受保护 tag 执行签名、公证、校验、Sentry source map 上传和 staging 发布；
- `promote-release.yml`：人工审批后提升正式频道。

CI 使用 frozen lockfile 和仓库固定的 Node/pnpm 版本。PR 工作流不能访问签名或发布密钥。发布 job 使用最小 GitHub permissions 和受保护 environment。Turbo 不缓存签名产物。

合并门禁要求：

- quality 通过；
- Web E2E 通过；
- 受影响平台的 Desktop smoke 通过。

## 18. 全新单仓库迁移

不保留旧 Git 历史，但迁移过程保留可恢复备份。

迁移步骤：

1. 冻结迁移期间修改；
2. 记录外层仓库和 `client-web`当前 commit、分支及工作树状态；
3. 分别生成本地 Git bundle；
4. 在独立临时目录组装目标树；
5. 以 `client-web`完整工作树为技术底座；
6. 迁入外层 `ui-demo`、`docs`和必要项目配置；
7. 排除 `.git`、`.gitmodules`、旧子模块 Makefile、`.superpowers`、编辑器临时文件和构建产物；
8. 合并 `.gitignore`、README、`CLAUDE.md`和环境变量示例；
9. 根包名改为 AI Butler，保留内部 `@vben/*`包名；
10. 生成迁移前后文件清单和校验和；
11. 执行安装、类型检查、单测、Web 构建和基础 Desktop 构建；
12. 验证通过后初始化新 Git 仓库并创建初始提交；
13. 配置新远端；
14. 用户确认后切换 Cursor 工作目录；
15. 旧目录保留为只读备份。

迁移来源是当前工作树，不是旧 commit，因此必须包含 `feature-aihk`的已提交、已暂存和未提交成果。

## 19. 验收标准

架构落地完成时必须满足：

- Web 与 Desktop 使用同一 Renderer 源码；
- Web 构建不包含 Electron 运行依赖；
- 生产 Desktop 不加载远程主页面；
- Renderer 无 Node.js 和 Electron 直接访问能力；
- 所有桌面能力经过类型化 `platformApi`和白名单 IPC；
- main/preload/Renderer 协议版本不匹配时安全失败；
- Windows、macOS、Linux 能启动、登录、访问核心业务和正常退出；
- 托盘、通知、开机启动、深链、更新按 capability 工作；
- refresh token 不出现在 localStorage、日志和普通 IPC 返回中；
- 三端安装包由受保护 CI 构建并按要求签名；
- 单元测试、Web E2E 和 Desktop smoke 满足合并门禁；
- 新单仓库包含当前全部有效业务文件，并通过迁移校验。

## 20. 实施顺序

本规格是跨阶段的总体架构规格，范围大于单个可安全执行的实现计划。实施时必须按以下依赖顺序拆成独立计划，每个计划分别验收后再进入下一阶段：

1. 创建并验证全新单仓库；
2. 建立 `packages/platform-api`；
3. 新增 Web Adapter 和构建目标；
4. 建立 `apps/desktop` main/preload；
5. 实现安全协议、IPC 与 WindowManager；
6. 接入托盘、预定义通知和开机启动；
7. 实现深链和认证安全存储；
8. 接入自动更新和签名发布；
9. 接入日志、Sentry 和恢复；
10. 完成测试矩阵与 GitHub Actions。

每一步保持 Web 可独立运行，Desktop 能力按 capability 渐进启用。
