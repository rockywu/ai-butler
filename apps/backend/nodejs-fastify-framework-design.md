# Node.js + TypeScript 高性能通用后端框架设计规划

**版本：V0.1**  
**状态：设计规划 / 待技术验证**  
**目标：构建一套基于 Node.js + TypeScript + Fastify 的企业级、模块化、高性能通用后端基础框架**

---

## 一、项目目标

本项目不是简单搭建一个业务 API 服务，而是规划一套可长期维护、可复用、可扩展的 Node.js 通用后端基础框架。

核心目标：

1. 使用 TypeScript 作为主要开发语言。
2. 使用 Fastify 作为 HTTP/Web 核心。
3. 保持较高的运行性能和较低的框架开销。
4. 提供类似企业级框架的工程化能力。
5. 将 HTTP、业务架构、数据库、缓存、消息、日志、认证、可观测性等能力模块化。
6. 支持未来多个业务项目复用。
7. 避免强绑定 NestJS，保留底层架构自主控制能力。
8. 通过 Monorepo 管理基础包和业务应用。

---

# 二、总体技术路线

最终采用：

```text
                    Application
                         │
          ┌──────────────┴──────────────┐
          │                             │
     Controller                      Service
          │                             │
          └──────────────┬──────────────┘
                         │
                    Repository
                         │
          ┌──────────────┼──────────────┐
          │              │              │
       Drizzle         Redis           NATS
          │              │              │
     PostgreSQL         Cache            MQ


──────────────────────────────────────────────

              Framework Layer

 Core / Module / DI / Config / Auth
 Error / Event / Lifecycle / Validation
                     │
                     ▼
                  Fastify
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
        Pino      TypeBox   OpenTelemetry

──────────────────────────────────────────────

                  Node.js
                TypeScript
```

---

# 三、核心技术选型

## 3.1 Runtime

### Node.js

作为默认生产运行环境。

选择原因：

- 成熟
- 生态完善
- TypeScript 支持成熟
- 企业部署环境普遍
- Fastify 生态完善
- 长期维护成本可控

暂不以 Bun 作为生产运行时。

---

## 3.2 Programming Language

### TypeScript

项目原则：

```text
TypeScript First
Strict Mode
```

建议开启：

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

目标：

- 编译期类型安全
- API 类型安全
- 数据访问类型安全
- 配置类型安全
- 减少运行时错误

---

# 四、HTTP 核心：Fastify

## 4.1 定位

Fastify 负责：

- HTTP Server
- Router
- Request
- Response
- Hooks
- Plugin
- 生命周期
- Schema Validation
- HTTP 层性能

Fastify 不直接承担业务架构。

---

## 4.2 原则

Controller 不直接操作数据库。

不推荐：

```text
HTTP
 ↓
Controller
 ↓
Database
```

推荐：

```text
HTTP
 ↓
Controller
 ↓
Service
 ↓
Repository
 ↓
Database
```

---

# 五、数据校验：TypeBox

选择：

```text
TypeBox
```

主要原因：

1. 与 Fastify JSON Schema 模型天然匹配。
2. TypeScript 类型推导优秀。
3. 支持运行时校验。
4. 可以作为 OpenAPI Schema 基础。
5. 避免 TypeScript 类型与运行时 Schema 分离。

目标：

```text
TypeBox
   ↓
JSON Schema
   ↓
Fastify Validation
   ↓
OpenAPI
```

---

# 六、数据库：PostgreSQL + Drizzle

## 6.1 PostgreSQL

默认主数据库。

原因：

- 成熟
- 稳定
- SQL 能力强
- 事务能力完善
- 企业级生态成熟
- 适合长期项目

---

## 6.2 Drizzle

选择：

```text
Drizzle ORM
```

原因：

- TypeScript 原生体验好
- 轻量
- SQL 表达能力强
- 类型安全
- 与底层框架组合灵活

架构：

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
Drizzle
    ↓
PostgreSQL
```

Repository 层负责隔离数据库实现。

业务层不应该直接依赖 Drizzle API。

---

# 七、缓存：Redis

推荐：

```text
Redis
ioredis
```

主要用途：

- Cache
- Session
- Distributed Lock
- Rate Limit
- 临时数据
- 分布式状态
- Queue 辅助

架构：

```text
Service
   ↓
Cache
   ↓
