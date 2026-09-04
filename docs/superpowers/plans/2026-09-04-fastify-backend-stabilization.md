# Fastify 后端稳定化实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 在认证与用户垂直切片之上完成第一阶段稳定化：用最小 `login-audit` 模块验证跨模块边界，用 dependency-cruiser 钉死架构规则，并补齐故障路径、安全、进程 E2E、性能回归与开发文档。

**架构：** `createApp()` 仍是唯一组合根。`login-audit` 只通过 `login-audit.service.ts` 导出 `LoginAuditService`；`AuthService` 经构造/工厂显式注入该接口，禁止引用 `modules/login-audit` 的 repository、schema、plugin 或其他内部文件。Drizzle 实现留在 `infrastructure/database`。健康检查、关闭超时、日志脱敏和错误映射继续复用薄内核，本计划只补失败路径与回归证据。

**技术栈：** Node.js 24、TypeScript Strict、Fastify 5、TypeBox、Pino、Drizzle ORM、PostgreSQL 17、Vitest 4、Testcontainers、dependency-cruiser、Autocannon；不新增 Redis、NATS、Kafka、完整 OpenTelemetry、CLI、OAuth2、DI Container。

**规格：** [`apps/backend/nodejs-fastify-framework-design.md`](../../../apps/backend/nodejs-fastify-framework-design.md)

**前置：** [`2026-09-04-fastify-backend-poc.md`](./2026-09-04-fastify-backend-poc.md)、[`2026-09-04-fastify-backend-thin-kernel.md`](./2026-09-04-fastify-backend-thin-kernel.md)、[`2026-09-04-fastify-backend-vertical-slice.md`](./2026-09-04-fastify-backend-vertical-slice.md) 均已完成

---

## 执行闸门

必须同时满足以下条件，才能开始本计划：

1. PoC、薄内核、垂直切片计划的全部任务均已提交。
2. `pnpm --filter @ai-butler/backend test`、`pnpm --filter @ai-butler/backend test:integration`、`pnpm --filter @ai-butler/backend typecheck` 退出码为 0。
3. 设计文档状态已到达「垂直切片已实现」。若前置计划修改了 `createApp`、`createTestApp`、`createAuthService`、`AppDependencies`、`/livez`、`/readyz`、`createShutdown`，先把本计划中的调用改成实际签名，再实现。

所有服务端代码、测试、迁移、基准和 ADR 只允许出现在 `apps/backend`。禁止引入 Redis、NATS、Kafka、完整 OpenTelemetry、CLI、OAuth2、Session、API Key、DI Container、`defineModule()`。第二个业务模块禁止做成联系人产品。

## 全局约束

- `createTestApp` 位于 `src/app/create-test-app.ts`；`testConfig()` 位于 `src/framework/testing/test-config.ts`。
- `/readyz` 失败固定 `{ code: 5030, data: null, message: 'not ready' }`。
- 未知错误固定 `{ code: 5000, data: null, message: 'Internal server error' }`。
- 未认证 `GET /user/info` 为 HTTP 401 / `code` `1101`。
- `AuthService` 只能依赖 `login-audit.service.ts` 导出的接口。
- `benchmark` 默认不 enforce。

---

## 文件结构

- 创建：`apps/backend/src/modules/login-audit/login-audit.service.ts` — 其他模块唯一允许引用的 login-audit 文件（plugin 仅给组合根注册 HTTP）
- 创建：`apps/backend/src/modules/login-audit/login-audit.schema.ts`
- 创建：`apps/backend/src/modules/login-audit/login-audit.plugin.ts`
- 创建：`apps/backend/src/infrastructure/database/login-audit.repository.ts`
- 创建：`apps/backend/migrations/0002_login_audit_events.sql`（若垂直切片最新迁移不是 `0001_`，使用下一个序号）
- 修改：`apps/backend/src/infrastructure/database/schema.ts`
- 修改：`apps/backend/src/modules/auth/auth.service.ts`
- 修改：`apps/backend/src/app/dependencies.ts`
- 修改：`apps/backend/src/app/register-modules.ts`
- 修改：`apps/backend/src/app/create-app.ts` — 支持 `extraClosers`、`shutdownTimeoutMs`，并 `decorate('shutdown')`
- 修改：`apps/backend/.dependency-cruiser.cjs`
- 修改：`apps/backend/src/architecture.test.ts`
- 修改：`apps/backend/src/framework/core/shutdown.ts` — 增加 `runShutdown()`
- 修改：`apps/backend/src/main.ts`
- 修改：`apps/backend/benchmarks/http-overhead.ts`
- 修改：`apps/backend/tests/shutdown.e2e.test.ts`
- 修改：`apps/backend/package.json`
- 创建：`apps/backend/docs/adr/0008-second-module-boundary.md`
- 创建：`apps/backend/docs/performance-regression.md`
- 创建：`apps/backend/README.md`
- 修改：`apps/backend/nodejs-fastify-framework-design.md`

---

### 任务 1：login-audit 模块并注入 AuthService

**文件：**
- 创建：`apps/backend/src/modules/login-audit/login-audit.service.ts`
- 创建：`apps/backend/src/modules/login-audit/login-audit.schema.ts`
- 创建：`apps/backend/src/modules/login-audit/login-audit.plugin.ts`
- 创建：`apps/backend/src/infrastructure/database/login-audit.repository.ts`
- 创建：`apps/backend/migrations/0002_login_audit_events.sql`
- 修改：`apps/backend/src/infrastructure/database/schema.ts`
- 修改：`apps/backend/src/modules/auth/auth.service.ts`
- 修改：`apps/backend/src/app/dependencies.ts`
- 修改：`apps/backend/src/app/register-modules.ts`
- 测试：`apps/backend/src/modules/login-audit/login-audit.service.test.ts`
- 测试：`apps/backend/src/modules/auth/auth.service.login-audit.test.ts`
- 测试：`apps/backend/src/modules/login-audit/login-audit.plugin.test.ts`
- 测试：`apps/backend/src/infrastructure/database/login-audit.repository.integration.test.ts`

- [ ] **步骤 1：编写失败的服务、认证注入、插件与仓储测试**

创建 `apps/backend/src/modules/login-audit/login-audit.service.test.ts`：

