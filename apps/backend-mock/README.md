# @vben/backend-mock

AI Butler / Vben 本地 Mock API 服务。不连接真实数据库，数据均为模拟，供 Web 与 Desktop 本地联调。

本服务以**独立进程**运行（默认端口 `5320`），不再由 Vite 插件内嵌拉起。

## 启动

在仓库根目录：

```bash
# 只起 Mock（Web / Desktop 开发前需手动先开）
pnpm dev:mock

# 只起 Web（需已有 Mock，或对接真实后端）
pnpm dev:antd
pnpm dev:web
```

在包目录：

```bash
pnpm start   # nitro dev
pnpm build   # nitro build
```

## Desktop 联调登录

打包后的 macOS 应用**没有** Vite `/api` 代理。本地预览默认直连 `http://localhost:5320/api`，因此必须先起 Mock：

```bash
pnpm dev:mock

# 推荐：去掉 Cursor 注入的 ELECTRON_RUN_AS_NODE
env -u ELECTRON_RUN_AS_NODE open \
  "apps/desktop/release/mac/AI Butler.app"

# 或覆盖 API 地址
env -u ELECTRON_RUN_AS_NODE \
  "apps/desktop/release/mac/AI Butler.app/Contents/MacOS/AI Butler" \
  --api-url=http://localhost:5320/api
```

Mock 账号：`vben` / `123456`（或 `admin` / `123456`）。  
若未起 Mock，登录会提示「网络异常」。

## 说明

- Web 开发仍通过 Vite 将 `/api` 代理到 `http://localhost:5320/api`
- Desktop 打包应用无 Vite 代理，需使用 `--api-url` 直连本服务
- 线上环境请对接真实后端，不要部署本 Mock
