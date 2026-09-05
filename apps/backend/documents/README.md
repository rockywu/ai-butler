# 后端使用文档

本目录是 `@ai-butler/backend` 的使用文档（Markdown + VitePress）。

## 启动文档站

在仓库根目录：

```bash
pnpm docs:backend
```

或在 `apps/backend`：

```bash
pnpm docs:dev
```

浏览器打开 [http://127.0.0.1:5174/](http://127.0.0.1:5174/)。

## 文档结构

| 页面 | 内容 |
| --- | --- |
| [快速开始](./guide/getting-started.md) | 环境、配置、启动 |
| [架构与分层](./guide/architecture.md) | 启动关闭、依赖规则 |
| [路由与接口](./guide/routes.md) | 现有路由与错误码 |
| [业务逻辑](./guide/logic.md) | 如何新增模块与 Service |
| [数据库操作](./guide/database.md) | Schema、Repository、事务、迁移 |
| [测试与验证](./guide/testing.md) | inject、集成测试、脚本 |