```ts
import { describe, expect, it, vi } from 'vitest';

import {
  createLoginAuditService,
  type LoginAuditRecord,
  type LoginAuditRepository,
} from './login-audit.service';

function createFakeRepository(
  records: LoginAuditRecord[] = [],
): LoginAuditRepository {
  return {
    async append(event) {
      records.push(event);
    },
    async listRecent(limit) {
      return records
        .toSorted(
          (left, right) =>
            right.occurredAt.getTime() - left.occurredAt.getTime(),
        )
        .slice(0, limit);
    },
  };
}

describe('createLoginAuditService', () => {
  it('records a login event and lists newest first', async () => {
    const records: LoginAuditRecord[] = [];
    const service = createLoginAuditService(createFakeRepository(records));
    const first: LoginAuditRecord = {
      occurredAt: new Date('2026-09-04T04:00:00.000Z'),
      userId: 'user-1',
      username: 'admin',
    };
    const second: LoginAuditRecord = {
      occurredAt: new Date('2026-09-04T05:00:00.000Z'),
      userId: 'user-2',
      username: 'jack',
    };

    await service.record(first);
    await service.record(second);

    await expect(service.listRecent(1)).resolves.toEqual([second]);
    expect(records).toEqual([first, second]);
  });

  it('delegates append failures to the caller', async () => {
    const service = createLoginAuditService({
      append: vi.fn().mockRejectedValue(new Error('write failed')),
      listRecent: vi.fn(),
    });

    await expect(
      service.record({
        occurredAt: new Date('2026-09-04T04:00:00.000Z'),
        userId: 'user-1',
        username: 'admin',
      }),
    ).rejects.toThrow('write failed');
  });
});
```

创建 `apps/backend/src/modules/auth/auth.service.login-audit.test.ts`：

```ts
import { describe, expect, it, vi } from 'vitest';

import { type LoginAuditService } from '../login-audit/login-audit.service';
import { createAuthService } from './auth.service';

const adminUser = {
  avatar: '',
  desc: 'Administrator',
  homePath: '/ai-butler/workbench',
  id: 'user-admin',
  passwordHash: 'scrypt-hash',
  realName: 'Admin',
  roles: ['admin'],
  username: 'admin',
};

describe('AuthService login audit', () => {
  it('records userId, username and occurredAt after a successful login', async () => {
    const record = vi.fn().mockResolvedValue(undefined);
    const loginAuditService: LoginAuditService = {
      listRecent: vi.fn(),
      record,
    };
    const authService = createAuthService({
      loginAuditService,
      now: () => new Date('2026-09-04T04:00:00.000Z'),
      tokens: {
        issueAccessToken: () => 'access-token',
        issueRefreshToken: () => 'refresh-token',
      },
      userRepository: {
        findUserById: vi.fn(),
        findUserByUsername: vi.fn().mockResolvedValue(adminUser),
      },
      verifyPassword: vi.fn().mockResolvedValue(true),
    });

    await authService.login({ password: '123456', username: 'admin' });

    expect(record).toHaveBeenCalledExactlyOnceWith({
      occurredAt: new Date('2026-09-04T04:00:00.000Z'),
      userId: 'user-admin',
      username: 'admin',
    });
  });

  it('does not record an audit event when credentials are rejected', async () => {
    const record = vi.fn();
    const authService = createAuthService({
      loginAuditService: { listRecent: vi.fn(), record },
      now: () => new Date('2026-09-04T04:00:00.000Z'),
      tokens: {
        issueAccessToken: () => 'access-token',
        issueRefreshToken: () => 'refresh-token',
      },
      userRepository: {
        findUserById: vi.fn(),
        findUserByUsername: vi.fn().mockResolvedValue(undefined),
      },
      verifyPassword: vi.fn(),
    });

    await expect(
      authService.login({ password: 'wrong', username: 'nobody' }),
    ).rejects.toMatchObject({
      message: 'Username or password is incorrect.',
      statusCode: 403,
    });
    expect(record).not.toHaveBeenCalled();
  });
});
```

若垂直切片的 `createAuthService` 把验密内聚在 service 内、没有 `verifyPassword` 参数，则本测试改为向 Fake repository 返回与种子用户相同的 hash，并沿用垂直切片已有的验密函数；`loginAuditService` 与 `now` 仍必须作为显式依赖传入。

创建 `apps/backend/src/modules/login-audit/login-audit.plugin.test.ts`：

```ts
import { afterEach, describe, expect, it } from 'vitest';

import { AppError } from '../../framework/core/app-error';
import errorHandlerPlugin from '../../framework/http/error-handler.plugin';
import {
  createHttpServer,
  type AppInstance,
} from '../../framework/http/fastify';
import { loginAuditPlugin } from './login-audit.plugin';
import { createLoginAuditService } from './login-audit.service';
import { type LoginAuditRecord } from './login-audit.service';

describe('loginAuditPlugin', () => {
  let app: AppInstance | undefined;
  const records: LoginAuditRecord[] = [
    {
      occurredAt: new Date('2026-09-04T04:00:00.000Z'),
      userId: 'user-admin',
      username: 'admin',
    },
  ];

  afterEach(async () => {
    await app?.close();
  });

  it('lists recent events when requireAdmin allows the request', async () => {
    app = createHttpServer({ logger: false });
    await app.register(errorHandlerPlugin);
    await app.register(loginAuditPlugin, {
      requireAdmin: async () => {},
      service: createLoginAuditService({
        append: async (event) => {
          records.push(event);
        },
        listRecent: async (limit) => records.slice(0, limit),
      }),
    });

    const response = await app.inject({
      method: 'GET',
      url: '/login-audit/events?limit=10',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      code: 0,
      data: {
        events: [
          {
            occurredAt: '2026-09-04T04:00:00.000Z',
            userId: 'user-admin',
            username: 'admin',
          },
        ],
      },
      message: 'success',
    });
  });

  it('returns 401 when requireAdmin rejects an anonymous caller', async () => {
    app = createHttpServer({ logger: false });
    await app.register(errorHandlerPlugin);
    await app.register(loginAuditPlugin, {
      requireAdmin: async () => {
        throw new AppError({
          code: 1001,
          message: 'Unauthorized',
          statusCode: 401,
        });
      },
      service: createLoginAuditService({
        append: async () => {},
        listRecent: async () => [],
      }),
    });

    const response = await app.inject({
      method: 'GET',
      url: '/login-audit/events',
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      code: 1001,
      data: null,
      message: 'Unauthorized',
    });
  });

  it('returns 403 when requireAdmin rejects a non-admin caller', async () => {
    app = createHttpServer({ logger: false });
    await app.register(errorHandlerPlugin);
    await app.register(loginAuditPlugin, {
      requireAdmin: async () => {
        throw new AppError({
          code: 1002,
          message: 'Forbidden',
          statusCode: 403,
        });
      },
      service: createLoginAuditService({
        append: async () => {},
        listRecent: async () => [],
      }),
    });

    const response = await app.inject({
      method: 'GET',
      url: '/login-audit/events',
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().code).toBe(1002);
  });
});
```

