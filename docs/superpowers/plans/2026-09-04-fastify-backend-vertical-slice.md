# Fastify 后端认证与用户垂直切片实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 在 `apps/backend` 内用 PostgreSQL + JWT 实现可测试的认证与用户垂直切片，并与现有 `web-antd` / `backend-mock` 的登录、刷新、退出、权限码和用户信息契约对齐。

**架构：** `createApp()` 在薄内核启动顺序中接入应用级 Drizzle 连接池；认证插件只解析 Bearer 并写入 `RequestContext.principal`；RBAC 由 `requireRole` / `requireAuthenticated` 显式执行；Controller 只读上下文、调用 Service、构造协议输出。`POST /auth/refresh` 是唯一不包 `{ code, data, message }` 的成功响应。

**技术栈：** Node.js 24、TypeScript 6、Fastify 5、TypeBox 1、Pino、Drizzle ORM 0.45、postgres.js、PostgreSQL 17、Testcontainers 12、Vitest 4、`jsonwebtoken`、`@fastify/cookie`、`node:crypto` scrypt

**规格：** [`apps/backend/nodejs-fastify-framework-design.md`](../../../apps/backend/nodejs-fastify-framework-design.md)

**前置：** PoC 计划 + 薄内核计划

---

## 闸门

**不得在薄内核计划完成前执行本计划。**

前置文档：

- [`docs/superpowers/plans/2026-09-04-fastify-backend-poc.md`](./2026-09-04-fastify-backend-poc.md)
- [`docs/superpowers/plans/2026-09-04-fastify-backend-thin-kernel.md`](./2026-09-04-fastify-backend-thin-kernel.md)

进入实现前必须同时满足：

1. PoC 十项验证有证据，ADR 0001–0003 已评审。
2. 薄内核 8 个任务已完成，ADR 0004–0005 已评审，设计文档状态为「薄内核已实现，等待垂直切片计划」。
3. 若 PoC 或薄内核修订了 `loadConfig`、`AppConfig`、`createApp`、`createTestApp`、`RequestContext`、`ResourceRegistry`、`createDependencies` 或健康检查接口，**先修订本计划再写代码**。

## 全局约束

- `createTestApp` 位于 `src/app/create-test-app.ts`；`testConfig()` 位于 `src/framework/testing/test-config.ts`。
- 检查器类型名为 `HealthChecker`，不要另造 `ReadinessChecker`。
- 扩展 `AppConfig` 时必须保留薄内核的 `openapiUiEnabled`。
- `/auth/*` 与 `/user/info` 成功 `message` 对齐 mock，使用 `ok`；框架 probe / health 仍用 `success`。
- `POST /auth/refresh` 成功 body 是 accessToken 原始字符串。
- 未认证 `1101`，登录/刷新失败 `1103`，缺角色 `1104`。

本计划假设薄内核已提供（名称若有出入，跟随仓库现有导出，不要平行再造一套）：

| 符号 | 预期位置 |
| --- | --- |
| `loadConfig` / `AppConfig` | `src/framework/config/` |
| `createLogger` 与 Pino 脱敏 | `src/framework/observability/` |
| `createApp` / `CreateAppOptions` | `src/app/create-app.ts` |
| `createDependencies` / `AppDependencies` | `src/app/dependencies.ts` |
| `createTestApp` | `src/app/create-test-app.ts` |
| `testConfig` | `src/framework/testing/test-config.ts` |
| `AppError` | `src/framework/core/app-error.ts` |
| `success` / `successEnvelopeSchema` | `src/framework/http/envelope.ts` |
| `RequestContext` / `getRequestContext` | `src/framework/core/request-context.ts` |
| `ResourceRegistry` | `src/framework/core/resource-registry.ts` |
| Readiness checkers | 薄内核健康检查插件 |
| PoC `createDatabase` / `Database` / `Transaction` / `DatabaseExecutor` | `src/infrastructure/database/client.ts` |
| probe 模块与 `poc_accounts` | 保留；probe 作 canary，`poc_accounts` 不作业务 |

## 范围与非目标

**做：**

- `DATABASE_URL`、`JWT_ACCESS_SECRET`、`JWT_REFRESH_SECRET` 启动校验与日志脱敏
- 应用级 PostgreSQL 连接池、失败快速退出、测试用 Drizzle migrator
- `users` + `access_codes`、窄 `UserRepository`、`AuthService`、JWT 认证插件、RBAC policy
- 与 mock / `web-antd` 对齐的 `/auth/*` 与 `/user/info`

**不做：** Redis、NATS、Kafka、OAuth2、API Key、Session、DI Container、`defineModule`、完整 OpenTelemetry、通用 CRUD 基类、bcrypt、生产启动自动跑破坏性迁移。密码只用 `node:crypto` scrypt。JWT 只用 catalog 已有的 `jsonwebtoken` + `@types/jsonwebtoken`。

所有服务端代码、测试、迁移和 ADR 只放在 `apps/backend`。

## 前端契约（已对照 mock + web-antd）

前端 `VITE_GLOB_API_URL=/api`，Vite 去掉 `/api` 前缀后转发。本切片路由**不**带 `/api` 前缀。

| 接口 | 前端客户端 | 成功 | 失败 |
| --- | --- | --- | --- |
| `POST /auth/login` | `requestClient`（剥 `data`） | HTTP 200，`{ code: 0, data: { accessToken, ... }, message }`；前端只用 `accessToken`，再调 `/user/info` 与 `/auth/codes` | 缺字段走 TypeBox 400 / code `1000`；用户名或密码错误 HTTP 403，消息统一 `Username or password is incorrect.`，不区分用户是否存在 |
| `POST /auth/refresh` | `baseRequestClient`（**不剥壳**），`const newToken = resp.data` | HTTP 200，**body 为 accessToken 原始字符串**，不是 envelope | HTTP 403 |
| `POST /auth/logout` | `baseRequestClient` | `{ code: 0, data: '', message }`，清除 `jwt` cookie | 无 cookie 仍成功 |
| `GET /auth/codes` | `requestClient` | `{ code: 0, data: string[], message }` | 无/无效 Bearer → HTTP 401 |
| `GET /user/info` | `requestClient` | `data` 对齐 `UserInfo` / `BasicUserInfo` | 无/无效 Bearer → HTTP 401；**绝不返回 password / passwordHash** |

Refresh cookie 与 mock 一致：名 `jwt`，`httpOnly: true`，`maxAge: 86400`（秒），`sameSite: 'none'`，`secure: true`，`path: '/'`。

`GET /user/info` 的 `data` 必须包含且仅对外暴露：

- `userId: string`
- `username: string`
- `realName: string`
- `roles: string[]`
- `avatar: string`
- `desc: string`
- `homePath: string`

登录成功 `data` 另含 `accessToken`，并同时给 `id` 与 `userId`（均为字符串，值为同一用户 ID），以便兼容 mock 的 `id` 与前端的 `userId`。

种子用户（测试 fixture，**不要**写入生产迁移）对齐 mock：

| username | password | roles | codes | homePath |
| --- | --- | --- | --- | --- |
| `vben` | `123456` | `['super']` | `AC_100100`, `AC_100110`, `AC_100120`, `AC_100010` | `/ai-butler/workbench` |
| `admin` | `123456` | `['admin']` | `AC_100010`, `AC_100020`, `AC_100030` | `/ai-butler/workbench` |
| `jack` | `123456` | `['user']` | `AC_1000001`, `AC_1000002` | `/ai-butler/workbench` |

稳定业务错误码（HTTP 语义对齐 mock，`code` 用可文档化非零值；mock 的 `-1` 不照搬）：

| 场景 | HTTP | `code` | `message` |
| --- | --- | --- | --- |
| 未认证 / 无效 Bearer | 401 | `1101` | `Unauthorized Exception` |
| 用户名或密码错误 / 刷新失败 | 403 | `1103` | 登录用 `Username or password is incorrect.`；刷新用 `Forbidden Exception` |
| 已认证但缺少角色 | 403 | `1104` | `Forbidden Exception` |

## 薄内核接口假设（实现时以仓库为准）

本计划按薄内核任务的约定编写。若实际导出名不同，只改调用点，不复制第二套配置/日志/测试工厂。

```ts
export interface AppConfig {
  readonly appEnv: 'development' | 'production' | 'test';
  readonly host: string;
  readonly logLevel: 'debug' | 'error' | 'fatal' | 'info' | 'silent' | 'trace' | 'warn';
  readonly openapiUiEnabled: boolean;
  readonly port: number;
}

export interface CreateAppOptions {
  checkers?: HealthChecker[];
  config?: AppConfig;
  dependencies?: Partial<AppDependencies>;
  logger?: boolean | object;
}

export interface RequestContext {
  requestId: string;
  traceId: string | undefined;
}

export function createTestApp(options?: CreateAppOptions): Promise<AppInstance>;
```

本切片将 `AppConfig` 扩展为必含 `databaseUrl`、`jwtAccessSecret`、`jwtRefreshSecret`；将 `RequestContext` 增加可写的 `principal`；将 `CreateAppOptions` 增加 `skipDatabase`、`database`、`extraPlugins`。

## 文件结构

本计划完成后新增或修改以下文件：

- 修改：`pnpm-workspace.yaml`——登记 `@fastify/cookie`。
- 修改：`apps/backend/package.json`——加入 `jsonwebtoken`、`@types/jsonwebtoken`、`@fastify/cookie`，扩展 `test:integration`。
- 修改：`apps/backend/src/framework/config/*`——必填数据库 URL 与 JWT 密钥，长度 ≥ 32。
- 修改：`apps/backend/src/framework/observability/*`——脱敏 `JWT_ACCESS_SECRET`、`JWT_REFRESH_SECRET` 及配置对象对应字段。
- 修改：`apps/backend/src/app/create-test-app.ts`——默认 `skipDatabase: true`。
- 修改：`apps/backend/src/framework/testing/test-config.ts`——默认测试配置含 32 位密钥、`openapiUiEnabled` 与 `databaseUrl`。
- 修改：`apps/backend/src/framework/core/request-context.ts`——增加 `Principal`。
- 修改：`apps/backend/src/app/create-app.ts`——启动顺序加入数据库；注册 cookie / JWT 插件。
- 修改：`apps/backend/src/app/dependencies.ts`——显式装配 `userRepository`、`authService`、`userService`。
- 修改：`apps/backend/src/app/register-modules.ts`——注册 auth、user；保留 probe。
- 修改：`apps/backend/src/infrastructure/database/schema.ts`——增加 `users`、`access_codes`。
- 修改：`apps/backend/src/infrastructure/database/client.ts`——连接池工厂、fail-fast ping。
- 创建：`apps/backend/migrations/0001_users.sql` 与 journal 条目。
- 创建：`apps/backend/src/modules/user/user.repository.ts`——窄接口。
- 创建：`apps/backend/src/infrastructure/database/user.repository.ts`——Drizzle 实现。
- 创建：`apps/backend/src/modules/user/user.repository.fake.ts`——测试 Fake。
- 创建：`apps/backend/src/modules/user/user.fixture.ts`——种子用户。
- 创建：`apps/backend/src/modules/user/user.service.ts`、`user.schema.ts`、`user.plugin.ts`。
- 创建：`apps/backend/src/modules/auth/password.ts`、`token.ts`、`auth-errors.ts`、`auth.service.ts`、`auth.schema.ts`、`auth.plugin.ts`、`jwt-authentication.plugin.ts`、`authorization.ts`。
- 创建：`apps/backend/docs/adr/0006-refresh-token-raw-string.md`
- 创建：`apps/backend/docs/adr/0007-jwt-only-authentication.md`

probe 与 `poc_accounts` **不删除**。

## 规格覆盖

