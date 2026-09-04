# Fastify 后端技术 PoC 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 在 `apps/backend` 内完成可运行、可测试、可测量的 Fastify 技术 PoC，用证据验证模块、Schema、错误、显式依赖、请求上下文、生命周期、事务和性能边界。

**架构：** `createApp()` 作为唯一组合根，按顺序注册框架插件和业务插件；业务模块使用 Fastify Plugin，依赖通过工厂显式传入。PoC 只验证设计假设，不建设完整 DI、认证、Redis、NATS 或公共框架包。

**技术栈：** Node.js 24、TypeScript 6、Fastify 5、TypeBox 1、Pino/Fastify Logger、Vitest 4、Drizzle ORM 0.45、PostgreSQL 17、Testcontainers 12、dependency-cruiser 18、Autocannon 8、pnpm 11、Turbo 2

**规格：** [`apps/backend/nodejs-fastify-framework-design.md`](../../../apps/backend/nodejs-fastify-framework-design.md)

---

## 范围检查与计划拆分

完整规格包含四个具有顺序依赖的里程碑。PoC 的结论会改变薄内核的公共接口，因此不能在获得 PoC 数据前把后续三个里程碑写成不可调整的实现步骤。

实施计划按以下边界拆分：

1. **本计划：技术 PoC**——回答规格第 20 节的十项验证问题，产出 ADR 和实测数据。
2. **薄内核计划**——仅在本计划评审通过后编写，交付配置、日志脱敏、OpenAPI UI、健康检查、Graceful Shutdown 和测试工厂。
3. **认证与用户垂直切片计划**——在薄内核接口稳定后编写，交付 JWT、RBAC、用户、迁移及前端契约。
4. **稳定化计划**——在真实切片完成后编写，交付第二业务模块、故障测试、安全检查和固定环境性能门禁。

Redis、NATS、Kafka、OAuth2、Session、CLI、代码生成器和完整 OpenTelemetry 不属于上述四个计划；只有新的已批准规格才能引入。

执行本计划前，必须从包含本计划和 V0.2 规格的提交创建专用 git worktree；不得在承载其他未完成改动的工作区直接实现。

## PoC 验收映射

| 规格验证项 | 对应任务 |
| --- | --- |
| Fastify Plugin 承担模块注册、封装和顺序 | 任务 1、4 |
| 显式工厂支持单例与测试替换 | 任务 4 |
| AsyncLocalStorage 上下文传播 | 任务 5 |
| TypeBox 驱动校验、序列化和 OpenAPI | 任务 2 |
| 错误映射符合前端响应契约 | 任务 3 |
| 事务上下文协调多个 Repository | 任务 7 |
| 信号关闭和资源逆序释放 | 任务 6 |
| 框架热路径满足性能预算 | 任务 9 |
| 测试应用替换依赖且不启动 TCP | 任务 4 |
| 目录和导入规则自动约束 | 任务 8 |

## 文件结构

本计划完成后新增或修改以下文件：

- 修改：`pnpm-workspace.yaml`——集中登记后端依赖版本。
- 修改：`package.json`——增加后端开发、构建、测试命令。
- 创建：`apps/backend/package.json`——单一后端 workspace 的脚本与依赖。
- 创建：`apps/backend/tsconfig.json`——继承仓库 Node 严格配置。
- 创建：`apps/backend/tsdown.config.ts`——生成 Node ESM 产物。
- 创建：`apps/backend/src/main.ts`——进程入口和信号绑定。
- 创建：`apps/backend/src/app/create-app.ts`——唯一应用组合根。
- 创建：`apps/backend/src/app/dependencies.ts`——显式依赖工厂。
- 创建：`apps/backend/src/app/register-modules.ts`——业务模块注册顺序。
- 创建：`apps/backend/src/framework/http/fastify.ts`——类型化 Fastify 实例。
- 创建：`apps/backend/src/framework/http/envelope.ts`——统一响应 Schema 与构造函数。
- 创建：`apps/backend/src/framework/http/openapi.plugin.ts`——OpenAPI 注册。
- 创建：`apps/backend/src/framework/http/error-handler.plugin.ts`——异常到协议响应映射。
- 创建：`apps/backend/src/framework/core/app-error.ts`——稳定应用错误。
- 创建：`apps/backend/src/framework/core/request-context.ts`——AsyncLocalStorage 上下文。
- 创建：`apps/backend/src/framework/core/request-context.plugin.ts`——请求上下文 Hook。
- 创建：`apps/backend/src/framework/core/resource-registry.ts`——资源逆序关闭。
- 创建：`apps/backend/src/framework/core/shutdown.ts`——信号与超时关闭协调。
- 创建：`apps/backend/src/modules/probe/`——用于验证框架边界的最小业务插件。
- 创建：`apps/backend/src/infrastructure/database/`——Drizzle、Repository 和事务 PoC。
- 创建：`apps/backend/migrations/0000_poc_accounts.sql`——可执行数据库迁移。
- 创建：`apps/backend/.dependency-cruiser.cjs`——依赖方向规则。
- 创建：`apps/backend/benchmarks/http-overhead.ts`——裸 Fastify 与框架路由对照基准。
- 创建：`apps/backend/docs/adr/`——PoC 的架构决策记录。
- 创建：`apps/backend/docs/poc-report.md`——验证命令、结果和结论。

---

### 任务 1：建立可运行的类型化 Fastify 插件

**文件：**
- 修改：`pnpm-workspace.yaml`
- 修改：`package.json`
- 创建：`apps/backend/package.json`
- 创建：`apps/backend/tsconfig.json`
- 创建：`apps/backend/tsdown.config.ts`
- 创建：`apps/backend/src/framework/http/fastify.ts`
- 创建：`apps/backend/src/modules/probe/probe.plugin.ts`
- 创建：`apps/backend/src/app/register-modules.ts`
- 创建：`apps/backend/src/app/create-app.test.ts`
- 创建：`apps/backend/src/app/create-app.ts`
- 创建：`apps/backend/src/main.ts`

- [ ] **步骤 1：加入 workspace 配置并编写失败的 API 测试**

在 `pnpm-workspace.yaml` 的 `catalog:` 中加入：

```yaml
  '@fastify/type-provider-typebox': ^6.1.0
  fastify: ^5.12.1
  fastify-plugin: ^6.0.0
  tsx: ^4.23.13
  typebox: ^1.3.23
```

在根 `package.json` 的 `scripts` 中加入：

```json
{
  "build:backend": "pnpm --filter @ai-butler/backend build",
  "dev:backend": "pnpm --filter @ai-butler/backend dev",
  "test:backend": "pnpm --filter @ai-butler/backend test"
}
```

创建 `apps/backend/package.json`：

```json
{
  "name": "@ai-butler/backend",
  "version": "0.1.0",
  "private": true,
  "license": "UNLICENSED",
  "type": "module",
  "scripts": {
    "build": "tsdown",
    "dev": "tsx watch src/main.ts",
    "start": "node dist/main.js",
    "test": "vitest run --environment node --exclude '**/*.integration.test.ts' --exclude '**/*.e2e.test.ts'",
    "test:e2e": "vitest run --environment node tests/shutdown.e2e.test.ts",
    "test:integration": "vitest run --environment node src/infrastructure/database/transaction.integration.test.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@fastify/type-provider-typebox": "catalog:",
    "fastify": "catalog:",
    "fastify-plugin": "catalog:",
    "typebox": "catalog:"
  },
  "devDependencies": {
    "@types/node": "catalog:",
    "@vben/tsconfig": "workspace:*",
    "tsdown": "catalog:",
    "tsx": "catalog:",
    "typescript": "catalog:",
    "vitest": "catalog:"
  }
}
```