401/403 的 `code` 必须与垂直切片 `requireRole` 抛出的 `AppError.code` 一致。

创建 `apps/backend/src/infrastructure/database/login-audit.repository.integration.test.ts`：

```ts
import { fileURLToPath } from 'node:url';

import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createDatabase, type Database } from './client';
import { createLoginAuditRepository } from './login-audit.repository';

describe('login-audit repository', () => {
  let closeClient: () => Promise<void> = async () => {};
  let database: Database;
  let stopContainer: () => Promise<void> = async () => {};

  beforeAll(async () => {
    const container = await new PostgreSqlContainer(
      'postgres:17-alpine',
    ).start();
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

  it('appends events and lists them newest first after migrate', async () => {
    const repository = createLoginAuditRepository(database);

    await repository.append({
      occurredAt: new Date('2026-09-04T04:00:00.000Z'),
      userId: 'user-1',
      username: 'admin',
    });
    await repository.append({
      occurredAt: new Date('2026-09-04T05:00:00.000Z'),
      userId: 'user-2',
      username: 'jack',
    });

    const recent = await repository.listRecent(1);

    expect(recent).toEqual([
      {
        occurredAt: new Date('2026-09-04T05:00:00.000Z'),
        userId: 'user-2',
        username: 'jack',
      },
    ]);
  });
});
```

- [ ] **步骤 2：运行测试验证失败**

```bash
pnpm exec vitest run --environment node \
  apps/backend/src/modules/login-audit/login-audit.service.test.ts \
  apps/backend/src/modules/auth/auth.service.login-audit.test.ts \
  apps/backend/src/modules/login-audit/login-audit.plugin.test.ts
```

预期：FAIL，无法解析 `./login-audit.service`，`createAuthService` 不接受 `loginAuditService`，且 `loginAuditPlugin` 不存在。

- [ ] **步骤 3：实现表、窄仓储、服务、插件，并从 AuthService 显式注入**

在 `schema.ts` 追加：

```ts
export const loginAuditEvents = pgTable('login_audit_events', {
  id: text().primaryKey(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  userId: text('user_id').notNull(),
  username: text().notNull(),
});
```

把 `loginAuditEvents` 加入已有 `schema` 对象。不要在 `modules/login-audit` 里 import `drizzle-orm`。

创建 `apps/backend/migrations/0002_login_audit_events.sql`：

```sql
CREATE TABLE "login_audit_events" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "username" text NOT NULL,
  "occurred_at" timestamptz NOT NULL
);

CREATE INDEX "login_audit_events_occurred_at_idx"
  ON "login_audit_events" ("occurred_at" DESC);
```

创建 `login-audit.service.ts`：

```ts
export interface LoginAuditRecord {
  occurredAt: Date;
  userId: string;
  username: string;
}

export interface LoginAuditRepository {
  append(event: LoginAuditRecord): Promise<void>;
  listRecent(limit: number): Promise<LoginAuditRecord[]>;
}

export interface LoginAuditService {
  listRecent(limit: number): Promise<LoginAuditRecord[]>;
  record(event: LoginAuditRecord): Promise<void>;
}

export function createLoginAuditService(
  repository: LoginAuditRepository,
): LoginAuditService {
  return {
    listRecent: (limit) => repository.listRecent(limit),
    record: (event) => repository.append(event),
  };
}
```

创建 `login-audit.repository.ts`：

```ts
import { randomUUID } from 'node:crypto';

import { desc } from 'drizzle-orm';

import {
  type LoginAuditRecord,
  type LoginAuditRepository,
} from '../../modules/login-audit/login-audit.service';
import { type DatabaseExecutor } from './client';
import { loginAuditEvents } from './schema';

export function createLoginAuditRepository(
  executor: DatabaseExecutor,
): LoginAuditRepository {
  return {
    async append(event) {
      await executor.insert(loginAuditEvents).values({
        id: randomUUID(),
        occurredAt: event.occurredAt,
        userId: event.userId,
        username: event.username,
      });
    },
    async listRecent(limit) {
      const rows = await executor
        .select({
          occurredAt: loginAuditEvents.occurredAt,
          userId: loginAuditEvents.userId,
          username: loginAuditEvents.username,
        })
        .from(loginAuditEvents)
        .orderBy(desc(loginAuditEvents.occurredAt))
        .limit(limit);

      return rows.map((row) => ({
        occurredAt: row.occurredAt,
        userId: row.userId,
        username: row.username,
      }));
    },
  };
}
```

`login-audit.schema.ts` 与 `login-audit.plugin.ts` 按测试实现：`GET /login-audit/events`，query `limit` 默认 20，`preHandler: options.requireAdmin`，响应用 `successEnvelopeSchema`。

修改 `auth.service.ts`：只允许增加对 `LoginAuditService` 的类型导入，禁止 import plugin、schema、repository。登录成功后调用 `loginAuditService.record({ occurredAt, userId, username })`。失败路径不得记审计。把现有 `createAuthService(` 调用补上 `loginAuditService`；现有认证单测使用空实现：

```ts
const silentLoginAudit: LoginAuditService = {
  listRecent: async () => [],
  record: async () => {},
};
```

