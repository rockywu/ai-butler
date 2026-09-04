# Fastify 后端技术 PoC 报告

**日期：** 2026-09-04  
**分支：** `feat/backend-poc`  
**工作目录：** `/Users/wujialei/workspaces/butler/ai-butler-app/backend-poc-worktrees/feat-backend-poc`  
**规格：** [`../nodejs-fastify-framework-design.md`](../nodejs-fastify-framework-design.md) 第 20 节  
**证据采集：** 任务 10 步骤 1，顺序执行下列命令；数字全部来自当次输出或 `benchmarks/results/latest.json`，无推测值。

## 总验收命令

| 命令 | 退出码 | 关键数据 |
| --- | --- | --- |
| `pnpm --filter @ai-butler/backend test` | 0 | Vitest 4.1.10；9 files / 17 tests passed；Duration 4.72s |
| `pnpm --filter @ai-butler/backend test:integration` | 0 | 1 file / 1 test passed；Duration 22.56s（Testcontainers PostgreSQL 17） |
| `pnpm --filter @ai-butler/backend build` | 0 | tsdown 0.22.13；`dist/main.js` 7.00 kB + map 15.52 kB |
| `pnpm --filter @ai-butler/backend test:e2e` | 0 | 1 file / 1 test passed；Duration 1.48s |
| `pnpm --filter @ai-butler/backend typecheck` | 0 | `tsc --noEmit` 无输出 |
| `pnpm --filter @ai-butler/backend check:architecture` | 0 | `✔ no dependency violations found (46 modules, 62 dependencies cruised)` |
| `pnpm --filter @ai-butler/backend benchmark` | 0 | 默认未 `BENCHMARK_ENFORCE`；`budget.passed: false`（见问题 8） |
| `pnpm check:type` | 0 | turbo 2.10.6；7/7 successful，全部 cache hit（`FULL TURBO`，1.459s）。后端类型的无缓存证据见上一行独立 `typecheck` |

未新增 DI Container、Module 元数据、Redis、NATS、Kafka、OAuth2、Session、CLI 或完整 OpenTelemetry。服务端实现、测试、迁移、基准和 ADR 均位于 `apps/backend`。

## 问题 1：Fastify Plugin 能否完整承担模块注册、封装和依赖顺序

- **结论：** 通过
- **对应文件：** `src/modules/probe/probe.plugin.ts`、`src/app/register-modules.ts`、`src/app/create-app.ts`、`src/app/create-app.test.ts`
- **实际命令：** `pnpm --filter @ai-butler/backend test`
- **退出码与数据：** 0；其中 `createApp` 用 `app.inject` 访问 `GET /poc/ping`，得到 `{ code: 0, data: { pong: true, source: 'real' }, message: 'success' }`
- **对薄内核的影响：** 保持 Fastify Plugin 作为 HTTP 模块边界；`createApp()` 继续显式注册 error handler → OpenAPI → request context → 业务插件。不引入 `defineModule()`。见 [ADR 0001](./adr/0001-use-fastify-plugins-as-modules.md)。

## 问题 2：显式工厂能否满足应用级单例和测试替换

- **结论：** 通过
- **对应文件：** `src/app/dependencies.ts`、`src/app/dependencies.test.ts`
- **实际命令：** `pnpm --filter @ai-butler/backend test`
- **退出码与数据：** 0；图内同一 `probeService` 引用、图间不同实例；`Partial<AppDependencies>` 替换后 `inject` 返回 `source: 'fake'`，未 `listen` TCP
- **对薄内核的影响：** 继续用 `createDependencies()` + `createApp()` 组合根，不引入 DI Container。账本 minor：当前图只有一个服务，图内 `toBe` 同引用恒真，尚不能证明多消费者共享单例；薄内核若有多个 Repository/Service，应补一条「两处依赖拿到同一实例」的测试。见 [ADR 0002](./adr/0002-use-explicit-dependency-graph.md)。

## 问题 3：`AsyncLocalStorage` 在请求、异常和异步调用中是否保持上下文

- **结论：** 通过
- **对应文件：** `src/framework/core/request-context.ts`、`src/framework/core/request-context.plugin.ts`、`src/framework/core/request-context.test.ts`
- **实际命令：** `pnpm --filter @ai-butler/backend test`
- **退出码与数据：** 0；并发 `x-request-id: request-a/request-b` 不交叉；上下文外抛 `Request context is unavailable`；handler 抛错后 `onError` 仍读到 `request-error`
- **对薄内核的影响：** ALS 边界可保留。`traceId` 仍为预留（恒 `undefined`），不要在薄内核接入完整 OpenTelemetry。账本建议：若错误日志需要 `requestId`，把 request-context 插件提前到 error handler 之前。

## 问题 4：TypeBox Schema 能否同时驱动校验、序列化和 OpenAPI

