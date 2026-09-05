# Node.js + TypeScript + Fastify 后端框架设计

**版本：V0.2**

**状态：薄内核已实现，等待垂直切片计划**

**代码边界：所有服务端代码均存放在 `apps/backend`**

## 1. 背景与目标

本项目计划构建一套基于 Node.js、TypeScript 和 Fastify 的内部通用后端框架，第一阶段仅供当前 Monorepo 使用。

框架优先服务以下目标：

1. 为后续服务端应用提供统一的启动、配置、HTTP、错误、日志、测试和资源关闭能力。
2. 保持较低的运行时开销，不重复实现 Fastify 已有的插件封装和生命周期机制。
3. 通过“认证 + 用户 + PostgreSQL”真实业务切片验证框架抽象。
4. 以模块化单体作为未来 12 个月的主要部署形态，出现明确边界后再评估拆分服务。
5. 保持业务逻辑与 HTTP、数据库及其他基础设施的依赖边界。

## 2. 非目标

第一阶段明确不做以下事项：

- 不发布公共 npm 框架。
- 不将服务端公共能力拆到仓库根目录的 `packages/`。
- 不复制 NestJS 的装饰器、反射元数据和完整依赖注入体系。
- 不同时支持 JWT、API Key、OAuth2 和 Session。
- 不因未来可能替换技术而预先封装通用 ORM、缓存或消息接口。
- 不在没有业务需求时引入 Redis、NATS、Kafka 或完整 OpenTelemetry。
- 不开发 CLI、代码生成器和项目模板。

## 3. 核心设计原则

### 3.1 薄内核

优先复用 Fastify Plugin、封装作用域、Hook 和生命周期。自研框架层只解决应用装配、配置、错误、上下文、可观测性和资源关闭等跨模块问题。

### 3.2 真实需求驱动抽象

公共能力必须先被真实业务切片使用。只有出现重复模式、独立依赖边界或第二个消费者后，才进一步提取抽象。

### 3.3 显式依赖

依赖通过工厂函数和构造函数显式传递。禁止通过全局容器任意获取服务，第一阶段不实现 DI Container 和 Request Scope。

### 3.4 单向依赖

业务可以依赖框架和基础设施提供的接口，框架不能依赖业务。业务服务不能依赖 Fastify，领域逻辑不能依赖 Drizzle Client。

### 3.5 不承诺无成本替换

框架不承诺 Redis、NATS、Drizzle 或 Pino 可以任意替换，只保证业务核心不直接依赖具体客户端。只有真实替换需求出现后，才设计对应适配层。

## 4. 代码组织

所有服务端规划、框架、业务、迁移和测试代码统一放在 `apps/backend`：

```text
apps/backend/
├── nodejs-fastify-framework-design.md
├── package.json
├── src/
│   ├── main.ts
│   ├── app/
│   │   ├── create-app.ts
│   │   └── register-modules.ts
│   ├── framework/
│   │   ├── core/
│   │   ├── http/
│   │   ├── config/
│   │   ├── observability/
│   │   └── testing/
│   ├── infrastructure/
│   │   └── database/
│   └── modules/
│       ├── auth/
│       └── user/
├── migrations/
├── tests/
└── benchmarks/
```

该结构是目标结构，不代表当前已进入实现。

### 4.1 目录职责

- `app`：应用创建、模块装配和启动入口。
- `framework/core`：应用生命周期、资源关闭协调、请求上下文和基础错误定义。
- `framework/http`：Fastify 创建、路由约定、响应协议、错误映射、OpenAPI 和健康检查。
- `framework/config`：环境变量读取、Schema 校验和类型化配置。
- `framework/observability`：Pino、请求 ID、Trace ID 和基础指标。
- `framework/testing`：测试应用工厂、`app.inject()` 辅助能力和 Fixture。
- `infrastructure`：数据库等具体技术实现。
- `modules`：按业务能力组织的垂直模块。

