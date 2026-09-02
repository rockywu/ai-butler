# AI Butler 全新单仓库迁移实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将当前外层仓库与 `client-web` 子模块的有效工作树组装为 `/Users/wujialei/workspaces/butler/ai-butler-app` 下的全新本地单仓库，并通过现有 Web 工程的完整质量验证。

**架构：** 以当前 `client-web` 工作树为 monorepo 技术底座，将外层 `ui-demo`、设计文档和项目规则叠加到根目录。迁移不保留旧 Git 历史，但先生成双仓 Git bundle 和状态快照；新仓库初始化为 `main`，只创建一个初始提交，不配置远端。本阶段不创建 Electron 应用。

**技术栈：** Git、rsync、Node.js 24.16.0、pnpm 11.16.0、pnpm workspace、Turbo、Vue 3、Vite、Vitest

---

## 范围边界

本计划只交付一个通过验证的本地单仓库。

包含：

- 迁移前冻结检查与双仓备份；
- `client-web` 工作树完整复制；
- 外层产品资产叠加；
- 根配置、品牌元数据、README 和项目规则修订；
- 项目级 `.cursor/skills` 本地复制并保持 Git 忽略；
- 安装、检查、单测和 Web 构建；
- 初始化 `main` 分支和单一初始提交。

不包含：

- 创建或推送 Git 远端；
- `apps/desktop`；
- `packages/platform-api`；
- Electron 依赖和打包；
- 新 GitHub Actions；
- Web 业务功能修改；
- 内部 `@vben/*` 包重命名。

## 已锁定的迁移输入

| 项目 | 固定值 |
| --- | --- |
| 外层源目录 | `/Users/wujialei/workspaces/butler/ai-butler` |
| Web 源目录 | `/Users/wujialei/workspaces/butler/ai-butler/client-web` |
| 计划工作树 | `/Users/wujialei/workspaces/butler/ai-butler-plan-repository-migration` |
| 新仓库目录 | `/Users/wujialei/workspaces/butler/ai-butler-app` |
| 备份目录 | `/Users/wujialei/workspaces/butler/ai-butler-migration-backup-2026-09-02` |
| 外层提交 | `71632a714ac5f3b519418d5c9eb7284ef833ca7f` |
| Web 提交 | `50f484390a921a7c3f2586f6defeae61c30d9fc5` |
| Web 分支 | `feature-aihk` |
| 新仓库分支 | `main` |
| 产品名 | `AI Butler（阿斯系统）` |
| 根 package 名 | `ai-butler` |
| 根许可证字段 | `UNLICENSED` |

若执行时两个源提交中的任何一个发生变化，停止本计划，重新记录状态并更新迁移输入；不得继续使用过期校验值。

## 目标文件结构

### 从 Web 底座保留

- `apps/`：现有 `web-antd` 与 `backend-mock`
- `packages/`：Vben 核心、effects 和通用包
- `internal/`：构建、TypeScript 和 lint 配置
- `scripts/`：Vben 工具脚本
- `playground/`：组件试验场
- `package.json`：修改为产品根元数据
- `pnpm-workspace.yaml`：删除失效的 `docs` workspace
- `pnpm-lock.yaml`、`turbo.json`、测试和 lint 配置

### 从外层迁入

- `ui-demo/`
- `docs/superpowers/specs/`
- `CLAUDE.md`，迁入后改写为单仓库规则

### 新建或重写

- `README.md`：产品入口文档
- `NOTICE.md`：Vben MIT 来源声明
- `LICENSES/VBEN-MIT.txt`：保留原 Vben MIT 文本
- `scripts/repository/validate-product-root.mjs`：单仓库结构验证器
- `docs/superpowers/migrations/2026-09-02-single-repository.md`：迁移证据
- `ai-butler.code-workspace`：只包含实际存在的 workspace 目录

### 不迁入

- 两个旧 `.git`
- `.gitmodules`
- 外层子模块 Makefile
- `node_modules`
- `.turbo`、`dist`、`.nitro`、`.output`、coverage
- `.superpowers`
- `.DS_Store`
- `.subagent-board.md`、`.subagent-logs`
- 上游 `.github` 工作流

