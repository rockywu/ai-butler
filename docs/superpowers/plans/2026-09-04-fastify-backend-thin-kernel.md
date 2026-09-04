# Fastify 后端薄内核实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 在已评审通过的 Fastify 技术 PoC 之上，于 `apps/backend` 内交付可运行薄内核：类型化配置、Pino 脱敏日志、OpenAPI UI、存活/就绪检查、优雅关闭接线、以及 `app.inject()` 测试工厂。

**架构：** `createApp()` 仍是唯一组合根，返回可 `inject` 的 Fastify 实例。配置经 TypeBox 校验后以只读 `AppConfig` 注入；Pino 作为 `loggerInstance`；健康检查使用可注入 `HealthChecker` 与 `ReadinessGate`，默认不连接数据库。关闭时先 `markNotReady()`，再经 `ResourceRegistry` 关闭 Fastify。依赖继续由 `createDependencies()` 显式传入，不引入 DI Container 或 `defineModule()`。

**技术栈：** Node.js 24、TypeScript 6、Fastify 5、TypeBox 1、Pino 9、`@fastify/swagger` 9、`@fastify/swagger-ui` 5、Vitest 4、pnpm 11、Turbo 2

**规格：** [`apps/backend/nodejs-fastify-framework-design.md`](../../../apps/backend/nodejs-fastify-framework-design.md)

**前置：** [`docs/superpowers/plans/2026-09-04-fastify-backend-poc.md`](./2026-09-04-fastify-backend-poc.md)

---

## 执行闸门（未通过则整份计划作废）

本计划**不得开工**，除非同时满足：

1. 前置 PoC 计划的全部任务已提交，且 `apps/backend/docs/adr/0001-*.md`、`0002-*.md`、`0003-*.md` 与 `apps/backend/docs/poc-report.md` 已通过人工评审。
2. 设计文档状态已是「技术 PoC 已验证，等待薄内核实现计划评审」（或评审纪要明确等价）。
3. 实现者已对照下方「PoC 复用基线」核对真实代码。**若 PoC 改了公共接口、插件名、路由或 `createApp` 签名，必须先修订本计划再写代码**，禁止边实现边猜。

核对命令（全部退出码须为 0，基准测试允许只记录趋势）：

```bash
pnpm --filter @ai-butler/backend test
pnpm --filter @ai-butler/backend typecheck
pnpm --filter @ai-butler/backend check:architecture
```

未通过闸门时停止。不要「先写配置再等评审」。

## 范围

本计划只做规格里程碑 2（可运行薄内核），并且**无数据库连接、无业务表**。`/readyz` 的外部依赖检查通过注入的 `checkers` 完成，默认空列表。

明确不做：

- Redis、NATS、Kafka、OAuth2、Session、CLI、完整 OpenTelemetry、DI Container、`defineModule()`
- PostgreSQL 业务表、启动期 `DATABASE_URL` 建连、Drizzle 接入（延后到垂直切片计划）
- JWT / RBAC / 用户模块
- `@fastify/cookie`、`pino-pretty`、`dotenv` 文件加载

所有服务端实现、测试和 ADR 只允许出现在 `apps/backend`。catalog 版本号只改根目录 `pnpm-workspace.yaml`。

## PoC 复用基线

实现时必须直接 import 这些已有符号，不要复制一份：

| 符号 | 路径 | 本计划中的用法 |
| --- | --- | --- |
| `createApp` / `CreateAppOptions` | `src/app/create-app.ts` | 扩展选项，返回值仍是 `AppInstance` |
| `createDependencies` / `AppDependencies` | `src/app/dependencies.ts` | 测试替换依赖 |
| `AppError` | `src/framework/core/app-error.ts` | 不改；配置错误用独立 `ConfigError` |
| `successEnvelopeSchema` / `success` | `src/framework/http/envelope.ts` | 健康检查成功响应 |
| `openapi.plugin`（`name: 'openapi'`，`app.swagger()`） | `src/framework/http/openapi.plugin.ts` | 继续先于业务路由收集文档 |
| `error-handler.plugin` | `src/framework/http/error-handler.plugin.ts` | 保持原注册 |
| `getRequestContext` / `runWithRequestContext` / `RequestContext` | `src/framework/core/request-context.ts` | 日志 mixin 读取 `requestId`、`traceId` |
| `ResourceRegistry` | `src/framework/core/resource-registry.ts` | `createApp` 内注册 `fastify` 关闭函数 |
| `createShutdown` | `src/framework/core/shutdown.ts` | 由 `createAppShutdown` 包装 |
| `probePlugin` | `src/modules/probe/` | 启动顺序中的业务模块 |
| `.dependency-cruiser.cjs` | `apps/backend/.dependency-cruiser.cjs` | 不放宽 `framework ↛ modules` |

PoC 之后 `createApp` 的约定形态（若真实代码不同，先改计划）：

```ts
export interface CreateAppOptions {
  dependencies?: Partial<AppDependencies>;
  logger?: boolean;
}

export async function createApp(options: CreateAppOptions = {}): Promise<AppInstance>;
```

本计划只做加法：`config`、`logger` 扩成 Pino 实例、`checkers`、`readinessGate`、`resources`。**禁止**把返回值改成 `{ app, ... }`，否则 PoC 测试会全数失败。

仓库现状：根 `pnpm-workspace.yaml` 的 catalog **没有** `pino`。PoC 使用 Fastify 内置 logger。薄内核引入 `pino: ^9.9.0`（不跟 Fastify 5 去赌 Pino 10 的类型兼容）。Swagger UI 使用 `@fastify/swagger-ui: ^5.2.4`。

TypeBox 一律 `import { Type } from 'typebox'`，校验用 `import { Value } from 'typebox/value'`，禁止 `@sinclair/typebox`。

## 文件结构

本计划完成后新增或修改以下文件。每个文件只承担一列职责。

**新增**

- `apps/backend/src/framework/config/schema.ts`：TypeBox `AppConfigSchema` 与只读 `AppConfig`
- `apps/backend/src/framework/config/config-error.ts`：配置错误（含配置项名、不含密钥值）
- `apps/backend/src/framework/config/load-config.ts`：环境变量 → 校验 → `Object.freeze`
- `apps/backend/src/framework/config/load-config.test.ts`：配置成功、失败、脱敏、只读
- `apps/backend/src/framework/config/process-env-boundary.test.ts`：业务与框架源码不得出现 `process.env`（白名单除外）
- `apps/backend/src/framework/testing/test-config.ts`：测试用 `testConfig()`，不读 `process.env`
- `apps/backend/src/framework/observability/redact.ts`：Pino `redact.paths` 常量
- `apps/backend/src/framework/observability/logger.ts`：`createLogger(config, destination?)`
- `apps/backend/src/framework/observability/logger.test.ts`：脱敏与 `requestId` / `traceId`
- `apps/backend/src/framework/http/openapi-ui.plugin.ts`：`/documentation` UI 与无 UI 时的 `/documentation/json`
- `apps/backend/src/framework/http/openapi-ui.test.ts`：UI 开关
- `apps/backend/src/framework/core/readiness.ts`：`ReadinessGate` / `createReadinessGate`
- `apps/backend/src/framework/http/health.schema.ts`：存活、就绪、未就绪 Schema
- `apps/backend/src/framework/http/health.plugin.ts`：`/livez`、`/readyz`、`HealthChecker`
- `apps/backend/src/framework/http/health.test.ts`：存活、就绪、checkers、连接串不泄露
- `apps/backend/src/framework/core/app-shutdown.ts`：先未就绪再 `closeAll`
- `apps/backend/src/framework/core/app-shutdown.test.ts`：关闭顺序
- `apps/backend/src/app/create-test-app.ts`：测试工厂
- `apps/backend/src/app/create-test-app.test.ts`：新测试走工厂
- `apps/backend/src/app/start.ts`：`bootstrap` / `start`（无 DB 的 §7.1）
- `apps/backend/src/app/start.test.ts`：配置失败不得 listen
- `apps/backend/docs/adr/0004-typed-config-and-secrets.md`
- `apps/backend/docs/adr/0005-liveness-and-readiness.md`

**修改**

- `pnpm-workspace.yaml`：登记 `pino`、`@fastify/swagger-ui`
- `apps/backend/package.json`：加入上述依赖
- `apps/backend/src/framework/http/fastify.ts`：`loggerInstance`、`requestId` 标签、Fastify 装饰类型
- `apps/backend/src/framework/core/request-context.plugin.ts`：读取 `x-trace-id`
- `apps/backend/src/app/create-app.ts`：注入 config / logger / checkers / gate / registry，按规格补齐注册顺序
- `apps/backend/src/main.ts`：改为调用 `start()`
- `apps/backend/nodejs-fastify-framework-design.md`：状态改为「薄内核已实现，等待垂直切片计划」

**不改职责、只回归**

- `src/modules/probe/**`、`envelope.ts`、`error-handler.plugin.ts`、`openapi.plugin.ts`、`resource-registry.ts`、`shutdown.ts`、`dependencies.ts`

---

### 任务 1：类型化配置