创建 `apps/backend/tsconfig.json`：

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@vben/tsconfig/node.json",
  "compilerOptions": {
    "allowImportingTsExtensions": true,
    "types": ["node", "vitest/globals"]
  },
  "include": ["src/**/*.ts", "benchmarks/**/*.ts", "tsdown.config.ts"],
  "exclude": ["dist", "node_modules"]
}
```

创建 `apps/backend/tsdown.config.ts`：

```ts
import { defineConfig } from 'tsdown';

export default defineConfig({
  clean: true,
  dts: false,
  entry: ['src/main.ts'],
  format: ['esm'],
  platform: 'node',
  sourcemap: true,
});
```

创建 `apps/backend/src/app/create-app.test.ts`：

```ts
import { afterEach, describe, expect, it } from 'vitest';

import { createApp } from './create-app';

describe('createApp', () => {
  let app: Awaited<ReturnType<typeof createApp>> | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it('registers a probe module through a Fastify plugin', async () => {
    app = await createApp({ logger: false });

    const response = await app.inject({ method: 'GET', url: '/poc/ping' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      code: 0,
      data: { pong: true },
      message: 'success',
    });
  });
});
```

- [ ] **步骤 2：安装依赖并确认测试失败**

运行：

```bash
pnpm install
pnpm exec vitest run --environment node apps/backend/src/app/create-app.test.ts
```

预期：FAIL，提示无法解析 `./create-app`。

- [ ] **步骤 3：实现最小 Fastify 应用和 probe 插件**

创建 `apps/backend/src/framework/http/fastify.ts`：

```ts
import { type TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import Fastify, { type FastifyServerOptions } from 'fastify';

export function createHttpServer(options: FastifyServerOptions = {}) {
  return Fastify(options).withTypeProvider<TypeBoxTypeProvider>();
}

export type AppInstance = ReturnType<typeof createHttpServer>;
```

创建 `apps/backend/src/modules/probe/probe.plugin.ts`：

```ts
import { type FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from 'typebox';

const responseSchema = Type.Object({
  code: Type.Literal(0),
  data: Type.Object({ pong: Type.Boolean() }),
  message: Type.String(),
});

export const probePlugin: FastifyPluginAsyncTypebox = async (app) => {
  app.get(
    '/poc/ping',
    { schema: { response: { 200: responseSchema } } },
    async () => ({
      code: 0 as const,
      data: { pong: true },
      message: 'success',
    }),
  );
};
```

创建 `apps/backend/src/app/register-modules.ts`：

```ts
import { type AppInstance } from '../framework/http/fastify';
import { probePlugin } from '../modules/probe/probe.plugin';

export async function registerModules(app: AppInstance): Promise<void> {
  await app.register(probePlugin);
}
```

创建 `apps/backend/src/app/create-app.ts`：

```ts
import { createHttpServer } from '../framework/http/fastify';
import { registerModules } from './register-modules';

export interface CreateAppOptions {
  logger?: boolean;
}

export async function createApp(options: CreateAppOptions = {}) {
  const app = createHttpServer({ logger: options.logger ?? false });
  await registerModules(app);
  return app;
}
```

创建 `apps/backend/src/main.ts`：

```ts
import { createApp } from './app/create-app';

const app = await createApp({ logger: true });
await app.listen({
  host: '0.0.0.0',
  port: Number.parseInt(process.env.PORT ?? '3000', 10),
});
```

- [ ] **步骤 4：验证测试、类型与构建**

运行：

```bash
pnpm exec vitest run --environment node apps/backend/src/app/create-app.test.ts
pnpm --filter @ai-butler/backend typecheck
pnpm --filter @ai-butler/backend build
```

预期：测试 PASS；类型检查退出码为 0；生成 `apps/backend/dist/main.js`。

- [ ] **步骤 5：Commit**

```bash
git add package.json pnpm-workspace.yaml pnpm-lock.yaml apps/backend/package.json apps/backend/tsconfig.json apps/backend/tsdown.config.ts apps/backend/src
git commit -m "feat: 建立 Fastify 后端 PoC"
```

---

### 任务 2：用 TypeBox 单一 Schema 生成校验、序列化和 OpenAPI

**文件：**
- 修改：`pnpm-workspace.yaml`
- 修改：`apps/backend/package.json`
- 创建：`apps/backend/src/framework/http/envelope.ts`
- 创建：`apps/backend/src/framework/http/openapi.plugin.ts`
- 创建：`apps/backend/src/modules/probe/probe.schema.ts`
- 修改：`apps/backend/src/modules/probe/probe.plugin.ts`
- 修改：`apps/backend/src/app/create-app.ts`
- 创建：`apps/backend/src/framework/http/openapi.test.ts`

- [ ] **步骤 1：编写失败的 Schema 与 OpenAPI 测试**

创建 `apps/backend/src/framework/http/openapi.test.ts`：

```ts
import { afterEach, describe, expect, it } from 'vitest';

import { createApp } from '../../app/create-app';

describe('TypeBox and OpenAPI', () => {
  let app: Awaited<ReturnType<typeof createApp>> | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it('uses one TypeBox schema for validation, serialization and OpenAPI', async () => {
    app = await createApp({ logger: false });

    const valid = await app.inject({
      method: 'POST',
      payload: { value: 'hello' },
      url: '/poc/echo',
    });
    const invalid = await app.inject({
      method: 'POST',
      payload: { value: 42 },
      url: '/poc/echo',
    });

    await app.ready();
    const document = app.swagger();

    expect(valid.json()).toEqual({
      code: 0,
      data: { value: 'hello' },
      message: 'success',
    });
    expect(invalid.statusCode).toBe(400);
    expect(document.paths?.['/poc/echo']?.post).toBeDefined();
  });
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：

```bash
pnpm exec vitest run --environment node apps/backend/src/framework/http/openapi.test.ts
```

预期：FAIL，`app.swagger` 不存在且 `/poc/echo` 返回 404。

- [ ] **步骤 3：实现统一响应与 OpenAPI 注册**

在 `pnpm-workspace.yaml` 的 `catalog:` 中加入：

```yaml
  '@fastify/swagger': ^9.8.1
```

在 `apps/backend/package.json` 的 `dependencies` 中加入：

```json
{
  "@fastify/swagger": "catalog:"
}
```

创建 `apps/backend/src/framework/http/envelope.ts`：

```ts
import { Type, type TSchema } from 'typebox';

export function successEnvelopeSchema<T extends TSchema>(data: T) {
  return Type.Object({
    code: Type.Literal(0),
    data,
    message: Type.String(),
  });
}

export function success<T>(data: T, message = 'success') {
  return { code: 0 as const, data, message };
}
```

创建 `apps/backend/src/framework/http/openapi.plugin.ts`：

```ts
import swagger from '@fastify/swagger';
import { type FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

const openApiPlugin: FastifyPluginAsync = async (app) => {
  await app.register(swagger, {
    openapi: {
      info: { title: 'AI Butler Backend', version: '0.1.0' },
    },
  });
};

export default fp(openApiPlugin, {
  fastify: '5.x',
  name: 'openapi',
});
```

创建 `apps/backend/src/modules/probe/probe.schema.ts`：

```ts
import { Type } from 'typebox';

import { successEnvelopeSchema } from '../../framework/http/envelope';

export const EchoBodySchema = Type.Object({
  value: Type.String({ minLength: 1 }),
});

export const EchoResponseSchema = successEnvelopeSchema(EchoBodySchema);
export const PingResponseSchema = successEnvelopeSchema(
  Type.Object({ pong: Type.Boolean() }),
);
```

修改 `probe.plugin.ts`，路由处理器只复用这些 Schema 和 `success()`：

```ts
import { type FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import { success } from '../../framework/http/envelope';
import {
  EchoBodySchema,
  EchoResponseSchema,
  PingResponseSchema,
} from './probe.schema';

export const probePlugin: FastifyPluginAsyncTypebox = async (app) => {
  app.get(
    '/poc/ping',
    { schema: { response: { 200: PingResponseSchema } } },
    async () => success({ pong: true }),
  );

  app.post(
    '/poc/echo',
    {
      schema: {
        body: EchoBodySchema,
        response: { 200: EchoResponseSchema },
      },
    },
    async (request) => success(request.body),
  );
};
```

在 `create-app.ts` 中确保 OpenAPI 先于业务路由注册：

```ts
const app = createHttpServer({ logger: options.logger ?? false });
await app.register(openApiPlugin);
await registerModules(app);
```

运行 `pnpm install` 更新 lockfile。

- [ ] **步骤 4：验证单一 Schema 链路**

运行：

```bash
pnpm exec vitest run --environment node apps/backend/src/framework/http/openapi.test.ts apps/backend/src/app/create-app.test.ts
pnpm --filter @ai-butler/backend typecheck
```

预期：全部 PASS；OpenAPI 中存在 `/poc/echo`；非法 body 返回 400。

- [ ] **步骤 5：Commit**

```bash
git add pnpm-workspace.yaml pnpm-lock.yaml apps/backend/package.json apps/backend/src
git commit -m "feat: 验证 TypeBox 与 OpenAPI 单一 Schema"
```

---

### 任务 3：统一错误映射和安全响应

**文件：**
- 创建：`apps/backend/src/framework/core/app-error.ts`
- 创建：`apps/backend/src/framework/http/error-handler.plugin.ts`
- 创建：`apps/backend/src/framework/http/error-handler.test.ts`
- 修改：`apps/backend/src/app/create-app.ts`
- 修改：`apps/backend/src/modules/probe/probe.plugin.ts`

- [ ] **步骤 1：编写业务、校验和未知错误测试**

创建 `apps/backend/src/framework/http/error-handler.test.ts`：

```ts
import { afterEach, describe, expect, it } from 'vitest';

import { createApp } from '../../app/create-app';

describe('error handler', () => {
  let app: Awaited<ReturnType<typeof createApp>> | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it.each([
    ['/poc/errors/business', 409, 2001, 'Probe conflict'],
    ['/poc/errors/system', 500, 5000, 'Internal server error'],
  ] as const)('maps %s to a safe envelope', async (url, status, code, message) => {
    app = await createApp({ logger: false });
    const response = await app.inject({ method: 'GET', url });

    expect(response.statusCode).toBe(status);
    expect(response.json()).toEqual({ code, data: null, message });
    expect(response.body).not.toContain('database-password');
  });

  it('maps Fastify validation failures to code 1000', async () => {
    app = await createApp({ logger: false });
    const response = await app.inject({
      method: 'POST',
      payload: { value: 42 },
      url: '/poc/echo',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      code: 1000,
      data: null,
      message: 'Request validation failed',
    });
  });
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：

```bash
pnpm exec vitest run --environment node apps/backend/src/framework/http/error-handler.test.ts
```

预期：FAIL；错误路由返回 404，校验错误仍使用 Fastify 默认响应。

- [ ] **步骤 3：实现稳定错误码和统一映射**

创建 `apps/backend/src/framework/core/app-error.ts`：

```ts
export class AppError extends Error {
  readonly code: number;
  readonly details: unknown | undefined;
  readonly statusCode: number;

  constructor(options: {
    cause?: unknown;
    code: number;
    details?: unknown;
    message: string;
    statusCode: number;
  }) {
    super(options.message, { cause: options.cause });
    this.name = 'AppError';
    this.code = options.code;
    this.details = options.details;
    this.statusCode = options.statusCode;
  }
}
```

创建 `apps/backend/src/framework/http/error-handler.plugin.ts`：

```ts
import { type FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

import { AppError } from '../core/app-error';

const errorHandlerPlugin: FastifyPluginAsync = async (app) => {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        code: error.code,
        data: null,
        message: error.message,
      });
    }

    if (error.validation) {
      return reply.status(400).send({
        code: 1000,
        data: null,
        message: 'Request validation failed',
      });
    }

    request.log.error({ err: error }, 'unhandled request error');
    return reply.status(500).send({
      code: 5000,
      data: null,
      message: 'Internal server error',
    });
  });
};