| 规格 / 契约 | 任务 |
| --- | --- |
| §7.1 启动顺序含数据库，失败快速退出 | 2 |
| §10 / §10.1 窄 Repository，无 CRUD 基类 | 4 |
| §10.2 事务由 Service 声明 | 4、fixture |
| §10.3 空库迁移；生产不自动破坏性迁移 | 3、2 |
| §11 配置校验、业务不读 `process.env`、错误含项名不含密钥 | 1 |
| §12 日志脱敏密钥与连接串 | 1 |
| §13 认证/授权分离、JWT only、Controller 不解析 Token | 6、7、8、9 |
| §8 与前端 `{ code, data, message }`；refresh 例外 | 6、9、ADR 0006 |
| 登录 403 消息不可区分 | 5、6 |
| Bearer + `/user/info` 字段、无 password | 7、9 |
| RBAC `requireRole`：401 / 403 | 8 |
| 种子用户对齐 mock | 4、6、9 |

---

### 任务 1：扩展配置——数据库 URL 与 JWT 密钥

**文件：**
- 修改：`apps/backend/src/framework/config/` 下现有 schema 与 `loadConfig`
- 修改：`apps/backend/src/framework/config/` 下现有配置测试
- 修改：`apps/backend/src/framework/observability/` 下现有 logger 脱敏
- 修改：`apps/backend/src/app/create-test-app.ts`
- 修改：`apps/backend/src/framework/testing/test-config.ts`
- 创建：`apps/backend/.env.example`

- [ ] **步骤 1：编写失败的配置与脱敏测试**

在现有 `loadConfig` 测试文件中追加（保持原 `APP_ENV` / `HOST` / `PORT` / `LOG_LEVEL` 用例）：

```ts
import { describe, expect, it } from 'vitest';

import { loadConfig } from './load-config';

const validEnv = {
  APP_ENV: 'test',
  DATABASE_URL: 'postgres://postgres:postgres@127.0.0.1:5432/ai_butler',
  HOST: '127.0.0.1',
  JWT_ACCESS_SECRET: 'A'.repeat(32),
  JWT_REFRESH_SECRET: 'B'.repeat(32),
  LOG_LEVEL: 'silent',
  PORT: '3000',
};

describe('loadConfig secrets', () => {
  it('loads DATABASE_URL and JWT secrets into a frozen config', () => {
    const config = loadConfig(validEnv);

    expect(config.databaseUrl).toBe(validEnv.DATABASE_URL);
    expect(config.jwtAccessSecret).toBe(validEnv.JWT_ACCESS_SECRET);
    expect(config.jwtRefreshSecret).toBe(validEnv.JWT_REFRESH_SECRET);
    expect(Object.isFrozen(config)).toBe(true);
  });

  it('rejects JWT secrets shorter than 32 characters without leaking the value', () => {
    const env = { ...validEnv, JWT_ACCESS_SECRET: 'short-secret-value' };

    expect(() => loadConfig(env)).toThrow(/JWT_ACCESS_SECRET/);
    expect(() => loadConfig(env)).toThrow(/at least 32 characters/);
    expect(() => loadConfig(env)).not.toThrow(/short-secret-value/);
  });

  it('rejects missing DATABASE_URL by name', () => {
    const { DATABASE_URL: _ignored, ...env } = validEnv;

    expect(() => loadConfig(env)).toThrow(/DATABASE_URL/);
  });
});
```

若薄内核 logger 已有脱敏测试，追加：

```ts
it('redacts JWT secret env names and config fields', () => {
  const logger = createLogger({
    appEnv: 'test',
    databaseUrl: 'postgres://postgres:password@127.0.0.1:5432/ai_butler',
    host: '127.0.0.1',
    jwtAccessSecret: 'A'.repeat(32),
    jwtRefreshSecret: 'B'.repeat(32),
    logLevel: 'info',
    openapiUiEnabled: false,
    port: 3000,
  });

  const output: string[] = [];
  const destination = {
    write(chunk: string) {
      output.push(chunk);
    },
  };
  const child = logger.child({}, { dest: destination } as never);
  child.info({
    JWT_ACCESS_SECRET: 'A'.repeat(32),
    JWT_REFRESH_SECRET: 'B'.repeat(32),
    jwtAccessSecret: 'A'.repeat(32),
    jwtRefreshSecret: 'B'.repeat(32),
  });

  const text = output.join('');
  expect(text).not.toContain('A'.repeat(32));
  expect(text).not.toContain('B'.repeat(32));
});
```

若现有 logger 测试用 `stream`/`sonic-boom` 收集 JSON 行，按同一方式断言 `redact` 后的值为 `[Redacted]`，正文不含密钥明文。不要把密钥写进仓库别的文件。

- [ ] **步骤 2：运行测试验证失败**

运行：

```bash
pnpm exec vitest run --environment node apps/backend/src/framework/config
```

预期：FAIL。`AppConfig` 尚无 `databaseUrl` / `jwtAccessSecret` / `jwtRefreshSecret`，或 `loadConfig` 仍只读取 `APP_ENV` / `HOST` / `PORT` / `LOG_LEVEL`。

- [ ] **步骤 3：编写最少实现代码**

扩展 `AppConfig` 与 schema（字段名必须与测试一致）：

```ts
import { Type, type Static } from 'typebox';

export const AppConfigSchema = Type.Object({
  appEnv: Type.Union([
    Type.Literal('development'),
    Type.Literal('production'),
    Type.Literal('test'),
  ]),
  databaseUrl: Type.String({ minLength: 1 }),
  host: Type.String({ minLength: 1 }),
  jwtAccessSecret: Type.String({ minLength: 32 }),
  jwtRefreshSecret: Type.String({ minLength: 32 }),
  logLevel: Type.Union([
    Type.Literal('fatal'),
    Type.Literal('error'),
    Type.Literal('warn'),
    Type.Literal('info'),
    Type.Literal('debug'),
    Type.Literal('trace'),
    Type.Literal('silent'),
  ]),
  openapiUiEnabled: Type.Boolean(),
  port: Type.Integer({ minimum: 1, maximum: 65_535 }),
});

export type AppConfig = Readonly<Static<typeof AppConfigSchema>>;
```

`loadConfig` 从环境变量映射，**密钥长度校验不要走会把 value 打进错误信息的通用 dump**。在现有实现上增加：

```ts
function readRequired(
  env: NodeJS.Dict<string>,
  name: string,
): string {
  const value = env[name];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function readSecret(
  env: NodeJS.Dict<string>,
  name: string,
): string {
  const value = env[name];
  if (typeof value !== 'string' || value.length < 32) {
    throw new Error(`${name} must be a string of at least 32 characters`);
  }
  return value;
}

export function loadConfig(
  env: NodeJS.Dict<string> = process.env,
): AppConfig {
  const config: AppConfig = Object.freeze({
    appEnv: parseAppEnv(env.APP_ENV),
    databaseUrl: readRequired(env, 'DATABASE_URL'),
    host: readRequired(env, 'HOST'),
    jwtAccessSecret: readSecret(env, 'JWT_ACCESS_SECRET'),
    jwtRefreshSecret: readSecret(env, 'JWT_REFRESH_SECRET'),
    logLevel: parseLogLevel(env.LOG_LEVEL),
    openapiUiEnabled: parseOpenApiUi(env, env.APP_ENV),
    port: parsePort(env.PORT),
  });

  return config;
}
```

`parseAppEnv` / `parseLogLevel` / `parsePort` 沿用薄内核已有函数；不要让业务模块读取 `process.env`。

Pino `redact.paths` 在薄内核已有 `password`、`authorization`、`cookie`、`accessToken`、`refreshToken`、`DATABASE_URL` 基础上增加：

```ts
'JWT_ACCESS_SECRET',
'JWT_REFRESH_SECRET',
'jwtAccessSecret',
'jwtRefreshSecret',
'databaseUrl',
'*.jwtAccessSecret',
'*.jwtRefreshSecret',
'*.databaseUrl',
```

更新 `apps/backend/src/framework/testing/test-config.ts` 与 `apps/backend/src/app/create-test-app.ts`，避免任务 1 之后所有薄内核测试因缺密钥失败。必须保留薄内核已有的 `openapiUiEnabled`，不要另造 `framework/testing/create-test-app.ts`：

```ts
export function testConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return Object.freeze({
    appEnv: 'test',
    databaseUrl: 'postgres://postgres:postgres@127.0.0.1:5432/unused',
    host: '127.0.0.1',
    jwtAccessSecret: 'A'.repeat(32),
    jwtRefreshSecret: 'B'.repeat(32),
    logLevel: 'fatal',
    openapiUiEnabled: true,
    port: 0,
    ...overrides,
  });
}

export async function createTestApp(options: CreateAppOptions = {}) {
  return createApp({
    logger: false,
    skipDatabase: true,
    ...options,
    config: testConfig(options.config),
  });
}
```

`CreateAppOptions` 此时可能还没有 `skipDatabase`；若 TypeScript 报错，在本任务把该字段先加到接口上并在 `createApp` 中读取（忽略即可），任务 2 再接入真实连接。

创建 `apps/backend/.env.example`（占位值，不是真实密钥）：

```bash
APP_ENV=development
HOST=0.0.0.0
PORT=3000
LOG_LEVEL=info
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/ai_butler
JWT_ACCESS_SECRET=change-me-must-be-at-least-32-chars
JWT_REFRESH_SECRET=change-me-must-be-at-least-32-chars-too
```

- [ ] **步骤 4：运行测试验证通过**

运行：

```bash
pnpm exec vitest run --environment node apps/backend/src/framework/config
pnpm --filter @ai-butler/backend test
pnpm --filter @ai-butler/backend typecheck
```

预期：新配置测试 PASS；薄内核原有测试在 `createTestApp` 补齐密钥后 PASS。

- [ ] **步骤 5：Commit**

```bash
git add apps/backend/.env.example apps/backend/src/framework
git commit -m "$(cat <<'EOF'
feat: 扩展后端数据库与 JWT 配置

EOF
)"
```

---

### 任务 2：应用级 Drizzle 连接池并接入启动顺序

**文件：**
- 修改：`apps/backend/src/infrastructure/database/client.ts`
- 修改：`apps/backend/src/app/create-app.ts`
- 修改：`apps/backend/src/app/create-app.test.ts`（若仍直接 `createApp` 且会连库）
- 修改：`apps/backend/src/app/create-test-app.ts`
- 修改：`apps/backend/src/framework/testing/test-config.ts`
- 创建：`apps/backend/src/infrastructure/database/database-startup.integration.test.ts`
- 修改：`apps/backend/package.json` 的 `test:integration`

- [ ] **步骤 1：编写失败的启动与 fail-fast 测试**

创建 `apps/backend/src/infrastructure/database/database-startup.integration.test.ts`：

```ts
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { afterAll, describe, expect, it } from 'vitest';

import { createApp } from '../../app/create-app';
import { testConfig } from '../../framework/testing/test-config';

describe('database startup', () => {
  let connectionUri = '';
  let stopContainer: () => Promise<void> = async () => {};

  afterAll(async () => {
    await stopContainer();
  });

  it('connects with a shared pool and answers readiness', async () => {
    const container = await new PostgreSqlContainer('postgres:17-alpine').start();
    stopContainer = () => container.stop().then(() => undefined);
    connectionUri = container.getConnectionUri();

    const app = await createApp({
      config: testConfig({ databaseUrl: connectionUri }),
      logger: false,
      skipDatabase: false,
    });

    try {
      const live = await app.inject({ method: 'GET', url: '/livez' });
      const ready = await app.inject({ method: 'GET', url: '/readyz' });

      expect(live.statusCode).toBe(200);
      expect(ready.statusCode).toBe(200);
      expect(ready.body).not.toContain(connectionUri);
      expect(ready.body).not.toContain('postgres://');
    } finally {
      await app.close();
    }
  }, 60_000);

  it('fails fast when DATABASE_URL is unreachable', async () => {
    await expect(
      createApp({
        config: testConfig({
          databaseUrl: 'postgres://postgres:postgres@127.0.0.1:1/does_not_exist',
        }),
        logger: false,
        skipDatabase: false,
      }),
    ).rejects.toThrow();
  }, 30_000);
});
```

在 `create-app` 单元测试或新建 `apps/backend/src/app/create-app.database.test.ts`：