**文件：**
- 创建：`apps/backend/src/framework/config/schema.ts`
- 创建：`apps/backend/src/framework/config/config-error.ts`
- 创建：`apps/backend/src/framework/config/load-config.ts`
- 创建：`apps/backend/src/framework/config/load-config.test.ts`
- 创建：`apps/backend/src/framework/config/process-env-boundary.test.ts`
- 创建：`apps/backend/src/framework/testing/test-config.ts`
- 修改：`apps/backend/src/framework/http/fastify.ts`
- 修改：`apps/backend/src/app/create-app.ts`

- [ ] **步骤 1：编写失败的配置测试**

创建 `apps/backend/src/framework/config/load-config.test.ts`：

```ts
import { describe, expect, it } from 'vitest';

import { ConfigError } from './config-error';
import { loadConfig } from './load-config';

const validEnv = {
  APP_ENV: 'test',
  HOST: '127.0.0.1',
  LOG_LEVEL: 'info',
  PORT: '3000',
};

describe('loadConfig', () => {
  it('returns a frozen AppConfig from environment variables', () => {
    const config = loadConfig({
      ...validEnv,
      OPENAPI_UI: 'true',
    });

    expect(config).toEqual({
      appEnv: 'test',
      host: '127.0.0.1',
      logLevel: 'info',
      openapiUiEnabled: true,
      port: 3000,
    });
    expect(Object.isFrozen(config)).toBe(true);
    expect(() => {
      (config as { port: number }).port = 1;
    }).toThrow(TypeError);
  });

  it('disables OpenAPI UI by default in production', () => {
    const config = loadConfig({
      ...validEnv,
      APP_ENV: 'production',
    });

    expect(config.openapiUiEnabled).toBe(false);
  });

  it('lists missing keys without echoing raw values', () => {
    expect(() => loadConfig({})).toThrow(ConfigError);
    try {
      loadConfig({});
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigError);
      expect((error as ConfigError).keys).toEqual([
        'APP_ENV',
        'HOST',
        'PORT',
        'LOG_LEVEL',
      ]);
      expect((error as Error).message).toContain('APP_ENV');
      expect((error as Error).message).toContain('HOST');
      expect((error as Error).message).toContain('PORT');
      expect((error as Error).message).toContain('LOG_LEVEL');
    }
  });

  it('mentions PORT but never the invalid secret-like value', () => {
    const secret = 'super-secret-password-value';

    expect(() =>
      loadConfig({
        ...validEnv,
        PORT: secret,
      }),
    ).toThrow(ConfigError);

    try {
      loadConfig({ ...validEnv, PORT: secret });
    } catch (error) {
      expect((error as ConfigError).keys).toEqual(['PORT']);
      expect((error as Error).message).toContain('PORT');
      expect((error as Error).message).not.toContain(secret);
    }
  });
});
```

创建 `apps/backend/src/framework/config/process-env-boundary.test.ts`：

```ts
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const srcRoot = fileURLToPath(new URL('../../', import.meta.url));

const allowed = new Set([
  path.join(srcRoot, 'framework/config/load-config.ts'),
  path.join(srcRoot, 'app/start.ts'),
  path.join(srcRoot, 'main.ts'),
]);

async function collectTsFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return collectTsFiles(fullPath);
      }
      return fullPath.endsWith('.ts') && !fullPath.endsWith('.test.ts')
        ? [fullPath]
        : [];
    }),
  );
  return files.flat();
}

describe('process.env boundary', () => {
  it('keeps process.env out of business and framework runtime code', async () => {
    const files = (await collectTsFiles(srcRoot)).filter(
      (file) => !allowed.has(file),
    );
    const offenders: string[] = [];

    for (const file of files) {
      const source = await readFile(file, 'utf8');
      if (source.includes('process.env')) {
        offenders.push(path.relative(srcRoot, file));
      }
    }

    expect(offenders).toEqual([]);
  });
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：

```bash
pnpm exec vitest run --environment node apps/backend/src/framework/config/load-config.test.ts apps/backend/src/framework/config/process-env-boundary.test.ts
```

预期：FAIL，无法解析 `./load-config` 与 `./config-error`。

- [ ] **步骤 3：编写最少实现代码**

创建 `apps/backend/src/framework/config/config-error.ts`：

```ts
export class ConfigError extends Error {
  readonly keys: string[];

  constructor(keys: string[], message: string) {
    super(message);
    this.name = 'ConfigError';
    this.keys = keys;
  }
}
```

创建 `apps/backend/src/framework/config/schema.ts`：

```ts
import { Type } from 'typebox';

export const AppEnvSchema = Type.Union([
  Type.Literal('development'),
  Type.Literal('production'),
  Type.Literal('test'),
]);

export const LogLevelSchema = Type.Union([
  Type.Literal('debug'),
  Type.Literal('error'),
  Type.Literal('fatal'),
  Type.Literal('info'),
  Type.Literal('silent'),
  Type.Literal('trace'),
  Type.Literal('warn'),
]);

export const AppConfigSchema = Type.Object({
  appEnv: AppEnvSchema,
  host: Type.String({ minLength: 1 }),
  logLevel: LogLevelSchema,
  openapiUiEnabled: Type.Boolean(),
  port: Type.Integer({ maximum: 65535, minimum: 0 }),
});

export type AppEnv = 'development' | 'production' | 'test';
export type LogLevel = 'debug' | 'error' | 'fatal' | 'info' | 'silent' | 'trace' | 'warn';

export type AppConfig = Readonly<{
  appEnv: AppEnv;
  host: string;
  logLevel: LogLevel;
  openapiUiEnabled: boolean;
  port: number;
}>;
```

创建 `apps/backend/src/framework/config/load-config.ts`：

```ts
import { Value } from 'typebox/value';

import { ConfigError } from './config-error';
import {
  AppConfigSchema,
  type AppConfig,
  type AppEnv,
  type LogLevel,
} from './schema';

const REQUIRED_KEYS = ['APP_ENV', 'HOST', 'PORT', 'LOG_LEVEL'] as const;
const APP_ENVS = new Set<AppEnv>(['development', 'production', 'test']);
const LOG_LEVELS = new Set<LogLevel>([
  'debug',
  'error',
  'fatal',
  'info',
  'silent',
  'trace',
  'warn',
]);

function readRequired(
  env: NodeJS.ProcessEnv,
  key: (typeof REQUIRED_KEYS)[number],
): string | undefined {
  const value = env[key];
  return value === undefined || value === '' ? undefined : value;
}

function parseOpenApiUi(
  env: NodeJS.ProcessEnv,
  appEnv: AppEnv,
): boolean {
  const raw = env.OPENAPI_UI;
  if (raw === undefined || raw === '') {
    return appEnv !== 'production';
  }
  if (raw === 'true') {
    return true;
  }
  if (raw === 'false') {
    return false;
  }
  throw new ConfigError(['OPENAPI_UI'], 'Invalid configuration: OPENAPI_UI');
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const missing = REQUIRED_KEYS.filter((key) => readRequired(env, key) === undefined);
  if (missing.length > 0) {
    throw new ConfigError(
      [...missing],
      `Missing required configuration: ${missing.join(', ')}`,
    );
  }

  const appEnvRaw = readRequired(env, 'APP_ENV')!;
  if (!APP_ENVS.has(appEnvRaw as AppEnv)) {
    throw new ConfigError(['APP_ENV'], 'Invalid configuration: APP_ENV');
  }

  const logLevelRaw = readRequired(env, 'LOG_LEVEL')!;
  if (!LOG_LEVELS.has(logLevelRaw as LogLevel)) {
    throw new ConfigError(['LOG_LEVEL'], 'Invalid configuration: LOG_LEVEL');
  }

  const port = Number.parseInt(readRequired(env, 'PORT')!, 10);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new ConfigError(['PORT'], 'Invalid configuration: PORT');
  }

  const host = readRequired(env, 'HOST')!;
  const candidate = {
    appEnv: appEnvRaw as AppEnv,
    host,
    logLevel: logLevelRaw as LogLevel,
    openapiUiEnabled: parseOpenApiUi(env, appEnvRaw as AppEnv),
    port,
  };

  if (!Value.Check(AppConfigSchema, candidate)) {
    throw new ConfigError(['config'], 'Invalid configuration: config');
  }

  return Object.freeze(candidate);
}
```

创建 `apps/backend/src/framework/testing/test-config.ts`：

```ts
import { type AppConfig } from '../config/schema';

