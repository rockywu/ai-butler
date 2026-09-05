# ADR 0005：存活与就绪检查语义

**状态：** 接受

## 背景

规格第 14 节要求拆分 Liveness 与 Readiness：存活只证明进程还能工作，就绪才检查必要依赖；开始关闭后就绪必须立即失败，且响应不得泄露连接串、内部地址或凭据。薄内核没有默认数据库，垂直切片才会注入真实 checker。

## 决策

- `GET /livez` 不执行任何 `HealthChecker`，只要事件循环能回答请求即返回 `{ code: 0, data: { status: 'live' }, message: 'success' }`。
- `GET /readyz` 先看 `ReadinessGate`；关闭开始时 `markNotReady()`，此后立即 503 且不再跑 checkers。
- checkers 由 `createApp({ checkers })` 注入，默认 `[]`。checker 失败时 HTTP 正文固定为 `{ code: 5030, data: null, message: 'not ready' }`；细节只进已脱敏的日志。
- `createAppShutdown` 保证顺序：`markNotReady()` → `ResourceRegistry.closeAll()`（含 Fastify）。用 `app.inject()` 验证未就绪，进程级 SIGTERM 仍以 PoC e2e 为准。

## 替代方案

- 单一 `/healthz` 同时表示存活与依赖：拒绝，关闭期间会被编排误杀仍能工作的进程，或把尚未建连的实例留在池里。
- 启动期默认连接 PostgreSQL 再做就绪：拒绝，本里程碑明确无业务表、无默认 DB。
- 把 checker 异常消息返回给客户端：拒绝，连接串和内部地址会泄漏。
- 为薄内核再写一套进程级 SIGTERM e2e：拒绝，PoC 的 `tests/shutdown.e2e.test.ts` 已覆盖真实信号；本里程碑用 `inject` 验证未就绪即可。

## 后果

- 编排系统可以先摘流量（就绪失败）再等进程退出（存活仍成功）。
- 垂直切片加入 PostgreSQL 时，只需注入名为 `database` 的 checker，不必改 `/livez` 或 `/readyz` 的协议。
- checker 日志必须经过 `sanitizeHealthError`；响应体永远是固定信封，不回显异常原文。