Redis
```

后续可以封装：

```text
@framework/cache
```

统一缓存 API。

---

# 八、消息系统：NATS

默认消息系统候选：

```text
NATS
```

适用于：

- Domain Event
- 异步任务
- 服务间通信
- 消息通知
- 微服务事件

暂不强制引入 Kafka。

如果未来出现：

- 超大规模事件流
- 数据管道
- 日志流
- 大规模消息持久化

再评估 Kafka。

---

# 九、日志系统：Pino

使用：

```text
Pino
```

Fastify 原生生态支持良好。

日志要求：

- JSON Structured Logging
- Request ID
- Trace ID
- Error Stack
- Log Level
- Production/Development 模式

目标日志结构：

```json
{
  "level": 30,
  "time": 1788500000000,
  "requestId": "abc123",
  "traceId": "trace123",
  "msg": "request completed"
}
```

---

# 十、可观测性：OpenTelemetry

引入：

```text
OpenTelemetry
```

统一追踪：

```text
HTTP
 ↓
Controller
 ↓
Service
 ↓
PostgreSQL
 ↓
Redis
 ↓
NATS
```

目标：

- Trace
- Span
- Metrics
- Logs 关联
- Request ID
- Trace ID

未来可以接入：

- Grafana
- Jaeger
- Grafana Tempo
- Datadog

---

# 十一、API 文档：OpenAPI + Swagger

目标：

```text
TypeBox
   ↓
Fastify Schema
   ↓
OpenAPI
   ↓
Swagger UI
```

原则：

> API Schema 尽可能只维护一份。

避免：

```text
TypeScript Type
+
Validation Schema
+
Swagger Schema
```

三份重复定义。

---

# 十二、认证与权限：Auth Framework

设计独立模块：

```text
@framework/auth
```

支持：

```text
JWT
API Key
OAuth2
Session
```

权限体系：

```text
Authentication
       ↓
Authorization
       ↓
RBAC / ABAC
       ↓
Controller
```

---

# 十三、配置系统：Config

设计：

```text
@framework/config
```

配置来源：

```text
Environment Variables
        ↓
Schema Validation
        ↓
Typed Config
        ↓
Application
```

例如：

```text
APP_ENV
PORT
DATABASE_URL
REDIS_URL
NATS_URL
JWT_SECRET
```

启动阶段必须完成配置校验。

配置错误应在 Application 启动阶段直接失败，而不是运行过程中才发现。

---

# 十四、错误处理

设计统一错误体系：

```text
@framework/errors
```

建议：

```text
FrameworkError
├── ValidationError
├── AuthenticationError
├── AuthorizationError
├── NotFoundError
├── ConflictError
├── DatabaseError
└── InternalServerError
```

HTTP 层统一转换：

```text
Domain Error
      ↓
Framework Error
      ↓
HTTP Error Response
```

避免业务代码直接操作：

```text
reply.status(...)
```

---

# 十五、DI（Dependency Injection）

初期不强制引入复杂 DI。

第一阶段可以使用明确的构造函数注入：

```typescript
class UserService {
  constructor(
    private readonly userRepository: UserRepository
  ) {}
}
```

未来如果框架出现：

- Singleton
- Request Scope
- Factory Provider
- Lifecycle
- Module Provider

等需求，再设计统一 DI Container。

原则：

> 不为了模仿 NestJS 而引入复杂 DI。

---

# 十六、Module 系统

设计自己的 Module 机制。

目标结构：

```text
Application
├── AuthModule
├── UserModule
├── OrderModule
└── PaymentModule
```

Module 负责：

- 注册 Controller
- 注册 Service
- 注册 Repository
- 注册 Provider
- 注册 Plugin
- 管理依赖关系

示例：

```typescript
export const UserModule = defineModule({
  providers: [
    UserService,
    UserRepository
  ],
  controllers: [
    UserController
  ]
})
```

具体 API 待后续设计。

---

# 十七、生命周期

Framework 需要统一生命周期：

```text
create
  ↓
configure
  ↓
register
  ↓
initialize
  ↓
ready
  ↓
start
  ↓
running
  ↓
shutdown
```

关闭阶段：

```text
SIGTERM
   ↓
Stop Accepting Requests
   ↓
Drain Connections
   ↓
Close NATS
   ↓
Close Redis
   ↓
Close Database
   ↓