export function testConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return Object.freeze({
    appEnv: 'test',
    host: '127.0.0.1',
    logLevel: 'fatal',
    openapiUiEnabled: true,
    port: 0,
    ...overrides,
  });
}
```

修改 `apps/backend/src/framework/http/fastify.ts`，在现有 `createHttpServer` 之上增加 `config` 装饰类型（保留 PoC 的 `TypeBoxTypeProvider`）：

```ts
import { type TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import Fastify, { type FastifyServerOptions } from 'fastify';

import { type AppConfig } from '../config/schema';

declare module 'fastify' {
  interface FastifyInstance {
    config: AppConfig;
  }
}

export function createHttpServer(options: FastifyServerOptions = {}) {
  return Fastify(options).withTypeProvider<TypeBoxTypeProvider>();
}

export type AppInstance = ReturnType<typeof createHttpServer>;
```

修改 `apps/backend/src/app/create-app.ts` 为完整文件（在 PoC 注册顺序上只加 `config`，不改插件集合）：

```ts
import { createDependencies, type AppDependencies } from './dependencies';
import { registerModules } from './register-modules';
import { type AppConfig } from '../framework/config/schema';
import requestContextPlugin from '../framework/core/request-context.plugin';
import { testConfig } from '../framework/testing/test-config';
import errorHandlerPlugin from '../framework/http/error-handler.plugin';
import { createHttpServer } from '../framework/http/fastify';
import openApiPlugin from '../framework/http/openapi.plugin';

export interface CreateAppOptions {
  config?: AppConfig;
  dependencies?: Partial<AppDependencies>;
  logger?: boolean;
}

export async function createApp(options: CreateAppOptions = {}) {
  const config = options.config ?? testConfig();
  const app = createHttpServer({ logger: options.logger ?? false });
  app.decorate('config', config);

  await app.register(openApiPlugin);
  await app.register(errorHandlerPlugin);
  await app.register(requestContextPlugin);
  await registerModules(app, createDependencies(options.dependencies));
  return app;
}
```

`main.ts` 本任务保持 PoC 原样。`main.ts` 读 `process.env` 要到任务 7 才收口；本任务的边界测试已把 `main.ts` / `start.ts` / `load-config.ts` 列入白名单。

- [ ] **步骤 4：运行测试验证通过**

运行：

```bash
pnpm exec vitest run --environment node apps/backend/src/framework/config/load-config.test.ts apps/backend/src/framework/config/process-env-boundary.test.ts apps/backend/src/app/create-app.test.ts
pnpm --filter @ai-butler/backend typecheck
```

预期：全部 PASS；现有 ping 测试不因 `config` 装饰而失败。

- [ ] **步骤 5：Commit**

```bash
git add apps/backend/src/framework/config apps/backend/src/framework/testing/test-config.ts apps/backend/src/framework/http/fastify.ts apps/backend/src/app/create-app.ts
git commit -m "$(cat <<'EOF'
feat: 增加类型化配置

EOF
)"
```

**本任务交付物：** `loadConfig(env)` 得到只读 `AppConfig`；缺项/非法值的错误带配置项名、不含原始值；`createApp` 不再依赖调用方设置 `process.env`。

---

### 任务 2：Pino 与日志脱敏

**文件：**
- 修改：`pnpm-workspace.yaml`
- 修改：`apps/backend/package.json`
- 创建：`apps/backend/src/framework/observability/redact.ts`
- 创建：`apps/backend/src/framework/observability/logger.ts`
- 创建：`apps/backend/src/framework/observability/logger.test.ts`
- 修改：`apps/backend/src/framework/http/fastify.ts`
- 修改：`apps/backend/src/framework/core/request-context.plugin.ts`
- 修改：`apps/backend/src/app/create-app.ts`

- [ ] **步骤 1：加入 pino catalog 并编写失败的日志测试**

在 `pnpm-workspace.yaml` 的 `catalog:` 中加入：

```yaml
  pino: ^9.9.0
```

在 `apps/backend/package.json` 的 `dependencies` 中加入：

```json
{
  "pino": "catalog:"
}
```

创建 `apps/backend/src/framework/observability/logger.test.ts`：

```ts
import { afterEach, describe, expect, it } from 'vitest';

import { createApp } from '../../app/create-app';
import { runWithRequestContext } from '../core/request-context';
import { testConfig } from '../testing/test-config';
import { createLogger } from './logger';

function createCapture() {
  const lines: string[] = [];
  return {
    destination: {
      write(message: string) {
        lines.push(message);
      },
    },
    lines,
  };
}