```ts
import { describe, expect, it } from 'vitest';

import { createApp } from './create-app';
import { createTestApp } from './create-test-app';
import { testConfig } from '../framework/testing/test-config';

describe('createApp database skip', () => {
  it('skips connecting when skipDatabase is true', async () => {
    const app = await createTestApp({
      config: testConfig({
        databaseUrl: 'postgres://postgres:postgres@127.0.0.1:1/must-not-connect',
      }),
    });

    const response = await app.inject({ method: 'GET', url: '/poc/ping' });
    expect(response.statusCode).toBe(200);
    await app.close();
  });

  it('does not listen when createApp is used in tests', async () => {
    const app = await createApp({
      config: testConfig(),
      logger: false,
      skipDatabase: true,
    });
    expect(app.server.listening).toBe(false);
    await app.close();
  });
});
```

- [ ] **步骤 2：运行测试验证失败**

将 `apps/backend/package.json` 的集成脚本扩为：

```json
{
  "test:integration": "vitest run --environment node src/infrastructure/database/*.integration.test.ts"
}
```

运行：

```bash
pnpm exec vitest run --environment node apps/backend/src/app/create-app.database.test.ts
pnpm --filter @ai-butler/backend test:integration
```

预期：FAIL。`skipDatabase` 不存在，或 `createApp` 尚未连接数据库 / 未在失败时拒绝。

- [ ] **步骤 3：编写最少实现代码**

扩展 `client.ts`（保留 PoC 的 `createDatabase` / `Database` / `Transaction` / `DatabaseExecutor`）：

```ts
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';

import { schema } from './schema';

export function createPool(url: string): Sql {
  return postgres(url, { connect_timeout: 5, max: 10 });
}

export function createDatabase(client: Sql) {
  return drizzle(client, { schema });
}

export async function pingDatabase(client: Sql): Promise<void> {
  await client`SELECT 1`;
}

export type Database = PostgresJsDatabase<typeof schema>;
export type Transaction = Parameters<
  Parameters<Database['transaction']>[0]
>[0];
export type DatabaseExecutor = Database | Transaction;
```

扩展 `CreateAppOptions`：

```ts
export interface CreateAppOptions {
  checkers?: HealthChecker[];
  config?: AppConfig;
  database?: Database;
  dependencies?: Partial<AppDependencies>;
  extraPlugins?: FastifyPluginAsync[];
  logger?: boolean | object;
  skipDatabase?: boolean;
}
```

`extraPlugins` 本任务可先原样传到 `registerModules`，任务 8 再使用。

在 `createApp` 中，配置与 logger 之后、Fastify 之前接入数据库（对齐规格 §7.1）。伪代码必须落成真实控制流：

```ts
export async function createApp(options: CreateAppOptions = {}) {
  const config = options.config ?? loadConfig();
  const logger = createLogger(config, options.logger);
  const resources = options.resources ?? new ResourceRegistry();

  let sql: Sql | undefined;
  let database = options.database;
  const checkers = [...(options.checkers ?? [])];

  if (!options.skipDatabase && !database) {
    sql = createPool(config.databaseUrl);
    await pingDatabase(sql);
    database = createDatabase(sql);
    resources.register('database', async () => {
      await sql?.end({ timeout: 5 });
    });
    checkers.push({
      name: 'postgres',
      check: async () => {
        await pingDatabase(sql!);
      },
    });
  }

  const dependencies = createDependencies(options.dependencies ?? {}, {
    config,
    database,
  });

  const app = createHttpServer({ logger });
  resources.register('http', async () => {
    await app.close();
  });

  await registerFrameworkPlugins(app, { checkers, config, resources });
  await registerModules(app, dependencies);
  for (const plugin of options.extraPlugins ?? []) {
    await app.register(plugin);
  }
  await app.ready();
  return app;
}
```

`registerFrameworkPlugins` 沿用薄内核已拆出的注册函数；若薄内核把插件注册内联在 `createApp`，就在原顺序中插入，不要重写整个文件。

`main.ts` **禁止** `skipDatabase: true`。配置或 `pingDatabase` 失败时让异常冒泡，进程以非零状态退出，不得 `listen`。

`createDependencies` 签名改为接收装配上下文（仍禁止 DI 容器）：

```ts
export function createDependencies(
  overrides: Partial<AppDependencies>,
  context: { config: AppConfig; database: Database | undefined },
): AppDependencies {
  return {
    probeService: overrides.probeService ?? createProbeService(),
  };
}
```

任务 4–5 再往这里挂 Repository / Service。现在不要创建空的 CRUD 服务。

关闭顺序：`ResourceRegistry` 逆序，HTTP 后关数据库。不要在 `createApp` 里调用 migrator。

- [ ] **步骤 4：运行测试验证通过**

运行：

```bash
pnpm exec vitest run --environment node apps/backend/src/app/create-app.database.test.ts
pnpm --filter @ai-butler/backend test:integration
pnpm --filter @ai-butler/backend test
pnpm --filter @ai-butler/backend typecheck
```

预期：可达的 Testcontainers 实例上 `/readyz` 为 200 且正文无连接串；错误 URL 时 `createApp` 拒绝；`skipDatabase` 下 probe 仍可 inject。本机无 Docker 时，集成测试应报 Testcontainers 连接错误，禁止改成内存数据库。

- [ ] **步骤 5：Commit**

```bash
git add apps/backend/package.json apps/backend/src
git commit -m "$(cat <<'EOF'
feat: 在应用启动时接入 PostgreSQL 连接池

EOF
)"
```

---

### 任务 3：users / access_codes Schema 与空库迁移

**文件：**
- 修改：`apps/backend/src/infrastructure/database/schema.ts`
- 创建：`apps/backend/migrations/0001_users.sql`
- 修改：`apps/backend/migrations/meta/_journal.json`（若 PoC 尚无 journal，一并补上 `0000_poc_accounts`）
- 创建：`apps/backend/src/infrastructure/database/migrate-users.integration.test.ts`

- [ ] **步骤 1：编写空库 migrate 集成测试**

创建 `apps/backend/src/infrastructure/database/migrate-users.integration.test.ts`：

```ts
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createDatabase, type Database } from './client';

describe('users migration', () => {
  let closeClient: () => Promise<void> = async () => {};
  let database: Database;
  let sql: ReturnType<typeof postgres>;
  let stopContainer: () => Promise<void> = async () => {};

  beforeAll(async () => {
    const container = await new PostgreSqlContainer('postgres:17-alpine').start();
    stopContainer = () => container.stop().then(() => undefined);
    sql = postgres(container.getConnectionUri(), { max: 2 });
    closeClient = () => sql.end();
    database = createDatabase(sql);
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

  it('creates users and access_codes on an empty database', async () => {
    const tables = await sql<{ table_name: string }[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('users', 'access_codes', 'poc_accounts')
      ORDER BY table_name
    `;

    expect(tables.map((row) => row.table_name)).toEqual([
      'access_codes',
      'poc_accounts',
      'users',
    ]);

    const userCount = await sql<{ count: string }[]>`SELECT count(*)::text FROM users`;
    const codeCount = await sql<{ count: string }[]>`
      SELECT count(*)::text FROM access_codes
    `;
    expect(userCount[0]?.count).toBe('0');
    expect(codeCount[0]?.count).toBe('0');
  });

  it('enforces unique usernames', async () => {
    await sql`
      INSERT INTO users (
        id, username, password_hash, real_name, avatar, description, home_path, roles
      ) VALUES (
        'user-1', 'vben', 'hash', 'Vben', '', '', '/ai-butler/workbench', ARRAY['super']::text[]
      )
    `;

    await expect(
      sql`
        INSERT INTO users (
          id, username, password_hash, real_name, avatar, description, home_path, roles
        ) VALUES (
          'user-2', 'vben', 'hash', 'Other', '', '', '/ai-butler/workbench', ARRAY['user']::text[]
        )
      `,
    ).rejects.toThrow(/unique|duplicate/i);
  });
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：

```bash
pnpm --filter @ai-butler/backend test:integration
```

预期：FAIL。`users` / `access_codes` 不存在，或 journal 未包含 `0001_users`。

- [ ] **步骤 3：编写最少实现代码**

在 `schema.ts` 保留 `poc_accounts` / `poc_audit_logs`，追加：

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

export const users = pgTable('users', {
  avatar: text('avatar').notNull().default(''),
  description: text('description').notNull().default(''),
  homePath: text('home_path').notNull(),
  id: text('id').primaryKey(),
  passwordHash: text('password_hash').notNull(),
  realName: text('real_name').notNull(),
  roles: text('roles').array().notNull(),
  username: text('username').notNull().unique(),
});

export const accessCodes = pgTable('access_codes', {
  codes: text('codes').array().notNull(),
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id),
});

export const schema = { accessCodes, accounts, auditLogs, users };
```

创建 `apps/backend/migrations/0001_users.sql`：

```sql
CREATE TABLE "users" (
  "id" text PRIMARY KEY NOT NULL,
  "username" text NOT NULL,
  "password_hash" text NOT NULL,
  "real_name" text NOT NULL,
  "avatar" text NOT NULL DEFAULT '',
  "description" text NOT NULL DEFAULT '',
  "home_path" text NOT NULL,
  "roles" text[] NOT NULL,
  CONSTRAINT "users_username_unique" UNIQUE("username")
);

CREATE TABLE "access_codes" (
  "user_id" text PRIMARY KEY NOT NULL,
  "codes" text[] NOT NULL,
  CONSTRAINT "access_codes_user_id_users_id_fk"
    FOREIGN KEY ("user_id")
    REFERENCES "public"."users"("id")
    ON DELETE no action
    ON UPDATE no action
);
```

更新 `apps/backend/migrations/meta/_journal.json`：

```json
{
  "version": "7",
  "dialect": "postgresql",
  "entries": [
    {
      "idx": 0,
      "version": "7",
      "when": 0,
      "tag": "0000_poc_accounts",
      "breakpoints": true
    },
    {
      "idx": 1,
      "version": "7",
      "when": 1,
      "tag": "0001_users",
      "breakpoints": true
    }
  ]
}
```

若 PoC 的 `0000_poc_accounts.sql` 尚无 journal，把该文件名与 tag 对齐后再追加 `0001_users`。不要在本迁移中 INSERT 种子用户。不要让 `createApp` 调用 `migrate()`。

- [ ] **步骤 4：运行测试验证通过**

运行：

```bash
pnpm --filter @ai-butler/backend test:integration
pnpm --filter @ai-butler/backend typecheck
```

预期：空库可完整 migrate；`users.username` 唯一约束生效；用户表初始为空。

- [ ] **步骤 5：Commit**

```bash
git add apps/backend/migrations apps/backend/src/infrastructure/database
git commit -m "$(cat <<'EOF'
feat: 增加 users 与 access_codes 迁移

EOF
)"
```

---

### 任务 4：UserRepository 窄接口与集成测试

**文件：**
- 创建：`apps/backend/src/modules/user/user.repository.ts`
- 创建：`apps/backend/src/infrastructure/database/user.repository.ts`
- 创建：`apps/backend/src/modules/user/user.repository.fake.ts`
- 创建：`apps/backend/src/infrastructure/database/user.repository.integration.test.ts`

- [ ] **步骤 1：编写失败的 Repository 集成测试**

创建 `apps/backend/src/infrastructure/database/user.repository.integration.test.ts`：

```ts
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createDrizzleUserRepository } from './user.repository';
import { createDatabase, type Database } from './client';

const sampleUser = {
  avatar: 'https://example.com/vben.png',
  description: 'super user',
  homePath: '/ai-butler/workbench',
  id: 'user-vben',
  passwordHash: 'scrypt$placeholder',
  realName: 'Vben',
  roles: ['super'],
  username: 'vben',
};