`createDependencies()` 在组合根创建 `loginAuditService` 并注入 `authService`。`register-modules.ts` 注册 `loginAuditPlugin`，`requireAdmin` 使用垂直切片导出的 `requireRole('admin')`。`login-audit.plugin.ts` 自身不得 import `modules/auth` 内部文件。

`package.json` 的集成测试脚本改为：

```json
{
  "test:integration": "vitest run --environment node src/**/*.integration.test.ts"
}
```

- [ ] **步骤 4：运行测试验证通过**

```bash
pnpm exec vitest run --environment node \
  apps/backend/src/modules/login-audit/login-audit.service.test.ts \
  apps/backend/src/modules/auth/auth.service.login-audit.test.ts \
  apps/backend/src/modules/login-audit/login-audit.plugin.test.ts
pnpm --filter @ai-butler/backend test
pnpm --filter @ai-butler/backend test:integration
pnpm --filter @ai-butler/backend typecheck
```

预期：全部 PASS。无 Docker 时必须暴露 Testcontainers 错误，禁止改成内存数据库。

- [ ] **步骤 5：Commit**

```bash
git add apps/backend/src/modules/login-audit \
  apps/backend/src/modules/auth/auth.service.ts \
  apps/backend/src/modules/auth/auth.service.login-audit.test.ts \
  apps/backend/src/infrastructure/database \
  apps/backend/migrations/0002_login_audit_events.sql \
  apps/backend/src/app/dependencies.ts \
  apps/backend/src/app/register-modules.ts \
  apps/backend/package.json
git commit -m "$(cat <<'EOF'
feat: 增加登录审计模块并注入认证服务

EOF
)"
```

---

### 任务 2：全量架构规则并用 architecture.test.ts 执行

**文件：**
- 修改：`apps/backend/.dependency-cruiser.cjs`
- 修改：`apps/backend/src/architecture.test.ts`

- [ ] **步骤 1：把 architecture 测试钉在 depcruise 零违规上**

```ts
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

describe('backend architecture', () => {
  it('satisfies dependency-cruiser rules', async () => {
    const { stderr, stdout } = await execFileAsync(
      'pnpm',
      ['exec', 'depcruise', '--config', '.dependency-cruiser.cjs', 'src'],
      { cwd: new URL('../', import.meta.url) },
    );

    expect(stderr).toBe('');
    expect(stdout.length).toBeGreaterThan(0);
  });
});
```

- [ ] **步骤 2：先不改规则，确认当前文件能跑**

```bash
pnpm --filter @ai-butler/backend check:architecture
pnpm exec vitest run --environment node apps/backend/src/architecture.test.ts
```

预期：PoC 已有规则下目前应 PASS。

- [ ] **步骤 3：写入全量 forbidden 规则**

将 `apps/backend/.dependency-cruiser.cjs` 替换为：

```js
/** @type {import('dependency-cruiser').IConfiguration} */
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
      name: 'services-must-not-import-fastify',
      severity: 'error',
      from: { path: '\\.service\\.ts$' },
      to: { path: '(^|/)(fastify|fastify-plugin|@fastify/)' },
    },
    {
      name: 'modules-must-not-import-drizzle-or-postgres',
      severity: 'error',
      from: { path: '^src/modules/' },
      to: { path: '(^|/)(drizzle-orm|postgres)' },
    },
    {
      name: 'controllers-must-not-import-database-client',
      severity: 'error',
      from: { path: '^src/modules/.+\\.(plugin|controller)\\.ts$' },
      to: { path: '^src/infrastructure/database/(client|schema)\\.ts$' },
    },
    {
      name: 'modules-must-not-import-other-module-internals',
      severity: 'error',
      from: { path: '^src/modules/([^/]+)/' },
      to: {
        path: '^src/modules/([^/]+)/',
        pathNot: [
          '^src/modules/$1/',
          '^src/modules/[^/]+/[^/]+\\.(service|plugin)\\.ts$',
        ],
      },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    includeOnly: '^src',
    tsConfig: { fileName: 'tsconfig.json' },
    tsPreCompilationDeps: true,
  },
};
```

然后依次加入临时违规、跑 `pnpm --filter @ai-butler/backend check:architecture`、看到对应规则名后立刻删除，全部不得提交：

1. `src/framework/http/fastify.ts` 增加 `import '../modules/login-audit/login-audit.plugin';` → `framework-must-not-import-modules`
2. `auth.service.ts` 增加 `import type { FastifyRequest } from 'fastify';` → `services-must-not-import-fastify`
3. `login-audit.service.ts` 增加 `import { eq } from 'drizzle-orm';` → `modules-must-not-import-drizzle-or-postgres`
4. `login-audit.plugin.ts` 增加 `import { createDatabase } from '../../infrastructure/database/client';` → `controllers-must-not-import-database-client`
5. `auth.service.ts` 增加 `import '../login-audit/login-audit.schema';` → `modules-must-not-import-other-module-internals`。保留已有的 `LoginAuditService` import。

`app/dependencies.ts` 引用 repository 以及两个 `*.service.ts` 必须继续合法。

- [ ] **步骤 4：删除全部临时违规后验证通过**

```bash
pnpm --filter @ai-butler/backend check:architecture
pnpm exec vitest run --environment node apps/backend/src/architecture.test.ts
pnpm --filter @ai-butler/backend typecheck
```

预期：全部 PASS；`git diff` 不含任何故意违规 import。

- [ ] **步骤 5：Commit**

```bash
git add apps/backend/.dependency-cruiser.cjs apps/backend/src/architecture.test.ts
git commit -m "$(cat <<'EOF'
test: 钉死后端模块依赖方向

EOF
)"
```

---

### 任务 3：Readiness 失败 503 与关闭超时非零退出

**文件：**
- 修改：`apps/backend/src/framework/core/shutdown.ts`
- 修改：`apps/backend/src/framework/core/shutdown.test.ts`
- 修改：`apps/backend/src/app/create-app.ts`
- 修改：`apps/backend/src/main.ts`
- 测试：`apps/backend/src/framework/http/health.failure.test.ts`
- 测试：`apps/backend/src/app/shutdown-timeout.test.ts`

- [ ] **步骤 1：编写 readiness 失败与慢 close 超时测试**

`/readyz` 失败文案必须与薄内核一致：`{ code: 5030, data: null, message: 'not ready' }`。不要改成 `Service unavailable`。