## 任务 1：冻结并备份两个源仓库

**交付物：**

- `/Users/wujialei/workspaces/butler/ai-butler-migration-backup-2026-09-02/outer.bundle`
- `/Users/wujialei/workspaces/butler/ai-butler-migration-backup-2026-09-02/client-web.bundle`
- 两个仓库的提交、状态和文件清单

- [ ] **步骤 1：验证源提交未变化**

运行：

```bash
test "$(git -C /Users/wujialei/workspaces/butler/ai-butler rev-parse HEAD)" = "71632a714ac5f3b519418d5c9eb7284ef833ca7f"
test "$(git -C /Users/wujialei/workspaces/butler/ai-butler/client-web rev-parse HEAD)" = "50f484390a921a7c3f2586f6defeae61c30d9fc5"
test "$(git -C /Users/wujialei/workspaces/butler/ai-butler/client-web branch --show-current)" = "feature-aihk"
```

预期：三个命令均以状态码 0 结束。

- [ ] **步骤 2：验证 Web 工作树干净**

运行：

```bash
test -z "$(git -C /Users/wujialei/workspaces/butler/ai-butler/client-web status --porcelain=v1 -uall)"
```

预期：状态码 0。若失败，停止迁移并把新增状态纳入迁移输入，不能清理或丢弃文件。

- [ ] **步骤 3：创建备份目录和状态快照**

运行：

```bash
mkdir -p /Users/wujialei/workspaces/butler/ai-butler-migration-backup-2026-09-02
git -C /Users/wujialei/workspaces/butler/ai-butler rev-parse HEAD > /Users/wujialei/workspaces/butler/ai-butler-migration-backup-2026-09-02/outer-head.txt
git -C /Users/wujialei/workspaces/butler/ai-butler status --porcelain=v1 -uall > /Users/wujialei/workspaces/butler/ai-butler-migration-backup-2026-09-02/outer-status.txt
git -C /Users/wujialei/workspaces/butler/ai-butler/client-web rev-parse HEAD > /Users/wujialei/workspaces/butler/ai-butler-migration-backup-2026-09-02/client-web-head.txt
git -C /Users/wujialei/workspaces/butler/ai-butler/client-web status --porcelain=v1 -uall > /Users/wujialei/workspaces/butler/ai-butler-migration-backup-2026-09-02/client-web-status.txt
git -C /Users/wujialei/workspaces/butler/ai-butler/client-web ls-files -z | LC_ALL=C sort -z | shasum -a 256 > /Users/wujialei/workspaces/butler/ai-butler-migration-backup-2026-09-02/client-web-file-list.sha256
```

预期：`client-web-status.txt` 为空，两个 head 文件分别包含锁定提交。

- [ ] **步骤 4：生成两个 Git bundle**

运行：

```bash
git -C /Users/wujialei/workspaces/butler/ai-butler bundle create /Users/wujialei/workspaces/butler/ai-butler-migration-backup-2026-09-02/outer.bundle --all
git -C /Users/wujialei/workspaces/butler/ai-butler/client-web bundle create /Users/wujialei/workspaces/butler/ai-butler-migration-backup-2026-09-02/client-web.bundle --all
git bundle verify /Users/wujialei/workspaces/butler/ai-butler-migration-backup-2026-09-02/outer.bundle
git bundle verify /Users/wujialei/workspaces/butler/ai-butler-migration-backup-2026-09-02/client-web.bundle
```

预期：两个 `git bundle verify` 均报告 bundle 正常。

## 任务 2：组装全新工作树

**交付物：** `/Users/wujialei/workspaces/butler/ai-butler-app` 包含 Web 底座、产品文档、原型和本地 Cursor 技能，但不含旧 Git 元数据或缓存。

- [ ] **步骤 1：验证目标目录不存在**

运行：

```bash
test ! -e /Users/wujialei/workspaces/butler/ai-butler-app
```

预期：状态码 0。若目录存在，不删除；停止并由用户确认如何处理已有目录。