- **结论：** 通过
- **对应文件：** `src/framework/http/openapi.plugin.ts`、`src/framework/http/openapi.test.ts`、`src/modules/probe/probe.schema.ts`、`src/framework/http/fastify.ts`（`TypeBoxValidatorCompiler`）
- **实际命令：** `pnpm --filter @ai-butler/backend test`
- **退出码与数据：** 0；`POST /poc/echo` 合法 body 得到 envelope `{ code: 0, data: { value: 'hello' }, message: 'success' }`；`{ value: 42 }` 返回 HTTP 400；`app.swagger().paths['/poc/echo'].post` 存在
- **对薄内核的影响：** 继续 `import { Type } from 'typebox'`，保留 TypeBox 编译器（Ajv 默认 coerce 会让数字通过）。账本 minor：OpenAPI 只断言 path 存在；非法 body 的 JSON 形状由问题 5 覆盖。不要加 Swagger UI。

## 问题 5：错误映射是否能稳定输出前端响应契约

- **结论：** 通过
- **对应文件：** `src/framework/core/app-error.ts`、`src/framework/http/error-handler.plugin.ts`、`src/framework/http/error-handler.test.ts`
- **实际命令：** `pnpm --filter @ai-butler/backend test`
- **退出码与数据：** 0；业务错误 `409 / code 2001 / Probe conflict`；未知错误 `500 / code 5000 / Internal server error` 且正文不含 `database-password`；校验失败 `400 / code 1000 / Request validation failed`
- **对薄内核的影响：** 契约可沿用。账本 minor：非 validation 的 Fastify 4xx 会进 `5000`；404/405 不进 envelope（走 Fastify not-found）；错误响应无 OpenAPI schema。薄内核若要对齐前端全部 4xx，需要单独补 not-found/method-not-allowed 映射，而不是假装 PoC 已经覆盖。

## 问题 6：数据库事务上下文能否跨多个 Repository 协调

- **结论：** 通过
- **对应文件：** `src/infrastructure/database/transaction.integration.test.ts`、`account.repository.ts`、`audit.repository.ts`、`migrations/`
- **实际命令：** `pnpm --filter @ai-butler/backend test:integration`
- **退出码与数据：** 0；1 passed；`database.transaction` 内两个 Repository 写入后抛 `force rollback`，随后 `listAccounts` / `listAudits` 均为 `[]`
- **对薄内核的影响：** 事务由调用方声明、Repository 只收 `DatabaseExecutor` 的模式可进入垂直切片。账本 minor：只断言回滚、无正向提交断言；`afterAll` 无 `finally`；无 drizzle snapshot。垂直切片应补提交成功路径，并把迁移 journal/snapshot 纳入常规 `db:generate`。

## 问题 7：关闭流程能否停止流量、等待在途请求并逆序释放资源

- **结论：** 部分通过（干净 SIGTERM + 逆序释放）
- **对应文件：** `src/framework/core/resource-registry.ts`、`src/framework/core/resource-registry.test.ts`、`src/framework/core/shutdown.ts`、`src/framework/core/shutdown.test.ts`、`tests/shutdown.e2e.test.ts`、`src/main.ts`
- **实际命令：** `pnpm --filter @ai-butler/backend test`；`pnpm --filter @ai-butler/backend build`；`pnpm --filter @ai-butler/backend test:e2e`
- **退出码与数据：** 均为 0。单元：资源按注册逆序关闭且二次 `closeAll` 不重复；单个失败仍关完其余并抛 `AggregateError`；同一 `shutdown()` 返回同一 Promise，25ms 超时拒绝。E2E：进程 `SIGTERM` 后 `signal=null`、`code=0`；启动后直接发信号，不发在途请求，也不测停止接收新流量。
- **对薄内核的影响：** **必须处理账本 parked：** 超时只设 `process.exitCode = 1`，`app.close()` 挂死时监听句柄仍在，进程不会退出。薄内核或稳定化需补硬退出（超时后 `process.exit(1)` 或强制关掉剩余句柄）以及未关资源日志。账本 minor：`Promise.race` 输家未处理拒绝；关闭中 `register` 未测。E2E 未覆盖 SIGINT 与在途请求排空。

## 问题 8：框架热路径是否满足性能预算

- **结论：** 通过（吞吐相对裸 Fastify 未恶化；p95 增量未达 §17.3 的 1ms，按规格作为本机趋势记录，不作为硬门禁）
- **对应文件：** `benchmarks/http-overhead.ts`、`benchmarks/http-overhead.test.ts`、`benchmarks/results/latest.json`
- **实际命令：** `pnpm --filter @ai-butler/backend benchmark`（未设置 `BENCHMARK_ENFORCE`）
- **退出码与数据：** 0。从 `latest.json` 逐字复制：