创建 `apps/backend/src/framework/http/health.failure.test.ts`：

```ts
import { afterEach, describe, expect, it } from 'vitest';

import { createTestApp } from '../../app/create-test-app';

describe('readiness failure', () => {
  let app: Awaited<ReturnType<typeof createTestApp>> | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it('returns a fixed 503 envelope and never leaks connection strings', async () => {
    const leaked = 'postgres://backend:super-secret@db.internal/app';
    app = await createTestApp({
      checkers: [
        {
          async check() {
            throw new Error(`database ping failed ${leaked}`);
          },
          name: 'database',
        },
      ],
    });

    const ready = await app.inject({ method: 'GET', url: '/readyz' });
    const live = await app.inject({ method: 'GET', url: '/livez' });

    expect(ready.statusCode).toBe(503);
    expect(ready.json()).toEqual({
      code: 5030,
      data: null,
      message: 'not ready',
    });
    expect(ready.body).not.toContain('super-secret');
    expect(ready.body).not.toContain('postgres://');
    expect(ready.body).not.toContain('db.internal');
    expect(live.statusCode).toBe(200);
  });
});
```

若薄内核 `checkers` 已是 `{ name, check }[]`，保持该形状。不要改成 `Record<string, () => Promise<void>>`。

在 `apps/backend/src/framework/core/shutdown.test.ts` 追加：

```ts
import { createShutdown, runShutdown } from './shutdown';

describe('runShutdown', () => {
  it('returns 1 when shutdown times out', async () => {
    const shutdown = createShutdown({
      close: () => new Promise(() => {}),
      timeoutMs: 25,
    });
    await expect(runShutdown(shutdown)).resolves.toBe(1);
  });

  it('returns 0 when shutdown completes', async () => {
    const shutdown = createShutdown({
      close: async () => {},
      timeoutMs: 25,
    });
    await expect(runShutdown(shutdown)).resolves.toBe(0);
  });
});
```

创建 `apps/backend/src/app/shutdown-timeout.test.ts`：

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

import { runShutdown } from '../framework/core/shutdown';
import { createTestApp } from './create-test-app';

describe('createApp shutdown timeout', () => {
  let app: Awaited<ReturnType<typeof createTestApp>> | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it('rejects the decorated shutdown and maps timeout to exit code 1', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit must not be called');
    }) as never);

    app = await createTestApp({
      extraClosers: [
        {
          close: () => new Promise(() => {}),
          name: 'slow-resource',
        },
      ],
      shutdownTimeoutMs: 25,
    });

    await expect(app.shutdown()).rejects.toThrow('Shutdown timed out after 25ms');
    await expect(runShutdown(app.shutdown)).resolves.toBe(1);
    expect(exitSpy).not.toHaveBeenCalled();
    exitSpy.mockRestore();
  });
});
```

- [ ] **步骤 2：运行测试验证失败**

```bash
pnpm exec vitest run --environment node \
  apps/backend/src/framework/http/health.failure.test.ts \
  apps/backend/src/framework/core/shutdown.test.ts \
  apps/backend/src/app/shutdown-timeout.test.ts
```

预期：FAIL。`runShutdown` 不存在；`createTestApp` 尚不接受 `extraClosers`；checker 抛出含连接串的错误时 `/readyz` 可能 500 或把原文写入 body。

- [ ] **步骤 3：实现安全的 readiness 失败响应、runShutdown 与慢 close 注入**

```ts
export async function runShutdown(
  shutdown: () => Promise<void>,
): Promise<0 | 1> {
  try {
    await shutdown();
    return 0;
  } catch {
    return 1;
  }
}
```

`/readyz` 在 `shuttingDown` 或 checker 抛错时返回上述 503 envelope；日志可记录完整 `err`，HTTP body 不能含连接串。`/livez` 继续不跑 checkers。

`CreateAppOptions` 增加 `extraClosers` 与 `shutdownTimeoutMs`。`createApp()` 注册 Fastify 与 extra closers 后 `app.decorate('shutdown', shutdown)`，关闭前先 `markNotReady()`。`createTestApp` 必须透传这些字段。

`main.ts` 使用 `runShutdown(app.shutdown)` 设置 `process.exitCode`。业务代码仍禁止直接读 `process.env`；若薄内核已改为只读 `loadConfig()`，删除 `PORT` 的 `process.env` 覆盖。

- [ ] **步骤 4：运行测试验证通过**

```bash
pnpm exec vitest run --environment node \
  apps/backend/src/framework/http/health.failure.test.ts \
  apps/backend/src/framework/core/shutdown.test.ts \
  apps/backend/src/app/shutdown-timeout.test.ts
pnpm --filter @ai-butler/backend test
pnpm --filter @ai-butler/backend typecheck
```

预期：全部 PASS。

- [ ] **步骤 5：Commit**

```bash
git add apps/backend/src/framework/core/shutdown.ts \
  apps/backend/src/framework/core/shutdown.test.ts \
  apps/backend/src/framework/http \
  apps/backend/src/framework/testing \
  apps/backend/src/app/create-app.ts \
  apps/backend/src/app/shutdown-timeout.test.ts \
  apps/backend/src/main.ts
git commit -m "$(cat <<'EOF'
fix: 补齐就绪失败与关闭超时退出

EOF
)"
```

---

### 任务 4：错误响应、日志脱敏与未认证 401

**文件：**
- 测试：`apps/backend/src/framework/http/security.test.ts`
- 修改：`apps/backend/src/framework/http/error-handler.plugin.ts`（仅当测试失败且现有映射会泄露时）
- 修改：薄内核日志配置（仅当 redact 路径缺漏时）

- [ ] **步骤 1：编写安全回归测试**

创建 `apps/backend/src/framework/http/security.test.ts`：

```ts
import { Writable } from 'node:stream';

import { afterEach, describe, expect, it } from 'vitest';

import { createTestApp } from '../../app/create-test-app';
import { createLogger } from '../observability/logger';
import { testConfig } from '../testing/test-config';

