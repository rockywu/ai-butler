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
