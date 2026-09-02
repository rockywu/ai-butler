# 2026-09-02 框架迁移任务日志

## 任务目标

将原外层仓库与 `client-web` Git 子模块整理为一个全新的 AI Butler（阿斯系统）单仓库：

- 目标目录：`/Users/wujialei/workspaces/butler/ai-butler-app`
- 默认分支：`main`
- Git 历史：全新初始化
- 远端仓库：本阶段不配置
- 旧仓库：保留，不删除、不改写

## 输入版本

- 外层仓库提交：`71632a714ac5f3b519418d5c9eb7284ef833ca7f`
- Web 子模块分支：`feature-aihk`
- Web 子模块提交：`50f484390a921a7c3f2586f6defeae61c30d9fc5`
- 执行计划：`docs/superpowers/plans/2026-09-02-single-repository-migration.md`

## 已完成任务

### 1. 冻结与备份

- 校验两个源仓库的提交和工作树状态；
- 确认使用 `client-web` 实际工作树，而不是外层仓库记录的旧 submodule 指针；
- 生成两个完整 Git bundle；
- 保存提交、状态和文件清单。

备份目录：

`/Users/wujialei/workspaces/butler/ai-butler-migration-backup-2026-09-02`

### 2. 组装新仓库

- 将 Vben monorepo 内容提升到新仓库根目录；
- 迁入 `ui-demo`、架构规格和实施计划；
- 复制本地 `.cursor/skills`，并继续保持 Git 忽略；
- 排除旧 Git、submodule、依赖、缓存、构建产物和 brainstorming 临时文件；
- 使用 rsync checksum 模式校验源文件复制结果。

### 3. 规范化项目配置

- 根 package 改为 `ai-butler@0.1.0`；
- 根 package 设置为私有 `UNLICENSED`；
- 删除失效的上游应用开发、构建脚本；
- 从 pnpm workspace 删除已裁剪的 `docs` 应用；
- 产品标题改为 `AI Butler（阿斯系统）`；
- 应用命名空间改为 `ai-butler`；
- 生产 API 地址从 Vben Mock 改为同源 `/api`；
- 新建 `ai-butler.code-workspace`；
- 删除旧 `vben-admin.code-workspace`。

### 4. 许可证与发布安全

- 根产品代码标记为 `UNLICENSED`；
- 主应用 `@vben/web-antd` 设置为 `private: true` 和 `UNLICENSED`；
- 移除主应用中的 Vben homepage、bugs、repository 和 author 元数据；
- Vben MIT 原文迁移到 `LICENSES/VBEN-MIT.txt`；
- 新建 `NOTICE.md` 保存第三方来源声明；
- changeset 发布范围改为 `restricted`；
- changeset 不再引用上游 GitHub changelog。

### 5. 文档与规则

- 重写产品 `README.md`；
- 重写 `CLAUDE.md` 的仓库定位、目录和命令约定；
- 删除 submodule、Makefile 和 `client-web/` 路径说明；
- 保存骨架设计、完整桌面端设计、迁移计划和迁移记录；
- 新建可执行的产品根结构验证器。

### 6. 基线修复

迁移验证发现两个源仓库已有问题：

- `chat/index.vue` 使用 `v-show` 保护可能为空的 `activeConv`，`vue-tsc` 无法完成类型收窄。新仓改为 `v-if`；
- `UnwrappableZodType` 未加入 cspell 词典。新仓增加 `unwrappable`。

初始提交钩子还对部分业务视图执行了格式化换行重排，不涉及业务语义变更。

### 7. 验证器增强

`scripts/repository/validate-product-root.mjs` 当前验证：

- 根 package 和主应用的私有许可证状态；
- changeset 发布安全；
- workspace 与目录结构；
- `.cursor`、`.superpowers` 和 worktree 忽略规则；
- 产品标题、命名空间和占位密钥；
- 生产 API 不指向 Vben；
- 规格、计划、迁移记录和原型存在；
- 旧 submodule、根 MIT LICENSE 和上游 README 不存在；
- 从仓库任意子目录运行时都能定位产品根。

## 最终结果

- 新仓库路径：`/Users/wujialei/workspaces/butler/ai-butler-app`
- 初始提交：`7da7931c7810e774fbd68dd9aa6fc44dddfefb49`
- 分支：`main`
- 受跟踪文件：1370 个
- Git 提交数：1
- Git 远端数：0
- 工作树：干净
- 最终独立审查：通过，无 Critical 或 Important 问题

## 验证结果

以下命令均在最终提交上通过：

```bash
node scripts/repository/validate-product-root.mjs
pnpm check
pnpm test:unit
pnpm build:antd
```

两个旧仓库的 Git bundle 均通过 `git bundle verify`。

## 非阻塞遗留事项

- `@changesets/changelog-github` 已不再使用，可在依赖清理阶段移除；
- `apps/web-antd` 仍保留 Vben 基线版本 `5.7.0`，产品版本策略将在后续阶段统一；
- 生产 API 当前使用同源 `/api`，接入真实环境时需要配置同源网关或更新运行时配置；
- `AiButlerLogin` 路由仍存在原有容器配置问题，不属于本次迁移范围；
- Electron `apps/desktop` 与 `platformApi` 尚未实现，将作为下一阶段执行。