describe('security regressions', () => {
  let app: Awaited<ReturnType<typeof createTestApp>> | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it('maps unknown errors to a safe 500 envelope', async () => {
    const error = new Error(
      'select * from users failed postgres://backend:super-secret@db/app DATABASE_URL=postgres://backend:super-secret@db/app at auth.service.ts:88',
    );
    error.stack = `${error.message}\n    at AuthService.login (auth.service.ts:88:11)`;

    app = await createTestApp({
      dependencies: {
        probeService: {
          read() {
            throw error;
          },
        },
      },
    });

    const response = await app.inject({ method: 'GET', url: '/poc/ping' });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      code: 5000,
      data: null,
      message: 'Internal server error',
    });
    expect(response.body).not.toContain('super-secret');
    expect(response.body).not.toContain('select *');
    expect(response.body).not.toContain('auth.service.ts:88');
    expect(response.body).not.toContain('DATABASE_URL');
    expect(response.body).not.toContain('postgres://');
  });

  it('redacts credentials from login request logs', async () => {
    const chunks: string[] = [];
    const destination = new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(String(chunk));
        callback();
      },
    });
    const logger = createLogger(testConfig({ logLevel: 'info' }), destination);

    app = await createTestApp({ logger });

    await app.inject({
      headers: {
        authorization: 'Bearer secret-access-token',
        cookie: 'jwt=secret-refresh-token',
      },
      method: 'POST',
      payload: { password: '123456', username: 'vben' },
      url: '/auth/login',
    });

    const text = chunks.join('');
    expect(text).toContain('[Redacted]');
    expect(text).not.toContain('secret-access-token');
    expect(text).not.toContain('secret-refresh-token');
    expect(text).not.toContain('123456');
  });

  it('returns 401 without leaking stack or jwt for missing bearer', async () => {
    app = await createTestApp();

    const response = await app.inject({ method: 'GET', url: '/user/info' });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      code: 1101,
      message: 'Unauthorized Exception',
    });
    expect(response.body).not.toContain('stack');
    expect(response.body).not.toMatch(/eyJ[A-Za-z0-9_-]+\./);
  });
});
```

若薄内核把 redact 固定在 `createLogger()` 内部，则按上例通过 destination 注入 stream，不要复制一套新的脱敏逻辑。`createTestApp` / `createApp` 若尚不接受 Pino 实例作 `logger`，本任务只把该项接到已有 `loggerInstance` 选项，不要新造 logger 工厂。

- [ ] **步骤 2：运行测试验证失败**

```bash
pnpm exec vitest run --environment node apps/backend/src/framework/http/security.test.ts
```

预期：FAIL 的原因只能是缺文件、logger 未脱敏，或 `/user/info` 未返回 401。若三则已经 PASS，不要改生产代码，直接进入步骤 4。

- [ ] **步骤 3：补齐安全映射与脱敏（仅修复失败项）**

未知异常分支必须 `request.log.error({ err: error }, 'unhandled request error')` 后发送稳定 500 envelope。禁止 `send(error)`。Pino redact 至少包含 `password`、`req.headers.authorization`、`req.headers.cookie`、`req.body.password`、`accessToken`、`refreshToken`、`DATABASE_URL`。缺失 Bearer 必须由认证插件抛 HTTP 401 的 `AppError`；`GET /user/info` 不得自行解析 token。

- [ ] **步骤 4：运行测试验证通过**

```bash
pnpm exec vitest run --environment node apps/backend/src/framework/http/security.test.ts
pnpm --filter @ai-butler/backend test
pnpm --filter @ai-butler/backend typecheck
```

- [ ] **步骤 5：Commit**

生产代码有改动时：

```bash
git add apps/backend/src/framework/http/security.test.ts \
  apps/backend/src/framework/http/error-handler.plugin.ts \
  apps/backend/src/framework/observability \
  apps/backend/src/app/create-app.ts \
  apps/backend/src/modules/auth
git commit -m "$(cat <<'EOF'
fix: 阻止错误响应与日志泄露敏感信息

EOF
)"
```

若步骤 3 无需改生产代码，则只提交测试，信息为 `test: 增加安全回归覆盖`。

---

### 任务 5：真实进程 E2E（listen PORT=0 + SIGTERM 退出 0）

**文件：**
- 修改：`apps/backend/tests/shutdown.e2e.test.ts`

- [ ] **步骤 1：扩展 PoC 进程测试**

修改 `apps/backend/tests/shutdown.e2e.test.ts`：

```ts
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

const MAIN = fileURLToPath(new URL('../dist/main.js', import.meta.url));

describe('process shutdown e2e', () => {
  let child: ReturnType<typeof spawn> | undefined;

  afterEach(async () => {
    if (!child || child.exitCode !== null || child.signalCode !== null) {
      return;
    }
    child.kill('SIGTERM');
    await once(child, 'exit');
  });

  it('listens on PORT=0 and exits 0 after SIGTERM', async () => {
    const chunks: string[] = [];
    child = spawn(process.execPath, [MAIN], {
      env: {
        ...process.env,
        HOST: '127.0.0.1',
        LOG_LEVEL: 'info',
        PORT: '0',
      },
    });
    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');
    child.stdout?.on('data', (chunk: string) => chunks.push(chunk));
    child.stderr?.on('data', (chunk: string) => chunks.push(chunk));

    const url = await waitForListenUrl(() => chunks.join(''), 10_000);
    const live = await fetch(`${url}/livez`);
    expect(live.status).toBe(200);

    child.kill('SIGTERM');
    const [exitCode, signal] = (await Promise.race([
      once(child, 'exit'),
      sleep(10_000).then(() => {
        throw new Error('process did not exit within 10s');
      }),
    ])) as [number | null, NodeJS.Signals | null];

    expect(exitCode).toBe(0);
    expect(signal).toBeNull();
  }, 30_000);
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForListenUrl(
  readOutput: () => string,
  timeoutMs: number,
): Promise<string> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const text = readOutput();
    const pretty = text.match(/Server listening at (http:\/\/127\.0\.0\.1:\d+)/);
    const json = text.match(/"address"\s*:\s*"(http:\/\/127\.0\.0\.1:\d+)/);
    const url = pretty?.[1] ?? json?.[1];
    if (url) {
      return url;
    }
    await sleep(50);
  }
  throw new Error(`server listen address not found in output:\n${readOutput()}`);
}
```

不要在此文件覆盖 `/auth/login` 等 API。垂直切片之后启动需要 `DATABASE_URL` 和 JWT 密钥：通过 `...process.env` 传入。没有数据库时本用例应失败并暴露启动错误，而不是跳过，也不得改成 `app.inject()`。

- [ ] **步骤 2：在未构建时运行以确认失败模式**

```bash
pnpm --filter @ai-butler/backend test:e2e
```

若尚未 `build`，预期 FAIL：找不到 `dist/main.js`。不要改测试去跑 `tsx src/main.ts`。

- [ ] **步骤 3：确保 main 在 PORT=0 时把实际地址打到 Fastify 日志**

保持 `createApp({ logger: true })`。不要为了 E2E 再注册一套新路由。

- [ ] **步骤 4：构建后运行 E2E**

```bash
pnpm --filter @ai-butler/backend build
pnpm --filter @ai-butler/backend test:e2e
```

预期：PASS；`afterEach` 不需要 `SIGKILL`。

- [ ] **步骤 5：Commit**

```bash
git add apps/backend/tests/shutdown.e2e.test.ts apps/backend/src/main.ts
git commit -m "$(cat <<'EOF'
test: 覆盖后端进程监听与信号退出

EOF
)"
```

---

### 任务 6：性能回归写入文档，默认不 enforce

**文件：**
- 修改：`apps/backend/benchmarks/http-overhead.ts`
- 修改：`apps/backend/benchmarks/http-overhead.test.ts`
- 修改：`apps/backend/package.json`
- 创建：`apps/backend/docs/performance-regression.md`

- [ ] **步骤 1：为报告格式化编写失败测试**

在现有 `apps/backend/benchmarks/http-overhead.test.ts` 追加：

```ts
import { formatPerformanceReport } from './http-overhead';