- [ ] **步骤 2：复制 Web 工作树并排除非源码内容**

运行：

```bash
mkdir -p /Users/wujialei/workspaces/butler/ai-butler-app
rsync -a \
  --exclude='.git' \
  --exclude='.github' \
  --exclude='.cursor' \
  --exclude='.superpowers' \
  --exclude='.DS_Store' \
  --exclude='.subagent-board.md' \
  --exclude='.subagent-logs' \
  --exclude='node_modules' \
  --exclude='.turbo' \
  --exclude='dist' \
  --exclude='.nitro' \
  --exclude='.output' \
  --exclude='coverage' \
  /Users/wujialei/workspaces/butler/ai-butler/client-web/ \
  /Users/wujialei/workspaces/butler/ai-butler-app/
```

预期：目标根目录存在 `package.json`、`apps/web-antd`、`packages`、`internal`和 `pnpm-lock.yaml`。

- [ ] **步骤 3：叠加外层产品资产**

运行：

```bash
mkdir -p /Users/wujialei/workspaces/butler/ai-butler-app/ui-demo
mkdir -p /Users/wujialei/workspaces/butler/ai-butler-app/docs
rsync -a /Users/wujialei/workspaces/butler/ai-butler/ui-demo/ /Users/wujialei/workspaces/butler/ai-butler-app/ui-demo/
rsync -a /Users/wujialei/workspaces/butler/ai-butler/docs/ /Users/wujialei/workspaces/butler/ai-butler-app/docs/
cp /Users/wujialei/workspaces/butler/ai-butler/CLAUDE.md /Users/wujialei/workspaces/butler/ai-butler-app/CLAUDE.md
mkdir -p /Users/wujialei/workspaces/butler/ai-butler-app/docs/superpowers/plans
cp /Users/wujialei/workspaces/butler/ai-butler-plan-repository-migration/docs/superpowers/plans/2026-09-02-single-repository-migration.md /Users/wujialei/workspaces/butler/ai-butler-app/docs/superpowers/plans/
```

预期：目标包含原型、两份规格和本计划。

- [ ] **步骤 4：复制本地 Cursor 技能但保持忽略**

运行：

```bash
mkdir -p /Users/wujialei/workspaces/butler/ai-butler-app/.cursor
rsync -a /Users/wujialei/workspaces/butler/ai-butler/.cursor/skills/ /Users/wujialei/workspaces/butler/ai-butler-app/.cursor/skills/
```

预期：目标存在 `.cursor/skills/brainstorming/SKILL.md` 和 `.cursor/skills/writing-plans/SKILL.md`。

- [ ] **步骤 5：验证复制未遗漏 Web 已跟踪文件**

运行：

```bash
cd /Users/wujialei/workspaces/butler/ai-butler/client-web
git ls-files -z |
  while IFS= read -r -d '' file; do
    case "$file" in
      .github/*) continue ;;
    esac
    test -e "/Users/wujialei/workspaces/butler/ai-butler-app/$file" || {
      printf 'missing: %s\n' "$file"
      exit 1
    }
  done
```

预期：无输出，状态码 0。

- [ ] **步骤 6：初始化全新本地 Git 仓库**

运行：

```bash
git -C /Users/wujialei/workspaces/butler/ai-butler-app init -b main
test "$(git -C /Users/wujialei/workspaces/butler/ai-butler-app branch --show-current)" = "main"
test -z "$(git -C /Users/wujialei/workspaces/butler/ai-butler-app remote)"
```

预期：当前分支为 `main`，无远端。

## 任务 3：先建立会失败的产品根验证器

**文件：**

- 创建：`/Users/wujialei/workspaces/butler/ai-butler-app/scripts/repository/validate-product-root.mjs`

- [ ] **步骤 1：创建结构验证器**

写入：