export default fp(errorHandlerPlugin, {
  fastify: '5.x',
  name: 'error-handler',
});
```

在 `create-app.ts` 中于业务模块前注册 `errorHandlerPlugin`。在 `probe.plugin.ts` 中增加：

```ts
app.get('/poc/errors/business', async () => {
  throw new AppError({
    code: 2001,
    message: 'Probe conflict',
    statusCode: 409,
  });
});

app.get('/poc/errors/system', async () => {
  throw new Error('database-password');
});
```

- [ ] **步骤 4：验证错误响应和回归**

运行：

```bash
pnpm exec vitest run --environment node apps/backend/src/framework/http/error-handler.test.ts apps/backend/src/framework/http/openapi.test.ts
pnpm --filter @ai-butler/backend typecheck
```

预期：全部 PASS；未知异常正文不包含原始消息。

- [ ] **步骤 5：Commit**

```bash
git add apps/backend/src
git commit -m "feat: 统一后端错误响应"
```

---

### 任务 4：验证显式依赖工厂、单例和测试替换

**文件：**
- 创建：`apps/backend/src/modules/probe/probe.service.ts`
- 创建：`apps/backend/src/app/dependencies.ts`
- 修改：`apps/backend/src/app/register-modules.ts`
- 修改：`apps/backend/src/app/create-app.ts`
- 修改：`apps/backend/src/app/create-app.test.ts`
- 修改：`apps/backend/src/modules/probe/probe.plugin.ts`
- 修改：`apps/backend/src/modules/probe/probe.schema.ts`
- 创建：`apps/backend/src/app/dependencies.test.ts`

- [ ] **步骤 1：编写依赖单例和覆盖测试**

创建 `apps/backend/src/app/dependencies.test.ts`：

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createDependencies } from './dependencies';
import { createApp } from './create-app';

describe('explicit dependencies', () => {
  let app: Awaited<ReturnType<typeof createApp>> | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it('creates one service instance per dependency graph', () => {
    const first = createDependencies();
    const second = createDependencies();

    expect(first.probeService).toBe(first.probeService);
    expect(first.probeService).not.toBe(second.probeService);
  });

  it('replaces a dependency without a global container or TCP server', async () => {
    const read = vi.fn().mockReturnValue({ pong: true, source: 'fake' });
    app = await createApp({
      dependencies: { probeService: { read } },
      logger: false,
    });

    const response = await app.inject({ method: 'GET', url: '/poc/ping' });

    expect(read).toHaveBeenCalledOnce();
    expect(response.json().data).toEqual({ pong: true, source: 'fake' });
  });
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：

```bash
pnpm exec vitest run --environment node apps/backend/src/app/dependencies.test.ts
```

预期：FAIL，找不到 `./dependencies`，且 `createApp` 不接受 `dependencies`。

- [ ] **步骤 3：实现依赖图并通过插件选项注入**

创建 `apps/backend/src/modules/probe/probe.service.ts`：

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

创建 `apps/backend/src/app/dependencies.ts`：

```ts
import {
  createProbeService,
  type ProbeService,
} from '../modules/probe/probe.service';