describe('UserRepository', () => {
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

  it('saves and finds a user by username without exposing a generic CRUD API', async () => {
    const repository = createDrizzleUserRepository(database);

    await repository.saveUser(sampleUser);
    await repository.replaceAccessCodes(sampleUser.id, [
      'AC_100100',
      'AC_100110',
    ]);

    await expect(repository.findUserByUsername('missing')).resolves.toBeUndefined();
    await expect(repository.findUserByUsername('vben')).resolves.toEqual(sampleUser);
    await expect(repository.findAccessCodesByUsername('vben')).resolves.toEqual([
      'AC_100100',
      'AC_100110',
    ]);
    await expect(repository.findAccessCodesByUsername('missing')).resolves.toEqual(
      [],
    );
  });

  it('rolls back user and access codes in one service-declared transaction', async () => {
    const repository = createDrizzleUserRepository(database);

    await expect(
      database.transaction(async (transaction) => {
        await repository.saveUser(
          { ...sampleUser, id: 'user-jack', username: 'jack', realName: 'Jack', roles: ['user'] },
          transaction,
        );
        await repository.replaceAccessCodes('user-jack', ['AC_1000001'], transaction);
        throw new Error('force rollback');
      }),
    ).rejects.toThrow('force rollback');

    await expect(repository.findUserByUsername('jack')).resolves.toBeUndefined();
    await expect(repository.findAccessCodesByUsername('jack')).resolves.toEqual([]);
  });
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：

```bash
pnpm exec vitest run --environment node apps/backend/src/infrastructure/database/user.repository.integration.test.ts
```

预期：FAIL，找不到 `createDrizzleUserRepository`。

- [ ] **步骤 3：编写最少实现代码**

创建 `apps/backend/src/modules/user/user.repository.ts`：

```ts
import { type DatabaseExecutor } from '../../infrastructure/database/client';

export interface UserRecord {
  avatar: string;
  description: string;
  homePath: string;
  id: string;
  passwordHash: string;
  realName: string;
  roles: string[];
  username: string;
}

export interface UserRepository {
  findAccessCodesByUsername(
    username: string,
    executor?: DatabaseExecutor,
  ): Promise<string[]>;
  findUserByUsername(
    username: string,
    executor?: DatabaseExecutor,
  ): Promise<UserRecord | undefined>;
  replaceAccessCodes(
    userId: string,
    codes: string[],
    executor?: DatabaseExecutor,
  ): Promise<void>;
  saveUser(user: UserRecord, executor?: DatabaseExecutor): Promise<void>;
}
```

创建 `apps/backend/src/infrastructure/database/user.repository.ts`：

```ts
import { eq } from 'drizzle-orm';

import {
  type UserRecord,
  type UserRepository,
} from '../../modules/user/user.repository';
import { type Database, type DatabaseExecutor } from './client';
import { accessCodes, users } from './schema';

export function createDrizzleUserRepository(database: Database): UserRepository {
  const withExecutor = (executor?: DatabaseExecutor) => executor ?? database;

  return {
    async findAccessCodesByUsername(username, executor) {
      const db = withExecutor(executor);
      const rows = await db
        .select({ codes: accessCodes.codes })
        .from(accessCodes)
        .innerJoin(users, eq(users.id, accessCodes.userId))
        .where(eq(users.username, username))
        .limit(1);
      return rows[0]?.codes ?? [];
    },

    async findUserByUsername(username, executor) {
      const db = withExecutor(executor);
      const rows = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);
      const row = rows[0];
      if (!row) {
        return undefined;
      }
      return {
        avatar: row.avatar,
        description: row.description,
        homePath: row.homePath,
        id: row.id,
        passwordHash: row.passwordHash,
        realName: row.realName,
        roles: row.roles ?? [],
        username: row.username,
      };
    },

    async replaceAccessCodes(userId, codes, executor) {
      const db = withExecutor(executor);
      await db
        .insert(accessCodes)
        .values({ codes, userId })
        .onConflictDoUpdate({
          set: { codes },
          target: accessCodes.userId,
        });
    },

    async saveUser(user, executor) {
      const db = withExecutor(executor);
      await db.insert(users).values({
        avatar: user.avatar,
        description: user.description,
        homePath: user.homePath,
        id: user.id,
        passwordHash: user.passwordHash,
        realName: user.realName,
        roles: user.roles,
        username: user.username,
      });
    },
  };
}
```

创建 `apps/backend/src/modules/user/user.repository.fake.ts`：

```ts
import { type UserRecord, type UserRepository } from './user.repository';

export function createFakeUserRepository(
  seed: Array<{ codes?: string[]; user: UserRecord }> = [],
): UserRepository {
  const users = new Map(seed.map((item) => [item.user.username, { ...item.user }]));
  const codesByUserId = new Map(
    seed.map((item) => [item.user.id, [...(item.codes ?? [])]]),
  );

  return {
    async findAccessCodesByUsername(username) {
      const user = users.get(username);
      return user ? [...(codesByUserId.get(user.id) ?? [])] : [];
    },
    async findUserByUsername(username) {
      const user = users.get(username);
      return user ? { ...user, roles: [...user.roles] } : undefined;
    },
    async replaceAccessCodes(userId, codes) {
      codesByUserId.set(userId, [...codes]);
    },
    async saveUser(user) {
      users.set(user.username, { ...user, roles: [...user.roles] });
    },
  };
}
```

禁止创建 `BaseRepository` / `CrudRepository`。`modules/**` 不要 import `drizzle-orm` 或 `postgres`。

- [ ] **步骤 4：运行测试验证通过**

运行：

```bash
pnpm exec vitest run --environment node apps/backend/src/infrastructure/database/user.repository.integration.test.ts
pnpm --filter @ai-butler/backend check:architecture
pnpm --filter @ai-butler/backend typecheck
```

预期：PASS；dependency-cruiser 不报告 `modules` 引用 `drizzle-orm`。

- [ ] **步骤 5：Commit**

```bash
git add apps/backend/src/modules/user apps/backend/src/infrastructure/database
git commit -m "$(cat <<'EOF'
feat: 增加用户仓储窄接口

EOF
)"
```

---

### 任务 5：AuthService 单元测试（Fake Repository）

**文件：**
- 创建：`apps/backend/src/modules/auth/password.ts`
- 创建：`apps/backend/src/modules/auth/token.ts`
- 创建：`apps/backend/src/modules/auth/auth-errors.ts`
- 创建：`apps/backend/src/modules/auth/auth.service.ts`
- 创建：`apps/backend/src/modules/auth/auth.service.test.ts`
- 创建：`apps/backend/src/modules/user/user.fixture.ts`

- [ ] **步骤 1：编写失败的 AuthService 测试**

创建 `apps/backend/src/modules/auth/auth.service.test.ts`：

```ts
import { beforeAll, describe, expect, it } from 'vitest';

import { createFakeUserRepository } from '../user/user.repository.fake';
import { createAuthService } from './auth.service';
import { invalidCredentials } from './auth-errors';
import { hashPassword } from './password';
import { verifyAccessToken, verifyRefreshToken } from './token';

const accessSecret = 'A'.repeat(32);
const refreshSecret = 'B'.repeat(32);

describe('AuthService', () => {
  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await hashPassword('123456');
  });

  function createService() {
    const userRepository = createFakeUserRepository([
      {
        codes: ['AC_100100', 'AC_100110'],
        user: {
          avatar: '',
          description: '',
          homePath: '/ai-butler/workbench',
          id: 'user-vben',
          passwordHash,
          realName: 'Vben',
          roles: ['super'],
          username: 'vben',
        },
      },
    ]);

    return createAuthService({
      jwtAccessSecret: accessSecret,
      jwtRefreshSecret: refreshSecret,
      userRepository,
    });
  }

  it('logs in with matching credentials and issues access plus refresh tokens', async () => {
    const service = createService();
    const result = await service.login({ password: '123456', username: 'vben' });

    expect(result.user.username).toBe('vben');
    expect(result.user).not.toHaveProperty('password');
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(verifyAccessToken(result.accessToken, accessSecret)?.username).toBe(
      'vben',
    );
    expect(verifyRefreshToken(result.refreshToken, refreshSecret)?.username).toBe(
      'vben',
    );
    expect(
      verifyAccessToken(result.accessToken, refreshSecret),
    ).toBeUndefined();
  });

  it('uses the same error for unknown users and bad passwords', async () => {
    const service = createService();
    const missing = service.login({ password: '123456', username: 'ghost' });
    const mismatch = service.login({ password: 'wrong', username: 'vben' });

    await expect(missing).rejects.toMatchObject(invalidCredentials());
    await expect(mismatch).rejects.toMatchObject(invalidCredentials());
    await expect(missing).rejects.toThrow('Username or password is incorrect.');
    await expect(mismatch).rejects.toThrow('Username or password is incorrect.');
  });

  it('does not reveal whether a username exists via error properties', async () => {
    const service = createService();

    try {
      await service.login({ password: '123456', username: 'ghost' });
      throw new Error('expected failure');
    } catch (error) {
      const text = JSON.stringify(error);
      expect(text).not.toMatch(/not found|does not exist|unknown user/i);
      expect(text).not.toContain('passwordHash');
    }
  });
});
```

`toMatchObject(invalidCredentials())` 要求 `invalidCredentials()` 返回 `AppError` 实例，`statusCode === 403`，`code === 1103`，`message` 固定。

- [ ] **步骤 2：运行测试验证失败**

运行：

```bash
pnpm exec vitest run --environment node apps/backend/src/modules/auth/auth.service.test.ts
```

预期：FAIL，`./auth.service` 不存在。

- [ ] **步骤 3：编写最少实现代码**

创建 `apps/backend/src/modules/auth/auth-errors.ts`：

```ts
import { AppError } from '../../framework/core/app-error';

export function unauthorized(): AppError {
  return new AppError({
    code: 1101,
    message: 'Unauthorized Exception',
    statusCode: 401,
  });
}

export function invalidCredentials(): AppError {
  return new AppError({
    code: 1103,
    message: 'Username or password is incorrect.',
    statusCode: 403,
  });
}

export function forbidden(message = 'Forbidden Exception'): AppError {
  return new AppError({
    code: 1104,
    message,
    statusCode: 403,
  });
}

export function refreshForbidden(): AppError {
  return new AppError({
    code: 1103,
    message: 'Forbidden Exception',
    statusCode: 403,
  });
}
```

创建 `apps/backend/src/modules/auth/password.ts`：

```ts
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;
const N = 16_384;
const PREFIX = 'scrypt';
const R = 8;
const P = 1;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scryptAsync(password, salt, KEY_LENGTH, {
    N,
    p: P,
    r: R,
  })) as Buffer;
  return `${PREFIX}$${N}$${R}$${P}$${salt.toString('hex')}$${derived.toString('hex')}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const parts = storedHash.split('$');
  if (parts.length !== 6 || parts[0] !== PREFIX) {
    return false;
  }
  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const salt = Buffer.from(parts[4] ?? '', 'hex');
  const expected = Buffer.from(parts[5] ?? '', 'hex');
  if (!salt.length || expected.length !== KEY_LENGTH) {
    return false;
  }
  const actual = (await scryptAsync(password, salt, KEY_LENGTH, {
    N: n,
    p,
    r,
  })) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
```

创建 `apps/backend/src/modules/auth/token.ts`：

```ts
import jwt from 'jsonwebtoken';

export interface TokenPrincipal {
  roles: string[];
  userId: string;
  username: string;
}

interface AccessClaims extends jwt.JwtPayload {
  roles: string[];
  tokenUse: 'access';
  username: string;
}

interface RefreshClaims extends jwt.JwtPayload {
  tokenUse: 'refresh';
  username: string;
}

export function signAccessToken(
  principal: TokenPrincipal,
  secret: string,
): string {
  return jwt.sign(
    {
      roles: principal.roles,
      sub: principal.userId,
      tokenUse: 'access',
      username: principal.username,
    },
    secret,
    { expiresIn: '7d' },
  );
}

export function signRefreshToken(
  principal: TokenPrincipal,
  secret: string,
): string {
  return jwt.sign(
    {
      sub: principal.userId,
      tokenUse: 'refresh',
      username: principal.username,
    },
    secret,
    { expiresIn: '30d' },
  );
}

export function verifyAccessToken(
  token: string,
  secret: string,
): TokenPrincipal | undefined {
  try {
    const decoded = jwt.verify(token, secret) as AccessClaims;
    if (decoded.tokenUse !== 'access' || !decoded.sub || !decoded.username) {
      return undefined;
    }
    return {
      roles: decoded.roles ?? [],
      userId: decoded.sub,
      username: decoded.username,
    };
  } catch {
    return undefined;
  }
}

export function verifyRefreshToken(
  token: string,
  secret: string,
): Pick<TokenPrincipal, 'userId' | 'username'> | undefined {
  try {
    const decoded = jwt.verify(token, secret) as RefreshClaims;
    if (decoded.tokenUse !== 'refresh' || !decoded.sub || !decoded.username) {
      return undefined;
    }
    return { userId: decoded.sub, username: decoded.username };
  } catch {
    return undefined;
  }
}
```

创建 `apps/backend/src/modules/auth/auth.service.ts`：

```ts
import { type UserRecord, type UserRepository } from '../user/user.repository';
import { invalidCredentials, refreshForbidden } from './auth-errors';
import { hashPassword, verifyPassword } from './password';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  type TokenPrincipal,
} from './token';

export interface PublicUser {
  avatar: string;
  desc: string;
  homePath: string;
  id: string;
  realName: string;
  roles: string[];
  userId: string;
  username: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
}

export interface AuthService {
  getAccessCodes(username: string): Promise<string[]>;
  login(input: { password: string; username: string }): Promise<LoginResult>;
  refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }>;
}

