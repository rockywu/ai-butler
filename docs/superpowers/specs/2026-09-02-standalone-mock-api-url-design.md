# 独立 Mock 服务与 Desktop `--api-url` 设计

日期：2026-09-02

## 目标

让本地 Mock API 以独立进程运行，Desktop 打包应用可通过启动参数覆盖 API 地址，从而在不依赖 Vite 内嵌 Mock / `app://` 同源 `/api` 的情况下验证登录。

## 方案

### Mock 独立进程

- `apps/web-antd/.env.development` 与 `playground/.env.development` 将 `VITE_NITRO_MOCK` 设为 `false`
- 根脚本新增 `pnpm dev:mock`，仅启动 `@vben/backend-mock`（端口 5320）
- `pnpm dev:antd` 使用 `concurrently` 同时启动 Mock 与 Web，避免日常 DX 退化
- Vite `/api` proxy 仍指向 `http://localhost:5320/api`
- 不删除 `viteNitroMockPlugin` 代码，仅默认关闭

### Desktop 运行时 API 覆盖

- 启动参数：`--api-url=http://localhost:5320/api`（亦支持 `--api-url <url>`）
- 仅允许 `http:` / `https:`
- main 解析后通过同步 IPC 交给 preload
- preload 在页面脚本前拦截 `window._VBEN_ADMIN_PRO_APP_CONF_` 赋值，写入 `VITE_GLOB_API_URL`
- 未传参时行为不变（构建期默认 `/api`）

### 联调步骤

```bash
pnpm dev:mock
# 另开终端，带参启动打包应用
env -u ELECTRON_RUN_AS_NODE \
  "apps/desktop/release/mac/AI Butler.app/Contents/MacOS/AI Butler" \
  --api-url=http://localhost:5320/api
```

使用 Mock 账号 `vben` / `123456` 验证登录。

## 非目标

- 不拆出独立仓库
- 不做配置文件 / 环境变量覆盖
- 不改变 Mock 接口契约