Exit
```

必须考虑 Graceful Shutdown。

---

# 十八、测试：Vitest

选择：

```text
Vitest
```

测试层次：

```text
Unit Test
Integration Test
API Test
E2E Test
```

Fastify API 测试优先使用：

```typescript
app.inject()
```

避免普通 API 测试必须启动真实 TCP Server。

---

# 十九、项目管理：pnpm Monorepo

推荐：

```text
pnpm workspace
```

整体结构：

```text
project/
│
├── apps/
│   └── api/
│
├── packages/
│   ├── core/
│   ├── http/
│   ├── config/
│   ├── validation/
│   ├── database/
│   ├── cache/
│   ├── logger/
│   ├── auth/
│   ├── events/
│   ├── observability/
│   └── testing/
│
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.json
```

---

# 二十、Framework Package 设计

建议第一阶段拆分：

```text
@framework/core
```

负责：

- Application
- Module
- Lifecycle
- Provider
- Error
- Context

---

```text
@framework/http
```

负责：

- Fastify
- Router
- HTTP Context
- HTTP Lifecycle
- HTTP Adapter

---

```text
@framework/config
```

负责：

- Environment
- Config Schema
- Typed Config

---

```text
@framework/validation
```

负责：

- TypeBox
- Validation
- Schema

---

```text
@framework/database
```

负责：

- Drizzle
- Database Connection
- Transaction
- Repository 基础能力

---

```text
@framework/cache
```

负责：

- Redis
- Cache
- Lock
- Rate Limit

---

```text
@framework/logger
```

负责：

- Pino
- Structured Logging
- Request ID
- Trace ID

---

```text
@framework/auth
```

负责：

- Authentication
- Authorization
- JWT
- RBAC

---

```text
@framework/events
```

负责：

- Event Bus
- NATS
- Domain Event

---

```text
@framework/observability
```

负责：

- OpenTelemetry
- Trace
- Metrics
- Instrumentation

---

```text
@framework/testing
```

负责：

- Test Utilities
- Fastify Test App
- Mock
- Fixture

---

# 二十一、推荐的业务项目结构

```text
apps/api/
│
├── src/
│   ├── main.ts
│   │
│   ├── app/
│   │   └── app.module.ts
│   │
│   └── modules/
│       │
│       ├── user/
│       │   ├── user.controller.ts
│       │   ├── user.service.ts
│       │   ├── user.repository.ts
│       │   ├── user.schema.ts
│       │   └── user.module.ts
│       │
│       ├── auth/
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   └── auth.module.ts
│       │
│       └── order/
│           ├── order.controller.ts
│           ├── order.service.ts
│           ├── order.repository.ts
│           └── order.module.ts
│
└── tests/
```

---

# 二十二、完整请求链路

标准 HTTP 请求：

```text
Client
  │
  ▼
Fastify
  │
  ▼
Request ID
  │
  ▼
OpenTelemetry
  │
  ▼
Authentication
  │
  ▼
Authorization
  │
  ▼
Validation
  │
  ▼
Controller
  │
  ▼
Service
  │
  ├──────────────┐
  ▼              ▼
Cache         Repository
  │              │
 Redis         Drizzle
                 │
             PostgreSQL
  │
  ▼
Response
```

---

# 二十三、性能设计原则

核心原则：

### 1. HTTP 层保持轻量

不要在 Fastify 上堆叠大量无意义抽象。

### 2. 避免重复序列化

尽可能使用 Fastify Schema。

### 3. 避免过度 DI

DI 主要服务于可维护性，不应成为每个请求的额外负担。

### 4. Repository 与数据库连接池复用

禁止请求级创建 Database Client。

### 5. Redis Client 全局复用

禁止每次请求创建 Redis Connection。

### 6. NATS Connection 长连接

Application 生命周期统一管理。

### 7. 日志异步化

避免同步 IO 阻塞事件循环。

### 8. Graceful Shutdown

生产环境必须支持容器编排环境下的安全退出。

---

# 二十四、架构原则

## 原则 1：Framework 与 Business 分离

```text
Framework
    ↓
Infrastructure
    ↓