let dummyHashPromise: Promise<string> | undefined;

function dummyHash(): Promise<string> {
  dummyHashPromise ??= hashPassword('dummy-password-not-used');
  return dummyHashPromise;
}

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    avatar: user.avatar,
    desc: user.description,
    homePath: user.homePath,
    id: user.id,
    realName: user.realName,
    roles: [...user.roles],
    userId: user.id,
    username: user.username,
  };
}

export function createAuthService(options: {
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  userRepository: UserRepository;
}): AuthService {
  const issue = (user: UserRecord) => {
    const principal: TokenPrincipal = {
      roles: user.roles,
      userId: user.id,
      username: user.username,
    };
    return {
      accessToken: signAccessToken(principal, options.jwtAccessSecret),
      refreshToken: signRefreshToken(principal, options.jwtRefreshSecret),
      user: toPublicUser(user),
    };
  };

  return {
    getAccessCodes(username) {
      return options.userRepository.findAccessCodesByUsername(username);
    },

    async login(input) {
      const user = await options.userRepository.findUserByUsername(input.username);
      const hash = user?.passwordHash ?? (await dummyHash());
      const matched = await verifyPassword(input.password, hash);
      if (!user || !matched) {
        throw invalidCredentials();
      }
      return issue(user);
    },

    async refresh(refreshToken) {
      const claims = verifyRefreshToken(refreshToken, options.jwtRefreshSecret);
      if (!claims) {
        throw refreshForbidden();
      }
      const user = await options.userRepository.findUserByUsername(claims.username);
      if (!user) {
        throw refreshForbidden();
      }
      const tokens = issue(user);
      return {
        accessToken: tokens.accessToken,
        refreshToken,
      };
    },
  };
}
```

刷新成功时**不轮换** refresh token，与 mock 把原 cookie 写回一致。

创建 `apps/backend/src/modules/user/user.fixture.ts`：

```ts
import { hashPassword } from '../auth/password';
import { type UserRecord } from './user.repository';

export interface SeedUser {
  codes: string[];
  password: string;
  user: Omit<UserRecord, 'passwordHash'>;
}

export const SEED_USERS: SeedUser[] = [
  {
    codes: ['AC_100100', 'AC_100110', 'AC_100120', 'AC_100010'],
    password: '123456',
    user: {
      avatar: '',
      description: '',
      homePath: '/ai-butler/workbench',
      id: 'user-vben',
      realName: 'Vben',
      roles: ['super'],
      username: 'vben',
    },
  },
  {
    codes: ['AC_100010', 'AC_100020', 'AC_100030'],
    password: '123456',
    user: {
      avatar: '',
      description: '',
      homePath: '/ai-butler/workbench',
      id: 'user-admin',
      realName: 'Admin',
      roles: ['admin'],
      username: 'admin',
    },
  },
  {
    codes: ['AC_1000001', 'AC_1000002'],
    password: '123456',
    user: {
      avatar: '',
      description: '',
      homePath: '/ai-butler/workbench',
      id: 'user-jack',
      realName: 'Jack',
      roles: ['user'],
      username: 'jack',
    },
  },
];

export async function buildSeedRecords() {
  return Promise.all(
    SEED_USERS.map(async (item) => ({
      codes: item.codes,
      user: {
        ...item.user,
        passwordHash: await hashPassword(item.password),
      },
    })),
  );
}
```

`auth.service.ts` 禁止 import `fastify`。

- [ ] **步骤 4：运行测试验证通过**

运行：

```bash
pnpm exec vitest run --environment node apps/backend/src/modules/auth/auth.service.test.ts
pnpm --filter @ai-butler/backend typecheck
```

预期：PASS；未知用户与错误密码抛出同一 `AppError`。

- [ ] **步骤 5：Commit**

```bash
git add apps/backend/src/modules/auth apps/backend/src/modules/user/user.fixture.ts
git commit -m "$(cat <<'EOF'
feat: 实现不可区分失败的登录服务

EOF
)"
```

---

### 任务 6：Auth HTTP——login / refresh / logout / codes 与 refresh 原始字符串

**文件：**
- 修改：`pnpm-workspace.yaml`
- 修改：`apps/backend/package.json`
- 修改：`apps/backend/src/app/create-app.ts`
- 修改：`apps/backend/src/app/dependencies.ts`
- 修改：`apps/backend/src/app/register-modules.ts`
- 修改：`apps/backend/src/framework/core/request-context.ts`
- 创建：`apps/backend/src/modules/auth/auth.schema.ts`
- 创建：`apps/backend/src/modules/auth/jwt-authentication.plugin.ts`
- 创建：`apps/backend/src/modules/auth/authorization.ts`
- 创建：`apps/backend/src/modules/auth/auth.plugin.ts`
- 创建：`apps/backend/src/modules/auth/auth.http.test.ts`

- [ ] **步骤 1：编写失败的 HTTP 契约测试**

创建 `apps/backend/src/modules/auth/auth.http.test.ts`：

```ts
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { createTestApp } from '../../app/create-test-app';
import { testConfig } from '../../framework/testing/test-config';
import { buildSeedRecords } from '../user/user.fixture';
import { createFakeUserRepository } from '../user/user.repository.fake';

function cookieHeader(response: { cookies: Array<{ name: string; value: string }> }) {
  const token = response.cookies.find((item) => item.name === 'jwt');
  expect(token).toBeDefined();
  return { jwt: token!.value };
}

describe('auth HTTP', () => {
  let app: Awaited<ReturnType<typeof createTestApp>> | undefined;
  let seeds: Awaited<ReturnType<typeof buildSeedRecords>>;

  beforeAll(async () => {
    seeds = await buildSeedRecords();
  });

  afterEach(async () => {
    await app?.close();
  });

  async function start() {
    app = await createTestApp({
      config: testConfig(),
      dependencies: {
        userRepository: createFakeUserRepository(seeds),
      },
    });
    return app;
  }

  it('logs in and sets a jwt refresh cookie', async () => {
    const server = await start();
    const response = await server.inject({
      method: 'POST',
      payload: { password: '123456', username: 'vben' },
      url: '/auth/login',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.code).toBe(0);
    expect(body.data.accessToken.split('.')).toHaveLength(3);
    expect(body.data.userId).toBe('user-vben');
    expect(body.data.id).toBe('user-vben');
    expect(body.data.username).toBe('vben');
    expect(body.data.realName).toBe('Vben');
    expect(body.data.roles).toEqual(['super']);
    expect(body.data.homePath).toBe('/ai-butler/workbench');
    expect(body.data).not.toHaveProperty('password');
    expect(body.data).not.toHaveProperty('passwordHash');

    const cookie = response.cookies.find((item) => item.name === 'jwt');
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe('None');
    expect(cookie?.secure).toBe(true);
    expect(cookie?.maxAge).toBe(86_400);
  });

  it('does not distinguish missing users from bad passwords', async () => {
    const server = await start();
    const missing = await server.inject({
      method: 'POST',
      payload: { password: '123456', username: 'ghost' },
      url: '/auth/login',
    });
    const mismatch = await server.inject({
      method: 'POST',
      payload: { password: 'wrong', username: 'vben' },
      url: '/auth/login',
    });

    for (const response of [missing, mismatch]) {
      expect(response.statusCode).toBe(403);
      expect(response.json()).toMatchObject({
        code: 1103,
        data: null,
        message: 'Username or password is incorrect.',
      });
    }
  });

  it('returns the raw access token string on refresh', async () => {
    const server = await start();
    const login = await server.inject({
      method: 'POST',
      payload: { password: '123456', username: 'vben' },
      url: '/auth/login',
    });
    const refresh = await server.inject({
      cookies: cookieHeader(login),
      method: 'POST',
      url: '/auth/refresh',
    });

    expect(refresh.statusCode).toBe(200);
    expect(refresh.body.trimStart().startsWith('{')).toBe(false);
    expect(refresh.body).not.toMatch(/"code"\s*:/);
    const token = refresh.body.startsWith('"')
      ? JSON.parse(refresh.body)
      : refresh.body;
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
    expect(token).not.toBe(login.json().data.accessToken);
  });

  it('rejects refresh without a cookie with HTTP 403', async () => {
    const server = await start();
    const response = await server.inject({ method: 'POST', url: '/auth/refresh' });
    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      code: 1103,
      data: null,
      message: 'Forbidden Exception',
    });
  });

  it('clears the jwt cookie on logout', async () => {
    const server = await start();
    const login = await server.inject({
      method: 'POST',
      payload: { password: '123456', username: 'vben' },
      url: '/auth/login',
    });
    const response = await server.inject({
      cookies: cookieHeader(login),
      method: 'POST',
      url: '/auth/logout',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      code: 0,
      data: '',
      message: 'ok',
    });
    const cleared = response.cookies.find((item) => item.name === 'jwt');
    expect(cleared?.maxAge === 0 || cleared?.expires?.getTime() === 0 || !cleared?.value).toBe(
      true,
    );
  });

  it('returns access codes for a bearer token', async () => {
    const server = await start();
    const login = await server.inject({
      method: 'POST',
      payload: { password: '123456', username: 'admin' },
      url: '/auth/login',
    });
    const response = await server.inject({
      headers: { authorization: `Bearer ${login.json().data.accessToken}` },
      method: 'GET',
      url: '/auth/codes',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      code: 0,
      data: ['AC_100010', 'AC_100020', 'AC_100030'],
      message: 'ok',
    });
  });

  it('rejects codes without a bearer token', async () => {
    const server = await start();
    const response = await server.inject({ method: 'GET', url: '/auth/codes' });
    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      code: 1101,
      message: 'Unauthorized Exception',
    });
  });
});
```

- [ ] **步骤 2：安装 cookie 依赖并验证测试失败**

在 `pnpm-workspace.yaml` 的 `catalog:` 中加入：

```yaml
  '@fastify/cookie': ^11.0.2
```

在 `apps/backend/package.json` 的 `dependencies` 加入 `"@fastify/cookie": "catalog:"` 与 `"jsonwebtoken": "catalog:"`，在 `devDependencies` 加入 `"@types/jsonwebtoken": "catalog:"`。

运行：

```bash
pnpm install
pnpm exec vitest run --environment node apps/backend/src/modules/auth/auth.http.test.ts
```

预期：FAIL，`/auth/login` 为 404。

- [ ] **步骤 3：编写最少实现代码**

扩展 `RequestContext`：

```ts
export interface Principal {
  roles: string[];
  userId: string;
  username: string;
}

export interface RequestContext {
  principal: Principal | undefined;
  requestId: string;
  traceId: string | undefined;
}