export interface AppDependencies {
  probeService: ProbeService;
}

export function createDependencies(
  overrides: Partial<AppDependencies> = {},
): AppDependencies {
  return {
    probeService: overrides.probeService ?? createProbeService(),
  };
}
```

将 `registerModules` 改成：

```ts
export async function registerModules(
  app: AppInstance,
  dependencies: AppDependencies,
): Promise<void> {
  await app.register(probePlugin, {
    service: dependencies.probeService,
  });
}
```

为 `probePlugin` 定义选项，并将 `/poc/ping` 处理器改成：

```ts
interface ProbePluginOptions {
  service: ProbeService;
}

export const probePlugin: FastifyPluginAsyncTypebox<
  ProbePluginOptions
> = async (app, options) => {
  app.get(
    '/poc/ping',
    { schema: { response: { 200: PingResponseSchema } } },
    async () => success(options.service.read()),
  );

  // 保留任务 2、3 已加入的 echo 和 errors 路由。
};
```

将 `PingResponseSchema.data` 改为：

```ts
Type.Object({
  pong: Type.Boolean(),
  source: Type.String(),
})
```

将 `CreateAppOptions` 扩展为：

```ts
export interface CreateAppOptions {
  dependencies?: Partial<AppDependencies>;
  logger?: boolean;
}
```

在 `createApp()` 内调用 `createDependencies(options.dependencies)`，并将结果传给 `registerModules()`。

将 `create-app.test.ts` 中 ping 响应的 `data` 更新为：

```ts
data: { pong: true, source: 'real' },
```

- [ ] **步骤 4：验证依赖行为和完整 API 回归**

运行：

```bash
pnpm exec vitest run --environment node apps/backend/src/app
pnpm exec vitest run --environment node apps/backend/src/framework/http
pnpm --filter @ai-butler/backend typecheck
```

预期：全部 PASS；测试过程没有监听 TCP 端口。

- [ ] **步骤 5：Commit**

```bash
git add apps/backend/src
git commit -m "feat: 增加显式应用依赖图"
```

---

### 任务 5：验证 AsyncLocalStorage 请求上下文

**文件：**
- 创建：`apps/backend/src/framework/core/request-context.ts`
- 创建：`apps/backend/src/framework/core/request-context.plugin.ts`
- 创建：`apps/backend/src/framework/core/request-context.test.ts`
- 修改：`apps/backend/src/app/create-app.ts`
- 修改：`apps/backend/src/modules/probe/probe.plugin.ts`
- 修改：`apps/backend/src/modules/probe/probe.schema.ts`

- [ ] **步骤 1：编写并发请求隔离测试**

创建 `apps/backend/src/framework/core/request-context.test.ts`：

```ts
import { afterEach, describe, expect, it } from 'vitest';

import { createApp } from '../../app/create-app';