第一阶段不将上述目录继续拆成多个 workspace 包。未来如需拆包，仍优先保留在 `apps/backend` 内，并以真实的隔离或复用需求作为依据。

## 5. 依赖规则

允许的主要依赖方向：

```text
main
  ↓
app composition
  ├── framework
  ├── infrastructure
  └── business modules

business controller → application service → repository interface
                                              ↑
                              infrastructure implementation
```

必须通过静态检查约束：

- `framework/**` 禁止引用 `modules/**`。
- Service 和领域代码禁止引用 `FastifyRequest`、`FastifyReply`。
- 业务核心禁止直接引用 Drizzle Client。
- Controller 禁止直接访问数据库。
- 模块不得通过深层路径访问其他模块的内部实现。
- 基础设施实现不得反向包含业务规则。

## 6. 模块与依赖装配

### 6.1 模块模型

业务模块直接使用 Fastify Plugin 作为 HTTP 注册和封装单元，不平行设计 `defineModule()` 元数据系统。

每个模块应明确：

- 提供哪些路由。
- 暴露哪些 Service 接口。
- 依赖哪些外部 Service 或 Repository。
- 初始化和关闭时是否持有资源。

模块间交互通过显式导出的 Service 接口完成，不访问对方内部文件。

### 6.2 依赖生命周期

- 数据库连接、日志器和业务 Service 默认为应用级单例。
- 禁止按请求创建数据库、Redis 或 NATS Client。
- 请求级信息使用 `AsyncLocalStorage` 保存。
- Request Context 只包含 `requestId`、`traceId`、认证主体等上下文，不存放业务服务。

## 7. 应用启动与关闭

### 7.1 启动顺序

```text
加载并校验配置
→ 创建日志器
→ 创建数据库连接
→ 创建 Fastify
→ 注册框架插件
→ 注册业务模块
→ 注册健康检查与 OpenAPI
→ fastify.ready()
→ 监听端口
```

配置或必要基础设施初始化失败时，应用必须快速退出，不能带病启动。

### 7.2 关闭顺序

每个持有资源的组件在创建时注册关闭函数。关闭时按注册的逆序执行：

```text
收到 SIGTERM / SIGINT
→ 标记未就绪
→ 停止接收新请求
→ 等待在途请求
→ 关闭 Fastify
→ 关闭数据库及其他资源
→ 退出进程
```

关闭流程必须有总超时。超时后记录尚未关闭的资源并以非零状态退出，避免容器无限挂起。

## 8. HTTP 与 Schema

标准请求链路：

```text
Fastify Route
→ TypeBox Validation
→ Controller
→ Service / Use Case
→ Repository
→ Drizzle
→ PostgreSQL
```

约束：

- Controller 仅负责读取协议输入、调用 Service 和构造协议输出。
- TypeBox 是 HTTP 输入、输出及 OpenAPI 的唯一 Schema 来源。
- 领域模型不强制复用 HTTP DTO，避免协议变化污染业务核心。
- Fastify Response Schema 应用于生产序列化，减少重复校验和序列化开销。

### 8.1 响应协议

与现有前端保持一致：

```json
{
  "code": 0,
  "data": {},
  "message": "success"
}
```

- 成功码固定为 `0`。
- 业务失败使用稳定、可文档化的非零错误码。
- HTTP 状态码表达传输语义，响应 `code` 表达业务语义。
- 错误响应不能包含 SQL、堆栈、密钥或内部实现信息。

## 9. 错误体系

错误分为三类：

1. 业务错误：预期内的规则失败，例如用户不存在、状态冲突。
2. 协议错误：输入校验、认证或授权失败。
3. 系统错误：数据库、网络、编程错误及其他未识别异常。

业务错误包含：

- 稳定错误码。
- 安全的客户端消息。
- 建议 HTTP 状态码。
- 可选的安全详情。
- 原始异常 `cause`。

HTTP 层统一完成错误到响应的映射。未识别异常统一返回内部错误，并记录完整异常及 `requestId`。