export function setPrincipal(principal: Principal): void {
  getRequestContext().principal = principal;
}
```

在 request-context 插件创建上下文时设 `principal: undefined`。

创建 `apps/backend/src/modules/auth/auth.schema.ts`：

```ts
import { Type } from 'typebox';

import { successEnvelopeSchema } from '../../framework/http/envelope';

export const LoginBodySchema = Type.Object({
  password: Type.String({ minLength: 1 }),
  username: Type.String({ minLength: 1 }),
});

export const PublicUserSchema = Type.Object({
  avatar: Type.String(),
  desc: Type.String(),
  homePath: Type.String(),
  id: Type.String(),
  realName: Type.String(),
  roles: Type.Array(Type.String()),
  userId: Type.String(),
  username: Type.String(),
});

export const LoginResultSchema = Type.Intersect([
  PublicUserSchema,
  Type.Object({ accessToken: Type.String() }),
]);

export const LoginResponseSchema = successEnvelopeSchema(LoginResultSchema);
export const LogoutResponseSchema = successEnvelopeSchema(Type.Literal(''));
export const CodesResponseSchema = successEnvelopeSchema(Type.Array(Type.String()));
```

创建 `apps/backend/src/modules/auth/authorization.ts`：

```ts
import { type preHandlerAsyncHookHandler } from 'fastify';

import { getRequestContext } from '../../framework/core/request-context';
import { forbidden, unauthorized } from './auth-errors';

export function requireAuthenticated(): preHandlerAsyncHookHandler {
  return async () => {
    if (!getRequestContext().principal) {
      throw unauthorized();
    }
  };
}

export function requireRole(role: string): preHandlerAsyncHookHandler {
  return async () => {
    const { principal } = getRequestContext();
    if (!principal) {
      throw unauthorized();
    }
    if (!principal.roles.includes(role)) {
      throw forbidden();
    }
  };
}
```

创建 `apps/backend/src/modules/auth/jwt-authentication.plugin.ts`：

```ts
import { type FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

import { type AppConfig } from '../../framework/config/schema';
import { setPrincipal } from '../../framework/core/request-context';
import { unauthorized } from './auth-errors';
import { verifyAccessToken } from './token';

export const jwtAuthenticationPlugin: FastifyPluginAsync<{
  config: AppConfig;
}> = async (app, options) => {
  app.addHook('onRequest', async (request) => {
    const header = request.headers.authorization;
    if (!header) {
      return;
    }
    if (!header.startsWith('Bearer ')) {
      throw unauthorized();
    }
    const token = header.slice('Bearer '.length).trim();
    const principal = verifyAccessToken(token, options.config.jwtAccessSecret);
    if (!principal) {
      throw unauthorized();
    }
    setPrincipal(principal);
  });
};

export default fp(jwtAuthenticationPlugin, {
  fastify: '5.x',
  name: 'jwt-authentication',
});
```

Cookie 常量与 auth 插件：

```ts
import cookie from '@fastify/cookie';
import { type FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import { success } from '../../framework/http/envelope';
import { getRequestContext } from '../../framework/core/request-context';
import { type AuthService } from './auth.service';
import {
  CodesResponseSchema,
  LoginBodySchema,
  LoginResponseSchema,
  LogoutResponseSchema,
} from './auth.schema';
import { requireAuthenticated } from './authorization';
import { refreshForbidden } from './auth-errors';

export const REFRESH_COOKIE_NAME = 'jwt';

export const refreshCookieOptions = {
  httpOnly: true,
  maxAge: 86_400,
  path: '/',
  sameSite: 'none' as const,
  secure: true,
};

interface AuthPluginOptions {
  service: AuthService;
}

export const authPlugin: FastifyPluginAsyncTypebox<AuthPluginOptions> = async (
  app,
  options,
) => {
  app.post(
    '/auth/login',
    { schema: { body: LoginBodySchema, response: { 200: LoginResponseSchema } } },
    async (request, reply) => {
      const result = await options.service.login(request.body);
      reply.setCookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions);
      return success(
        { ...result.user, accessToken: result.accessToken },
        'ok',
      );
    },
  );

  app.post('/auth/refresh', async (request, reply) => {
    const token = request.cookies[REFRESH_COOKIE_NAME];
    reply.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions);
    if (!token) {
      throw refreshForbidden();
    }
    const result = await options.service.refresh(token);
    reply.setCookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions);
    return reply
      .status(200)
      .type('text/plain; charset=utf-8')
      .send(result.accessToken);
  });

  app.post(
    '/auth/logout',
    { schema: { response: { 200: LogoutResponseSchema } } },
    async (_request, reply) => {
      reply.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions);
      return success('', 'ok');
    },
  );

  app.get(
    '/auth/codes',
    {
      preHandler: [requireAuthenticated()],
      schema: { response: { 200: CodesResponseSchema } },
    },
    async () => {
      const { principal } = getRequestContext();
      const codes = await options.service.getAccessCodes(principal!.username);
      return success(codes, 'ok');
    },
  );
};
```

`/auth/refresh` **不要**套 `successEnvelopeSchema`。`auth.plugin.ts` 不要 import `jsonwebtoken`，不要调用 `jwt.verify`。

在 `createApp` 注册框架插件之后、业务模块之前：

```ts
await app.register(cookie);
await app.register(jwtAuthenticationPlugin, { config });
```

`createDependencies` 增加：

```ts
export interface AppDependencies {
  authService: AuthService;
  probeService: ProbeService;
  userRepository: UserRepository;
}

export function createDependencies(
  overrides: Partial<AppDependencies>,
  context: { config: AppConfig; database: Database | undefined },
): AppDependencies {
  const userRepository =
    overrides.userRepository ??
    (context.database
      ? createDrizzleUserRepository(context.database)
      : createFakeUserRepository([]));

  return {
    authService:
      overrides.authService ??
      createAuthService({
        jwtAccessSecret: context.config.jwtAccessSecret,
        jwtRefreshSecret: context.config.jwtRefreshSecret,
        userRepository,
      }),
    probeService: overrides.probeService ?? createProbeService(),
    userRepository,
  };
}
```

`registerModules`：

```ts
export async function registerModules(
  app: AppInstance,
  dependencies: AppDependencies,
): Promise<void> {
  await app.register(probePlugin, { service: dependencies.probeService });
  await app.register(authPlugin, { service: dependencies.authService });
}
```

- [ ] **步骤 4：运行测试验证通过**

运行：

```bash
pnpm exec vitest run --environment node apps/backend/src/modules/auth/auth.http.test.ts apps/backend/src/modules/auth/auth.service.test.ts
pnpm --filter @ai-butler/backend test
pnpm --filter @ai-butler/backend typecheck
```

预期：全部 PASS。refresh 成功响应不是 `{ code, data }`。若 `cookie.maxAge` 在 inject 中单位表现与 86400 不一致，先核对本机 `@fastify/cookie` 文档：本计划按 **秒** 与 mock/`h3` 对齐；测试断言以 Set-Cookie 里的 `Max-Age=86400` 为准，必要时改为：

```ts
expect(response.headers['set-cookie']).toEqual(
  expect.arrayContaining([expect.stringMatching(/Max-Age=86400/i)]),
);
```

- [ ] **步骤 5：Commit**

```bash
git add pnpm-workspace.yaml pnpm-lock.yaml apps/backend/package.json apps/backend/src
git commit -m "$(cat <<'EOF'
feat: 对齐登录刷新退出与权限码 HTTP 契约

EOF
)"
```

---

### 任务 7：JWT 认证插件与 GET /user/info

**文件：**
- 创建：`apps/backend/src/modules/user/user.service.ts`
- 创建：`apps/backend/src/modules/user/user.schema.ts`
- 创建：`apps/backend/src/modules/user/user.plugin.ts`
- 修改：`apps/backend/src/app/dependencies.ts`
- 修改：`apps/backend/src/app/register-modules.ts`
- 创建：`apps/backend/src/modules/user/user.http.test.ts`

- [ ] **步骤 1：编写失败的用户信息测试**

创建 `apps/backend/src/modules/user/user.http.test.ts`：

```ts
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { createTestApp } from '../../app/create-test-app';
import { testConfig } from '../../framework/testing/test-config';
import { buildSeedRecords } from './user.fixture';
import { createFakeUserRepository } from './user.repository.fake';

describe('GET /user/info', () => {
  let app: Awaited<ReturnType<typeof createTestApp>> | undefined;
  let seeds: Awaited<ReturnType<typeof buildSeedRecords>>;

  beforeAll(async () => {
    seeds = await buildSeedRecords();
  });

  afterEach(async () => {
    await app?.close();
  });

  async function start() {
    app = await createTestApp({
      config: testConfig(),
      dependencies: { userRepository: createFakeUserRepository(seeds) },
    });
    return app;
  }

  it('returns the frontend UserInfo shape and never returns a password', async () => {
    const server = await start();
    const login = await server.inject({
      method: 'POST',
      payload: { password: '123456', username: 'vben' },
      url: '/auth/login',
    });

    const response = await server.inject({
      headers: { authorization: `Bearer ${login.json().data.accessToken}` },
      method: 'GET',
      url: '/user/info',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      code: 0,
      data: {
        avatar: '',
        desc: '',
        homePath: '/ai-butler/workbench',
        realName: 'Vben',
        roles: ['super'],
        userId: 'user-vben',
        username: 'vben',
      },
      message: 'ok',
    });
    expect(response.body).not.toContain('password');
    expect(response.body).not.toContain('passwordHash');
    expect(response.body).not.toContain('scrypt$');
  });

  it('returns 401 without a bearer token', async () => {
    const server = await start();
    const response = await server.inject({ method: 'GET', url: '/user/info' });
    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      code: 1101,
      message: 'Unauthorized Exception',
    });
  });

  it('returns 401 for a malformed bearer token', async () => {
    const server = await start();
    const response = await server.inject({
      headers: { authorization: 'Bearer not-a-jwt' },
      method: 'GET',
      url: '/user/info',
    });
    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      code: 1101,
      message: 'Unauthorized Exception',
    });
  });

  it('keeps token parsing out of the user controller', () => {
    const source = readFileSync(
      fileURLToPath(new URL('./user.plugin.ts', import.meta.url)),
      'utf8',
    );
    expect(source).not.toMatch(/jsonwebtoken/);
    expect(source).not.toMatch(/jwt\.verify/);
    expect(source).not.toMatch(/verifyAccessToken/);
  });
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：

```bash
pnpm exec vitest run --environment node apps/backend/src/modules/user/user.http.test.ts
```

预期：FAIL，`/user/info` 返回 404。

- [ ] **步骤 3：编写最少实现代码**

创建 `apps/backend/src/modules/user/user.service.ts`：

```ts
import { unauthorized } from '../auth/auth-errors';
import { toPublicUser, type PublicUser } from '../auth/auth.service';
import { type UserRepository } from './user.repository';

export interface UserService {
  getPublicUser(username: string): Promise<PublicUser>;
}

export function createUserService(userRepository: UserRepository): UserService {
  return {
    async getPublicUser(username) {
      const user = await userRepository.findUserByUsername(username);
      if (!user) {
        throw unauthorized();
      }
      return toPublicUser(user);
    },
  };
}
```

创建 `apps/backend/src/modules/user/user.schema.ts`：

```ts
import { Type } from 'typebox';

import { successEnvelopeSchema } from '../../framework/http/envelope';

export const UserInfoSchema = Type.Object({
  avatar: Type.String(),
  desc: Type.String(),
  homePath: Type.String(),
  realName: Type.String(),
  roles: Type.Array(Type.String()),
  userId: Type.String(),
  username: Type.String(),
});

export const UserInfoResponseSchema = successEnvelopeSchema(UserInfoSchema);
```

登录 `data` 可以多 `id` / `accessToken`；`/user/info` 的 `data` **不要**再输出 `id` 或 `token`，只保留前端 `UserInfo` / `BasicUserInfo` 字段。

创建 `apps/backend/src/modules/user/user.plugin.ts`：

