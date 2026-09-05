# 架构与分层

薄内核只解决装配、配置、HTTP 约定、错误、日志和关闭。业务能力以 Fastify Plugin 为模块边界，依赖通过工厂函数显式传入，不引入 DI Container。

## 分层

```text
main.ts
  ↓
app/（组合根）
  ├── framework/        跨模块能力，禁止引用 modules
  ├── infrastructure/   Drizzle、具体客户端
  └── modules/          业务插件与 Service
```

允许的调用方向：

```text
Plugin（路由） → Service → Repository 接口
                              ↑
                 infrastructure 实现
```

约束：

- `framework/**` 不得引用 `modules/**`
- `*.service.ts` 不得引用 `fastify`
- `src/modules/**` 不得直接引用 `drizzle-orm` / `postgres`
- 业务代码不得读取 `process.env`

用 `pnpm --filter @ai-butler/backend check:architecture` 检查。规则写在 `.dependency-cruiser.cjs`。决策见 [ADR 0001](../../docs/adr/0001-use-fastify-plugins-as-modules.md)、[ADR 0002](../../docs/adr/0002-use-explicit-dependency-graph.md)。

## 启动顺序

```text
main.ts
  └─ start()
       └─ bootstrap(env)
            ├─ loadConfig(env)          # 失败则不建 server
            ├─ createLogger(config)
            ├─ createReadinessGate()
            ├─ new ResourceRegistry()
            ├─ createApp({ ... })
            └─ app.ready()
       ├─ 绑定 SIGINT / SIGTERM
       └─ app.listen({ host, port })
```

`createApp` 的插件顺序：

1. `errorHandlerPlugin` — 统一错误映射
2. `requestContextPlugin` — `requestId` / `traceId`
3. `openApiPlugin` — `@fastify/swagger`
4. `registerModules` — 业务路由
5. `healthPlugin` — `/livez`、`/readyz`
6. `openApiUiPlugin` — Swagger UI（可由配置关闭）
7. 把 Fastify 注册进 `ResourceRegistry`，关闭时 `app.close()`

`bootstrap()` 不 `listen`，供测试直接 `app.inject()`。

规格里写了「创建数据库连接」，**当前薄内核未实现**。启动不会读 `DATABASE_URL`，也不会建池。详见 [数据库操作](./database)。

## 关闭顺序

收到 `SIGINT` / `SIGTERM` 后：

1. `readinessGate.markNotReady()`，`/readyz` 立刻返回 503
2. `resources.closeAll()` 按注册逆序释放（含 Fastify）
3. 默认超时 10 秒

关闭超时目前只 reject Promise 并设 `process.exitCode = 1`，**不会**强制 `process.exit`。这是已知账本，见 `docs/poc-report.md` 问题 7。

## 请求上下文

`request-context.plugin.ts` 用 `AsyncLocalStorage` 保存：

```ts
{ requestId: string; traceId: string | undefined }
```

- 请求头 `x-request-id` 优先，否则用 Fastify `request.id`
- 可选请求头 `x-trace-id`
- 响应会回写这两个头

业务里用 `getRequestContext()` 读取。在 ALS 外调用会抛 `Request context is unavailable`。

Pino 通过 mixin 自动带上 `requestId` / `traceId`，并脱敏 `password`、`Authorization`、`DATABASE_URL` 等路径。

## 配置对象

`loadConfig(env)` 产出只读 `AppConfig`：

```ts
{
  appEnv: 'development' | 'production' | 'test';
  host: string;
  logLevel: LogLevel;
  openapiUiEnabled: boolean;
  port: number;
}
```

模块从 `app.config` 或工厂参数取配置，不要再读环境变量。详见 [ADR 0004](../../docs/adr/0004-typed-config-and-secrets.md)。