不要求将所有底层异常转换为大量细分类。只有业务确实需要区分并恢复时，才增加稳定错误类型。

## 10. 数据库与事务

默认技术路线：

- PostgreSQL。
- Drizzle。
- 应用级共享连接池。
- 显式迁移文件。

### 10.1 Repository

Repository 按业务能力定义窄接口，例如：

```text
findUserByEmail
saveUser
updateUserStatus
```

禁止创建隐藏查询能力的通用 CRUD Repository 基类，也不对 Drizzle API 做一比一包装。

### 10.2 事务

- 事务边界由应用 Service / Use Case 声明。
- Repository 可以接收事务上下文。
- Repository 不得私自开启无法被上层协调的事务。
- 涉及多个 Repository 的一致性操作必须处于同一事务边界。

### 10.3 迁移

- Schema 与迁移文件纳入版本控制。
- CI 验证迁移可以在空数据库执行。
- 集成测试验证关键升级路径。
- 生产应用启动时不自动执行破坏性迁移。
- 破坏性变更采用兼容发布、数据回填和后续清理的分阶段策略。

## 11. 配置

配置来源以环境变量为主：

```text
Environment Variables
→ TypeBox Schema Validation
→ Typed Config
→ Application
```

要求：

- 所有必要配置在启动阶段完成校验。
- 业务代码不直接读取 `process.env`。
- 配置对象默认只读。
- 密钥不写入仓库，不打印到日志。
- 配置错误必须包含配置项名称和修复方向，但不能暴露密钥值。

## 12. 日志与可观测性

第一阶段使用 Pino 提供结构化日志，至少包含：

- 时间与日志级别。
- 服务和环境标识。
- `requestId`。
- `traceId`（存在时）。
- 安全的用户标识（存在时）。
- 错误类型、消息和堆栈。

日志必须脱敏：

- 密码。
- Authorization。
- Cookie。
- Access Token 和 Refresh Token。
- 数据库连接串。
- 其他配置声明的敏感字段。

第一阶段不要求完整 OpenTelemetry 自动插桩，但 Request Context 和日志字段必须预留 Trace 关联能力。出现跨进程调用和分布式排障需求后，再引入 OpenTelemetry Adapter。

## 13. 认证与授权

真实垂直切片第一版仅实现 JWT，以验证认证边界，不同时实现其他认证方式。

```text
Authentication
→ Principal
→ Authorization Policy
→ Controller
```

要求：

- Authentication 与 Authorization 分离。
- 认证插件只负责解析和验证身份。
- RBAC 由显式授权策略执行。
- Controller 不能自行解析 Token。
- 密钥从环境变量或密钥服务加载并在启动时校验。
- 登录、刷新和退出流程必须与现有前端 Token 协议对齐。
- 认证失败不能泄露账号是否存在等敏感状态。

更复杂的 ABAC、OAuth2、API Key 和 Session 必须由后续需求触发。

## 14. 健康检查

健康检查拆分为：

- Liveness：进程和事件循环是否仍可工作，不依赖外部系统。
- Readiness：应用是否可接收业务流量，检查必要的数据库等依赖。

开始关闭后 Readiness 必须立即失败，使流量先从当前实例移除。

健康接口不能泄露连接串、内部地址、凭据或完整异常。

## 15. Redis、消息与分布式能力

这些能力不属于第一阶段薄内核的前置条件。

### 15.1 Redis

出现业务需求后，缓存、限流和分布式锁分别设计：

- 缓存需要 TTL、键规范、防穿透及失效策略。
- 限流需要主体、窗口、算法及故障策略。
- 分布式锁需要租约、续期、所有权和 fencing token 评估。

不能用一个模糊的 Cache API 同时承载三种语义。

### 15.2 NATS

只有出现跨进程异步任务或服务通信需求时才引入 NATS。

引入前必须明确：

- 消息投递语义。
- 幂等键。
- 重试和退避。
- 死信或失败处理方式。
- Schema 兼容策略。
- 消费者关闭与消息排空。

