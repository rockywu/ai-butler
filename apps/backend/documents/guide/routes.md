# 路由与接口

所有成功响应都走统一信封 `success()`：

```json
{ "code": 0, "data": {}, "message": "success" }
```

错误响应：

```json
{ "code": 1000, "data": null, "message": "Request validation failed" }
```

`404` / `405` 走 Fastify 默认页面，**不会**包进信封。

OpenAPI 标题：`AI Butler Backend`，版本 `0.1.0`。开发环境可打开 [http://127.0.0.1:3000/documentation/](http://127.0.0.1:3000/documentation/)。

## 健康检查

### GET `/livez`

进程能响应即视为存活，不跑外部 checker。

```bash
curl http://127.0.0.1:3000/livez
```

```json
{ "code": 0, "data": { "status": "live" }, "message": "success" }
```

### GET `/readyz`

先看 `readinessGate.isReady()`，再并行跑 `createApp({ checkers })` 注入的检查器。默认 `checkers` 为空数组。任一失败或闸门关闭时返回 HTTP 503。

就绪：

```json
{ "code": 0, "data": { "status": "ready" }, "message": "success" }
```

未就绪：

```json
{ "code": 5030, "data": null, "message": "not ready" }
```

注册位置：`src/framework/http/health.plugin.ts`。语义见 [ADR 0005](../../docs/adr/0005-liveness-and-readiness.md)。

## 探针模块（PoC）

注册位置：`src/modules/probe/probe.plugin.ts`，由 `register-modules.ts` 挂到应用上。

### GET `/poc/ping`

探测 Service 是否装配成功。

```json
{ "code": 0, "data": { "pong": true, "source": "real" }, "message": "success" }
```

测试里替换 `probeService` 时，`source` 可以是假实现返回的值。

### GET `/poc/context`

读取当前请求的 `requestId`。

```json
{ "code": 0, "data": { "requestId": "req-1" }, "message": "success" }
```

可传 `x-request-id` 覆盖。

### POST `/poc/echo`

回显合法 JSON body。

请求体：

```json
{ "value": "hello" }
```

`value` 必须是长度 ≥ 1 的字符串。`{ "value": 42 }` 会返回 HTTP 400、`code: 1000`。

### GET `/poc/errors/business`

演示业务错误：抛 `AppError`，HTTP 409、`code: 2001`、`message: Probe conflict`。

## 测试表 CRUD

`test` 表：`id` 自增，`key` varchar(50)，`value` jsonb（混合类型）。注册位置：`src/modules/test/test.plugin.ts`。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/test` | 创建。body：`{ key, value }` |
| GET | `/test` | 列表 |
| GET | `/test/:id` | 单条 |
| PUT | `/test/:id` | 更新 `key` 和 / 或 `value` |
| DELETE | `/test/:id` | 删除 |

不存在时 HTTP 404、`code: 2101`。`value` 可以是对象、数组、字符串、数字、布尔或 `null`。

### GET `/poc/errors/system`

演示未处理异常：响应 HTTP 500、`code: 5000`、`message: Internal server error`。日志会记原始错误，响应体不含堆栈或密钥。

## OpenAPI

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/documentation/` | Swagger UI。`openapiUiEnabled === false` 时 404 |
| GET | `/documentation/json` | OpenAPI JSON，UI 关闭时仍可用 |

`APP_ENV=production` 且未设 `OPENAPI_UI=true` 时，UI 默认关闭。

## 错误码

| code | HTTP | 含义 |
| --- | --- | --- |
| 0 | 200 | 成功 |
| 1000 | 400 | TypeBox / Fastify 校验失败 |
| 2001 | 409 | 探针业务冲突（演示） |
| 2101 | 404 | `test` 记录不存在 |
| 5000 | 500 | 未预期系统错误 |
| 5030 | 503 | 未就绪 |

映射逻辑在 `src/framework/http/error-handler.plugin.ts`：

| 来源 | 结果 |
| --- | --- |
| `AppError` | 使用其 `statusCode` / `code` / `message` |
| Fastify `validation` | 400 / 1000 |
| 其他 | 500 / 5000，消息固定为 `Internal server error` |

## 新增一条路由

在对应模块的 `*.plugin.ts` 里注册，Schema 放 `*.schema.ts`，成功响应用 `successEnvelopeSchema`：

```ts
app.post(
  '/orders',
  {
    schema: {
      body: CreateOrderBodySchema,
      response: { 200: CreateOrderResponseSchema },
    },
  },
  async (request) => success(await options.service.create(request.body)),
);
```

完整模块步骤见 [业务逻辑](./logic)。