describe('request context', () => {
  let app: Awaited<ReturnType<typeof createApp>> | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it('keeps request ids isolated across concurrent async work', async () => {
    app = await createApp({ logger: false });

    const [first, second] = await Promise.all([
      app.inject({
        headers: { 'x-request-id': 'request-a' },
        method: 'GET',
        url: '/poc/context',
      }),
      app.inject({
        headers: { 'x-request-id': 'request-b' },
        method: 'GET',
        url: '/poc/context',
      }),
    ]);

    expect(first.json().data.requestId).toBe('request-a');
    expect(second.json().data.requestId).toBe('request-b');
    expect(first.headers['x-request-id']).toBe('request-a');
    expect(second.headers['x-request-id']).toBe('request-b');
  });
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：

```bash
pnpm exec vitest run --environment node apps/backend/src/framework/core/request-context.test.ts
```

预期：FAIL，`/poc/context` 返回 404。

- [ ] **步骤 3：实现上下文存储和 Fastify Hook**

创建 `apps/backend/src/framework/core/request-context.ts`：

```ts
import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  requestId: string;
  traceId: string | undefined;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext {
  const context = storage.getStore();
  if (!context) {
    throw new Error('Request context is unavailable');
  }
  return context;
}

export function runWithRequestContext<T>(
  context: RequestContext,
  callback: () => T,
): T {
  return storage.run(context, callback);
}
```

创建 `apps/backend/src/framework/core/request-context.plugin.ts`：

```ts
import { type FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';

import { runWithRequestContext } from './request-context';

const requestContextPlugin: FastifyPluginCallback = (app, _options, done) => {
  app.addHook('onRequest', (request, reply, next) => {
    const header = request.headers['x-request-id'];
    const requestId = typeof header === 'string' ? header : request.id;
    reply.header('x-request-id', requestId);
    runWithRequestContext({ requestId, traceId: undefined }, next);
  });
  done();
};

export default fp(requestContextPlugin, {
  fastify: '5.x',
  name: 'request-context',
});
```

在 `createApp()` 中于业务模块前注册该插件。在 `probe.schema.ts` 增加：

```ts
export const ContextResponseSchema = successEnvelopeSchema(
  Type.Object({ requestId: Type.String() }),
);
```

在 probe 插件中增加：

```ts
app.get(
  '/poc/context',
  { schema: { response: { 200: ContextResponseSchema } } },
  async () => {
    await Promise.resolve();
    const { requestId } = getRequestContext();
    return success({ requestId });
  },
);
```

同时从对应文件导入 `ContextResponseSchema` 和 `getRequestContext`。

- [ ] **步骤 4：验证并发隔离和上下文外访问失败**

在测试中再断言直接调用 `getRequestContext()` 抛出 `Request context is unavailable`，然后运行：

```bash
pnpm exec vitest run --environment node apps/backend/src/framework/core/request-context.test.ts
pnpm --filter @ai-butler/backend typecheck
```

预期：全部 PASS；两个并发请求不会交换 ID。

- [ ] **步骤 5：Commit**

```bash
git add apps/backend/src
git commit -m "feat: 验证请求上下文隔离"
```

---

### 任务 6：验证资源逆序关闭、超时和进程信号

**文件：**
- 创建：`apps/backend/src/framework/core/resource-registry.ts`
- 创建：`apps/backend/src/framework/core/resource-registry.test.ts`
- 创建：`apps/backend/src/framework/core/shutdown.ts`
- 创建：`apps/backend/src/framework/core/shutdown.test.ts`
- 修改：`apps/backend/src/main.ts`
- 创建：`apps/backend/tests/shutdown.e2e.test.ts`

- [ ] **步骤 1：编写关闭顺序、错误聚合和超时测试**

创建 `apps/backend/src/framework/core/resource-registry.test.ts`：

```ts
import { describe, expect, it, vi } from 'vitest';

import { ResourceRegistry } from './resource-registry';

describe('ResourceRegistry', () => {
  it('closes resources once in reverse registration order', async () => {
    const order: string[] = [];
    const registry = new ResourceRegistry();
    registry.register('database', async () => void order.push('database'));
    registry.register('http', async () => void order.push('http'));

    await registry.closeAll();
    await registry.closeAll();

    expect(order).toEqual(['http', 'database']);
  });

  it('continues closing after one resource fails', async () => {
    const closeDatabase = vi.fn();
    const registry = new ResourceRegistry();
    registry.register('database', closeDatabase);
    registry.register('http', async () => {
      throw new Error('http close failed');
    });

    await expect(registry.closeAll()).rejects.toBeInstanceOf(AggregateError);
    expect(closeDatabase).toHaveBeenCalledOnce();
  });
});
```

创建 `apps/backend/src/framework/core/shutdown.test.ts`：

```ts
import { describe, expect, it } from 'vitest';

import { createShutdown } from './shutdown';

describe('createShutdown', () => {
  it('returns one promise and rejects when closing times out', async () => {
    let releaseClose: (() => void) | undefined;
    const closePromise = new Promise<void>((resolve) => {
      releaseClose = resolve;
    });
    const shutdown = createShutdown({
      close: () => closePromise,
      timeoutMs: 25,
    });

    const first = shutdown();
    const second = shutdown();

    expect(first).toBe(second);
    await expect(first).rejects.toThrow('Shutdown timed out after 25ms');
    releaseClose?.();
  });
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：

```bash
pnpm exec vitest run --environment node apps/backend/src/framework/core/resource-registry.test.ts apps/backend/src/framework/core/shutdown.test.ts
```

预期：FAIL，两个实现模块均不存在。

- [ ] **步骤 3：实现资源注册表和幂等关闭控制器**

创建 `apps/backend/src/framework/core/resource-registry.ts`：

```ts
interface Resource {
  close: () => Promise<void> | void;
  name: string;
}

export class ResourceRegistry {
  readonly #resources: Resource[] = [];
  #closePromise: Promise<void> | undefined;

  register(name: string, close: Resource['close']): void {
    if (this.#closePromise) {
      throw new Error(`Cannot register ${name} while closing`);
    }
    this.#resources.push({ close, name });
  }

  closeAll(): Promise<void> {
    this.#closePromise ??= this.#closeOnce();
    return this.#closePromise;
  }

  async #closeOnce(): Promise<void> {
    const errors: Error[] = [];
    for (const resource of this.#resources.toReversed()) {
      try {
        await resource.close();
      } catch (error) {
        errors.push(
          new Error(`Failed to close ${resource.name}`, { cause: error }),
        );
      }
    }
    if (errors.length > 0) {
      throw new AggregateError(errors, 'One or more resources failed to close');
    }
  }
}
```

创建 `apps/backend/src/framework/core/shutdown.ts`：

```ts
export function createShutdown(options: {
  close: () => Promise<void>;
  timeoutMs: number;
}) {
  let running: Promise<void> | undefined;

  return function shutdown(): Promise<void> {
    running ??= Promise.race([
      options.close(),
      new Promise<never>((_resolve, reject) => {
        setTimeout(
          () =>
            reject(
              new Error(`Shutdown timed out after ${options.timeoutMs}ms`),
            ),
          options.timeoutMs,
        ).unref();
      }),
    ]);
    return running;
  };
}
```

将 `main.ts` 更新为：

```ts
import { createApp } from './app/create-app';
import { ResourceRegistry } from './framework/core/resource-registry';
import { createShutdown } from './framework/core/shutdown';

const app = await createApp({ logger: true });
const resources = new ResourceRegistry();
resources.register('fastify', () => app.close());

const shutdown = createShutdown({
  close: () => resources.closeAll(),
  timeoutMs: 10_000,
});

async function handleSignal(signal: NodeJS.Signals): Promise<void> {
  app.log.info({ signal }, 'shutdown started');
  try {
    await shutdown();
    process.exitCode = 0;
  } catch (error) {
    app.log.error({ err: error, signal }, 'shutdown failed');
    process.exitCode = 1;
  }
}

process.once('SIGINT', () => void handleSignal('SIGINT'));
process.once('SIGTERM', () => void handleSignal('SIGTERM'));

await app.listen({
  host: '0.0.0.0',
  port: Number.parseInt(process.env.PORT ?? '3000', 10),
});
```

- [ ] **步骤 4：增加真实子进程信号测试并运行**

创建 `apps/backend/tests/shutdown.e2e.test.ts`：

```ts
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

const backendRoot = fileURLToPath(new URL('../', import.meta.url));

describe('backend process shutdown', () => {
  let child: ChildProcessWithoutNullStreams | undefined;

  afterEach(() => {
    if (child?.exitCode === null) {
      child.kill('SIGKILL');
    }
  });

  it('exits cleanly after SIGTERM', async () => {
    child = spawn(process.execPath, ['dist/main.js'], {
      cwd: backendRoot,
      env: { ...process.env, PORT: '0' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let output = '';
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error(`backend did not start:\n${output}`));
      }, 5_000);
      const onData = (chunk: Buffer) => {
        output += chunk.toString();
        if (output.includes('Server listening at')) {
          cleanup();
          resolve();
        }
      };
      const cleanup = () => {
        clearTimeout(timeout);
        child?.stdout.off('data', onData);
        child?.stderr.off('data', onData);
      };
      child?.stdout.on('data', onData);
      child?.stderr.on('data', onData);
    });

    const exited = new Promise<
      [code: number | null, signal: NodeJS.Signals | null]
    >((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error(`backend did not stop:\n${output}`)),
        5_000,
      );
      child?.once('exit', (code, signal) => {
        clearTimeout(timeout);
        resolve([code, signal]);
      });
    });
    child.kill('SIGTERM');
    const [code, signal] = await exited;

    expect(signal).toBeNull();
    expect(code).toBe(0);
  });
});
```

运行：

```bash
pnpm --filter @ai-butler/backend build
pnpm --filter @ai-butler/backend test:e2e
pnpm exec vitest run --environment node apps/backend/src/framework/core/resource-registry.test.ts apps/backend/src/framework/core/shutdown.test.ts
```

预期：全部 PASS；子进程无需强制 `SIGKILL`。

- [ ] **步骤 5：Commit**

```bash
git add apps/backend/src apps/backend/tests
git commit -m "feat: 验证后端资源安全关闭"
```

---

### 任务 7：验证 PostgreSQL 迁移和跨 Repository 事务

**文件：**
- 修改：`pnpm-workspace.yaml`
- 修改：`apps/backend/package.json`
- 创建：`apps/backend/drizzle.config.ts`
- 创建：`apps/backend/migrations/0000_poc_accounts.sql`
- 创建：`apps/backend/src/infrastructure/database/schema.ts`
- 创建：`apps/backend/src/infrastructure/database/client.ts`
- 创建：`apps/backend/src/infrastructure/database/account.repository.ts`
- 创建：`apps/backend/src/infrastructure/database/audit.repository.ts`
- 创建：`apps/backend/src/infrastructure/database/transaction.integration.test.ts`

- [ ] **步骤 1：编写真实 PostgreSQL 事务回滚测试**

创建 `apps/backend/src/infrastructure/database/transaction.integration.test.ts`：

```ts
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createAccount, listAccounts } from './account.repository';
import { appendAudit, listAudits } from './audit.repository';
import { createDatabase, type Database } from './client';

