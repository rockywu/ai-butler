# 2026-09-02 单仓库迁移记录

## 来源

- 外层仓库：`71632a714ac5f3b519418d5c9eb7284ef833ca7f`
- Web 子模块工作树：`feature-aihk`，`50f484390a921a7c3f2586f6defeae61c30d9fc5`

迁移使用 Web 子模块的实际工作树，不使用外层仓库记录的旧 submodule 指针。

## 目标

- 路径：`/Users/wujialei/workspaces/butler/ai-butler-app`
- 默认分支：`main`
- Git 历史：全新初始化
- 远端：本阶段不配置

## 备份

旧仓库 bundle 和状态快照保存在：

`/Users/wujialei/workspaces/butler/ai-butler-migration-backup-2026-09-02`

## 迁入内容

- Vben monorepo 完整源码和当前 AI Butler 业务页面
- `ui-demo`
- 架构规格和实现计划
- 改写后的仓库规则

## 排除内容

- 旧 Git 与 submodule 元数据
- 依赖、缓存和构建产物
- brainstorming 临时状态
- 上游 GitHub 工作流

## 验证

迁移验收执行 `node scripts/repository/validate-product-root.mjs`、`pnpm check`、`pnpm test:unit` 和 `pnpm build:antd`。

## 基线修复

- 旧 Web 工作树在 `apps/web-antd/src/views/ai-butler/chat/index.vue` 中使用 `v-show` 保护可能为空的 `activeConv`，`vue-tsc` 无法据此收窄类型。新仓将该详情容器改为 `v-if`，使空状态不渲染并恢复类型检查；未修改业务数据或接口。
- 旧工作树的 `UnwrappableZodType` 未加入 cspell 词典。新仓在 `cspell.json` 增加 `unwrappable`，使既有标识符通过拼写检查。
- 初始提交的 pre-commit 钩子对部分业务视图进行了格式化换行重排；这些差异不改变业务语义。