数据库状态与事件需要原子一致时采用 Outbox，禁止依赖“提交数据库后直接发送消息”的双写方式。

### 15.3 外部调用

- 所有网络调用必须配置超时。
- 只有可证明幂等的操作才能自动重试。
- 重试必须有次数上限、退避和抖动。
- 必须区分必要依赖和可降级依赖。

## 16. 测试策略

### 16.1 单元测试

- 测试 Service、策略和纯函数。
- 使用显式 Fake 或 Stub。
- 不启动 Fastify，不连接真实基础设施。

### 16.2 集成测试

- 测试 Repository、事务和迁移。
- 使用隔离的真实 PostgreSQL。
- 不使用行为差异明显的内存数据库代替 PostgreSQL。

### 16.3 API 测试

- 使用 `app.inject()`。
- 验证 TypeBox Schema、认证、授权、错误映射和响应契约。
- 一般 API 测试不启动真实 TCP Server。

### 16.4 E2E 测试

E2E 仅覆盖真实进程启动、监听、信号关闭和部署配置，不重复全部 API 测试。

### 16.5 架构与契约测试

- 静态验证依赖方向。
- 验证 `{ code, data, message }` 契约。
- 验证稳定错误码。
- 验证 OpenAPI 文档可生成且与路由一致。

## 17. 性能设计与验收

### 17.1 运行时原则

- HTTP 热路径保持轻量。
- 不在请求期间构建依赖图。
- 数据库等 Client 全局复用。
- 使用 Fastify Schema 完成验证和序列化。
- 生产日志避免同步阻塞输出。
- 避免为类型包装而增加无业务价值的对象分配。

### 17.2 基准场景

以同一环境中的裸 Fastify 为基线，分别测试：

1. 空 JSON 路由。
2. TypeBox 输入和输出 Schema 路由。
3. 含上下文、日志和统一响应的框架路由。
4. 认证与用户真实业务链路。

固定以下条件：

- Node.js 版本。
- CPU 和内存限制。
- 并发度。
- 预热与采样时间。
- 日志级别及输出目标。
- 数据库连接池配置。

### 17.3 性能预算

- 薄框架在空路由上的吞吐损耗不超过裸 Fastify 的 10%。
- 薄框架引入的 p95 延迟增量不超过 1 ms。
- 真实业务链路另行记录数据库和认证开销，不将其错误归因于框架层。

共享 CI Runner 只记录趋势，不作为硬阻断。固定性能环境中的显著预算回退才阻断发布。

## 18. 实施里程碑

本文仅定义后续路线，不代表已经批准进入开发。

### 里程碑 1：技术 PoC

验证：

- Fastify Plugin 与业务模块边界。
- TypeBox、Fastify Schema 与 OpenAPI 单一来源。
- 显式依赖装配。
- Request Context。
- 资源逆序关闭。
- 基础性能预算。

验收结果必须包含可运行 PoC、测试结果、基准数据和 ADR。

### 里程碑 2：可运行薄内核

范围：

- 配置校验。
- HTTP 与响应协议。
- 错误映射。
- 请求上下文。
- Pino 日志及脱敏。
- OpenAPI。
- Liveness、Readiness。
- Graceful Shutdown。
- `app.inject()` 测试工具。

### 里程碑 3：真实垂直切片

范围：

- PostgreSQL 和 Drizzle。
- Schema 与迁移。
- 认证模块。
- 用户模块。
- Repository 和事务边界。
- 与现有前端响应及 Token 契约对齐。

只有经过该切片验证的重复模式，才可以提升为框架公共约定。

### 里程碑 4：稳定化

范围：

- 增加第二个业务模块验证边界。
- 架构依赖检查。
- 故障路径和关闭测试。
- 安全检查。
- 性能回归。
- 完善 ADR 和开发文档。

Redis、NATS 和完整 OpenTelemetry 必须由明确业务需求单独立项。

## 19. 技术决策

