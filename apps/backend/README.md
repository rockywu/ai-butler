# @ai-butler/backend

AI Butler（阿斯系统）的 Fastify 后端。开发前必须在本目录准备一份本地 `.env`，`pnpm dev` / `npm run dev` 只会读取 `.env`，不会自动用模板文件。

## 配置本地 `.env`

1. 在 `apps/backend` 下复制模板：

```bash
cp .env.template .env
```

2. 用编辑器打开 `.env`，按本机情况改值。必填项不能留空：

| 变量 | 必填 | 怎么填 |
| --- | --- | --- |
| `APP_ENV` | 是 | 本地开发填 `development`。只能是 `development` / `production` / `test` |
| `HOST` | 是 | 本机访问填 `127.0.0.1`；要让同一局域网的设备连进来再改 `0.0.0.0` |
| `PORT` | 是 | HTTP 端口，默认 `3000`。被占用就换一个未被占用的整数 |
| `LOG_LEVEL` | 是 | 日常开发用 `info`。可选 `debug` / `info` / `warn` / `error` / `fatal` / `trace` / `silent` |
| `DATABASE_URL` | 落库 / 迁移时要填 | `postgres://用户名:密码@主机:端口/数据库名` |
| `OPENAPI_UI` | 否 | `true` 或 `false`。不写时：`production` 关闭文档 UI，其它环境打开 |

3. 本机若按下面方式起 PostgreSQL 18，`DATABASE_URL` 可以先保持模板默认值：

```bash
docker run -d \
  --name pg18 \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=postgres \
  -p 5432:5432 \
  -v ~/docker-data/pg18-data:/var/lib/postgresql/data \
  --restart unless-stopped \
  postgres:18.6
```

对应连接串：

```bash
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/postgres
```

若你改了容器的用户、密码、库名或端口，只改 `DATABASE_URL` 里对应的四段即可，不要把账号写进代码。

4. 首次连库后执行迁移（会创建 `test` 等表）：

```bash
# 在仓库根目录
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/postgres \
  pnpm --filter @ai-butler/backend db:migrate
```

或在已导出 `DATABASE_URL` 的 `apps/backend` 目录执行 `pnpm db:migrate`。

5. 改完 `.env` 后必须重启后端。`tsx watch` 不会在你只改环境文件时自动重载变量。

没有 `.env`、或缺少 `APP_ENV` / `HOST` / `PORT` / `LOG_LEVEL` 时，进程会在监听端口之前以 `ConfigError` 退出。未配置 `DATABASE_URL` 时服务仍能启动，但 `/test` 只写内存，不会进 PostgreSQL。

`.env` 给本机用；提交仓库的是 `.env.template`（以及一份无注释的 `.env.example`）。不要把真实密码提交进 Git。

## 启动

在仓库根目录：

```bash
pnpm install
pnpm --filter @ai-butler/backend dev
```

或在 `apps/backend`：

```bash
pnpm dev
```

默认地址：[http://127.0.0.1:3000](http://127.0.0.1:3000)

| 地址 | 说明 |
| --- | --- |
| `/livez` | 存活检查 |
| `/readyz` | 就绪检查（配置了数据库时会 `select 1`） |
| `/test` | 测试表 CRUD |
| `/documentation/` | Swagger UI |

使用文档站点：`pnpm docs:backend`（根目录）或 `pnpm docs:dev`（本目录），打开 [http://127.0.0.1:5174/](http://127.0.0.1:5174/)。
