---
layout: home
hero:
  name: AI Butler Backend
  text: Fastify 薄内核使用文档
  tagline: 在 apps/backend 内编写业务模块、路由、配置与数据库操作。
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 查看路由
      link: /guide/routes
features:
  - title: 路由
    details: 现有 /livez、/readyz、/poc/* 与 OpenAPI 文档端点，以及如何新增业务路由。
  - title: 业务逻辑
    details: Plugin → Service → Repository 单向依赖。Service 不碰 Fastify 与 Drizzle。
  - title: 数据库
    details: Drizzle + PostgreSQL 的 Schema、Repository、事务与迁移。当前尚未接入启动链路。
---
