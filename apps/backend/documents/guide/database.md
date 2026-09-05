# 数据库操作

`DATABASE_URL` 已进入 `AppConfig`。`createApp` 在该值存在且未 `skipDatabase` 时建连、fail-fast ping，并把连接注册进 `ResourceRegistry`。`/readyz` 会跑 `select 1`。单元测试通过 `createTestApp` 跳过真实数据库，`/test` 走内存仓库。

## 技术栈

- PostgreSQL 17+（本机开发可用 18.6）
- Drizzle ORM + `postgres`（postgres.js）
- 迁移目录：`apps/backend/migrations/`
- 配置：`apps/backend/drizzle.config.ts`

## Schema

文件：`src/infrastructure/database/schema.ts`。

| 表 | 列 | 说明 |
| --- | --- | --- |
| `poc_accounts` | `id` text PK，`balance` integer NOT NULL | 账户（PoC） |
| `poc_audit_logs` | `id` text PK，`account_id` → `poc_accounts.id`，`event` text NOT NULL | 审计（PoC） |
| `test` | `id` integer 自增 PK，`key` varchar(50)，`value` jsonb | 测试 CRUD |

对应 SQL 在 `migrations/0000_poc_accounts.sql`。

```ts
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
```

## 建连

```ts
import postgres from 'postgres';

import { createDatabase } from './client';

const sql = postgres(process.env.DATABASE_URL!);
const database = createDatabase(sql);
```

`createDatabase(client)` 返回带 schema 的 Drizzle 实例。

类型：

| 类型 | 含义 |
| --- | --- |
| `Database` | 连接级 Drizzle 实例 |
| `Transaction` | `database.transaction` 回调里的 `tx` |
| `DatabaseExecutor` | `Database \| Transaction`，Repository 统一收这个 |

**只有** `infrastructure` 与 drizzle-kit 可以接触 `postgres` / `DATABASE_URL`。业务 Service 只依赖自己定义的 Repository 接口。

## Repository

窄方法，不包一层通用 CRUD。

`account.repository.ts`：

| 函数 | 行为 |
| --- | --- |
| `createAccount(executor, { id, balance })` | insert |
| `listAccounts(executor)` | select，按 `id` 升序 |

`audit.repository.ts`：

| 函数 | 行为 |
| --- | --- |
| `appendAudit(executor, { id, accountId, event })` | insert |
| `listAudits(executor)` | select，按 `id` 升序 |

调用时把 `database` 或 `tx` 传进去：

```ts
await createAccount(database, { id: 'acc-1', balance: 100 });
const rows = await listAccounts(database);
```

## 事务

事务由应用 Service / 用例声明，Repository 不得私自开无法被上层协调的事务。

```ts
await database.transaction(async (tx) => {
  await createAccount(tx, { id: 'acc-1', balance: 10 });
  await appendAudit(tx, {
    id: 'log-1',
    accountId: 'acc-1',
    event: 'opened',
  });
});
```

集成测试 `transaction.integration.test.ts` 用 Testcontainers `postgres:17-alpine` 验证：同一事务里写账户和审计后抛错，回滚后两张表都为空。

跑集成测试：

```bash
pnpm --filter @ai-butler/backend test:integration
```

需要本机 Docker（Testcontainers 拉 PostgreSQL 镜像）。

## 迁移

```bash
# 按 schema.ts 生成 SQL 与 journal
pnpm --filter @ai-butler/backend db:generate

# 对 DATABASE_URL 指向的库执行迁移
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/ai_butler \
  pnpm --filter @ai-butler/backend db:migrate
```

`drizzle.config.ts` 读取 `process.env.DATABASE_URL ?? ''`。空字符串无法连库，执行 migrate 前必须先导出真实 URL。

生产启动**不会**自动跑破坏性迁移。把 SQL 和 `migrations/meta/_journal.json` 纳入版本控制。

## 新增一张表

1. 在 `schema.ts` 增加 `pgTable(...)`，并加入 `schema` 导出
2. 运行 `db:generate`，检查新的 `migrations/000x_*.sql`
3. 新增 `src/infrastructure/database/<entity>.repository.ts`，参数类型用 `DatabaseExecutor`
4. 在模块侧定义窄接口，由 `createXxxService(repo)` 注入
5. 用 Testcontainers 写集成测试（可复制 `transaction.integration.test.ts` 的建库 / migrate 模板）

不要在 Plugin 里直接调 Drizzle。等垂直切片把数据库接入 `createApp` 之后，再把连接失败映射成 `/readyz` 的 `HealthChecker`。
