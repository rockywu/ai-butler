# 业务逻辑

业务写在 `src/modules/<name>/`，不要把规则塞进 Plugin 或 Drizzle Client。现成样板是 `src/modules/probe/`。

## 模块文件约定

| 文件 | 职责 |
| --- | --- |
| `<name>.schema.ts` | TypeBox 请求 / 响应 Schema |
| `<name>.service.ts` | 纯 TypeScript 接口与工厂，禁止 import Fastify / Drizzle |
| `<name>.plugin.ts` | 注册路由，从 `options` 拿 Service |
| `<name>.repository.ts`（可选） | 模块内窄接口，实现放 `infrastructure/database/` |

框架插件用 `fastify-plugin` 包装；业务 `probePlugin` 目前未包 `fp()`，新模块可按同样方式先保持简单。

## 现有探针逻辑

`ProbeService` 只有一个方法：

```ts
export interface ProbeService {
  read(): { pong: boolean; source: string };
}

export function createProbeService(): ProbeService {
  return {
    read: () => ({ pong: true, source: 'real' }),
  };
}
```

Plugin 里：

- `GET /poc/ping` 调用 `options.service.read()`
- `GET /poc/context` 读 `getRequestContext()`
- `POST /poc/echo` 直接回显已校验的 `request.body`
- 两条 `/poc/errors/*` 分别抛 `AppError` 与裸 `Error`

这就是「路由薄、逻辑在 Service、错误用 `AppError`」的最小示例。

## 新增一个业务模块

以假设的 `order` 为例。

### 1. Service

`src/modules/order/order.service.ts`：

```ts
export interface OrderService {
  create(input: { value: string }): Promise<{ id: string }>;
}

export function createOrderService(): OrderService {
  return {
    async create(input) {
      return { id: `ord_${input.value}` };
    },
  };
}
```

需要持久化时，把 Repository **接口** 作为 `createOrderService` 的参数传入，不要在 Service 里 import `drizzle-orm`。

### 2. Schema 与 Plugin

请求 / 响应用 TypeBox，200 响应用 `successEnvelopeSchema`。Plugin 只做三件事：声明 schema、调 Service、`success()` 或 `throw new AppError(...)`。

```ts
throw new AppError({
  code: 4001,
  message: 'Order not found',
  statusCode: 404,
});
```

### 3. 挂到组合根

扩展 `src/app/dependencies.ts`：

```ts
export interface AppDependencies {
  probeService: ProbeService;
  orderService: OrderService;
}

export function createDependencies(
  overrides: Partial<AppDependencies> = {},
): AppDependencies {
  return {
    probeService: overrides.probeService ?? createProbeService(),
    orderService: overrides.orderService ?? createOrderService(),
  };
}
```

在 `src/app/register-modules.ts` 注册：

```ts
await app.register(orderPlugin, {
  service: dependencies.orderService,
});
```

### 4. 用假实现测逻辑

```ts
const app = await createTestApp({
  dependencies: {
    orderService: {
      create: async () => ({ id: 'fake' }),
    },
  },
});

const res = await app.inject({
  method: 'POST',
  url: '/orders',
  payload: { value: 'x' },
});
```

不要为了测 HTTP 去 `listen` TCP。

## 错误与信封

成功：

```ts
import { success } from '../../framework/http/envelope';

return success({ id: 'ord_1' });
// { code: 0, data: { id: 'ord_1' }, message: 'success' }
```

业务失败抛 `AppError`。不要把密码、连接串写进 `message`。未捕获异常一律变成 `5000`，响应固定 `Internal server error`。

## 不要做的事

- 在 Plugin 里写 SQL 或直接 `import { drizzle }`
- 在 Service 里使用 `FastifyRequest` / `reply`
- 在模块内 `process.env.XXX`
- 做通用 CRUD Repository 基类；按用例写窄方法，例如 `findUserByEmail`、`saveUser`