```js
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const failures = [];

async function exists(path) {
  try {
    await access(join(root, path));
    return true;
  } catch {
    return false;
  }
}

function expect(condition, message) {
  if (!condition) failures.push(message);
}

const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const workspace = await readFile(join(root, 'pnpm-workspace.yaml'), 'utf8');
const gitignore = await readFile(join(root, '.gitignore'), 'utf8');
const claude = await readFile(join(root, 'CLAUDE.md'), 'utf8');

expect(packageJson.name === 'ai-butler', '根 package 名必须是 ai-butler');
expect(packageJson.version === '0.1.0', '初始产品版本必须是 0.1.0');
expect(packageJson.private === true, '根 package 必须保持 private');
expect(packageJson.license === 'UNLICENSED', '根 package 必须标记 UNLICENSED');
expect(!packageJson.repository, '根 package 不得保留 Vben repository');
expect(!packageJson.homepage, '根 package 不得保留 Vben homepage');
expect(!packageJson.bugs, '根 package 不得保留 Vben bugs');

for (const script of [
  'build:docs',
  'build:ele',
  'build:naive',
  'build:tdesign',
  'dev:antdv-next',
  'dev:docs',
  'dev:ele',
  'dev:naive',
  'dev:tdesign',
]) {
  expect(!packageJson.scripts?.[script], `必须删除失效脚本 ${script}`);
}

expect(!/^\s*-\s+docs\s*$/m.test(workspace), 'docs 不得作为 pnpm workspace 包');
expect(gitignore.includes('.superpowers'), '.gitignore 必须忽略 .superpowers');
expect(gitignore.includes('*-worktrees/'), '.gitignore 必须忽略 worktree 目录');
expect(!claude.includes('client-web/'), 'CLAUDE.md 不得保留 client-web 路径');

for (const path of [
  'apps/web-antd/package.json',
  'docs/superpowers/specs/骨架设计.md',
  'docs/superpowers/specs/2026-09-02-ai-butler-desktop-design.md',
  'ui-demo/阿斯系统-桌面端原型-1.0.html',
  'NOTICE.md',
  'LICENSES/VBEN-MIT.txt',
  'ai-butler.code-workspace',
]) {
  expect(await exists(path), `缺少必需路径 ${path}`);
}

for (const path of ['.gitmodules', 'client-web', 'vben-admin.code-workspace']) {
  expect(!(await exists(path)), `不得存在旧结构 ${path}`);
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log('AI Butler product root is valid');
```

- [ ] **步骤 2：运行验证器并确认失败**

运行：

```bash
cd /Users/wujialei/workspaces/butler/ai-butler-app
node scripts/repository/validate-product-root.mjs
```

预期：FAIL，至少报告根 package 名、license、`docs` workspace、上游元数据、失效脚本、NOTICE 和 workspace 文件问题。

## 任务 4：规范化产品根配置

**文件：**

- 修改：`/Users/wujialei/workspaces/butler/ai-butler-app/package.json`
- 修改：`/Users/wujialei/workspaces/butler/ai-butler-app/pnpm-workspace.yaml`
- 修改：`/Users/wujialei/workspaces/butler/ai-butler-app/.gitignore`
- 修改：`/Users/wujialei/workspaces/butler/ai-butler-app/apps/web-antd/.env`
- 删除：`/Users/wujialei/workspaces/butler/ai-butler-app/vben-admin.code-workspace`
- 创建：`/Users/wujialei/workspaces/butler/ai-butler-app/ai-butler.code-workspace`
- 创建：`/Users/wujialei/workspaces/butler/ai-butler-app/NOTICE.md`
- 创建：`/Users/wujialei/workspaces/butler/ai-butler-app/LICENSES/VBEN-MIT.txt`

- [ ] **步骤 1：更新根 package 元数据**

将 `package.json` 顶部元数据改为：

```json
{
  "name": "ai-butler",
  "version": "0.1.0",
  "private": true,
  "description": "AI Butler（阿斯系统）Web 与桌面客户端",
  "keywords": [
    "ai-butler",
    "vue",
    "electron",
    "vben"
  ],
  "license": "UNLICENSED",
  "type": "module"
}
```

保留原有 `scripts`、依赖、engines 和 packageManager，但删除：

