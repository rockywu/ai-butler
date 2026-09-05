# 快速开始

`@ai-butler/backend` 是 AI Butler（阿斯系统）的 Fastify 后端薄内核，代码全部放在 `apps/backend`。当前阶段已能独立启动 HTTP 服务，并带有 PoC 探针模块；认证、用户表与启动期数据库建连尚未接入。

本包与 `apps/backend-mock`（Nitro Mock，默认端口 `5320`）相互独立。`web-antd` 开发时默认仍代理到 Mock。

## 环境要求

- Node.js `^22.18.0 || ^24.12.0`（仓库 `.node-version` 锁 `24.16.0`）
- pnpm `>= 11`（根目录 `preinstall` 只允许 pnpm）
- 可选：PostgreSQL 17（仅跑集成测试或执行迁移时需要）

在仓库根目录安装依赖：

```bash
pnpm install
```

## 配置环境变量

启动前必须提供 4 个必填项。本地已提供 `apps/backend/.env`：

```bash
APP_ENV=development
HOST=127.0.0.1
PORT=3000
LOG_LEVEL=info
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/postgres
```

| 变量 | 必填 | 取值 |
| --- | --- | --- |
| `APP_ENV` | 是 | `development` / `production` / `test` |
| `HOST` | 是 | 监听地址，例如 `127.0.0.1` |
| `PORT` | 是 | `0`–`65535` 的整数 |
| `LOG_LEVEL` | 是 | `debug` / `info` / `warn` / `error` / `fatal` / `trace` / `silent` |
| `OPENAPI_UI` | 否 | `true` / `false`。缺省时 production 关闭 UI，其余环境打开 |
| `DATABASE_URL` | 否 | 有值则启动时建连并启用 `/test` 落库；缺省时 `/test` 走内存仓库 |

缺项或非法值会在 `listen` 之前抛出 `ConfigError`，错误信息只含配置项名，不含原始值。

业务代码禁止读取 `process.env`。只有 `main.ts`、`start.ts`、`load-config.ts` 可以接触环境变量。

## 启动服务

在 `apps/backend`：

```bash
npm run dev
# 或
pnpm dev
```

在仓库根目录：

```bash
pnpm dev:backend
# 等价于
pnpm --filter @ai-butler/backend dev
```

`dev` 脚本为 `tsx watch --env-file=.env src/main.ts`，默认监听 [http://127.0.0.1:3000](http://127.0.0.1:3000)。

启动成功后可访问：

| 地址 | 说明 |
| --- | --- |
| [http://127.0.0.1:3000/livez](http://127.0.0.1:3000/livez) | 存活检查 |
| [http://127.0.0.1:3000/readyz](http://127.0.0.1:3000/readyz) | 就绪检查 |
| [http://127.0.0.1:3000/poc/ping](http://127.0.0.1:3000/poc/ping) | 探针 |
| [http://127.0.0.1:3000/documentation/](http://127.0.0.1:3000/documentation/) | Swagger UI |
| [http://127.0.0.1:3000/documentation/json](http://127.0.0.1:3000/documentation/json) | OpenAPI JSON |

生产构建：

```bash
pnpm build:backend
# 需自行注入 4 个必填环境变量后再启动
node apps/backend/dist/main.js
```

## 常用脚本

在 `@ai-butler/backend` 包内：

| 脚本 | 作用 |
| --- | --- |
| `dev` | 开发启动（watch + `.env`） |
| `build` | tsdown 产出 `dist/main.js` |
| `start` | `node dist/main.js`（不自动读 `.env`） |
| `test` | 单元测试（排除 integration / e2e） |
| `test:integration` | PostgreSQL 事务集成测试 |
| `test:e2e` | 进程级 SIGTERM 关闭测试（需先 build） |
| `typecheck` | `tsc --noEmit` |
| `check:architecture` | 依赖方向检查 |
| `db:generate` / `db:migrate` | Drizzle 迁移 |
| `docs:dev` | 启动本文档站点（默认端口 `5174`） |

## 目录速查

```text
apps/backend/
├── src/main.ts                 # 进程入口
├── src/app/                    # 组合根：createApp / start / 依赖装配
├── src/framework/              # 配置、HTTP、错误、日志、关闭
├── src/modules/                # 业务模块（当前仅 probe）
├── src/infrastructure/         # Drizzle 与 Repository（PoC，未挂到启动）
├── migrations/                 # SQL 迁移
├── documents/                  # 本使用文档（VitePress）
├── docs/adr/                   # 架构决策记录
└── .env                        # 本地开发配置
```

下一步阅读 [架构与分层](./architecture) 与 [路由与接口](./routes)。