describe('database transaction', () => {
  let closeClient: () => Promise<void> = async () => {};
  let database: Database;
  let stopContainer: () => Promise<void> = async () => {};

  beforeAll(async () => {
    const container = await new PostgreSqlContainer('postgres:17-alpine').start();
    stopContainer = () => container.stop().then(() => undefined);
    const client = postgres(container.getConnectionUri(), { max: 2 });
    closeClient = () => client.end();
    database = createDatabase(client);
    await migrate(database, {
      migrationsFolder: fileURLToPath(
        new URL('../../../migrations', import.meta.url),
      ),
    });
  }, 60_000);

  afterAll(async () => {
    await closeClient();
    await stopContainer();
  });

  it('rolls back changes made by two repositories in one transaction', async () => {
    await expect(
      database.transaction(async (transaction) => {
        await createAccount(transaction, {
          balance: 100,
          id: 'account-1',
        });
        await appendAudit(transaction, {
          accountId: 'account-1',
          event: 'created',
          id: 'audit-1',
        });
        throw new Error('force rollback');
      }),
    ).rejects.toThrow('force rollback');

    expect(await listAccounts(database)).toEqual([]);
    expect(await listAudits(database)).toEqual([]);
  });
});
```

- [ ] **步骤 2：安装依赖并验证测试失败**

在 `pnpm-workspace.yaml` 的 `catalog:` 中加入：

```yaml
  '@testcontainers/postgresql': ^12.1.0
  drizzle-kit: ^0.31.10
  drizzle-orm: ^0.45.2
  postgres: ^3.4.9
```

在 `apps/backend/package.json` 中加入运行依赖 `drizzle-orm`、`postgres`，以及开发依赖 `@testcontainers/postgresql`、`drizzle-kit`。增加脚本：

```json
{
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate"
}
```

运行：

```bash
pnpm install
pnpm --filter @ai-butler/backend test:integration
```

预期：FAIL，数据库实现和 Repository 文件不存在。

- [ ] **步骤 3：实现 Schema、迁移、数据库类型和窄 Repository**

创建两个表：

```ts
import { integer, pgTable, text } from 'drizzle-orm/pg-core';

export const accounts = pgTable('poc_accounts', {
  balance: integer().notNull(),
  id: text().primaryKey(),
});

export const auditLogs = pgTable('poc_audit_logs', {
  accountId: text('account_id')
    .notNull()
    .references(() => accounts.id),
  event: text().notNull(),
  id: text().primaryKey(),
});

export const schema = { accounts, auditLogs };
```

创建 `apps/backend/migrations/0000_poc_accounts.sql`：

```sql
CREATE TABLE "poc_accounts" (
  "id" text PRIMARY KEY NOT NULL,
  "balance" integer NOT NULL
);

CREATE TABLE "poc_audit_logs" (
  "id" text PRIMARY KEY NOT NULL,
  "account_id" text NOT NULL,
  "event" text NOT NULL,
  CONSTRAINT "poc_audit_logs_account_id_poc_accounts_id_fk"
    FOREIGN KEY ("account_id")
    REFERENCES "public"."poc_accounts"("id")
    ON DELETE no action
    ON UPDATE no action
);
```

在 `client.ts` 定义：

```ts
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { type Sql } from 'postgres';

import { schema } from './schema';

export function createDatabase(client: Sql) {
  return drizzle(client, { schema });
}

export type Database = PostgresJsDatabase<typeof schema>;
export type Transaction = Parameters<
  Parameters<Database['transaction']>[0]
>[0];
export type DatabaseExecutor = Database | Transaction;
```

创建 `apps/backend/src/infrastructure/database/account.repository.ts`：

```ts
import { asc } from 'drizzle-orm';

import { type DatabaseExecutor } from './client';
import { accounts } from './schema';

export interface NewAccount {
  balance: number;
  id: string;
}

export async function createAccount(
  executor: DatabaseExecutor,
  account: NewAccount,
): Promise<void> {
  await executor.insert(accounts).values(account);
}

export function listAccounts(executor: DatabaseExecutor) {
  return executor.select().from(accounts).orderBy(asc(accounts.id));
}
```

创建 `apps/backend/src/infrastructure/database/audit.repository.ts`：

```ts
import { asc } from 'drizzle-orm';

import { type DatabaseExecutor } from './client';
import { auditLogs } from './schema';

export interface NewAudit {
  accountId: string;
  event: string;
  id: string;
}

export async function appendAudit(
  executor: DatabaseExecutor,
  audit: NewAudit,
): Promise<void> {
  await executor.insert(auditLogs).values(audit);
}

export function listAudits(executor: DatabaseExecutor) {
  return executor.select().from(auditLogs).orderBy(asc(auditLogs.id));
}
```

创建 `drizzle.config.ts`：

```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  out: './migrations',
  schema: './src/infrastructure/database/schema.ts',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
});
```

- [ ] **步骤 4：验证迁移和事务边界**

运行：

```bash
pnpm --filter @ai-butler/backend test:integration
pnpm --filter @ai-butler/backend typecheck
```

预期：PASS；抛错后两个表均为空。若本机 Docker 不可用，测试应明确报出 Testcontainers 的 Docker 连接错误，不能改成内存数据库规避。

- [ ] **步骤 5：Commit**

```bash
git add pnpm-workspace.yaml pnpm-lock.yaml apps/backend/package.json apps/backend/drizzle.config.ts apps/backend/migrations apps/backend/src/infrastructure
git commit -m "feat: 验证跨仓储数据库事务"
```

---

### 任务 8：自动约束目录依赖方向

**文件：**
- 修改：`pnpm-workspace.yaml`
- 修改：`apps/backend/package.json`
- 创建：`apps/backend/.dependency-cruiser.cjs`
- 创建：`apps/backend/src/architecture.test.ts`

- [ ] **步骤 1：编写会触发违规的架构测试**

创建 `apps/backend/src/architecture.test.ts`：

```ts
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

describe('backend architecture', () => {
  it('satisfies dependency-cruiser rules', async () => {
    const result = await execFileAsync(
      'pnpm',
      [
        'exec',
        'depcruise',
        '--config',
        '.dependency-cruiser.cjs',
        'src',
      ],
      { cwd: new URL('../', import.meta.url) },
    );

    expect(result).toBeDefined();
  });
});
```

在测试首次运行前，临时向 `framework/http/fastify.ts` 添加一行 `import '../../modules/probe/probe.plugin';`，确认规则能够捕获真实违规；确认后立即删除该临时导入，不得提交。

- [ ] **步骤 2：安装工具并验证规则尚未建立**

在 `pnpm-workspace.yaml` 的 `catalog:` 中加入：

```yaml
  dependency-cruiser: ^18.2.0