```ts
import { type FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import { getRequestContext } from '../../framework/core/request-context';
import { success } from '../../framework/http/envelope';
import { requireAuthenticated } from '../auth/authorization';
import { UserInfoResponseSchema } from './user.schema';
import { type UserService } from './user.service';

interface UserPluginOptions {
  service: UserService;
}

export const userPlugin: FastifyPluginAsyncTypebox<UserPluginOptions> = async (
  app,
  options,
) => {
  app.get(
    '/user/info',
    {
      preHandler: [requireAuthenticated()],
      schema: { response: { 200: UserInfoResponseSchema } },
    },
    async () => {
      const { principal } = getRequestContext();
      const user = await options.service.getPublicUser(principal!.username);
      return success(
        {
          avatar: user.avatar,
          desc: user.desc,
          homePath: user.homePath,
          realName: user.realName,
          roles: user.roles,
          userId: user.userId,
          username: user.username,
        },
        'ok',
      );
    },
  );
};
```

该文件禁止 import `jsonwebtoken`、`verifyAccessToken`、`request.headers.authorization`。身份只来自 `getRequestContext().principal`。

扩展 `AppDependencies`：

```ts
export interface AppDependencies {
  authService: AuthService;
  probeService: ProbeService;
  userRepository: UserRepository;
  userService: UserService;
}

export function createDependencies(
  overrides: Partial<AppDependencies>,
  context: { config: AppConfig; database: Database | undefined },
): AppDependencies {
  const userRepository =
    overrides.userRepository ??
    (context.database
      ? createDrizzleUserRepository(context.database)
      : createFakeUserRepository([]));
  const authService =
    overrides.authService ??
    createAuthService({
      jwtAccessSecret: context.config.jwtAccessSecret,
      jwtRefreshSecret: context.config.jwtRefreshSecret,
      userRepository,
    });

  return {
    authService,
    probeService: overrides.probeService ?? createProbeService(),
    userRepository,
    userService: overrides.userService ?? createUserService(userRepository),
  };
}
```

`registerModules`：

```ts
export async function registerModules(
  app: AppInstance,
  dependencies: AppDependencies,
): Promise<void> {
  await app.register(probePlugin, { service: dependencies.probeService });
  await app.register(authPlugin, { service: dependencies.authService });
  await app.register(userPlugin, { service: dependencies.userService });
}
```

JWT 插件仍只负责解析 Bearer 并 `setPrincipal`；本任务不要把查库放进认证插件。

- [ ] **步骤 4：运行测试验证通过**

运行：

```bash
pnpm exec vitest run --environment node apps/backend/src/modules/user/user.http.test.ts apps/backend/src/modules/auth/auth.http.test.ts
pnpm --filter @ai-butler/backend typecheck
```

预期：PASS；`/user/info` 正文不含 `password` / `passwordHash` / `scrypt$`。

- [ ] **步骤 5：Commit**

```bash
git add apps/backend/src
git commit -m "$(cat <<'EOF'
feat: 增加 JWT 主体与用户信息接口

EOF
)"
```

---

### 任务 8：Authorization policy——401 / 403 与 Controller 不解析 Token

**文件：**
- 修改：`apps/backend/src/app/create-app.ts`（若任务 2 尚未接入 `extraPlugins`）
- 创建：`apps/backend/src/modules/auth/authorization.test.ts`
- 创建：`apps/backend/src/modules/auth/authorization.http.test.ts`

- [ ] **步骤 1：编写失败的 policy 单元测试与 HTTP 测试**

创建 `apps/backend/src/modules/auth/authorization.test.ts`：

```ts
import { describe, expect, it } from 'vitest';

import {
  runWithRequestContext,
  type RequestContext,
} from '../../framework/core/request-context';
import { requireAuthenticated, requireRole } from './authorization';
import { forbidden, unauthorized } from './auth-errors';

function context(principal: RequestContext['principal']): RequestContext {
  return { principal, requestId: 'req-1', traceId: undefined };
}

describe('authorization policies', () => {
  it('requireAuthenticated throws 401 when principal is missing', async () => {
    const hook = requireAuthenticated();
    await expect(
      runWithRequestContext(context(undefined), () => hook({} as never, {} as never)),
    ).rejects.toMatchObject(unauthorized());
  });

  it('requireRole throws 401 when unauthenticated and 403 when the role is missing', async () => {
    const hook = requireRole('admin');

    await expect(
      runWithRequestContext(context(undefined), () => hook({} as never, {} as never)),
    ).rejects.toMatchObject(unauthorized());

    await expect(
      runWithRequestContext(
        context({ roles: ['user'], userId: 'user-jack', username: 'jack' }),
        () => hook({} as never, {} as never),
      ),
    ).rejects.toMatchObject(forbidden());
  });

  it('requireRole allows an exact matching role', async () => {
    const hook = requireRole('admin');
    await expect(
      runWithRequestContext(
        context({ roles: ['admin'], userId: 'user-admin', username: 'admin' }),
        () => hook({} as never, {} as never),
      ),
    ).resolves.toBeUndefined();
  });
});
```

若 Fastify `preHandlerAsyncHookHandler` 需要 3 个参数，把调用改成 `hook({} as never, {} as never, () => undefined)`，以类型通过为准，行为断言不变。

创建 `apps/backend/src/modules/auth/authorization.http.test.ts`：

```ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { type FastifyPluginAsync } from 'fastify';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { createTestApp } from '../../app/create-test-app';
import { testConfig } from '../../framework/testing/test-config';
import { success } from '../../framework/http/envelope';
import { buildSeedRecords } from '../user/user.fixture';
import { createFakeUserRepository } from '../user/user.repository.fake';
import { requireRole } from './authorization';

const adminOnlyPlugin: FastifyPluginAsync = async (app) => {
  app.get(
    '/_test/admin',
    { preHandler: [requireRole('admin')] },
    async () => success({ ok: true }, 'ok'),
  );
};

describe('authorization HTTP', () => {
  let app: Awaited<ReturnType<typeof createTestApp>> | undefined;
  let seeds: Awaited<ReturnType<typeof buildSeedRecords>>;

  beforeAll(async () => {
    seeds = await buildSeedRecords();
  });

  afterEach(async () => {
    await app?.close();
  });

  async function start() {
    app = await createTestApp({
      config: testConfig(),
      dependencies: { userRepository: createFakeUserRepository(seeds) },
      extraPlugins: [adminOnlyPlugin],
    });
    return app;
  }

  it('returns 401 when unauthenticated', async () => {
    const server = await start();
    const response = await server.inject({ method: 'GET', url: '/_test/admin' });
    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      code: 1101,
      message: 'Unauthorized Exception',
    });
  });

  it('returns 403 when authenticated without the admin role', async () => {
    const server = await start();
    const login = await server.inject({
      method: 'POST',
      payload: { password: '123456', username: 'jack' },
      url: '/auth/login',
    });
    const response = await server.inject({
      headers: { authorization: `Bearer ${login.json().data.accessToken}` },
      method: 'GET',
      url: '/_test/admin',
    });
    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      code: 1104,
      message: 'Forbidden Exception',
    });
  });

  it('allows an admin principal', async () => {
    const server = await start();
    const login = await server.inject({
      method: 'POST',
      payload: { password: '123456', username: 'admin' },
      url: '/auth/login',
    });
    const response = await server.inject({
      headers: { authorization: `Bearer ${login.json().data.accessToken}` },
      method: 'GET',
      url: '/_test/admin',
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      code: 0,
      data: { ok: true },
      message: 'ok',
    });
  });

  it('does not parse tokens in HTTP controllers', () => {
    const authPlugin = readFileSync(
      fileURLToPath(new URL('./auth.plugin.ts', import.meta.url)),
      'utf8',
    );
    const userPlugin = readFileSync(
      fileURLToPath(new URL('../user/user.plugin.ts', import.meta.url)),
      'utf8',
    );
    const jwtPlugin = readFileSync(
      fileURLToPath(new URL('./jwt-authentication.plugin.ts', import.meta.url)),
      'utf8',
    );

    expect(authPlugin).not.toMatch(/jsonwebtoken/);
    expect(authPlugin).not.toMatch(/jwt\.verify/);
    expect(userPlugin).not.toMatch(/jsonwebtoken/);
    expect(userPlugin).not.toMatch(/jwt\.verify/);
    expect(jwtPlugin).toMatch(/verifyAccessToken/);
  });
});
```

`/_test/admin` 只存在于本测试的 `extraPlugins`，不要注册进生产 `registerModules`。

- [ ] **步骤 2：运行测试验证失败**

运行：

```bash
pnpm exec vitest run --environment node apps/backend/src/modules/auth/authorization.test.ts apps/backend/src/modules/auth/authorization.http.test.ts
```

预期：FAIL。若 `requireRole` 已存在但 `extraPlugins` 未接入 `createApp`，HTTP 用例会 404。

- [ ] **步骤 3：编写最少实现代码**

`requireAuthenticated` / `requireRole` 若任务 6 已实现，本步骤只把 `extraPlugins` 接到 `createApp`：在 `registerModules` 之后、`app.ready()` 之前循环 `options.extraPlugins`。不要把测试路由产品化。

确认错误映射：未认证必须是 HTTP 401 / code `1101`；已认证缺角色必须是 HTTP 403 / code `1104`。认证插件在无效 Bearer 时抛 `unauthorized()`，不要抛 `forbidden()`。

- [ ] **步骤 4：运行测试验证通过**

运行：

```bash
pnpm exec vitest run --environment node apps/backend/src/modules/auth/authorization.test.ts apps/backend/src/modules/auth/authorization.http.test.ts apps/backend/src/modules/user/user.http.test.ts
pnpm --filter @ai-butler/backend check:architecture
pnpm --filter @ai-butler/backend typecheck
```

预期：PASS；`*.service.ts` 仍不引用 `fastify`；`framework/**` 仍不引用 `modules/**`。

- [ ] **步骤 5：Commit**

```bash
git add apps/backend/src
git commit -m "$(cat <<'EOF'
feat: 分离认证与显式角色授权

EOF
)"
```

---

### 任务 9：前端契约回归套件 + ADR 0006 / ADR 0007

**文件：**
- 创建：`apps/backend/src/modules/auth/frontend-contract.http.test.ts`
- 创建：`apps/backend/src/infrastructure/database/auth-slice.integration.test.ts`
- 创建：`apps/backend/docs/adr/0006-refresh-token-raw-string.md`
- 创建：`apps/backend/docs/adr/0007-jwt-only-authentication.md`
- 修改：`apps/backend/nodejs-fastify-framework-design.md` 状态行

- [ ] **步骤 1：编写失败的前端契约回归与真实库切片测试**

创建 `apps/backend/src/modules/auth/frontend-contract.http.test.ts`：

