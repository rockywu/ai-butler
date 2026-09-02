# Desktop Preview 阶段任务日志

日期：2026-09-02

## 本次目标

在单仓库中建立 Electron 桌面壳与 `platformApi` 基础边界，并生成可运行的 macOS 桌面预览版本。

## 已完成

- 新增 `@ai-butler/platform-api` 工作区包，定义协议版本、运行时信息和统一结果类型。
- 在 Web Renderer 中增加 Web/Desktop 双适配器，并在应用启动阶段初始化。
- 新增 `apps/desktop`：
  - Electron main、preload 和共享 IPC 通道；
  - `contextIsolation: true`、`nodeIntegration: false`、`sandbox: true`；
  - 受信任来源校验和白名单 IPC；
  - 生产环境 `app://bundle` 本地资源协议；
  - 单实例和 macOS 应用生命周期处理。
- 增加独立 Desktop Renderer 构建模式，生产资源使用 hash 路由。
- 配置 electron-vite 与 electron-builder，当前发布目标为 Windows 和 macOS。
- 更新设计文档，Linux 不再属于首发范围。
- 生成并启动 macOS x64 客户端：
  - `apps/desktop/release/mac/AI Butler.app`
  - `apps/desktop/release/AI-Butler-0.1.0-x64.dmg`
  - `apps/desktop/release/AI-Butler-0.1.0-x64.zip`

## 验证记录

- 平台适配器单元测试通过。
- Desktop 和 Web 类型检查通过。
- 全量 `pnpm check` 通过。
- 全量 `pnpm test:unit` 通过。
- Web 生产构建通过。
- Electron main、preload 和占位 Renderer 构建通过。
- macOS x64 DMG/ZIP 打包通过，应用进程可持续运行。

## 构建环境说明

- 当前机器为 Intel Mac（x86_64）。
- GitHub 与 Node 下载器在拉取 Electron 运行时时出现 600 秒超时；改用镜像和本地解压的 Electron 运行时完成打包。
- Cursor 终端包含 `ELECTRON_RUN_AS_NODE=1`，命令行启动 GUI 应用时需移除该变量；这不是安装包缺陷。
- 当前产物未进行 Apple 代码签名和公证，仅用于本地预览。

## 后续任务

- 生成并验证 macOS arm64 产物。
- 生成 Windows x64 NSIS 安装包，并在 Windows 环境完成启动验证。
- 补充正式应用图标、代码签名和公证配置。
- 完成桌面端阶段最终日志和发布前验证。
