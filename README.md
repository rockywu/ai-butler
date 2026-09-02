# AI Butler（阿斯系统）

AI Butler 是面向 Web、Windows 和 macOS 的 AI 超级员工产品。

当前仓库是单一 pnpm/Turbo monorepo。Web 客户端基于 Vue 3、Vite、Vben Admin 和 Ant Design Vue；Electron 桌面端将在 `apps/desktop` 中建设，并与 Web 共用 `apps/web-antd` Renderer。

## 目录

- `apps/web-antd`：Web/Desktop 共用 Vue Renderer
- `apps/backend-mock`：本地 Nitro Mock API（独立进程，`pnpm dev:mock`）
- `packages`：Vben 核心与通用包
- `internal`：构建、TypeScript 和 lint 基础设施
- `playground`：组件试验场
- `ui-demo`：产品视觉原型
- `docs/superpowers/specs`：架构与设计规格
- `docs/superpowers/plans`：分阶段实现计划

## 环境

- Node.js 24.16.0
- pnpm 11.16.0

## 常用命令

```bash
pnpm install
pnpm dev:mock    # 独立 Mock :5320
pnpm dev:antd    # Mock + Web
pnpm build:antd
pnpm check
pnpm test:unit
```

Desktop 打包应用联调 Mock 登录：

```bash
pnpm dev:mock
env -u ELECTRON_RUN_AS_NODE \
  "apps/desktop/release/mac/AI Butler.app/Contents/MacOS/AI Butler" \
  --api-url=http://localhost:5320/api
```

详细约定见 `CLAUDE.md`。