Business
```

业务代码不能反向污染 Framework。

---

## 原则 2：HTTP 与 Domain 分离

业务逻辑不能依赖：

```text
FastifyRequest
FastifyReply
```

Service 应保持 HTTP 无关。

---

## 原则 3：数据库与业务隔离

业务层不直接依赖：

```text
Drizzle API
```

通过 Repository 隔离。

---

## 原则 4：基础设施模块化

未来可以替换：

```text
Redis → Other Cache
NATS → Kafka
Drizzle → Other ORM
Pino → Other Logger
```

不应该导致业务层大规模修改。

---

# 二十五、第一阶段 MVP

第一阶段不要一次实现全部能力。

建议：

```text
Phase 1
├── TypeScript
├── Fastify
├── TypeBox
├── Pino
├── Config
├── Error Handling
├── Module
├── Lifecycle
└── Vitest
```

先形成最小 Framework。

---

# 二十六、第二阶段

```text
Phase 2
├── PostgreSQL
├── Drizzle
├── Repository
├── Redis
├── Cache
└── OpenAPI
```

---

# 二十七、第三阶段

```text
Phase 3
├── Authentication
├── Authorization
├── JWT
├── RBAC
├── NATS
└── Event Bus
```

---

# 二十八、第四阶段

```text
Phase 4
├── OpenTelemetry
├── Metrics
├── Distributed Trace
├── Health Check
├── Readiness
└── Graceful Shutdown
```

---

# 二十九、第五阶段

```text
Phase 5
├── CLI
├── Code Generator
├── Project Template
├── Documentation
├── Testing Utilities
└── Developer Experience
```

最终目标：

```bash
framework create my-project
```

生成：

```text
my-project/
├── apps/
├── modules/
├── config/
└── tests/
```

---

# 三十、最终目标

最终形成：

```text
                @framework/core
                       │
        ┌──────────────┼──────────────┐
        │              │              │
     @http          @config       @validation
        │              │              │
        └──────────────┼──────────────┘
                       │
                    Fastify
                       │
        ┌──────────────┼──────────────┐
        │              │              │
     Database         Cache         Events
        │              │              │
     Drizzle          Redis          NATS
        │
   PostgreSQL

        ┌────────────────────────────┐
        │       Observability        │
        │       OpenTelemetry        │
        └────────────────────────────┘
```

框架最终应该做到：

> **业务项目只关心业务，Framework 负责基础设施和工程规范。**

---

# 三十一、关键决策记录

| 技术 | 决策 | 原因 |
|---|---|---|
| Node.js | 采用 | 成熟、生态完善 |
| TypeScript | 采用 | 类型安全、工程化 |
| Fastify | 采用 | 性能、插件体系、Schema |
| NestJS | 不作为核心 | 抽象较重，不作为底层核心 |
| Hono | 暂不采用 | 更偏轻量、多运行时 |
| Elysia | 暂不采用 | 强绑定 Bun |
| Express | 不采用 | 新项目性能和现代化程度不是最优 |
| TypeBox | 采用 | Fastify/JSON Schema 结合 |
| PostgreSQL | 采用 | 企业级关系数据库 |
| Drizzle | 采用 | 轻量、TypeScript、SQL 能力 |
| Redis | 采用 | Cache/Lock/Session 等 |
| Pino | 采用 | 高性能结构化日志 |
| NATS | 候选采用 | 高性能事件与消息 |
| OpenTelemetry | 采用 | 统一可观测性 |
| Vitest | 采用 | TypeScript 测试体验 |
| pnpm | 采用 | Monorepo |

---

# 三十二、当前待验证事项

在正式进入开发前，需要进一步验证：

1. Fastify Plugin 架构如何映射到 Framework Module。
2. Module 的依赖关系设计。
3. DI 是否需要独立 Container。
4. Request Scope 如何实现。
5. TypeBox 与 OpenAPI 的完整集成方案。
6. Drizzle Repository 抽象边界。
7. Redis Cache API 设计。
8. NATS Event Bus API 设计。
9. OpenTelemetry 自动 Instrumentation。
10. Fastify 与 Framework Lifecycle 的映射。
11. 错误体系和 HTTP Error Response 标准。
12. Graceful Shutdown 实现。
13. CLI 和代码生成器设计。
14. Monorepo Build Pipeline。
15. 单元测试、集成测试、E2E 测试边界。

---

# 三十三、设计结论

本项目最终技术路线确定为：

```text
Node.js
+
TypeScript
+
Fastify
+
TypeBox
+
PostgreSQL
+
Drizzle
+
Redis
+
Pino
+
NATS
+
OpenTelemetry
+
Vitest
+
pnpm Monorepo
```

核心思想：

> **以 Fastify 作为高性能 HTTP 内核，以自研 Framework Layer 提供企业级工程能力。**

不直接复制 NestJS 的架构，而是吸收其工程化思想，同时保持：

- 更低的抽象成本
- 更高的性能
- 更强的模块化
- 更好的基础设施可替换性
- 更强的 Framework 自主控制能力

该文档作为后续技术设计、PoC、架构评审和正式开发的基础规划文档。