describe('formatPerformanceReport', () => {
  it('renders the measured result and the shared-CI policy', () => {
    const markdown = formatPerformanceReport({
      baselineRps: 10_000,
      frameworkP95Ms: 1.5,
      frameworkRps: 9200,
      nodeVersion: 'v24.16.0',
      overheadPercent: 8,
      p95DeltaMs: 0.5,
    });

    expect(markdown).toContain('# Fastify 后端性能回归');
    expect(markdown).toContain('v24.16.0');
    expect(markdown).toContain('10000');
    expect(markdown).toContain('9200');
    expect(markdown).toContain('8.00%');
    expect(markdown).toContain('0.500 ms');
    expect(markdown).toContain('共享 CI 只记录趋势，不作为硬门禁');
    expect(markdown).toContain('BENCHMARK_ENFORCE');
  });
});
```

- [ ] **步骤 2：运行测试验证失败**

```bash
pnpm exec vitest run --environment node apps/backend/benchmarks/http-overhead.test.ts
```

预期：FAIL，`formatPerformanceReport` 未导出。

- [ ] **步骤 3：实现报告函数，并让默认 benchmark 脚本写入 docs**

在 `apps/backend/benchmarks/http-overhead.ts` 导出：

```ts
export interface PerformanceReportInput {
  baselineRps: number;
  frameworkP95Ms: number;
  frameworkRps: number;
  nodeVersion: string;
  overheadPercent: number;
  p95DeltaMs: number;
}

export function formatPerformanceReport(input: PerformanceReportInput): string {
  return [
    '# Fastify 后端性能回归',
    '',
    `- Node: ${input.nodeVersion}`,
    `- 裸 Fastify RPS: ${input.baselineRps}`,
    `- 框架 RPS: ${input.frameworkRps}`,
    `- 吞吐损耗: ${input.overheadPercent.toFixed(2)}%`,
    `- p95 增量: ${input.p95DeltaMs.toFixed(3)} ms`,
    `- 框架 p95: ${input.frameworkP95Ms.toFixed(3)} ms`,
    '',
    '共享 CI 只记录趋势，不作为硬门禁。只有 `BENCHMARK_ENFORCE=true` 才会在预算失败时退出 1。',
    '',
  ].join('\n');
}
```

`run()` 在写入 `benchmarks/results/latest.json` 之后，用同一份测量结果调用 `formatPerformanceReport` 并写入 `docs/performance-regression.md`。仅当 `BENCHMARK_ENFORCE === 'true'` 且预算失败时设置 `process.exitCode = 1`。

确认脚本：

```json
{
  "benchmark": "tsx benchmarks/http-overhead.ts",
  "benchmark:check": "cross-env BENCHMARK_ENFORCE=true tsx benchmarks/http-overhead.ts"
}
```

`benchmark` 禁止带 `BENCHMARK_ENFORCE=true`。不要新增 CI job 把 `benchmark:check` 设为 required。

- [ ] **步骤 4：运行单元测试和本机基准**

```bash
pnpm exec vitest run --environment node apps/backend/benchmarks/http-overhead.test.ts
pnpm --filter @ai-butler/backend benchmark
```

预期：单元测试 PASS；即使 `budget.passed === false`，`benchmark` 退出码仍为 0。禁止通过关掉 TypeBox、日志或认证来美化对照。

- [ ] **步骤 5：Commit**

```bash
git add apps/backend/benchmarks/http-overhead.ts \
  apps/backend/benchmarks/http-overhead.test.ts \
  apps/backend/package.json \
  apps/backend/docs/performance-regression.md
git commit -m "$(cat <<'EOF'
perf: 记录框架开销趋势并写入文档

