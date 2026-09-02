# AI Butler（阿斯系统）

AI Butler 是同时面向 Web、Windows、macOS 和 Linux 的 AI 超级员工产品。

当前仓库是单一 pnpm/Turbo monorepo。Web 客户端基于 Vue 3、Vite、Vben Admin 和 Ant Design Vue；Electron 桌面端将在 `apps/desktop` 中建设，并与 Web 共用 `apps/web-antd` Renderer。

## 目录

- `apps/web-antd`：Web/Desktop 共用 Vue Renderer
- `apps/backend-mock`：本地 Nitro Mock API
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
pnpm dev:antd
pnpm build:antd
pnpm check
pnpm test:unit
```

详细约定见 `CLAUDE.md`。