```text
homepage
bugs
repository
author
build:docs
build:ele
build:naive
build:tdesign
dev:antdv-next
dev:docs
dev:ele
dev:naive
dev:tdesign
```

预期：`package.json`仍是合法 JSON，`pnpm dev:antd`、`pnpm build:antd`和检查脚本保持存在。

- [ ] **步骤 2：删除失效 docs workspace**

从 `pnpm-workspace.yaml` 的 `packages`列表删除：

```yaml
  - docs
```

预期：根 `docs/`只作为产品文档目录，不被 pnpm 当作包。

- [ ] **步骤 3：合并忽略规则**

在 `.gitignore` 中确保存在：

```gitignore
*-worktrees/
.superpowers/
.subagent-board.md
.subagent-logs/
.cursor/
```

保留 Web 底座已有的依赖、构建、日志、环境变量和编辑器忽略规则。

- [ ] **步骤 4：更新应用品牌**

将 `apps/web-antd/.env` 的前两项改为：

```dotenv
VITE_APP_TITLE=AI Butler（阿斯系统）
VITE_APP_NAMESPACE=ai-butler
```

保留 `VITE_APP_STORE_SECURE_KEY` 占位值；生产密钥在后续安全配置计划中处理。

- [ ] **步骤 5：保留 Vben MIT 声明**

创建 `NOTICE.md`：

```markdown
# Third-Party Notices

AI Butler（阿斯系统）包含基于 Vue Vben Admin 5.7.0 修改的代码。

Vue Vben Admin:

- Source: https://github.com/vbenjs/vue-vben-admin
- License: MIT
- Copyright: Vben contributors

完整许可证文本见 `LICENSES/VBEN-MIT.txt`。
```

将现有根 `LICENSE` 的 MIT 文本复制到 `LICENSES/VBEN-MIT.txt`，随后删除根 `LICENSE`，避免将整个私有产品误标为 MIT：

```bash
cd /Users/wujialei/workspaces/butler/ai-butler-app
mkdir -p LICENSES
cp LICENSE LICENSES/VBEN-MIT.txt
rm LICENSE
```

预期：第三方 MIT 文本仍被保留，根 package 明确为 `UNLICENSED`。

- [ ] **步骤 6：替换无效 workspace 文件**

删除 `vben-admin.code-workspace`，创建 `ai-butler.code-workspace`：

```json
{
  "folders": [
    {
      "name": "AI Butler",
      "path": "."
    },
    {
      "name": "@vben/web-antd",
      "path": "apps/web-antd"
    },
    {
      "name": "@vben/backend-mock",
      "path": "apps/backend-mock"
    },
    {
      "name": "@vben/playground",
      "path": "playground"
    }
  ]
}
```

- [ ] **步骤 7：再次运行结构验证器并观察剩余失败**

运行：

```bash
cd /Users/wujialei/workspaces/butler/ai-butler-app
node scripts/repository/validate-product-root.mjs
```

预期：仍然 FAIL，失败原因只包含 `CLAUDE.md` 中的旧 `client-web/` 路径。

## 任务 5：重写产品入口文档和仓库规则

**文件：**

- 修改：`/Users/wujialei/workspaces/butler/ai-butler-app/README.md`
- 删除：`/Users/wujialei/workspaces/butler/ai-butler-app/README.zh-CN.md`
- 删除：`/Users/wujialei/workspaces/butler/ai-butler-app/README.ja-JP.md`
- 修改：`/Users/wujialei/workspaces/butler/ai-butler-app/CLAUDE.md`
- 创建：`/Users/wujialei/workspaces/butler/ai-butler-app/docs/superpowers/migrations/2026-09-02-single-repository.md`

- [ ] **步骤 1：重写 README**

用以下内容替换根 `README.md`：

