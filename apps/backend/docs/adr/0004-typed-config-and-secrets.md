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
