# 测试与验证

默认用 `app.inject()` 测 HTTP，不监听 TCP。真实 PostgreSQL 只出现在集成测试里。

## 测试工厂

```ts
import { createTestApp } from '../app/create-test-app';

const app = await createTestApp();
const res = await app.inject({ method: 'GET', url: '/poc/ping' });
```

`createTestApp` 内部调用 `createApp`，默认：

```ts
{
  appEnv: 'test',
  host: '127.0.0.1',
  logLevel: 'fatal',
  openapiUiEnabled: true,
  port: 0,
  logger: false,
}
```

替换依赖：

```ts
await createTestApp({
  dependencies: {
    probeService: { read: () => ({ pong: true, source: 'fake' }) },
  },
});
```

`bootstrap(env)` 会走真实 `loadConfig`，非法配置应在建 server 之前抛 `ConfigError`。

## 命令

在仓库根目录：

```bash
pnpm test:backend
pnpm --filter @ai-butler/backend test
pnpm --filter @ai-butler/backend test:integration
pnpm --filter @ai-butler/backend test:e2e
pnpm --filter @ai-butler/backend typecheck
pnpm --filter @ai-butler/backend check:architecture
```

| 命令 | 覆盖 |
| --- | --- |
| `test` | 单元测试，排除 `*.integration.test.ts` 与 e2e |
| `test:integration` | `transaction.integration.test.ts` |
| `test:e2e` | `tests/shutdown.e2e.test.ts`，需要先 `build` 出 `dist/main.js` |
| `benchmark` | 裸 Fastify 与框架路由对照 |

单文件：

```bash
pnpm exec vitest run --environment node apps/backend/src/framework/config/load-config.test.ts
```

## 建议怎么测

- **路由与信封**：`createApp({ logger: false })` + `inject`
- **Service**：直接调工厂，或给 Plugin 注入 fake
- **配置**：给 `loadConfig` 传入伪造 `env`，不要改 `process.env`
- **事务**：Testcontainers + 真实 migrate
- **关闭**：e2e 对 `dist/main.js` 发 SIGTERM

## 相关文档

包内规格与决策不要在使用文档里复述全文，按需查阅：

- [nodejs-fastify-framework-design.md](../../nodejs-fastify-framework-design.md) — 主规格
- [docs/poc-report.md](../../docs/poc-report.md) — PoC 验收与已知账本
- [ADR 0001–0005](../../docs/adr/) — 模块、依赖、配置、健康检查