| 技术或方向 | 决策 | 说明 |
| --- | --- | --- |
| Node.js | 采用 | 使用仓库统一支持的 Node.js 版本 |
| TypeScript Strict | 采用 | 启用严格类型检查 |
| Fastify | 采用 | HTTP、插件封装和生命周期基础 |
| TypeBox | 采用 | HTTP Schema、校验和 OpenAPI 来源 |
| PostgreSQL | 采用 | 默认关系数据库 |
| Drizzle | 采用 | 数据访问和迁移技术 |
| Pino | 采用 | 结构化日志 |
| Vitest | 采用 | 单元、集成和 API 测试 |
| 构造函数/工厂注入 | 采用 | 第一阶段显式装配依赖 |
| 自研 DI Container | 暂不采用 | 等真实作用域和 Provider 需求出现 |
| 自研 Module 元数据 | 不采用 | 复用 Fastify Plugin |
| Redis | 延后 | 由缓存、限流或锁的真实需求触发 |
| NATS | 延后 | 由跨进程异步需求触发 |
| OpenTelemetry | 延后完整接入 | 第一阶段只预留上下文边界 |
| 模块化单体 | 采用 | 未来 12 个月主要部署形态 |
| 公共 npm 发布 | 不采用 | 第一阶段仅限当前 Monorepo |

## 20. PoC 验证清单

进入正式框架实现前，PoC 必须回答：

1. Fastify Plugin 能否完整承担模块注册、封装和依赖顺序。
2. 显式工厂能否满足应用级单例和测试替换。
3. `AsyncLocalStorage` 在请求、异常和异步调用中是否保持上下文。
4. TypeBox Schema 能否同时驱动校验、序列化和 OpenAPI。
5. 错误映射是否能稳定输出前端响应契约。
6. 数据库事务上下文能否跨多个 Repository 协调。
7. 关闭流程能否停止流量、等待在途请求并逆序释放资源。
8. 框架热路径是否满足性能预算。
9. 测试应用能否按需替换依赖且不启动 TCP Server。
10. 目录和导入规则能否通过自动检查持续约束。

每一项必须以测试、基准或最小实验结果作答，不能仅凭设计推断。

## 21. 完成标准

一项框架能力只有同时满足以下条件才视为完成：

- 至少被一个真实业务切片使用。
- 有明确职责、公共接口和依赖方向。
- 具有正常、异常和资源关闭测试。
- 有文档化的错误及运维行为。
- 有性能结果，或已证明不处于请求热路径。
- 关键取舍已记录为 ADR。

## 22. 主要风险及控制

### 22.1 重复建设成熟框架能力

控制方式：优先复用 Fastify Plugin 和 Hook；新增框架 API 前必须记录 Fastify 原生能力不足之处。

### 22.2 过度拆包

控制方式：第一阶段维持 `apps/backend` 单一 workspace 和目录级边界，只在真实隔离需求出现后拆包。

### 22.3 Repository 成为低能力 ORM

控制方式：仅定义业务需要的窄接口，不建设通用 CRUD 基类。

### 22.4 为可替换性制造无效抽象

控制方式：只隔离业务与具体 Client，不提前承诺技术可无成本替换。

### 22.5 性能目标缺乏证据

控制方式：以裸 Fastify 为可重复基线，分别衡量框架和真实业务链路。

### 22.6 分布式能力过早引入

控制方式：Redis、NATS 和完整 OpenTelemetry 均设置业务需求触发条件。

## 23. 结论

最终路线为：

```text
Fastify 原生机制
→ apps/backend 内的薄框架内核
→ 认证 + 用户 + PostgreSQL 真实垂直切片
→ 根据真实重复点形成公共约定
→ 第二个业务模块验证稳定性
→ 按需求引入分布式能力
```

框架建设的核心不是增加抽象数量，而是在保持 Fastify 性能和机制优势的前提下，提供可验证的工程边界、统一行为和长期维护能力。

在新的实现计划获得单独批准前，本项目保持在设计阶段。