```

在 `apps/backend/package.json` 的 `devDependencies` 中加入 `dependency-cruiser`，并增加：

```json
{
  "check:architecture": "depcruise --config .dependency-cruiser.cjs src"
}
```

运行 `pnpm install` 后执行：

```bash
pnpm --filter @ai-butler/backend check:architecture
```

预期：在配置文件创建前 FAIL，提示找不到 `.dependency-cruiser.cjs`。

- [ ] **步骤 3：定义可执行的依赖规则**

创建 `apps/backend/.dependency-cruiser.cjs`：

```js
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'framework-must-not-import-modules',
      severity: 'error',
      from: { path: '^src/framework/' },
      to: { path: '^src/modules/' },
    },
    {
      name: 'business-must-not-import-database-clients',
      severity: 'error',
      from: { path: '^src/modules/' },
      to: { path: '^(drizzle-orm|postgres)' },
    },
    {
      name: 'services-must-not-import-fastify',
      severity: 'error',
      from: { path: '\\.service\\.ts$' },
      to: { path: '^fastify$' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    includeOnly: '^src',
    tsConfig: { fileName: 'tsconfig.json' },
  },
};
```

- [ ] **步骤 4：验证正反两种结果**

保留临时违规导入时运行：

```bash
pnpm --filter @ai-butler/backend check:architecture
```

预期：FAIL，并报告 `framework-must-not-import-modules`。

删除临时违规导入后运行：

```bash
pnpm --filter @ai-butler/backend check:architecture
pnpm exec vitest run --environment node apps/backend/src/architecture.test.ts
```

预期：全部 PASS。

- [ ] **步骤 5：Commit**

```bash
git add pnpm-workspace.yaml pnpm-lock.yaml apps/backend/package.json apps/backend/.dependency-cruiser.cjs apps/backend/src/architecture.test.ts
git commit -m "test: 约束后端模块依赖方向"
```

---

### 任务 9：建立裸 Fastify 对照性能基准

**文件：**
- 修改：`pnpm-workspace.yaml`
- 修改：`apps/backend/package.json`
- 创建：`apps/backend/benchmarks/http-overhead.ts`
- 创建：`apps/backend/benchmarks/http-overhead.test.ts`
- 创建：`apps/backend/benchmarks/results/.gitignore`

- [ ] **步骤 1：为预算计算编写失败测试**

创建 `apps/backend/benchmarks/http-overhead.test.ts`：

```ts
import { describe, expect, it } from 'vitest';

import { evaluateBudget, percentile } from './http-overhead';

describe('HTTP benchmark math', () => {
  it('calculates p95 and relative throughput loss', () => {
    expect(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.95)).toBe(10);
    expect(
      evaluateBudget({
        bareP95Ms: 2,
        bareRequestsPerSecond: 10_000,
        frameworkP95Ms: 2.5,
        frameworkRequestsPerSecond: 9_200,
      }),
    ).toEqual({
      latencyDeltaMs: 0.5,
      passed: true,
      throughputLossRatio: 0.08,
    });
  });
});
```

- [ ] **步骤 2：安装基准工具并验证测试失败**

在 `pnpm-workspace.yaml` 的 `catalog:` 中加入：

```yaml
  autocannon: ^8.0.0
```

在 `apps/backend/package.json` 的 `devDependencies` 中加入 `autocannon`，并增加：

```json
{
  "benchmark": "tsx benchmarks/http-overhead.ts",
  "benchmark:check": "cross-env BENCHMARK_ENFORCE=true tsx benchmarks/http-overhead.ts"
}
```

同时在 `devDependencies` 中加入仓库已有的 `cross-env: "catalog:"`。运行 `pnpm install`，然后执行：

```bash
pnpm exec vitest run --environment node apps/backend/benchmarks/http-overhead.test.ts
```

预期：FAIL，找不到 `./http-overhead`。

- [ ] **步骤 3：实现确定性的预算计算和真实 HTTP 对照**

创建完整的 `apps/backend/benchmarks/http-overhead.ts`：

```ts
import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { type AddressInfo } from 'node:net';
import { platform } from 'node:os';
import { performance } from 'node:perf_hooks';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

import Fastify, { type FastifyInstance } from 'fastify';

import { createApp } from '../src/app/create-app';

const execFileAsync = promisify(execFile);
const backendRoot = fileURLToPath(new URL('../', import.meta.url));

export interface BenchmarkInput {
  bareP95Ms: number;
  bareRequestsPerSecond: number;
  frameworkP95Ms: number;
  frameworkRequestsPerSecond: number;
}

export function percentile(values: number[], ratio: number): number {
  const sorted = values.toSorted((left, right) => left - right);
  const index = Math.ceil(sorted.length * ratio) - 1;
  return sorted[Math.max(0, index)] ?? 0;
}

export function evaluateBudget(input: BenchmarkInput) {
  const throughputLossRatio =
    (input.bareRequestsPerSecond - input.frameworkRequestsPerSecond) /
    input.bareRequestsPerSecond;
  const latencyDeltaMs = input.frameworkP95Ms - input.bareP95Ms;
  return {
    latencyDeltaMs,
    passed: throughputLossRatio <= 0.1 && latencyDeltaMs <= 1,
    throughputLossRatio,
  };
}

function urlFor(app: FastifyInstance): string {
  const address = app.server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}/poc/ping`;
}

async function requestsPerSecond(url: string): Promise<number> {
  const { stdout } = await execFileAsync(
    'pnpm',
    ['exec', 'autocannon', '-j', '-c', '50', '-d', '10', url],
    { cwd: backendRoot, maxBuffer: 10 * 1024 * 1024 },
  );
  const result = JSON.parse(stdout) as { requests: { average: number } };
  return result.requests.average;
}

async function p95Latency(
  url: string,
  requestCount = 1_000,
  concurrency = 50,
): Promise<number> {
  const durations: number[] = [];
  for (let offset = 0; offset < requestCount; offset += concurrency) {
    const batchSize = Math.min(concurrency, requestCount - offset);
    await Promise.all(
      Array.from({ length: batchSize }, async () => {
        const startedAt = performance.now();
        const response = await fetch(url);
        await response.arrayBuffer();
        durations.push(performance.now() - startedAt);
      }),
    );
  }
  return percentile(durations, 0.95);
}

async function createBareApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  app.get('/poc/ping', async () => ({
    code: 0,
    data: { pong: true, source: 'real' },
    message: 'success',
  }));
  await app.listen({ host: '127.0.0.1', port: 0 });
  return app;
}

async function run(): Promise<void> {
  const bare = await createBareApp();
  const framework = await createApp({ logger: false });
  await framework.listen({ host: '127.0.0.1', port: 0 });

  try {
    const bareUrl = urlFor(bare);
    const frameworkUrl = urlFor(framework);

    await Promise.all([
      p95Latency(bareUrl, 200, 50),
      p95Latency(frameworkUrl, 200, 50),
    ]);

    const bareRequestsPerSecond = await requestsPerSecond(bareUrl);
    const frameworkRequestsPerSecond =
      await requestsPerSecond(frameworkUrl);
    const bareP95Ms = await p95Latency(bareUrl);
    const frameworkP95Ms = await p95Latency(frameworkUrl);
    const budget = evaluateBudget({
      bareP95Ms,
      bareRequestsPerSecond,
      frameworkP95Ms,
      frameworkRequestsPerSecond,
    });
    const result = {
      budget,
      environment: {
        concurrency: 50,
        durationSeconds: 10,
        node: process.version,
        platform: platform(),
      },
      measurements: {
        bare: { p95Ms: bareP95Ms, requestsPerSecond: bareRequestsPerSecond },
        framework: {
          p95Ms: frameworkP95Ms,
          requestsPerSecond: frameworkRequestsPerSecond,
        },
      },
    };

    const resultsDirectory = new URL('./results/', import.meta.url);
    await mkdir(resultsDirectory, { recursive: true });
    await writeFile(
      new URL('latest.json', resultsDirectory),
      `${JSON.stringify(result, null, 2)}\n`,
    );
    console.log(JSON.stringify(result, null, 2));

    if (process.env.BENCHMARK_ENFORCE === 'true' && !budget.passed) {
      process.exitCode = 1;
    }
  } finally {
    await Promise.all([bare.close(), framework.close()]);
  }
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(entry).href) {
  await run();
}
```