EOF
)"
```

不要提交 `benchmarks/results/*.json`。

---

### 任务 7：ADR 0008、设计状态与开发 README

**文件：**
- 创建：`apps/backend/docs/adr/0008-second-module-boundary.md`
- 创建：`apps/backend/README.md`
- 修改：`apps/backend/nodejs-fastify-framework-design.md`

- [ ] **步骤 1：先跑稳定化总验收命令并保存证据**

```bash
pnpm --filter @ai-butler/backend test
pnpm --filter @ai-butler/backend test:integration
pnpm --filter @ai-butler/backend build
pnpm --filter @ai-butler/backend test:e2e
pnpm --filter @ai-butler/backend typecheck
pnpm --filter @ai-butler/backend check:architecture
pnpm --filter @ai-butler/backend benchmark
```

预期：除本机趋势基准允许 `budget.passed === false` 外，其余退出码为 0。把每条命令的退出码记入 ADR，禁止编造。

- [ ] **步骤 2：编写 ADR 0008**

创建 `apps/backend/docs/adr/0008-second-module-boundary.md`：

```markdown
# ADR 0008：第二模块只暴露 Service 边界

**状态：** 接受

## 背景

规格里程碑 4 要求增加第二个业务模块，验证模块不得深层引用 internals。第一个真实切片已经是认证与用户；第二个模块必须足够小，只用来钉死跨模块依赖，而不是顺手做联系人产品。

## 决策

- 第二模块是 `login-audit`，只记录成功登录的 `userId`、`username`、`occurredAt`。
- `AuthService` 只能 import `modules/login-audit/login-audit.service.ts`。
- Drizzle 实现放在 `infrastructure/database/login-audit.repository.ts`，由 `createDependencies()` 装配。
- 管理员查询的授权 `preHandler` 由 `register-modules.ts` 注入 `requireRole('admin')`。
- HTTP 查询走 `GET /login-audit/events`，不进入 `framework/`。

## 替代方案

- 完整联系人模块：拒绝，因为会把稳定化变成第二个产品切片。
- 认证直接写审计表：拒绝，因为会让 `modules/auth` 依赖 database schema。
- 用 NATS 解耦：拒绝，第一阶段没有跨进程异步需求。
- 把审计放进 `framework/`：拒绝，审计是业务事件，不是框架能力。

## 后果

- 后续第三模块必须同样只依赖被导出的 Service 接口。
- `dependency-cruiser` 禁止 `modules/*` 引用彼此 internals，也禁止业务模块直接引用 `drizzle-orm` / `postgres`。
- Redis、NATS 和完整 OpenTelemetry 仍需单独规格，不由本模块引入。
```

把步骤 1 记录的真实退出码写进「后果」或提交说明，禁止编造数字。

- [ ] **步骤 3：更新设计文档状态并写 README**

将设计文档状态改为：

```markdown
**状态：第一阶段稳定化完成，分布式能力需单独规格**
```

在里程碑 4 下追加：`login-audit` 已作为第二模块接入；架构规则、故障路径、安全回归、进程 E2E 与性能趋势文档已落地。Redis、NATS 和完整 OpenTelemetry 不在本阶段交付。

创建 `apps/backend/README.md`：

````markdown
# @ai-butler/backend

AI Butler 第一阶段后端：Fastify 薄内核 + 认证/用户切片 + `login-audit`。

## 环境

- Node `^22.18.0 || ^24.12.0`（仓库锁 24.16.0）
- pnpm `>=11`
- 集成与 E2E 需要本机 Docker（Testcontainers / PostgreSQL 17）

复制 `apps/backend/.env.example` 到本地环境，不要把真实密钥提交进仓库。

## 命令

在仓库根目录执行：

```bash
pnpm --filter @ai-butler/backend dev
pnpm --filter @ai-butler/backend test
pnpm --filter @ai-butler/backend test:integration
pnpm --filter @ai-butler/backend test:e2e
pnpm --filter @ai-butler/backend typecheck
pnpm --filter @ai-butler/backend check:architecture
pnpm --filter @ai-butler/backend db:generate
pnpm --filter @ai-butler/backend db:migrate
pnpm --filter @ai-butler/backend benchmark
```

生产启动不自动执行破坏性迁移。`benchmark` 默认只写趋势文档；只有 `BENCHMARK_ENFORCE=true` 才会因预算失败退出 1。
````

- [ ] **步骤 4：静态检查与仓库状态**

```bash
pnpm --filter @ai-butler/backend typecheck
pnpm --filter @ai-butler/backend check:architecture
git diff --check
git status --short
```

预期：检查通过；本任务只包含 ADR、README、设计文档状态。确认 `apps/backend` 外没有新的服务端实现。

- [ ] **步骤 5：Commit**

```bash
git add apps/backend/docs/adr/0008-second-module-boundary.md \
  apps/backend/README.md \
  apps/backend/nodejs-fastify-framework-design.md
git commit -m "$(cat <<'EOF'
docs: 记录第二模块边界并关闭第一阶段稳定化

EOF
)"
```

---

## 规格覆盖对照

| 规格 | 本计划任务 |
| --- | --- |
| §5 单向依赖 / 模块不得深层引用 internals | 任务 2 |
| §6 显式 Service 接口、Fastify Plugin 模块 | 任务 1 |
| §7.2 关闭超时非零退出 | 任务 3、任务 5 |
| §8.1 / §9 错误响应不含 SQL、堆栈、密钥 | 任务 4 |
| §10 窄 Repository、显式迁移 | 任务 1、任务 7 |
| §12 日志脱敏 | 任务 4 |
| §14 Readiness 失败且不泄露连接串 | 任务 3 |
| §16.4 E2E 只覆盖进程 listen/信号 | 任务 5 |
| §16.5 架构静态检查 | 任务 2 |
| §17 性能预算与共享 CI 不硬阻断 | 任务 6 |
| §18 里程碑 4 | 任务 1–7 |
| §21 完成标准 | 任务 1、3、5、6、7 |
| §22.3 / §22.6 窄仓储、分布式能力另立项 | 任务 1、任务 7 |

## 最终完成条件

- 七个任务分别有独立提交。
- `login-audit` 不是联系人产品；`AuthService` 只依赖 `LoginAuditService`。
- `check:architecture` 覆盖全部依赖禁令；故意违规已删除且未提交。
- `/readyz` 失败时 503 且 body 无连接串；慢 close 后 `runShutdown` 返回 1。
- 未认证 `GET /user/info` 为 401；错误响应与日志不含 stack/SQL/secret。
- E2E 使用 `dist/main.js` + `PORT=0` + `SIGTERM` 退出 0。
- `benchmark` 默认不 enforce。
- ADR 0008、设计文档状态、`apps/backend/README.md` 已更新。
- 未引入 Redis、NATS、Kafka、完整 OpenTelemetry、CLI、OAuth2、DI Container，也未把代码放到 `apps/backend` 之外。

在垂直切片全部提交之前不要开始实现本计划。
