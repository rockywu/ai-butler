# AI Butler Desktop 预览实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 在现有单仓库中建立可开发、可打包的 Electron 最小闭环，并在当前电脑生成和验证可打开的 macOS 应用。Windows 只保留构建配置，交由 Windows 环境或 CI 验证。

**架构：** `apps/web-antd` 继续作为唯一 Renderer，Desktop mode 输出静态资源；`apps/desktop` 使用 electron-vite 构建 main/preload，并由 electron-builder 打包。`packages/platform-api` 定义纯 TypeScript 运行时契约，Renderer 通过 Web/Desktop Adapter 访问平台能力。

**技术栈：** Electron 44.1.1、electron-vite 5.0.0、electron-builder 26.15.3、Vue 3、Vite、TypeScript、pnpm、Turbo

---

## 文件结构

- 创建 `packages/platform-api/`：运行时类型、结果模型、能力和协议版本。
- 创建 `apps/web-antd/src/platform/`：Web/Desktop Adapter 与单例入口。
- 修改 `apps/web-antd/src/main.ts`：在 Vue 启动前初始化平台适配器。
- 创建 `apps/desktop/src/main/index.ts`：应用生命周期、窗口和本地资源协议。
- 创建 `apps/desktop/src/preload/index.ts`：冻结的白名单桥。
- 创建 `apps/desktop/src/shared/channels.ts`：固定 IPC 通道。
- 创建 `apps/desktop/electron-vite.config.ts`：构建 main/preload，并提供 electron-vite 5 要求但不进入安装包的占位 Renderer。
- 创建 `apps/desktop/electron-builder.yml`：Windows/macOS 打包。
- 修改根脚本、catalog、Turbo 和 Web 构建脚本。
- 更新设计文档：首版放弃 Linux。

## 任务 1：更新首发平台范围

- [ ] 将骨架设计与完整桌面设计的首发平台改为 Windows/macOS。
- [ ] 删除首版 Linux 打包、更新、密钥环和 CI 要求。
- [ ] 在非目标中明确 Linux 推迟到后续版本。
- [ ] 更新 README 产品平台说明。
- [ ] 运行 `rg "Linux|三端" docs/superpowers/specs README.md`，确认只保留“Linux 推迟”说明。

## 任务 2：建立 platformApi 最小契约

- [ ] 创建 `@ai-butler/platform-api` 私有 workspace 包。
- [ ] 定义 `PLATFORM_PROTOCOL_VERSION = 1`。
- [ ] 定义 `RuntimeTarget`、`RuntimeInfo`、`PlatformError`、`PlatformResult<T>`、`RuntimeApi` 和 `PlatformApi`。
- [ ] 创建 Web Adapter，返回 `target: web`。
- [ ] 创建 Desktop Adapter，通过 `window.desktop.runtime.getInfo()` 获取运行信息并校验协议版本。
- [ ] 创建平台单例初始化和读取入口。
- [ ] 在 `main.ts` 的 Vben 初始化前调用 `initializePlatformApi()`。
- [ ] 添加单元测试，覆盖 Web Adapter 与 Desktop bridge 缺失/版本不匹配。

## 任务 3：创建 Electron main/preload

- [ ] 创建 `@ai-butler/desktop` 私有应用。
- [ ] electron-vite 输出 main/preload；占位 Renderer 不进入安装包。
- [ ] preload 只暴露 `protocolVersion` 与 `runtime.getInfo()`。
- [ ] main 注册固定 `runtime:get-info` IPC。
- [ ] 开启 `contextIsolation`，关闭 `nodeIntegration` 和 sandbox 外的高权限能力。
- [ ] 开发环境只加载 `http://localhost:5666`。
- [ ] 生产环境注册 secure/standard `app://` 协议并加载安装包内 Renderer。
- [ ] 拒绝外部导航和任意新窗口。
- [ ] macOS 激活时恢复窗口；所有窗口关闭时 Windows 退出、macOS 保持进程。

## 任务 4：配置开发与打包

- [ ] catalog 增加 Electron、electron-vite、electron-builder、wait-on 和 concurrently。
- [ ] Web 增加 `build:desktop`，输出到 `dist/desktop`。
- [ ] 根脚本增加 `dev:desktop`、`build:desktop`、`dist:mac`、`dist:win`。
- [ ] Desktop 开发脚本等待 5666 端口后启动 Electron。
- [ ] electron-builder 从 `apps/web-antd/dist/desktop` 复制 Renderer。
- [ ] macOS 生成 DMG/ZIP，支持 x64/arm64；Windows 生成 x64 NSIS。
- [ ] 本地测试构建关闭自动签名发现，不配置发布。

## 任务 5：验证

- [ ] 运行 platformApi 单元测试。
- [ ] 运行 `pnpm check`。
- [ ] 运行 `pnpm test:unit`。
- [ ] 运行 `pnpm build:antd`。
- [ ] 运行 `pnpm build:desktop`。
- [ ] 检查 Desktop Renderer、main 和 preload 产物。

## 任务 6：生成桌面客户端

- [ ] 在当前 macOS 构建本机架构 `.app`、DMG 和 ZIP。
- [ ] 启动 `.app`，确认窗口加载 AI Butler 页面且无 Node 集成。
- [ ] 当前电脑只生成和验证 macOS 产物；Windows 保留 x64 NSIS 配置，不在本机交叉构建。
- [ ] 记录产物路径、大小、提交和验证结果。
- [ ] 提交实现与任务日志。

## 完成条件

- `pnpm dev:desktop` 可启动桌面开发窗口；
- macOS `.app` 可在当前机器打开并显示共享 Renderer；
- macOS 安装产物存在；
- Windows x64 NSIS 配置保留，后续在 Windows 环境或 CI 验证；
- Web 构建继续通过；
- Renderer 无 Node/Electron 直接访问；
- 首发设计只包含 Windows/macOS；
- 工作树变更全部提交到 `feat/desktop-preview`。
