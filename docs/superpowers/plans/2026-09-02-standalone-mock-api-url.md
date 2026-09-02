# 独立 Mock 与 Desktop `--api-url` 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** Mock 独立进程启动；Desktop 支持 `--api-url` 覆盖 API，便于打包应用直连 Mock 验证登录。

**架构：** 关闭 Vite 内嵌 Nitro；根脚本起独立 Mock。Electron main 解析 CLI，preload 拦截 `_VBEN_ADMIN_PRO_APP_CONF_`。

**技术栈：** Nitro、concurrently、Electron IPC、pnpm workspace

---

## 文件结构

- 修改：`package.json` — `dev:mock`、`dev:antd`
- 修改：`apps/web-antd/.env.development`、`playground/.env.development` — `VITE_NITRO_MOCK=false`
- 修改：`apps/desktop/src/shared/channels.ts` — bootstrap 通道
- 创建：`apps/desktop/src/main/parse-api-url.ts` + 测试
- 修改：`apps/desktop/src/main/index.ts`、`apps/desktop/src/preload/index.ts`
- 修改：`CLAUDE.md`、`apps/backend-mock/README.md`、桌面相关说明

## 任务

### 任务 1：独立 Mock 脚本与关闭内嵌

- [ ] 根 `dev:mock`、`dev:antd` concurrently
- [ ] 两处 `.env.development` 关闭 `VITE_NITRO_MOCK`
- [ ] 更新 mock README / CLAUDE.md 启动说明

### 任务 2：Desktop `--api-url`

- [ ] `parse-api-url` + 单元测试
- [ ] main 注册 sync IPC + 解析 argv
- [ ] preload 拦截全局配置
- [ ] 重建 desktop 并（可选）重打 mac 目录验证登录