```markdown
# AI Butler（阿斯系统）

AI Butler 是同时面向 Web、Windows、macOS 和 Linux 的 AI 超级员工产品。

当前仓库是单一 pnpm/Turbo monorepo。Web 客户端基于 Vue 3、Vite、Vben Admin 和 Ant Design Vue；Electron 桌面端将在 `apps/desktop` 中建设，并与 Web 共用 `apps/web-antd` Renderer。

## 目录

- `apps/web-antd`：Web/Desktop 共用 Vue Renderer
- `apps/backend-mock`：本地 Nitro Mock API
- `packages`：Vben 核心与通用包
- `internal`：构建、TypeScript 和 lint 基础设施
- `playground`：组件试验场
- `ui-demo`：产品视觉原型
- `docs/superpowers/specs`：架构与设计规格
- `docs/superpowers/plans`：分阶段实现计划

## 环境

- Node.js 24.16.0
- pnpm 11.16.0

## 常用命令

```bash
pnpm install
pnpm dev:antd
pnpm build:antd
pnpm check
pnpm test:unit
```

详细约定见 `CLAUDE.md`。
```

删除上游多语言 README：

```bash
rm /Users/wujialei/workspaces/butler/ai-butler-app/README.zh-CN.md
rm /Users/wujialei/workspaces/butler/ai-butler-app/README.ja-JP.md
```

- [ ] **步骤 2：把 CLAUDE.md 改为单仓库语义**

删除“外层容器仓库”“Git submodule”“Makefile 子模块管理”相关章节，将开头替换为：

```markdown
# CLAUDE.md

本文件提供 AI Butler（阿斯系统）单仓库的开发约定。

## 仓库定位

本仓库是 AI Butler 产品的 pnpm/Turbo monorepo。

| 路径 | 说明 |
| --- | --- |
| `apps/web-antd/` | Web/Desktop 共用的 Vue 3 + Vben Renderer |
| `apps/backend-mock/` | Nitro Mock API |
| `packages/` | Vben 核心、集成层和通用包 |
| `internal/` | 构建、TypeScript、lint 基础设施 |
| `playground/` | 组件试验场 |
| `ui-demo/` | 产品视觉原型 |
| `docs/` | 架构、规格、计划和迁移记录 |

所有 pnpm、Turbo、测试和构建命令均在仓库根目录执行。
```

保留原文件中仍有效的环境要求、命令、monorepo 分层、路由、权限、API、状态、组件适配、国际化和业务模块说明。移除所有 `client-web/` 路径前缀和 submodule 提交指引。

- [ ] **步骤 3：确认规则文档无旧路径**

运行：

```bash
! rg -n 'client-web/|git submodule|submodule|Makefile' /Users/wujialei/workspaces/butler/ai-butler-app/CLAUDE.md
```

预期：无输出，状态码 0。

- [ ] **步骤 4：创建迁移证据文档**

创建 `docs/superpowers/migrations/2026-09-02-single-repository.md`：

```markdown
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
```

- [ ] **步骤 5：运行结构验证器确认通过**

运行：

```bash
cd /Users/wujialei/workspaces/butler/ai-butler-app
node scripts/repository/validate-product-root.mjs
```

预期：PASS，输出 `AI Butler product root is valid`。

## 任务 6：安装依赖并验证现有 Web 工程

**文件：**

- 可能修改：`/Users/wujialei/workspaces/butler/ai-butler-app/pnpm-lock.yaml`

- [ ] **步骤 1：验证 Node 和 pnpm 版本**

运行：

```bash
cd /Users/wujialei/workspaces/butler/ai-butler-app
node --version
pnpm --version
```

预期：Node 满足 `^22.18.0 || ^24.12.0`，pnpm 为 `11.16.0`。

- [ ] **步骤 2：使用锁文件安装依赖**

运行：

```bash
cd /Users/wujialei/workspaces/butler/ai-butler-app
pnpm install --frozen-lockfile
```

预期：PASS。若根 package 元数据导致 lockfile importer 变化，运行一次 `pnpm install --lockfile-only`，审查确认只包含根 importer 元数据变化后，再运行 `pnpm install --frozen-lockfile`。

- [ ] **步骤 3：运行全量静态检查**

运行：

```bash
pnpm check
```

预期：循环依赖、依赖声明、类型和拼写检查全部通过。

- [ ] **步骤 4：运行单元测试**