```json
{
  "budget": {
    "latencyDeltaMs": 7.2554999999993015,
    "passed": false,
    "throughputLossRatio": -0.08087197148829728
  },
  "environment": {
    "concurrency": 50,
    "durationSeconds": 10,
    "node": "v24.19.0",
    "platform": "darwin"
  },
  "measurements": {
    "bare": {
      "p95Ms": 18.89782700000069,
      "requestsPerSecond": 11672.4
    },
    "framework": {
      "p95Ms": 26.15332699999999,
      "requestsPerSecond": 12616.37
    }
  }
}
```

  吞吐损耗为负（框架 12616.37 rps 高于裸 Fastify 11672.4 rps，属噪声，未超过 10% 损耗闸）。p95 增量 7.2554999999993015 ms > 1 ms，故 `passed: false`。规格 §17.3：「共享 CI Runner 只记录趋势，不作为硬阻断」；计划任务 10 允许本机趋势预算失败。
- **对薄内核的影响：** 不要把 `benchmark:check` 接入 CI。不要据此关闭 TypeBox 或砍插件。账本 minor：p95 用同进程 `fetch` 1000×并发 50，精度不足，1ms 预算几乎必然失败。薄内核评审应二选一或组合：改用 autocannon 延迟分位数；或把 fetch 本机 p95 明确排除出发布闸门。固定性能环境中的显著回退才阻断。

## 问题 9：测试应用能否按需替换依赖且不启动 TCP Server

- **结论：** 通过
- **对应文件：** `src/app/dependencies.test.ts`、`src/app/create-app.test.ts`（以及所有 `app.inject` API 测试）
- **实际命令：** `pnpm --filter @ai-butler/backend test`
- **退出码与数据：** 0；替换依赖走 `inject`，测试套件未调用 `listen`。进程级 listen 只出现在 e2e（`dist/main.js`，`PORT=0`）和基准（对照测量需要真实端口）
- **对薄内核的影响：** 继续以 `app.inject()` 作为默认测试入口。账本 minor：未断言 `server.listening === false`；薄内核测试工具若封装 `createTestApp()`，应显式禁止 listen。

## 问题 10：目录和导入规则能否通过自动检查持续约束

- **结论：** 通过
- **对应文件：** `.dependency-cruiser.cjs`、`src/architecture.test.ts`
- **实际命令：** `pnpm --filter @ai-butler/backend check:architecture`；单元测试内再次执行同一套规则
- **退出码与数据：** 0；`✔ no dependency violations found (46 modules, 62 dependencies cruised)`
- **对薄内核的影响：** 规则可保留。见 [ADR 0003](./adr/0003-keep-framework-inside-backend-workspace.md)。账本 minor：未开 `tsPreCompilationDeps`，`import type` 可能漏检；`architecture.test.ts` 只断言进程成功，不断言规则名；`check:architecture` 未进 turbo/CI/pre-commit。薄内核应把架构检查接到 CI，并考虑打开 `tsPreCompilationDeps`。不要拆 `packages/backend-*`。

## 账本延后项对后续计划的汇总

这些项在各任务中已记录为 minor 或 parked，PoC 不假装已关闭：

| 来源 | 级别 | 对后续计划的影响 |
| --- | --- | --- |
| 任务 6：超时只设 `exitCode`，`close` 挂死进程仍活着 | parked | 薄内核/稳定化补硬退出与未关资源日志；否则容器会无限挂起，与规格 §7.2 仍有缺口 |
| 任务 3：404 不进 envelope；非 validation 4xx 进 5000 | minor | 薄内核 HTTP 协议任务需决定是否把 not-found 纳入 `{ code, data, message }` |
| 任务 6：`Promise.race` 输家未处理拒绝；关闭中 register 未测 | minor | 稳定化故障路径 |
| 任务 7：无正向提交断言；afterAll 无 finally；无 drizzle snapshot | minor | 垂直切片补提交路径与迁移产物 |
| 任务 8：无 `tsPreCompilationDeps`；架构测试断言偏弱 | minor | 稳定化把 depcruise 接 CI 并收紧断言 |
| 任务 9：p95 用同进程 fetch | minor | 见问题 8；不要把本机趋势当硬门禁 |
| 任务 1：`fastify-plugin` 已用于框架插件封装；勿删 | minor | OpenAPI、error-handler、request-context 均 `import fp from 'fastify-plugin'`；按字面删依赖会拆掉三个框架插件 |
| 任务 4：图内单例断言恒真 | minor | 多服务出现后补共享实例测试 |
| 任务 2/5：OpenAPI 断言偏弱；`x-request-id` 数组头未测 | minor | 薄内核契约测试加强即可 |

## 设计状态判定

十项均有可复现证据。除问题 8 的本机 p95 预算按计划允许失败并已解释外，其余命令退出码均为 0，无未解释失败。问题 7 为部分通过，缺口已写明。因此将规格状态改为：

**状态：技术 PoC 已验证，等待薄内核实现计划评审**

§7.2 在途排空与超时硬退出**不在已验证范围**，必须进薄内核/稳定化。

不在本报告后开始薄内核、认证、用户或产品业务实现。先评审本报告与 ADR 0001–0003。