```ts
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { createTestApp } from '../../app/create-test-app';
import { testConfig } from '../../framework/testing/test-config';
import { buildSeedRecords } from '../user/user.fixture';
import { createFakeUserRepository } from '../user/user.repository.fake';

function parseRefreshBody(body: string): string {
  expect(body.trimStart().startsWith('{')).toBe(false);
  expect(body).not.toMatch(/"code"\s*:/);
  const token = body.startsWith('"') ? JSON.parse(body) : body;
  expect(typeof token).toBe('string');
  expect(token.split('.')).toHaveLength(3);
  return token;
}

describe('frontend auth contract', () => {
  let app: Awaited<ReturnType<typeof createTestApp>> | undefined;
  let seeds: Awaited<ReturnType<typeof buildSeedRecords>>;

  beforeAll(async () => {
    seeds = await buildSeedRecords();
  });

  afterEach(async () => {
    await app?.close();
  });

  async function start() {
    app = await createTestApp({
      config: testConfig(),
      dependencies: { userRepository: createFakeUserRepository(seeds) },
    });
    return app;
  }

  it('matches the web-antd login then info then codes flow', async () => {
    const server = await start();
    const login = await server.inject({
      method: 'POST',
      payload: { password: '123456', username: 'vben' },
      url: '/auth/login',
    });

    expect(login.statusCode).toBe(200);
    const loginData = login.json().data;
    expect(login.json().code).toBe(0);
    expect(typeof loginData.accessToken).toBe('string');

    const info = await server.inject({
      headers: { authorization: `Bearer ${loginData.accessToken}` },
      method: 'GET',
      url: '/user/info',
    });
    expect(info.json().data).toEqual({
      avatar: '',
      desc: '',
      homePath: '/ai-butler/workbench',
      realName: 'Vben',
      roles: ['super'],
      userId: 'user-vben',
      username: 'vben',
    });

    const codes = await server.inject({
      headers: { authorization: `Bearer ${loginData.accessToken}` },
      method: 'GET',
      url: '/auth/codes',
    });
    expect(codes.json().data).toEqual([
      'AC_100100',
      'AC_100110',
      'AC_100120',
      'AC_100010',
    ]);
  });

  it('lets baseRequestClient read refresh as resp.data string', async () => {
    const server = await start();
    const login = await server.inject({
      method: 'POST',
      payload: { password: '123456', username: 'admin' },
      url: '/auth/login',
    });
    const cookie = login.cookies.find((item) => item.name === 'jwt');
    const refresh = await server.inject({
      cookies: { jwt: cookie!.value },
      method: 'POST',
      url: '/auth/refresh',
    });
    const newToken = parseRefreshBody(refresh.body);

    const info = await server.inject({
      headers: { authorization: `Bearer ${newToken}` },
      method: 'GET',
      url: '/user/info',
    });
    expect(info.statusCode).toBe(200);
    expect(info.json().data.username).toBe('admin');
  });

  it('keeps logout envelope compatible with requestClient successCode 0', async () => {
    const server = await start();
    const response = await server.inject({ method: 'POST', url: '/auth/logout' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ code: 0, data: '', message: 'ok' });
  });
});
```

创建 `apps/backend/src/infrastructure/database/auth-slice.integration.test.ts`：

```ts
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../../app/create-app';
import { testConfig } from '../../framework/testing/test-config';
import { buildSeedRecords } from '../../modules/user/user.fixture';
import { createDatabase } from './client';
import { createDrizzleUserRepository } from './user.repository';

describe('auth vertical slice against PostgreSQL', () => {
  let connectionUri = '';
  let stopContainer: () => Promise<void> = async () => {};

  beforeAll(async () => {
    const container = await new PostgreSqlContainer('postgres:17-alpine').start();
    stopContainer = () => container.stop().then(() => undefined);
    connectionUri = container.getConnectionUri();
    const client = postgres(connectionUri, { max: 2 });
    const database = createDatabase(client);
    await migrate(database, {
      migrationsFolder: fileURLToPath(
        new URL('../../../migrations', import.meta.url),
      ),
    });
    const repository = createDrizzleUserRepository(database);
    for (const seed of await buildSeedRecords()) {
      await database.transaction(async (transaction) => {
        await repository.saveUser(seed.user, transaction);
        await repository.replaceAccessCodes(seed.user.id, seed.codes, transaction);
      });
    }
    await client.end();
  }, 60_000);

  afterAll(async () => {
    await stopContainer();
  });

  it('logs in against migrated seed users', async () => {
    const app = await createApp({
      config: testConfig({ databaseUrl: connectionUri }),
      logger: false,
      skipDatabase: false,
    });

    try {
      const response = await app.inject({
        method: 'POST',
        payload: { password: '123456', username: 'jack' },
        url: '/auth/login',
      });
      expect(response.statusCode).toBe(200);
      expect(response.json().data.username).toBe('jack');
      expect(response.body).not.toContain('passwordHash');
    } finally {
      await app.close();
    }
  });
});
```

种子用户只在 fixture / 本测试中创建，不要改 `0001_users.sql`。

- [ ] **步骤 2：运行测试验证失败**

运行：

```bash
pnpm exec vitest run --environment node apps/backend/src/modules/auth/frontend-contract.http.test.ts
pnpm exec vitest run --environment node apps/backend/src/infrastructure/database/auth-slice.integration.test.ts
```

预期：若任务 6–8 已完成，HTTP 回归应 PASS；集成测试在未接入真实 `createApp`+migrate+seed 前 FAIL。本任务要钉死的是回归套件与 ADR 文件尚不存在。

若 HTTP 回归已绿，保留这些测试作为门禁，不要删除。继续写 ADR。

- [ ] **步骤 3：编写 ADR 并更新设计状态**

创建 `apps/backend/docs/adr/0006-refresh-token-raw-string.md`：

```markdown
# ADR 0006：刷新接口成功时返回原始 accessToken 字符串

**状态：** 接受

## 背景

`apps/web-antd/src/api/core/auth.ts` 使用 `baseRequestClient` 调用 `POST /auth/refresh`。该客户端不走 `defaultResponseInterceptor`，前端取 token 的方式是 `const newToken = resp.data`。

现有 mock（`apps/backend-mock/api/auth/refresh.post.ts`）在成功时直接 `return accessToken`，HTTP 200 的 body 是 JWT 字符串，不是 `{ code, data, message }`。

若垂直切片把 refresh 改成统一 envelope，axios 解析后的 `resp.data` 会变成对象，`accessStore.setAccessToken` 会写入无效值，静默刷新链路会断。

## 决策

`POST /auth/refresh` 成功时 HTTP 200，body 为 accessToken 原始字符串（`text/plain`），不包 envelope。失败时仍走统一错误处理器，HTTP 403，JSON envelope，`code` 为 `1103`。

这是刻意的协议例外，仅限该路径的成功响应。登录、退出、权限码、用户信息仍使用 `{ code, data, message }`。

## 替代方案

- 成功也返回 envelope，并改前端为 `resp.data.data`：拒绝，因为当前桌面/Web 客户端已按 mock 上线，垂直切片的目标是对齐现有契约，而不是同时改前后端。
- 让 `baseRequestClient` 也剥壳：拒绝，因为退出等接口仍依赖完整 axios 响应，且 refresh 的 mock 从未包壳。

## 后果

- OpenAPI 中该成功响应必须是 string，不能复用 `successEnvelopeSchema`。
- 契约测试必须断言 body 不以 `{` 开头、不含 `"code":`。
- 以后若所有客户端都改为 envelope，需要新 ADR 和新的前端变更，不能静默改后端。
```

创建 `apps/backend/docs/adr/0007-jwt-only-authentication.md`：

```markdown
# ADR 0007：第一版认证只使用 JWT

**状态：** 接受

## 背景

规格第 13 节要求真实垂直切片第一版只实现 JWT，以验证 Authentication 与 Authorization 的边界。现有 mock 使用 `jsonwebtoken` 签发 access / refresh，refresh 放在名为 `jwt` 的 httpOnly cookie 中。

仓库 catalog 已有 `jsonwebtoken` 与 `@types/jsonwebtoken`。同时支持 OAuth2、API Key 和 Session 会让认证插件重新变成策略容器，超出本切片范围。

## 决策

第一版只支持 JWT：

- Access Token 放在 `Authorization: Bearer`。
- Refresh Token 放在 cookie `jwt`（httpOnly、Max-Age 86400、SameSite=None、Secure）。
- 认证插件只验证 access token 并写入 `RequestContext.principal`。
- RBAC 由 `requireAuthenticated` / `requireRole` 显式执行。
- Controller 不解析 token。
- 密钥来自 `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`，启动时长度必须 ≥ 32。

不实现 OAuth2、API Key、Session 或 DI 管理的多策略认证。

## 替代方案

- 同时做 JWT + Session：拒绝，规格第 2 节禁止第一阶段并行多种认证。
- 自研 token 格式：拒绝，无法与现有前端/mock 对齐，也重复 `jsonwebtoken`。

## 后果

- 新增认证方式必须单独规格和 ADR。
- Access 与 Refresh 使用不同密钥和 `tokenUse` 声明，禁止互相套用。
```

将 `apps/backend/nodejs-fastify-framework-design.md` 状态从薄内核完成态改为：

```markdown
**状态：认证与用户垂直切片已实现，等待稳定化计划**
```

不要在生产 `createApp` 里自动 migrate。probe 与 `poc_accounts` 保留。

- [ ] **步骤 4：运行契约回归与静态检查**

运行：

```bash
pnpm exec vitest run --environment node apps/backend/src/modules/auth/frontend-contract.http.test.ts apps/backend/src/modules/auth/auth.http.test.ts apps/backend/src/modules/user/user.http.test.ts apps/backend/src/modules/auth/authorization.http.test.ts
pnpm --filter @ai-butler/backend test:integration
pnpm --filter @ai-butler/backend test
pnpm --filter @ai-butler/backend check:architecture
pnpm --filter @ai-butler/backend typecheck
```

预期：全部 PASS。refresh 成功 body 不是 envelope；`/user/info` 无密码字段；jack 访问 `/_test/admin` 为 403；真实 PostgreSQL 上 `vben` / `admin` / `jack` 可登录。

- [ ] **步骤 5：Commit**

```bash
git add apps/backend/src apps/backend/docs/adr apps/backend/nodejs-fastify-framework-design.md
git commit -m "$(cat <<'EOF'
docs: 记录刷新协议例外与 JWT only

EOF
)"
```

---

## 最终完成条件

只有同时满足以下条件，本计划才算完成：

- 9 个任务分别有独立提交。
- 配置缺密钥或密钥短于 32 时启动失败，错误含配置项名、不含密钥值。
- 生产启动连接 PostgreSQL 并 fail-fast，但不自动执行破坏性迁移；测试用 Drizzle migrator。
- `UserRepository` 只有 `findUserByUsername`、`saveUser`、`findAccessCodesByUsername`、`replaceAccessCodes`，无通用 CRUD 基类。
- 登录失败消息统一为 `Username or password is incorrect.`
- `POST /auth/refresh` 成功返回原始 accessToken 字符串，并由测试与 ADR 0006 钉死。
- `GET /user/info` 字段对齐 `userId` / `username` / `realName` / `roles` / `avatar` / `desc` / `homePath`，永不返回 password。
- 认证插件写 `RequestContext.principal`；Controller 源码不含 `jsonwebtoken` / `jwt.verify`。
- 未认证 401，缺角色 403；ADR 0007 记录 JWT only。
- probe 与 `poc_accounts` 仍在，且不是业务路径。
- 未引入 Redis、NATS、OAuth2、API Key、Session、bcrypt、DI Container、完整 OpenTelemetry。
- 所有实现、测试、迁移、ADR 均位于 `apps/backend`。

完成后停止实现，先评审契约测试与 ADR 0006 / 0007；只有评审通过，才能执行 [`2026-09-04-fastify-backend-stabilization.md`](./2026-09-04-fastify-backend-stabilization.md)。

---

## 规格自检

**1. 规格覆盖度：** §7.1 数据库启动 → 任务 2；§10 Repository / 事务 / 迁移 → 任务 3–4；§11 配置与密钥 → 任务 1；§12 脱敏 → 任务 1；§13 认证授权分离与 JWT only → 任务 6–8、ADR 0007；§8 响应协议与 refresh 例外 → 任务 6、9、ADR 0006；前端 login / refresh / logout / codes / user info → 任务 6、7、9。无遗漏。

**2. 占位符扫描：** 无 TODO / TBD / 待定 /「类似任务 N」。各步骤含可运行测试、命令、实现与 commit。

**3. 类型一致性：** `UserRecord`、`PublicUser`、`Principal`、`TokenPrincipal`、`AppConfig.databaseUrl|jwtAccessSecret|jwtRefreshSecret|openapiUiEnabled`、`skipDatabase`、`extraPlugins`、错误码 `1101/1103/1104`、cookie 名 `jwt` 在各任务中一致。`description` 仅存库，HTTP 字段名为 `desc`。`createTestApp` 在 `src/app/create-test-app.ts`，`testConfig` 在 `src/framework/testing/test-config.ts`。检查器类型名为 `HealthChecker`。

在薄内核计划完成并评审通过之前，不要开始实现本计划。