`benchmarks/results/.gitignore` 内容：

```gitignore
*.json
!.gitignore
```

- [ ] **步骤 4：运行单元测试和本机趋势基准**

运行：

```bash
pnpm exec vitest run --environment node apps/backend/benchmarks/http-overhead.test.ts
pnpm --filter @ai-butler/backend benchmark
```

预期：单元测试 PASS；生成 `benchmarks/results/latest.json`。本机结果只记录趋势，即使预算失败也不阻断；不得通过减少框架行为伪造对照。

- [ ] **步骤 5：Commit**

```bash
git add pnpm-workspace.yaml pnpm-lock.yaml apps/backend/package.json apps/backend/benchmarks
git commit -m "perf: 增加 Fastify 框架开销基准"
```

---

### 任务 10：记录 ADR、PoC 证据并执行总验收

**文件：**
- 创建：`apps/backend/docs/adr/0001-use-fastify-plugins-as-modules.md`
- 创建：`apps/backend/docs/adr/0002-use-explicit-dependency-graph.md`
- 创建：`apps/backend/docs/adr/0003-keep-framework-inside-backend-workspace.md`
- 创建：`apps/backend/docs/poc-report.md`
- 修改：`apps/backend/nodejs-fastify-framework-design.md`

- [ ] **步骤 1：先运行全部证据命令**

运行：

```bash
pnpm --filter @ai-butler/backend test
pnpm --filter @ai-butler/backend test:integration
pnpm --filter @ai-butler/backend build
pnpm --filter @ai-butler/backend test:e2e
pnpm --filter @ai-butler/backend typecheck
pnpm --filter @ai-butler/backend check:architecture
pnpm --filter @ai-butler/backend benchmark
pnpm check:type
```

预期：除本机趋势基准允许报告预算失败外，其余命令全部退出码为 0。保存每条命令的退出码、测试数量和基准 JSON 数据。

- [ ] **步骤 2：编写三份无占位符 ADR**

每份 ADR 使用固定结构：

```markdown
# ADR 0001：使用 Fastify Plugin 作为模块边界

**状态：** 接受

## 背景

后端需要模块注册、封装、依赖顺序和生命周期能力，同时要避免复制 NestJS 元数据系统。

## 决策

业务 HTTP 模块直接实现为 Fastify Plugin；应用组合根显式决定注册顺序和插件选项。

## 替代方案

- 自研 `defineModule()`：拒绝，因为与 Fastify Plugin 重复且尚无额外需求。
- 引入 NestJS：拒绝，因为当前目标是保持 Fastify 原生机制和较低开销。

## 后果

- 模块 HTTP 封装与 Fastify 一致。
- 非 HTTP 服务仍通过显式 TypeScript 接口暴露。
- 如果 PoC 证明插件依赖顺序无法表达真实需求，必须新建 ADR 替代本决策。
```

创建 `0002-use-explicit-dependency-graph.md`：

```markdown
# ADR 0002：使用显式依赖图

**状态：** 接受

## 背景

后端需要应用级单例、构造依赖和测试替换，但尚未出现 Request Scope、动态 Provider 或运行时依赖查找需求。

## 决策

`createDependencies()` 创建应用级依赖图，`createApp()` 作为唯一组合根；依赖通过函数参数、构造函数和 Fastify Plugin 选项传递。

## 替代方案

- 自研 DI Container：拒绝，因为当前作用域固定，容器只会隐藏依赖。
- 使用装饰器容器：拒绝，因为会引入反射元数据和额外运行时机制。

## 后果

- 测试可以通过 `Partial<AppDependencies>` 替换单项依赖。
- 每个应用实例拥有独立依赖图。
- 出现无法由显式工厂表达的真实作用域需求时，必须通过新 ADR 重新评估。
```

创建 `0003-keep-framework-inside-backend-workspace.md`：

```markdown
# ADR 0003：框架保留在 backend workspace 内

**状态：** 接受

## 背景

框架第一阶段只服务当前 Monorepo，且所有服务端代码必须集中在 `apps/backend`。

## 决策

框架、业务模块、基础设施、迁移、测试和 ADR 均存放在 `apps/backend`；通过目录和自动依赖规则隔离，不创建根目录 `packages/backend-*`。

## 替代方案

- 拆成多个 workspace 包：拒绝，因为尚无第二个消费者或独立发布需求。
- 将框架放入根 `packages/`：拒绝，因为不符合服务端代码集中管理约束。

## 后果

- 后端可以作为一个模块化单体独立演进。
- Turbo 以单一 workspace 运行后端任务。
- 出现第二个服务端应用或独立版本需求时，必须先提交拆包 ADR。
```

- [ ] **步骤 3：编写 PoC 报告并回填设计状态**

`poc-report.md` 必须逐项列出规格第 20 节十个问题，并为每项记录：

- 结论：通过、失败或需修订设计。
- 对应测试/基准文件。
- 实际执行命令。
- 实际退出码和关键数据。
- 对后续薄内核计划的影响。

不允许填写推测值。性能项从 `benchmarks/results/latest.json` 复制 Node 版本、RPS、p95、吞吐损耗比例和延迟增量。

只有十项均有证据且无未解释失败时，才将设计文档状态从：

```markdown
**状态：设计已确认，暂不进入开发**
```

改为：

```markdown
**状态：技术 PoC 已验证，等待薄内核实现计划评审**
```

若任何关键假设失败，保持原状态，在报告中写明需要重新设计的章节，不得继续薄内核开发。

- [ ] **步骤 4：重新执行静态验证**

运行：

```bash
pnpm --filter @ai-butler/backend typecheck
pnpm --filter @ai-butler/backend check:architecture
git diff --check
git status --short
```

预期：类型与架构检查通过；`git diff --check` 无输出；状态只包含本任务的 ADR、报告和设计状态变更。

- [ ] **步骤 5：Commit**

```bash
git add apps/backend/docs apps/backend/nodejs-fastify-framework-design.md
git commit -m "docs: 记录 Fastify 后端 PoC 结论"
```

---

## 最终完成条件

只有同时满足以下条件，本计划才算完成：

- 十个任务分别有独立提交。
- 单元、API、集成和 E2E 测试均通过。
- `pnpm check:type` 和依赖方向检查通过。
- PoC 报告的十个问题均有可复现证据。
- 性能结果使用裸 Fastify 同环境对照，没有把共享 CI 趋势误作硬门禁。
- 未新增 DI Container、Module 元数据、Redis、NATS、Kafka、OAuth2、Session、CLI 或完整 OpenTelemetry。
- 所有服务端实现、测试、迁移、基准和 ADR 均位于 `apps/backend`。

完成后停止实现，先评审 PoC 报告和三份 ADR；只有评审通过，才能编写“可运行薄内核”实现计划。