运行：

```bash
pnpm test:unit
```

预期：全部现有 Vitest 测试通过。

- [ ] **步骤 5：构建主应用**

运行：

```bash
pnpm build:antd
```

预期：`@vben/web-antd`及其依赖构建成功。

- [ ] **步骤 6：检查禁止提交的文件**

运行：

```bash
test -z "$(git ls-files | rg '(^|/)(node_modules|\.turbo|dist|coverage)(/|$)' || true)"
test ! -e .gitmodules
test ! -e client-web
test -z "$(git remote)"
git check-ignore .cursor/skills/brainstorming/SKILL.md
git check-ignore .superpowers/example
```

预期：前四项状态码 0，最后两项输出对应被忽略路径。

## 任务 7：创建唯一初始提交并完成验收

**文件：** 新仓库全部有效源码和文档。

- [ ] **步骤 1：审查将要提交的文件**

运行：

```bash
cd /Users/wujialei/workspaces/butler/ai-butler-app
git status --short --untracked-files=all
git add -A
git diff --cached --check
git diff --cached --stat
```

预期：

- 不包含 `.cursor`、`.superpowers`、`node_modules`、`.turbo`和构建产物；
- 包含 AI Butler 业务页面、`ui-demo`、规格、计划、NOTICE 和迁移记录；
- `git diff --cached --check`通过。

- [ ] **步骤 2：验证关键业务文件已暂存**

运行：

```bash
git diff --cached --name-only | rg '^apps/web-antd/src/views/ai-butler/workbench/index.vue$'
git diff --cached --name-only | rg '^apps/web-antd/src/router/routes/modules/ai-butler.ts$'
git diff --cached --name-only | rg '^ui-demo/阿斯系统-桌面端原型-1.0.html$'
git diff --cached --name-only | rg '^docs/superpowers/specs/骨架设计.md$'
git diff --cached --name-only | rg '^docs/superpowers/plans/2026-09-02-single-repository-migration.md$'
```

预期：五条命令分别输出目标文件。

- [ ] **步骤 3：创建初始提交**

运行：

```bash
git commit -m "chore: initialize AI Butler monorepo"
```

预期：提交成功。pre-commit 可能重复执行类型检查，必须等待其完成，不使用 `--no-verify`。

- [ ] **步骤 4：验证仓库状态和提交数量**

运行：

```bash
test -z "$(git status --porcelain=v1 -uall)"
test "$(git rev-list --count HEAD)" = "1"
test "$(git branch --show-current)" = "main"
test -z "$(git remote)"
node scripts/repository/validate-product-root.mjs
```

预期：工作树干净，只有一个提交，分支为 `main`，无远端，结构验证通过。

- [ ] **步骤 5：记录最终提交并验证备份可用**

运行：

```bash
git rev-parse HEAD
git bundle verify /Users/wujialei/workspaces/butler/ai-butler-migration-backup-2026-09-02/outer.bundle
git bundle verify /Users/wujialei/workspaces/butler/ai-butler-migration-backup-2026-09-02/client-web.bundle
```

预期：输出新仓库初始提交，两个旧仓库 bundle 仍可验证。

## 完成条件

满足以下条件后，本阶段结束：

- `/Users/wujialei/workspaces/butler/ai-butler-app` 是独立 Git 仓库；
- 默认分支为 `main`，只有一个初始提交且没有远端；
- 不存在 `client-web`、`.gitmodules`或子模块 Makefile；
- 项目品牌为 AI Butler（阿斯系统）；
- 根 package 为私有 `UNLICENSED`；
- Vben MIT 声明保存在 `NOTICE.md`和 `LICENSES/VBEN-MIT.txt`；
- 当前 AI Butler 页面、路由、原型、规格和本计划均已迁入；
- `.cursor/skills`存在于本地但被 Git 忽略；
- `pnpm check`、`pnpm test:unit`、`pnpm build:antd`和结构验证器全部通过；
- 两个旧仓库及备份目录保持不变；
- 旧工作区不删除，新工作区切换由用户在验收后决定。