function parseLines(lines: string[]): Array<Record<string, unknown>> {
  return lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

describe('createLogger', () => {
  let app: Awaited<ReturnType<typeof createApp>> | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it('redacts secrets and never writes raw credential material', () => {
    const capture = createCapture();
    const logger = createLogger(testConfig({ logLevel: 'info' }), capture.destination);

    logger.info({
      Authorization: 'Bearer abc',
      Cookie: 'sid=1',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/app',
      accessToken: 'access-secret',
      password: 'hunter2',
      refreshToken: 'refresh-secret',
    });

    const [payload] = parseLines(capture.lines);
    expect(payload).toBeDefined();
    expect(payload.password).toBe('[Redacted]');
    expect(payload.Authorization).toBe('[Redacted]');
    expect(payload.Cookie).toBe('[Redacted]');
    expect(payload.accessToken).toBe('[Redacted]');
    expect(payload.refreshToken).toBe('[Redacted]');
    expect(payload.DATABASE_URL).toBe('[Redacted]');
    expect(JSON.stringify(payload)).not.toContain('hunter2');
    expect(JSON.stringify(payload)).not.toContain('postgresql://');
  });

  it('mixes requestId and traceId when a request context exists', () => {
    const capture = createCapture();
    const logger = createLogger(testConfig({ logLevel: 'info' }), capture.destination);

    runWithRequestContext({ requestId: 'req-1', traceId: 'tr-1' }, () => {
      logger.info('inside request');
    });
    logger.info('outside request');

    const [inside, outside] = parseLines(capture.lines);
    expect(inside.requestId).toBe('req-1');
    expect(inside.traceId).toBe('tr-1');
    expect(outside.requestId).toBeUndefined();
    expect(outside.traceId).toBeUndefined();
  });

  it('attaches requestId and traceId to Fastify request logs', async () => {
    const capture = createCapture();
    const logger = createLogger(testConfig({ logLevel: 'info' }), capture.destination);
    app = await createApp({
      config: testConfig({ logLevel: 'info' }),
      logger,
    });

    await app.inject({
      headers: {
        'x-request-id': 'req-99',
        'x-trace-id': 'tr-99',
      },
      method: 'GET',
      url: '/poc/ping',
    });

    const payloads = parseLines(capture.lines);
    expect(payloads.some((line) => line.requestId === 'req-99')).toBe(true);
    expect(payloads.some((line) => line.traceId === 'tr-99')).toBe(true);
  });
});
```

- [ ] **步骤 2：安装依赖并确认测试失败**

运行：

```bash
pnpm install
pnpm exec vitest run --environment node apps/backend/src/framework/observability/logger.test.ts
```

预期：FAIL，无法解析 `./logger`。

- [ ] **步骤 3：编写最少实现代码**

创建 `apps/backend/src/framework/observability/redact.ts`：

```ts
export const REDACT_PATHS = [
  'Authorization',
  'Cookie',
  'DATABASE_URL',
  'accessToken',
  'authorization',
  'cookie',
  'password',
  'refreshToken',
  '*.Authorization',
  '*.Cookie',
  '*.DATABASE_URL',
  '*.accessToken',
  '*.authorization',
  '*.cookie',
  '*.password',
  '*.refreshToken',
  'req.headers.authorization',
  'req.headers.cookie',
] as const;
```

创建 `apps/backend/src/framework/observability/logger.ts`：

```ts
import pino, { type DestinationStream, type Logger } from 'pino';

import { type AppConfig } from '../config/schema';
import { getRequestContext } from '../core/request-context';
import { REDACT_PATHS } from './redact';

export function createLogger(
  config: AppConfig,
  destination?: DestinationStream,
): Logger {
  return pino(
    {
      base: {
        env: config.appEnv,
        service: 'ai-butler-backend',
      },
      level: config.logLevel,
      mixin() {
        try {
          const context = getRequestContext();
          return {
            requestId: context.requestId,
            ...(context.traceId === undefined ? {} : { traceId: context.traceId }),
          };
        } catch {
          return {};
        }
      },
      redact: {
        censor: '[Redacted]',
        paths: [...REDACT_PATHS],
      },
    },
    destination,
  );
}
```

将 `apps/backend/src/framework/core/request-context.plugin.ts` 改为完整文件（在 PoC Hook 上读取 `x-trace-id`）：

```ts
import { type FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';

import { runWithRequestContext } from './request-context';

const requestContextPlugin: FastifyPluginCallback = (app, _options, done) => {
  app.addHook('onRequest', (request, reply, next) => {
    const requestHeader = request.headers['x-request-id'];
    const traceHeader = request.headers['x-trace-id'];
    const requestId =
      typeof requestHeader === 'string' ? requestHeader : request.id;
    const traceId = typeof traceHeader === 'string' ? traceHeader : undefined;

    reply.header('x-request-id', requestId);
    if (traceId) {
      reply.header('x-trace-id', traceId);
    }

    runWithRequestContext({ requestId, traceId }, next);
  });
  done();
};

export default fp(requestContextPlugin, {
  fastify: '5.x',
  name: 'request-context',
});
```

修改 `apps/backend/src/framework/http/fastify.ts` 为完整文件：

```ts
import { type TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import Fastify, { type FastifyServerOptions } from 'fastify';

import { type AppConfig } from '../config/schema';

declare module 'fastify' {
  interface FastifyInstance {
    config: AppConfig;
  }
}

export function createHttpServer(options: FastifyServerOptions = {}) {
  return Fastify({
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    ...options,
  }).withTypeProvider<TypeBoxTypeProvider>();
}

export type AppInstance = ReturnType<typeof createHttpServer>;
```

修改 `apps/backend/src/app/create-app.ts` 为完整文件：

```ts
import { type Logger } from 'pino';

import { createDependencies, type AppDependencies } from './dependencies';
import { registerModules } from './register-modules';
import { type AppConfig } from '../framework/config/schema';
import requestContextPlugin from '../framework/core/request-context.plugin';
import { testConfig } from '../framework/testing/test-config';
import errorHandlerPlugin from '../framework/http/error-handler.plugin';
import { createHttpServer } from '../framework/http/fastify';
import openApiPlugin from '../framework/http/openapi.plugin';

export interface CreateAppOptions {
  config?: AppConfig;
  dependencies?: Partial<AppDependencies>;
  logger?: boolean | Logger;
}

function httpOptions(logger: CreateAppOptions['logger']) {
  if (logger && typeof logger === 'object') {
    return { loggerInstance: logger };
  }
  return { logger: logger ?? false };
}

export async function createApp(options: CreateAppOptions = {}) {
  const config = options.config ?? testConfig();
  const app = createHttpServer(httpOptions(options.logger));
  app.decorate('config', config);

  await app.register(openApiPlugin);
  await app.register(errorHandlerPlugin);
  await app.register(requestContextPlugin);
  await registerModules(app, createDependencies(options.dependencies));
  return app;
}
```

- [ ] **步骤 4：运行测试验证通过**

运行：

```bash
pnpm exec vitest run --environment node apps/backend/src/framework/observability/logger.test.ts apps/backend/src/framework/core/request-context.test.ts apps/backend/src/framework/config
pnpm --filter @ai-butler/backend typecheck
```

预期：全部 PASS；无上下文时日志不含 `requestId`；有 `x-trace-id` 时日志带 `traceId`。

- [ ] **步骤 5：Commit**

```bash
git add pnpm-workspace.yaml pnpm-lock.yaml apps/backend/package.json apps/backend/src/framework/observability apps/backend/src/framework/http/fastify.ts apps/backend/src/framework/core/request-context.plugin.ts apps/backend/src/app/create-app.ts
git commit -m "$(cat <<'EOF'
feat: 接入 Pino 日志脱敏

EOF
)"
```

**本任务交付物：** 结构化 Pino 日志带服务名与环境；`password`、`Authorization`、`Cookie`、`accessToken`、`refreshToken`、`DATABASE_URL` 被替换为 `[Redacted]`；存在时写入 `requestId` / `traceId`。

---

### 任务 3：OpenAPI UI

**文件：**
- 修改：`pnpm-workspace.yaml`
- 修改：`apps/backend/package.json`
- 创建：`apps/backend/src/framework/http/openapi-ui.plugin.ts`
- 创建：`apps/backend/src/framework/http/openapi-ui.test.ts`
- 修改：`apps/backend/src/app/create-app.ts`

- [ ] **步骤 1：加入 swagger-ui catalog 并编写失败测试**

在 `pnpm-workspace.yaml` 的 `catalog:` 中加入：

```yaml
  '@fastify/swagger-ui': ^5.2.4
```

在 `apps/backend/package.json` 的 `dependencies` 中加入：

```json
{
  "@fastify/swagger-ui": "catalog:"
}
```

创建 `apps/backend/src/framework/http/openapi-ui.test.ts`：

```ts
import { afterEach, describe, expect, it } from 'vitest';

import { createApp } from '../../app/create-app';
import { testConfig } from '../testing/test-config';

describe('OpenAPI UI', () => {
  let app: Awaited<ReturnType<typeof createApp>> | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it('serves the UI and JSON document when enabled', async () => {
    app = await createApp({
      config: testConfig({ openapiUiEnabled: true }),
      logger: false,
    });

    const ui = await app.inject({ method: 'GET', url: '/documentation/' });
    const json = await app.inject({ method: 'GET', url: '/documentation/json' });

    expect(ui.statusCode).toBe(200);
    expect(String(ui.headers['content-type'])).toMatch(/html/);
    expect(json.statusCode).toBe(200);
    expect(json.json().paths?.['/poc/ping']?.get).toBeDefined();
  });

  it('keeps JSON and hides the UI when disabled for production', async () => {
    app = await createApp({
      config: testConfig({
        appEnv: 'production',
        openapiUiEnabled: false,
      }),
      logger: false,
    });

    const ui = await app.inject({ method: 'GET', url: '/documentation/' });
    const json = await app.inject({ method: 'GET', url: '/documentation/json' });

    expect(ui.statusCode).toBe(404);
    expect(json.statusCode).toBe(200);
    expect(json.json().info?.title).toBe('AI Butler Backend');
    expect(json.json().paths?.['/poc/echo']?.post).toBeDefined();
  });
});
```

- [ ] **步骤 2：安装依赖并确认测试失败**

运行：

```bash
pnpm install
pnpm exec vitest run --environment node apps/backend/src/framework/http/openapi-ui.test.ts
```

预期：FAIL；`/documentation/` 与 `/documentation/json` 为 404。

- [ ] **步骤 3：编写最少实现代码**

创建 `apps/backend/src/framework/http/openapi-ui.plugin.ts`：

```ts
import swaggerUi from '@fastify/swagger-ui';
import { type FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

export interface OpenApiUiPluginOptions {
  enabled: boolean;
}

const openApiUiPlugin: FastifyPluginAsync<OpenApiUiPluginOptions> = async (
  app,
  options,
) => {
  if (options.enabled) {
    await app.register(swaggerUi, {
      routePrefix: '/documentation',
    });
    return;
  }

  app.get(
    '/documentation/json',
    { schema: { hide: true } },
    async () => app.swagger(),
  );
};

export default fp(openApiUiPlugin, {
  dependencies: ['openapi'],
  fastify: '5.x',
  name: 'openapi-ui',
});
```

修改 `apps/backend/src/app/create-app.ts` 为完整文件。Swagger 文档插件仍在业务模块之前（否则收集不到路由）；UI 在业务模块之后注册，对应规格 §7.1 的「健康检查与 OpenAPI」展示层：

```ts
import { type Logger } from 'pino';

import { createDependencies, type AppDependencies } from './dependencies';
import { registerModules } from './register-modules';
import { type AppConfig } from '../framework/config/schema';
import requestContextPlugin from '../framework/core/request-context.plugin';
import { testConfig } from '../framework/testing/test-config';
import errorHandlerPlugin from '../framework/http/error-handler.plugin';
import { createHttpServer } from '../framework/http/fastify';
import openApiPlugin from '../framework/http/openapi.plugin';
import openApiUiPlugin from '../framework/http/openapi-ui.plugin';

export interface CreateAppOptions {
  config?: AppConfig;
  dependencies?: Partial<AppDependencies>;
  logger?: boolean | Logger;
}

function httpOptions(logger: CreateAppOptions['logger']) {
  if (logger && typeof logger === 'object') {
    return { loggerInstance: logger };
  }
  return { logger: logger ?? false };
}

export async function createApp(options: CreateAppOptions = {}) {
  const config = options.config ?? testConfig();
  const app = createHttpServer(httpOptions(options.logger));
  app.decorate('config', config);

  await app.register(errorHandlerPlugin);
  await app.register(requestContextPlugin);
  await app.register(openApiPlugin);
  await registerModules(app, createDependencies(options.dependencies));
  await app.register(openApiUiPlugin, { enabled: config.openapiUiEnabled });
  return app;
}
```

不要改 PoC 的 `openapi.plugin.ts`（它只注册 `@fastify/swagger`）。不要加入 cookie 插件。

- [ ] **步骤 4：运行测试验证通过**

运行：

```bash
pnpm exec vitest run --environment node apps/backend/src/framework/http/openapi-ui.test.ts apps/backend/src/framework/http/openapi.test.ts
pnpm --filter @ai-butler/backend typecheck
```

预期：全部 PASS；生产默认关 UI 时 JSON 仍可用。

- [ ] **步骤 5：Commit**

```bash
git add pnpm-workspace.yaml pnpm-lock.yaml apps/backend/package.json apps/backend/src/framework/http/openapi-ui.plugin.ts apps/backend/src/framework/http/openapi-ui.test.ts apps/backend/src/app/create-app.ts
git commit -m "$(cat <<'EOF'
feat: 增加 OpenAPI 文档界面

EOF
)"
```

**本任务交付物：** `GET /documentation/` 提供 Swagger UI；`GET /documentation/json` 始终可取文档；`APP_ENV=production` 且未把 `OPENAPI_UI=true` 时 UI 关闭。

---

### 任务 4：Liveness 与 Readiness

**文件：**
- 创建：`apps/backend/src/framework/core/readiness.ts`
- 创建：`apps/backend/src/framework/http/health.schema.ts`
- 创建：`apps/backend/src/framework/http/health.plugin.ts`
- 创建：`apps/backend/src/framework/http/health.test.ts`
- 修改：`apps/backend/src/framework/http/fastify.ts`
- 修改：`apps/backend/src/app/create-app.ts`

- [ ] **步骤 1：编写失败的健康检查测试**

创建 `apps/backend/src/framework/http/health.test.ts`：

```ts
import { afterEach, describe, expect, it } from 'vitest';

import { createApp } from '../../app/create-app';
import { createReadinessGate } from '../core/readiness';
import { testConfig } from '../testing/test-config';

describe('health checks', () => {
  let app: Awaited<ReturnType<typeof createApp>> | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it('keeps liveness independent of injected checkers', async () => {
    app = await createApp({
      checkers: [
        {
          async check() {
            throw new Error('database is down');
          },
          name: 'database',
        },
      ],
      config: testConfig(),
      logger: false,
    });

    const live = await app.inject({ method: 'GET', url: '/livez' });
    const ready = await app.inject({ method: 'GET', url: '/readyz' });

    expect(live.statusCode).toBe(200);
    expect(live.json()).toEqual({
      code: 0,
      data: { status: 'live' },
      message: 'success',
    });
    expect(ready.statusCode).toBe(503);
    expect(ready.json()).toEqual({
      code: 5030,
      data: null,
      message: 'not ready',
    });
  });

  it('fails readiness immediately after shutdown starts', async () => {
    const readinessGate = createReadinessGate();
    app = await createApp({
      config: testConfig(),
      logger: false,
      readinessGate,
    });

    const before = await app.inject({ method: 'GET', url: '/readyz' });
    expect(before.statusCode).toBe(200);
    expect(before.json()).toEqual({
      code: 0,
      data: { status: 'ready' },
      message: 'success',
    });

    readinessGate.markNotReady();

    const after = await app.inject({ method: 'GET', url: '/readyz' });
    const live = await app.inject({ method: 'GET', url: '/livez' });
    expect(after.statusCode).toBe(503);
    expect(live.statusCode).toBe(200);
  });

  it('does not leak connection strings from a failing checker', async () => {
    app = await createApp({
      checkers: [
        {
          async check() {
            throw new Error(
              'connect failed postgresql://user:secret@localhost:5432/app DATABASE_URL=postgresql://user:secret@localhost:5432/app',
            );
          },
          name: 'database',
        },
      ],
      config: testConfig(),
      logger: false,
    });

    const response = await app.inject({ method: 'GET', url: '/readyz' });

    expect(response.statusCode).toBe(503);
    expect(response.body).not.toContain('postgresql://');
    expect(response.body).not.toContain('secret');
    expect(response.body).not.toContain('DATABASE_URL=');
    expect(response.json()).toEqual({
      code: 5030,
      data: null,
      message: 'not ready',
    });
  });
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：

```bash
pnpm exec vitest run --environment node apps/backend/src/framework/http/health.test.ts
```

预期：FAIL；`/livez` 与 `/readyz` 为 404。

- [ ] **步骤 3：编写最少实现代码**

创建 `apps/backend/src/framework/core/readiness.ts`：

```ts
export interface ReadinessGate {
  isReady(): boolean;
  markNotReady(): void;
}

export function createReadinessGate(): ReadinessGate {
  let ready = true;
  return {
    isReady: () => ready,
    markNotReady() {
      ready = false;
    },
  };
}
```

创建 `apps/backend/src/framework/http/health.schema.ts`：

```ts
import { Type } from 'typebox';

import { successEnvelopeSchema } from './envelope';

export const LiveResponseSchema = successEnvelopeSchema(
  Type.Object({ status: Type.Literal('live') }),
);

export const ReadyResponseSchema = successEnvelopeSchema(
  Type.Object({ status: Type.Literal('ready') }),
);

export const NotReadyResponseSchema = Type.Object({
  code: Type.Literal(5030),
  data: Type.Null(),
  message: Type.Literal('not ready'),
});
```

创建 `apps/backend/src/framework/http/health.plugin.ts`：

```ts
import { type FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import fp from 'fastify-plugin';

import { type ReadinessGate } from '../core/readiness';
import { success } from './envelope';
import {
  LiveResponseSchema,
  NotReadyResponseSchema,
  ReadyResponseSchema,
} from './health.schema';

export interface HealthChecker {
  check(): Promise<void> | void;
  name: string;
}

export interface HealthPluginOptions {
  checkers: HealthChecker[];
  readinessGate: ReadinessGate;
}

export function sanitizeHealthError(message: string): string {
  return message
    .replaceAll(/[a-z][\w+.-]*:\/\/\S+/gi, '[Redacted]')
    .replaceAll(/DATABASE_URL=\S+/gi, 'DATABASE_URL=[Redacted]')
    .replaceAll(/password=\S+/gi, 'password=[Redacted]');
}

const healthPlugin: FastifyPluginAsyncTypebox<HealthPluginOptions> = async (
  app,
  options,
) => {
  app.get(
    '/livez',
    { schema: { response: { 200: LiveResponseSchema } } },
    async () => success({ status: 'live' as const }),
  );

  app.get(
    '/readyz',
    {
      schema: {
        response: {
          200: ReadyResponseSchema,
          503: NotReadyResponseSchema,
        },
      },
    },
    async (_request, reply) => {
      if (!options.readinessGate.isReady()) {
        return reply.status(503).send({
          code: 5030 as const,
          data: null,
          message: 'not ready' as const,
        });
      }

      const results = await Promise.allSettled(
        options.checkers.map(async (checker) => checker.check()),
      );

      for (const [index, result] of results.entries()) {
        if (result.status === 'rejected') {
          const message =
            result.reason instanceof Error
              ? result.reason.message
              : String(result.reason);
          app.log.error(
            {
              checker: options.checkers[index]?.name,
              err: new Error(sanitizeHealthError(message)),
            },
            'readiness checker failed',
          );
        }
      }

      if (results.some((result) => result.status === 'rejected')) {
        return reply.status(503).send({
          code: 5030 as const,
          data: null,
          message: 'not ready' as const,
        });
      }

      return success({ status: 'ready' as const });
    },
  );
};

export default fp(healthPlugin, {
  fastify: '5.x',
  name: 'health',
});
```

修改 `apps/backend/src/framework/http/fastify.ts` 为完整文件：

```ts
import { type TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import Fastify, { type FastifyServerOptions } from 'fastify';

import { type AppConfig } from '../config/schema';
import { type ReadinessGate } from '../core/readiness';
import { type ResourceRegistry } from '../core/resource-registry';

declare module 'fastify' {
  interface FastifyInstance {
    config: AppConfig;
    readinessGate: ReadinessGate;
    resources: ResourceRegistry;
  }
}

export function createHttpServer(options: FastifyServerOptions = {}) {
  return Fastify({
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    ...options,
  }).withTypeProvider<TypeBoxTypeProvider>();
}

export type AppInstance = ReturnType<typeof createHttpServer>;
```

本任务先装饰 `readinessGate`；`resources` 在任务 5 赋值。为通过类型检查，任务 4 的 `createApp` 同步创建默认 `ResourceRegistry` 并 `decorate`，但还不注册关闭函数、不改 `main.ts`。

修改 `apps/backend/src/app/create-app.ts` 为完整文件：

```ts
import { type Logger } from 'pino';

import { createDependencies, type AppDependencies } from './dependencies';
import { registerModules } from './register-modules';
import { type AppConfig } from '../framework/config/schema';
import { createReadinessGate, type ReadinessGate } from '../framework/core/readiness';
import requestContextPlugin from '../framework/core/request-context.plugin';
import { ResourceRegistry } from '../framework/core/resource-registry';
import { testConfig } from '../framework/testing/test-config';
import errorHandlerPlugin from '../framework/http/error-handler.plugin';
import { createHttpServer } from '../framework/http/fastify';
import healthPlugin, { type HealthChecker } from '../framework/http/health.plugin';
import openApiPlugin from '../framework/http/openapi.plugin';
import openApiUiPlugin from '../framework/http/openapi-ui.plugin';

export interface CreateAppOptions {
  checkers?: HealthChecker[];
  config?: AppConfig;
  dependencies?: Partial<AppDependencies>;
  logger?: boolean | Logger;
  readinessGate?: ReadinessGate;
  resources?: ResourceRegistry;
}

function httpOptions(logger: CreateAppOptions['logger']) {
  if (logger && typeof logger === 'object') {
    return { loggerInstance: logger };
  }
  return { logger: logger ?? false };
}

export async function createApp(options: CreateAppOptions = {}) {
  const config = options.config ?? testConfig();
  const readinessGate = options.readinessGate ?? createReadinessGate();
  const resources = options.resources ?? new ResourceRegistry();
  const checkers = options.checkers ?? [];
  const app = createHttpServer(httpOptions(options.logger));

  app.decorate('config', config);
  app.decorate('readinessGate', readinessGate);
  app.decorate('resources', resources);

  await app.register(errorHandlerPlugin);
  await app.register(requestContextPlugin);
  await app.register(openApiPlugin);
  await registerModules(app, createDependencies(options.dependencies));
  await app.register(healthPlugin, { checkers, readinessGate });
  await app.register(openApiUiPlugin, { enabled: config.openapiUiEnabled });
  return app;
}
```

默认 `checkers` 为空数组：没有数据库、没有连接串。不要在本任务创建 PostgreSQL checker。

- [ ] **步骤 4：运行测试验证通过**

运行：

```bash
pnpm exec vitest run --environment node apps/backend/src/framework/http/health.test.ts apps/backend/src/framework/http/openapi-ui.test.ts apps/backend/src/app/create-app.test.ts
pnpm --filter @ai-butler/backend typecheck
```

预期：全部 PASS；未就绪与 checker 失败的响应体都不含连接串。

- [ ] **步骤 5：Commit**

```bash
git add apps/backend/src/framework/core/readiness.ts apps/backend/src/framework/http/health.schema.ts apps/backend/src/framework/http/health.plugin.ts apps/backend/src/framework/http/health.test.ts apps/backend/src/framework/http/fastify.ts apps/backend/src/app/create-app.ts
git commit -m "$(cat <<'EOF'
feat: 增加存活与就绪检查

EOF
)"
```

**本任务交付物：** `GET /livez` 不查外部依赖；`GET /readyz` 使用注入 checkers；`markNotReady()` 后就绪立即 503；响应固定 `{ code, data, message }` 且无连接串。

---

### 任务 5：把 ResourceRegistry 与 createShutdown 接到 createApp / main

**文件：**
- 创建：`apps/backend/src/framework/core/app-shutdown.ts`
- 创建：`apps/backend/src/framework/core/app-shutdown.test.ts`
- 修改：`apps/backend/src/app/create-app.ts`
- 修改：`apps/backend/src/main.ts`
- 修改：`apps/backend/src/framework/http/health.test.ts`（仅追加 inject 用例，不写进程级 e2e）

- [ ] **步骤 1：编写失败的关闭顺序与未就绪测试**

创建 `apps/backend/src/framework/core/app-shutdown.test.ts`：

```ts
import { afterEach, describe, expect, it } from 'vitest';

import { createApp } from '../../app/create-app';
import { testConfig } from '../testing/test-config';
import { createAppShutdown } from './app-shutdown';
import { createReadinessGate } from './readiness';
import { ResourceRegistry } from './resource-registry';

describe('createAppShutdown', () => {
  let app: Awaited<ReturnType<typeof createApp>> | undefined;

  afterEach(async () => {
    if (app && !app.resources) {
      await app.close();
      return;
    }
    if (app) {
      await app.close().catch(() => undefined);
    }
  });

  it('marks not-ready before closing Fastify', async () => {
    const order: string[] = [];
    const readinessGate = createReadinessGate();
    const markNotReady = readinessGate.markNotReady.bind(readinessGate);
    readinessGate.markNotReady = () => {
      order.push('not-ready');
      markNotReady();
    };

    const resources = new ResourceRegistry();
    resources.register('fastify', async () => {
      order.push('close');
    });

    const shutdown = createAppShutdown({ readinessGate, resources, timeoutMs: 200 });
    await shutdown();

    expect(order).toEqual(['not-ready', 'close']);
  });

  it('lets inject observe not-ready without a process-level e2e', async () => {
    const readinessGate = createReadinessGate();
    const resources = new ResourceRegistry();
    app = await createApp({
      config: testConfig(),
      logger: false,
      readinessGate,
      resources,
    });

    const before = await app.inject({ method: 'GET', url: '/readyz' });
    expect(before.statusCode).toBe(200);

    readinessGate.markNotReady();
    const after = await app.inject({ method: 'GET', url: '/readyz' });
    const live = await app.inject({ method: 'GET', url: '/livez' });

    expect(after.statusCode).toBe(503);
    expect(live.statusCode).toBe(200);
    expect(app.resources).toBe(resources);
  });
});
```

不要新增 `tests/shutdown.e2e.test.ts`。PoC 已覆盖真实 SIGTERM 子进程。

- [ ] **步骤 2：运行测试验证失败**

运行：

```bash
pnpm exec vitest run --environment node apps/backend/src/framework/core/app-shutdown.test.ts
```

预期：FAIL，找不到 `./app-shutdown`。

- [ ] **步骤 3：编写最少实现代码**

创建 `apps/backend/src/framework/core/app-shutdown.ts`：

```ts
import { type ReadinessGate } from './readiness';
import { type ResourceRegistry } from './resource-registry';
import { createShutdown } from './shutdown';

export function createAppShutdown(options: {
  readinessGate: ReadinessGate;
  resources: ResourceRegistry;
  timeoutMs?: number;
}) {
  return createShutdown({
    async close() {
      options.readinessGate.markNotReady();
      await options.resources.closeAll();
    },
    timeoutMs: options.timeoutMs ?? 10_000,
  });
}
```

在 `createApp` 末尾、`return app` 之前加入（不要重复注册）：

```ts
  resources.register('fastify', () => app.close());
  return app;
```

此时 `create-app.ts` 完整文件：

```ts
import { type Logger } from 'pino';

import { createDependencies, type AppDependencies } from './dependencies';
import { registerModules } from './register-modules';
import { type AppConfig } from '../framework/config/schema';
import { createReadinessGate, type ReadinessGate } from '../framework/core/readiness';
import requestContextPlugin from '../framework/core/request-context.plugin';
import { ResourceRegistry } from '../framework/core/resource-registry';
import { testConfig } from '../framework/testing/test-config';
import errorHandlerPlugin from '../framework/http/error-handler.plugin';
import { createHttpServer } from '../framework/http/fastify';
import healthPlugin, { type HealthChecker } from '../framework/http/health.plugin';
import openApiPlugin from '../framework/http/openapi.plugin';
import openApiUiPlugin from '../framework/http/openapi-ui.plugin';

export interface CreateAppOptions {
  checkers?: HealthChecker[];
  config?: AppConfig;
  dependencies?: Partial<AppDependencies>;
  logger?: boolean | Logger;
  readinessGate?: ReadinessGate;
  resources?: ResourceRegistry;
}

function httpOptions(logger: CreateAppOptions['logger']) {
  if (logger && typeof logger === 'object') {
    return { loggerInstance: logger };
  }
  return { logger: logger ?? false };
}

export async function createApp(options: CreateAppOptions = {}) {
  const config = options.config ?? testConfig();
  const readinessGate = options.readinessGate ?? createReadinessGate();
  const resources = options.resources ?? new ResourceRegistry();
  const checkers = options.checkers ?? [];
  const app = createHttpServer(httpOptions(options.logger));

  app.decorate('config', config);
  app.decorate('readinessGate', readinessGate);
  app.decorate('resources', resources);

  await app.register(errorHandlerPlugin);
  await app.register(requestContextPlugin);
  await app.register(openApiPlugin);
  await registerModules(app, createDependencies(options.dependencies));
  await app.register(healthPlugin, { checkers, readinessGate });
  await app.register(openApiUiPlugin, { enabled: config.openapiUiEnabled });

  resources.register('fastify', () => app.close());
  return app;
}
```

将 `apps/backend/src/main.ts` 改为完整文件。此处仍直接读 `process.env` 交给 `loadConfig`（白名单允许），任务 7 再抽 `bootstrap` / `start`：

```ts
import { createApp } from './app/create-app';
import { loadConfig } from './framework/config/load-config';
import { createAppShutdown } from './framework/core/app-shutdown';
import { createReadinessGate } from './framework/core/readiness';
import { ResourceRegistry } from './framework/core/resource-registry';
import { createLogger } from './framework/observability/logger';

const config = loadConfig(process.env);
const logger = createLogger(config);
const readinessGate = createReadinessGate();
const resources = new ResourceRegistry();
const app = await createApp({
  config,
  logger,
  readinessGate,
  resources,
});

const shutdown = createAppShutdown({
  readinessGate,
  resources,
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
  host: config.host,
  port: config.port,
});
```

信号路径是：`SIGTERM` → `createAppShutdown` → `markNotReady()` → `resources.closeAll()` → 已注册的 `fastify` `app.close()`。不要再写一份 e2e spawn 测试。

- [ ] **步骤 4：运行测试验证通过**

运行：

```bash
pnpm exec vitest run --environment node apps/backend/src/framework/core/app-shutdown.test.ts apps/backend/src/framework/core/resource-registry.test.ts apps/backend/src/framework/core/shutdown.test.ts apps/backend/src/framework/http/health.test.ts
pnpm --filter @ai-butler/backend typecheck
```

预期：全部 PASS；`inject` 能看到未就绪；关闭顺序为 `not-ready` 然后 `close`。

- [ ] **步骤 5：Commit**

```bash
git add apps/backend/src/framework/core/app-shutdown.ts apps/backend/src/framework/core/app-shutdown.test.ts apps/backend/src/app/create-app.ts apps/backend/src/main.ts
git commit -m "$(cat <<'EOF'
feat: 接入优雅关闭与未就绪

EOF
)"
```

**本任务交付物：** `createApp` 把 Fastify 登记进 `ResourceRegistry`；`createAppShutdown` 保证先未就绪再关服务器；`main.ts` 的 SIGTERM / SIGINT 走同一条路径。用 `inject` 验证未就绪，不重复 PoC e2e。

---

### 任务 6：`createTestApp()`

**文件：**
- 创建：`apps/backend/src/app/create-test-app.ts`
- 创建：`apps/backend/src/app/create-test-app.test.ts`

`createTestApp` 放在 `app/` 而不是 `framework/testing/`，避免 `framework → app` 反向依赖。`testConfig()` 继续留在 `framework/testing/test-config.ts`。

- [ ] **步骤 1：编写失败的测试工厂测试**

创建 `apps/backend/src/app/create-test-app.test.ts`：

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createTestApp } from './create-test-app';
import { testConfig } from '../framework/testing/test-config';

describe('createTestApp', () => {
  let app: Awaited<ReturnType<typeof createTestApp>> | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it('defaults to a disabled logger and supports inject without TCP', async () => {
    const read = vi.fn().mockReturnValue({ pong: true, source: 'factory' });
    app = await createTestApp({
      dependencies: { probeService: { read } },
    });

    const response = await app.inject({ method: 'GET', url: '/poc/ping' });

    expect(app.server.listening).toBe(false);
    expect(read).toHaveBeenCalledOnce();
    expect(response.json().data).toEqual({ pong: true, source: 'factory' });
  });

  it('overrides config and readiness checkers', async () => {
    app = await createTestApp({
      checkers: [
        {
          async check() {
            throw new Error('cache unavailable');
          },
          name: 'cache',
        },
      ],
      config: testConfig({ openapiUiEnabled: false }),
    });

    const ready = await app.inject({ method: 'GET', url: '/readyz' });
    const json = await app.inject({ method: 'GET', url: '/documentation/json' });
    const ui = await app.inject({ method: 'GET', url: '/documentation/' });

    expect(ready.statusCode).toBe(503);
    expect(json.statusCode).toBe(200);
    expect(ui.statusCode).toBe(404);
    expect(app.config.openapiUiEnabled).toBe(false);
  });
});
```

现有 `create-app.test.ts`、`dependencies.test.ts`、`openapi.test.ts` **继续调用 `createApp`**，本任务不强制迁移。

- [ ] **步骤 2：运行测试验证失败**

运行：

```bash
pnpm exec vitest run --environment node apps/backend/src/app/create-test-app.test.ts
```

预期：FAIL，无法解析 `./create-test-app`。

- [ ] **步骤 3：编写最少实现代码**

创建 `apps/backend/src/app/create-test-app.ts`：

```ts
import { type Logger } from 'pino';

import { createApp, type CreateAppOptions } from './create-app';
import { type AppDependencies } from './dependencies';
import { type AppConfig } from '../framework/config/schema';
import { type ReadinessGate } from '../framework/core/readiness';
import { type ResourceRegistry } from '../framework/core/resource-registry';
import { testConfig } from '../framework/testing/test-config';
import { type HealthChecker } from '../framework/http/health.plugin';

export interface CreateTestAppOptions {
  checkers?: HealthChecker[];
  config?: AppConfig;
  dependencies?: Partial<AppDependencies>;
  logger?: boolean | Logger;
  readinessGate?: ReadinessGate;
  resources?: ResourceRegistry;
}

export async function createTestApp(options: CreateTestAppOptions = {}) {
  const createOptions: CreateAppOptions = {
    checkers: options.checkers,
    config: options.config ?? testConfig(),
    dependencies: options.dependencies,
    logger: options.logger ?? false,
    readinessGate: options.readinessGate,
    resources: options.resources,
  };
  return createApp(createOptions);
}
```

- [ ] **步骤 4：运行测试验证通过**

运行：

```bash
pnpm exec vitest run --environment node apps/backend/src/app/create-test-app.test.ts apps/backend/src/app/create-app.test.ts apps/backend/src/app/dependencies.test.ts
pnpm --filter @ai-butler/backend typecheck
```

预期：全部 PASS；工厂测试未监听 TCP；旧测试仍用 `createApp`。

- [ ] **步骤 5：Commit**

```bash
git add apps/backend/src/app/create-test-app.ts apps/backend/src/app/create-test-app.test.ts
git commit -m "$(cat <<'EOF'
feat: 增加测试应用工厂

EOF
)"
```

**本任务交付物：** `createTestApp()` 默认 `logger: false`，可覆盖 `config` / `dependencies` / `checkers`，返回可 `inject` 的应用。至少本文件的新测试走工厂。

---

### 任务 7：启动顺序对齐规格 §7.1（无 DB）

**文件：**
- 创建：`apps/backend/src/app/start.ts`
- 创建：`apps/backend/src/app/start.test.ts`
- 修改：`apps/backend/src/main.ts`

目标顺序（规格 §7.1 去掉「创建数据库连接」）：

```text
loadConfig
→ createLogger
→ create Fastify（createApp 内）
→ 框架插件（error-handler、request-context、openapi 文档）
→ probe 模块
→ health 与 OpenAPI UI
→ app.ready()
→ listen
```

配置校验失败必须在创建 Fastify / `listen` 之前抛出。

- [ ] **步骤 1：编写失败的启动测试**

创建 `apps/backend/src/app/start.test.ts`：

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ConfigError } from '../framework/config/config-error';
import { bootstrap, start } from './start';

describe('bootstrap and start', () => {
  let runtime: Awaited<ReturnType<typeof bootstrap>> | undefined;

  afterEach(async () => {
    await runtime?.app.close();
    runtime = undefined;
  });

  it('does not construct the server when configuration is invalid', async () => {
    const listen = vi.fn();

    await expect(
      bootstrap({
        APP_ENV: 'staging',
        HOST: '127.0.0.1',
        LOG_LEVEL: 'info',
        PORT: '3000',
      }),
    ).rejects.toBeInstanceOf(ConfigError);

    await expect(
      start({
        APP_ENV: 'staging',
        HOST: '127.0.0.1',
        LOG_LEVEL: 'info',
        PORT: '3000',
      }),
    ).rejects.toBeInstanceOf(ConfigError);

    expect(listen).not.toHaveBeenCalled();
  });

  it('becomes ready without listening and exposes probe plus health routes', async () => {
    runtime = await bootstrap({
      APP_ENV: 'test',
      HOST: '127.0.0.1',
      LOG_LEVEL: 'fatal',
      PORT: '0',
    });

    expect(runtime.app.server.listening).toBe(false);

    const ping = await runtime.app.inject({ method: 'GET', url: '/poc/ping' });
    const live = await runtime.app.inject({ method: 'GET', url: '/livez' });
    const docs = await runtime.app.inject({
      method: 'GET',
      url: '/documentation/json',
    });

    expect(ping.statusCode).toBe(200);
    expect(live.statusCode).toBe(200);
    expect(docs.statusCode).toBe(200);
    expect(runtime.app.config.appEnv).toBe('test');
  });
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：

```bash
pnpm exec vitest run --environment node apps/backend/src/app/start.test.ts
```

预期：FAIL，无法解析 `./start`。

- [ ] **步骤 3：编写最少实现代码**

创建 `apps/backend/src/app/start.ts`：

```ts
import { createApp } from './create-app';
import { loadConfig } from '../framework/config/load-config';
import { createAppShutdown } from '../framework/core/app-shutdown';
import { createReadinessGate } from '../framework/core/readiness';
import { ResourceRegistry } from '../framework/core/resource-registry';
import { createLogger } from '../framework/observability/logger';

export async function bootstrap(env: NodeJS.ProcessEnv = process.env) {
  const config = loadConfig(env);
  const logger = createLogger(config);
  const readinessGate = createReadinessGate();
  const resources = new ResourceRegistry();
  const app = await createApp({
    config,
    logger,
    readinessGate,
    resources,
  });
  await app.ready();
  return { app, config, logger, readinessGate, resources };
}

export async function start(env: NodeJS.ProcessEnv = process.env) {
  const runtime = await bootstrap(env);
  const shutdown = createAppShutdown({
    readinessGate: runtime.readinessGate,
    resources: runtime.resources,
  });

  async function handleSignal(signal: NodeJS.Signals): Promise<void> {
    runtime.logger.info({ signal }, 'shutdown started');
    try {
      await shutdown();
      process.exitCode = 0;
    } catch (error) {
      runtime.logger.error({ err: error, signal }, 'shutdown failed');
      process.exitCode = 1;
    }
  }

  process.once('SIGINT', () => void handleSignal('SIGINT'));
  process.once('SIGTERM', () => void handleSignal('SIGTERM'));

  await runtime.app.listen({
    host: runtime.config.host,
    port: runtime.config.port,
  });

  return runtime;
}
```

将 `apps/backend/src/main.ts` 改为：

```ts
import { start } from './app/start';

await start();
```

`createApp` 内部顺序已在任务 3–5 对齐，本任务不要再插入数据库工厂。`bootstrap` 在 `listen` 之前调用 `app.ready()`。

边界测试白名单已包含 `src/app/start.ts` 与 `src/main.ts`，它们是唯一允许把 `process.env` 交给 `loadConfig` 的入口。

- [ ] **步骤 4：运行测试验证通过**

运行：

```bash
pnpm exec vitest run --environment node apps/backend/src/app/start.test.ts apps/backend/src/framework/config/process-env-boundary.test.ts
pnpm --filter @ai-butler/backend test
pnpm --filter @ai-butler/backend typecheck
```

预期：全部 PASS；非法 `APP_ENV` 时 `start` / `bootstrap` 抛 `ConfigError`；`bootstrap` 后 `server.listening === false`。

- [ ] **步骤 5：Commit**

```bash
git add apps/backend/src/app/start.ts apps/backend/src/app/start.test.ts apps/backend/src/main.ts
git commit -m "$(cat <<'EOF'
feat: 对齐应用启动顺序

EOF
)"
```

**本任务交付物：** 无 DB 的启动链与规格 §7.1 一致；配置失败不会 `listen`；进程入口只调用 `start()`。

---

### 任务 8：ADR 0004 / 0005 与设计文档状态

**文件：**
- 创建：`apps/backend/docs/adr/0004-typed-config-and-secrets.md`
- 创建：`apps/backend/docs/adr/0005-liveness-and-readiness.md`
- 修改：`apps/backend/nodejs-fastify-framework-design.md`

本任务用「先跑证据命令、再写无占位符文档」代替业务 TDD。不要在 ADR 里填写未运行的退出码。

- [ ] **步骤 1：先运行全部验证命令并记录真实结果**

运行：

```bash
pnpm --filter @ai-butler/backend test
pnpm --filter @ai-butler/backend typecheck
pnpm --filter @ai-butler/backend check:architecture
pnpm --filter @ai-butler/backend build
```

预期：退出码均为 0。把每条命令的退出码、测试数量抄进提交说明或本地笔记，ADR 只写已发生的事实。不要把 PoC 基准数字抄进本任务。

- [ ] **步骤 2：编写两份 ADR**

创建 `apps/backend/docs/adr/0004-typed-config-and-secrets.md`：

```markdown
# ADR 0004：配置校验与密钥隔离

**状态：** 接受

## 背景

规格第 11 节要求环境变量在启动期完成 TypeBox 校验，业务代码不得读取 `process.env`，配置对象默认只读，错误必须指出配置项名称且不得打印密钥值。薄内核尚无 JWT 或数据库连接串，但配置入口必须先把这条边界立住，避免垂直切片把密钥读散到模块里。

## 决策

- 使用 `loadConfig(env)` 将 `APP_ENV`、`HOST`、`PORT`、`LOG_LEVEL` 以及可选的 `OPENAPI_UI` 映射为只读 `AppConfig`。
- `AppConfig` 经 `AppConfigSchema`（`typebox`）`Value.Check` 后 `Object.freeze`。
- 配置错误抛出 `ConfigError`，`keys` 与 `message` 只含配置项名，不含原始环境变量值。
- `createApp` / 业务模块 / 框架运行时代码从参数或 `app.config` 取配置；只有 `load-config.ts`、`start.ts`、`main.ts` 可以接触 `process.env`。
- 生产环境默认 `openapiUiEnabled = false`，可用 `OPENAPI_UI=true` 显式打开。

## 替代方案

- 继续在 `main.ts` 读取 `process.env.PORT`：拒绝，因为规格禁止业务与应用代码直接读环境变量，且无法集中脱敏。
- 引入独立配置中心或密钥服务：拒绝，第一阶段没有第二个配置源。
- 把 JWT 占位字段提前写进 Schema：拒绝，垂直切片计划才会引入密钥项；提前加入只会制造假必填项。

## 后果

- 缺少或非法的 `APP_ENV` / `HOST` / `PORT` / `LOG_LEVEL` 会在 `listen` 之前失败。
- 后续若增加 `DATABASE_URL` 或 JWT 密钥，必须走同一套 `loadConfig`，错误与日志都不得回显原值。
- 出现第二个配置源时，必须新开 ADR，而不是在模块内补 `process.env`。
```

创建 `apps/backend/docs/adr/0005-liveness-and-readiness.md`：

```markdown
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
```

- [ ] **步骤 3：回填设计文档状态**

将 `apps/backend/nodejs-fastify-framework-design.md` 头部状态从 PoC 评审后的：

```markdown
**状态：技术 PoC 已验证，等待薄内核实现计划评审**
```

改为：

```markdown
**状态：薄内核已实现，等待垂直切片计划**
```

不要改规格正文里的启动顺序、健康检查语义或非目标清单。若步骤 1 的任何命令失败，保持原状态，不要改这一行。

- [ ] **步骤 4：重新执行静态验证**

运行：

```bash
pnpm --filter @ai-butler/backend test
pnpm --filter @ai-butler/backend typecheck
pnpm --filter @ai-butler/backend check:architecture
git diff --check
git status --short
```

预期：测试、类型、依赖方向检查退出码为 0；`git diff --check` 无输出；工作区只剩下本任务的两份 ADR 和设计文档状态变更。

- [ ] **步骤 5：Commit**

```bash
git add apps/backend/docs/adr/0004-typed-config-and-secrets.md apps/backend/docs/adr/0005-liveness-and-readiness.md apps/backend/nodejs-fastify-framework-design.md
git commit -m "$(cat <<'EOF'
docs: 记录配置与健康检查决策

EOF
)"
```

**本任务交付物：** ADR 0004（配置与密钥）、ADR 0005（健康检查语义）已落地；设计文档状态为「薄内核已实现，等待垂直切片计划」。完成后停止实现，等待垂直切片计划，不要开始 JWT、用户表或 PostgreSQL 建连。

---

## 最终完成条件

只有同时满足以下条件，本计划才算完成：

- 闸门已通过：PoC 计划完成，ADR 0001–0003 与 `poc-report.md` 评审通过；若 PoC 改了公共接口，本计划已先修订再实现。
- 八个任务分别有独立提交，提交信息为 Conventional Commits 中文（`feat:` / `docs:`，scope 用 `backend` 或省略）。
- `pnpm --filter @ai-butler/backend test`、`typecheck`、`check:architecture`、`build` 退出码为 0。
- 业务模块与框架运行时代码不读取 `process.env`；配置错误含配置项名、不含密钥值。
- 日志脱敏覆盖 `password`、`Authorization`、`Cookie`、`accessToken`、`refreshToken`、`DATABASE_URL`；存在时带 `requestId` / `traceId`。
- `/documentation` 与 `/documentation/json` 可用，生产可通过 `AppConfig.openapiUiEnabled` 关闭 UI。
- `/livez` 不查外部依赖；`/readyz` 使用注入 checkers；关闭开始后就绪立即失败；响应不含连接串。
- `createAppShutdown` 先 `markNotReady()` 再关闭 Fastify；未就绪用 `inject` 验证，未再写进程级 e2e。
- 新测试走 `createTestApp()`；旧测试仍可使用 `createApp`。
- 启动顺序为 loadConfig → logger → Fastify → 框架插件 → probe → health / OpenAPI UI → `ready`；配置失败不得 `listen`。
- 未新增 Redis、NATS、OAuth2、Session、CLI、完整 OpenTelemetry、DI Container、`defineModule()`、PostgreSQL 业务表或默认数据库连接。
- 所有服务端实现、测试和 ADR 均位于 `apps/backend`。
- TypeBox 从 `typebox` 导入；Pino 与 `@fastify/swagger-ui` 经 catalog 引入。

完成后不要开始认证与用户垂直切片。先评审 ADR 0004、0005 和设计文档新状态，再执行 [`2026-09-04-fastify-backend-vertical-slice.md`](./2026-09-04-fastify-backend-vertical-slice.md)。

## 规格覆盖

| 规格 | 本计划任务 |
| --- | --- |
| §7.1 启动顺序（无数据库） | 任务 7 |
| §7.2 关闭先未就绪再释放资源 | 任务 5 |
| §8 / OpenAPI | 任务 3 |
| §11 类型化配置、业务不读 `process.env` | 任务 1 |
| §12 Pino 脱敏与 `requestId` / `traceId` | 任务 2 |
| §14 Liveness / Readiness | 任务 4、ADR 0005 |
| §16.1 `app.inject()` 测试工厂 | 任务 6 |
| §18 里程碑 2 | 任务 1–8 |
| §15 / §19 Redis、NATS、完整 OTEL 延后 | 闸门与非目标 |

## 全局约束

- `createTestApp` 位于 `src/app/create-test-app.ts`；`testConfig()` 位于 `src/framework/testing/test-config.ts`。禁止把工厂放到 `framework/testing/`，以免 `framework → app`。
- `/readyz` 失败固定 `{ code: 5030, data: null, message: 'not ready' }`。
- `HealthChecker` 是注入检查器的类型名，不要另造 `ReadinessChecker`。
- `AppConfig` 必须保留 `openapiUiEnabled`；`logLevel` 含 `silent`。
- 本计划无数据库连接、无业务表。