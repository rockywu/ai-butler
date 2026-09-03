# CLAUDE.md

本文件提供 AI Butler（阿斯系统）单仓库的开发约定。

## 仓库定位

本仓库是 AI Butler（阿斯系统）产品的 pnpm/Turbo monorepo。

| 路径 | 说明 |
| --- | --- |
| `apps/web-antd/` | Web/Desktop 共用的 Vue 3 + Vben Renderer |
| `apps/backend-mock/` | Nitro Mock API |
| `apps/desktop/` | Electron 主进程、preload 与安装包 |
| `apps/desktop-plugins/` | 桌面原生插件；`browser` 用 Playwright 驱动系统 Chrome/Edge |
| `packages/` | Vben 核心、集成层和通用包 |
| `internal/` | 构建、TypeScript、lint 基础设施 |
| `playground/` | 组件试验场 |
| `ui-demo/` | 产品视觉原型 |
| `docs/` | 架构、规格、计划和迁移记录 |

页面只通过 `platformApi.browser` 调用桌面浏览器插件。未安装系统 Chrome/Edge 时不会回退 Playwright 自带 Chromium。

## 常用命令

所有 pnpm、Turbo、测试和构建命令均在仓库根目录执行。

### 环境要求（硬约束）

- Node `^22.18.0 || ^24.12.0`（`.node-version` 锁 24.16.0）
- pnpm `>=11`，`packageManager` 锁 `pnpm@11.16.0`
- **只能用 pnpm**：`preinstall` 钩子是 `npx only-allow pnpm`，用 npm/yarn 会直接失败
- npm registry 已指向 `https://registry.npmmirror.com`（`.npmrc`）

### 开发与构建

```bash
pnpm install                 # 安装依赖（postinstall 会跑各包的 stub）
pnpm dev                     # 交互式选择要启动的应用（turbo-run）
pnpm dev:mock                # 独立启动 Nitro Mock API，端口 5320（需手动先开）
pnpm dev:antd                # 只启动主应用 web-antd（端口 5666）
pnpm dev:web                 # 只启动 web-antd（需已有 Mock 或真实后端）
pnpm dev:desktop             # 只启动 Electron（需 Web 已在 5666）
pnpm dev:desktop:mac         # concurrently 启动 Web + Electron（macOS 本机）
pnpm dev:desktop:windows     # concurrently 启动 Web + Electron（Windows 本机）
pnpm dev:play                # 启动 playground

pnpm build                   # 构建全部（turbo，NODE_OPTIONS=--max-old-space-size=8192）
pnpm build:antd              # 只构建 web-antd
pnpm build:desktop           # 构建 Desktop Renderer + Electron main/preload（不打安装包）
pnpm build:desktop:mac       # 上述 + electron-builder --mac --dir（可直接打开 .app）
pnpm build:desktop:windows   # 上述 + electron-builder --win --dir（产出 win-unpacked）
pnpm dist:mac                # 打 macOS dmg/zip 安装包
pnpm dist:win                # 打 Windows NSIS 安装包（在 macOS 上需要 wine）
pnpm preview                 # 构建后预览
pnpm clean                   # 清理产物；pnpm reinstall 会连 lockfile 一起重装
```

Mock 是**独立进程服务**（`apps/backend-mock`），默认端口 5320。`VITE_NITRO_MOCK=false`，不再由 Vite 插件内嵌拉起。所有 `dev:*` 组合启动项都不拉 Mock，需要时先手动 `pnpm dev:mock`。Web 仍经 Vite 将 `/api` 代理到 `localhost:5320`。Desktop 打包应用需加 `--api-url=http://localhost:5320/api` 直连 Mock 以验证登录。`build:desktop:mac` / `build:desktop:windows` 使用 `--dir`，只产出可运行目录、不打安装包，便于本机打开测试。

### 检查与测试

```bash
pnpm check              # 全量检查：循环依赖 + 依赖声明 + 类型 + 拼写
pnpm check:type         # 仅类型（turbo run typecheck → vue-tsc --noEmit）
pnpm check:circular     # 循环依赖（vsh）
pnpm check:dep          # 依赖声明合法性（vsh）
pnpm check:cspell       # 拼写检查，词库在 cspell.json

pnpm lint               # vsh lint
pnpm format             # vsh lint --format

pnpm test:unit          # 单元测试：vitest run --dom（环境 happy-dom）
pnpm test:benchmark     # 基准测试
pnpm test:e2e           # E2E（Playwright，仅 playground 声明了该 task）
```

跑**单个单元测试**（根 `vitest.config.ts` 已配好 Vue/JSX 插件）：

```bash
pnpm exec vitest run --dom packages/utils/src/xxx.test.ts   # 按文件
pnpm exec vitest run --dom -t "关键字"                       # 按测试名
pnpm exec vitest --dom packages/utils                       # watch 模式
```

E2E 单条用例：`pnpm --filter @vben/playground exec playwright test <file> --ui`。

### 提交

`lefthook` 装了 pre-commit（**串行**执行：oxlint --fix → oxfmt → eslint --fix → stylelint --fix，均只处理暂存文件并回填；最后 `pnpm check:type` 全量类型检查，耗时较长）与 commit-msg（commitlint）。post-merge 会自动 `pnpm install`。

提交信息遵循 Angular/Conventional Commits，type 限定：`feat` `fix` `style` `perf` `refactor` `revert` `test` `docs` `chore` `ci` `types`。可用 `pnpm commit`（czg）交互生成。

## Monorepo 架构

### monorepo 分层

pnpm workspace + turbo。workspace glob 见 `pnpm-workspace.yaml`（`internal/*`、`internal/lint-configs/*`、`packages/*`、`packages/@core/{base,ui-kit,forward}/*`、`packages/@core/*`、`packages/effects/*`、`packages/business/*`、`apps/*`、`scripts/*`、`playground`）。

依赖自底向上分四层，**不要跨层反向依赖**：

```
internal/ + scripts/      基础设施：lint-configs、tsconfig、tailwind-config、vite-config、node-utils、vsh、turbo-run
        ↑
packages/@core/*          框架无关的基础 SDK 与原子 UI（@vben-core/*）
                          base/{design,icons,shared,typings}、composables、preferences
                          ui-kit/{shadcn-ui,form-ui,layout-ui,menu-ui,popup-ui,tabs-ui}
        ↑                 ⚠️ README 明确要求：不要在 @core 里放业务逻辑
packages/effects/*        与 pinia/偏好/路由/组件库轻度耦合的集成层（@vben/*）
                          access、common-ui、hooks、layouts、plugins（echarts/tiptap/vxe-table/motion）、request
packages/{constants,icons,locales,preferences,stores,styles,types,utils}
        ↑
apps/ + playground/       可运行应用
```

- `apps/web-antd`（`@vben/web-antd`）—— **主应用**，Ant Design Vue 4 风格，业务开发的落点
- `apps/backend-mock`（`@vben/backend-mock`）—— Nitro 假后端，文件路由 `api/<path>.<method>.ts`，含 JWT/faker
- `playground`（`@vben/playground`）—— 组件试验场 + 唯一带 Playwright E2E 的工作区

上游模板的其他 UI 版本（`web-ele`/`web-naive`/`web-tdesign`/`docs`）及对应的根级开发、构建脚本均已删除。`packages/business/*` 与 `packages/@core/forward/*` 是预留空目录。

### 依赖版本用 catalog 统一管理

各包 `package.json` 里写的是 `"vue": "catalog:"`，**真实版本号集中在 `pnpm-workspace.yaml` 的 `catalog:` 段（180+ 条）**。

- 升级/新增依赖：改 `pnpm-workspace.yaml` 的 catalog，不要在子包 package.json 里写死版本号
- `overrides` 已把 `vue`、`pinia`、`clsx`、`@ctrl/tinycolor`、`@ast-grep/napi` 强制锁到 catalog 版本
- `publicHoistPattern` 把 lint 工具链提升到根 `node_modules`

### turbo 任务图

`turbo.json`：`build`/`preview`/`build:analyze` 都 `dependsOn: ["^build"]`（先构建依赖包）；`dev` 显式 `cache: false` + `persistent: true`；`typecheck`、`test:e2e` 可缓存。`@vben/backend-mock#build` 覆盖 outputs 为 `.nitro/**`、`.output/**`。

`globalDependencies` 包含 `pnpm-lock.yaml`、`**/tsconfig*.json`、`internal/{node-utils,vite-config}/src/**`、`scripts/*/src/**` —— **动这些文件会让所有 task 缓存全部失效**。

## 主应用 web-antd 开发约定

路径别名 `#/*` → `./src/*`（同时声明在 `package.json#imports` 与 `tsconfig.json#paths`）。

### 启动链路

`src/main.ts` → `initApplication()` → `initPreferences()` → 动态 `import('./bootstrap')` → `initComponentAdapter()` → `initSetupVbenForm()` → `setupI18n()` → `initStores(app, { namespace })` → 挂载 router → `app.mount('#app')` → `unmountGlobalLoading()`。

`namespace` 形如 `${VITE_APP_NAMESPACE}-${VITE_APP_VERSION}-${dev|prod}`，用于隔离 localStorage / store 持久化 key。

### 路由与菜单

**菜单不是单独配置的，完全由路由 `meta` 生成。**

- `src/router/routes/core.ts` —— 核心路由（`/`、`/auth/*`、404），不参与权限过滤
- `src/router/routes/modules/*.ts` —— 业务模块路由，每个文件默认导出 `RouteRecordRaw[]`，由 `routes/index.ts` 用 `import.meta.glob('./modules/**/*.ts', { eager: true })` 自动收集，**新增文件无需手动注册**
- 当前业务模块：`ai-butler.ts`（阿斯系统主模块：workbench / acquisition / chat / contacts / digital / video）、`dashboard.ts`、`demos.ts`、`vben.ts`
- `src/views/_core/` 是 layout 依赖的必需页面（登录、403、404、个人中心等），**不要删除**

常用 `meta` 字段（完整定义在 `packages/@core/base/typings/src/vue-router.d.ts`）：`title`（必填）、`icon`/`activeIcon`（Iconify 名如 `lucide:target`）、`order`（同级排序，缺省 999）、`authority: string[]`、`hideInMenu`/`hideInTab`/`hideInBreadcrumb`/`hideChildrenInMenu`、`keepAlive`、`affixTab`、`ignoreAccess`、`link`（外链走 IFrameView）、`menuVisibleWithForbidden`、`noBasicLayout`、`badge`。

菜单生成：`packages/utils/src/helpers/generate-menus.ts`。

### 权限模型

默认 `accessMode: 'frontend'`（`packages/@core/preferences/src/config.ts`），可在 `src/preferences.ts` 的 `overridesPreferences` 里改成 `'backend'` / `'mixed'`。

`src/router/guard.ts#setupAccessGuard` 在进入非 core 路由前 `fetchUserInfo()` 拿 roles，再走 `src/router/access.ts#generateAccess`（注入 `pageMap`/`layoutMap`/`fetchMenuListAsync`），最终由 `packages/effects/access/src/accessible.ts#generateAccessible` 把可访问路由挂到根节点 children 并生成菜单，写入 `useAccessStore`。

- **路由级**：`meta.authority` ∩ `userRoles`（frontend 模式生效）
- **元素级**：`v-access:role="..."` / `v-access:code="..."` 指令，或 `<AccessControl :codes type="role|code">`；判定逻辑在 `packages/effects/access/src/use-access.ts`
- backend 模式下后端需返回 `RouteRecordStringComponent[]`（component 为字符串路径，由前端 map 成组件）

### API 层

`src/api/request.ts` 创建两个客户端：

- `requestClient` —— 业务统一使用，`responseReturn: 'data'`，已挂全部拦截器
- `baseRequestClient` —— 裸客户端，供刷新 token / 登出等不能触发业务拦截器的场景

**响应契约**：`{ code, data, message }`，`successCode: 0`（`defaultResponseInterceptor`）。拦截器顺序：请求注入 `Authorization: Bearer <token>` + `Accept-Language` → 剥壳 → 401 刷新 token（`enableRefreshToken`，失败按 `loginExpiredMode` 弹模态框或跳登录）→ 兜底 `message.error`。

`baseURL` 来自 `useAppConfig(...).apiURL`：dev 读 `VITE_GLOB_API_URL`（默认 `/api`，经 `vite.config.ts` proxy 到 `localhost:5320/api`），prod 读构建期注入的 `window._VBEN_ADMIN_PRO_APP_CONF_`。

### 状态管理

`initStores`（`packages/stores/src/setup.ts`）启用 `pinia-plugin-persistedstate`，key 为 `${namespace}-${storeId}`；**dev 直写 localStorage，prod 用 secure-ls 加密**，密钥 `VITE_APP_STORE_SECURE_KEY`（`.env` 里目前仍是占位值 `please-replace-me-with-your-own-key`，上生产前必须替换）。

全局 store 在 `@vben/stores`：`useAccessStore`（token/codes/menus/routes/锁屏）、`useUserStore`、`useTabbarStore`、`useTimezoneStore`，登出用 `resetAllStores()`。应用内 store 只有 `src/store/auth.ts`（登录、登出、fetchUserInfo）。

### 组件适配层 src/adapter/

把 `@vben/common-ui` 的 `vben-form` / `vben-modal` / `vxe-table` 与 ant-design-vue 绑定，在 `bootstrap` 阶段执行：

- `component/index.ts#initComponentAdapter` —— 异步注册 antd 控件，`withDefaultPlaceholder` 自动补 placeholder，`withPreviewUpload` 提供裁剪/尺寸限制/拖拽排序，最后 `globalShareState.setComponents()`
- `form.ts#initSetupVbenForm` —— `baseModelPropName: 'value'`，`modelPropNameMap` 处理 Checkbox/Radio/Switch 的 `checked` 与 Upload 的 `fileList`；导出 `useVbenForm` / `z`
- `vxe-table.ts` —— 约定分页响应 `{ items, total }`；注册 `CellImage`、`CellLink` 渲染器；导出 `useVbenVxeGrid`

**新增表单控件**需在 `ComponentType` 联合、`ComponentPropsMap`、`components` 三处同步登记（必要时加 `modelPropNameMap`）。

### 国际化

`src/locales/langs/<lang>/<namespace>.json`，现有 `zh-CN`、`en-US`，各含 `page.json`、`demos.json`；通用 UI 文案在 `packages/locales`。`setupI18n` 用 `import.meta.glob` 收集，并按需动态加载 dayjs / antd 的 locale。

新增语言：建目录（名称须与 `SupportedLanguagesType` 一致）+ 在 `locales/index.ts` 的 `loadDayjsLocale`/`loadAntdLocale` 各加一个分支。

⚠️ `ai-butler` 模块现有路由的 `title` 是**中文硬编码**（如 `title: '工作台'`），未走 `$t()`。若该模块要支持多语言，需一并改为 i18n key。

### 环境变量

均在 `apps/web-antd/`：`.env`（`VITE_APP_TITLE`、`VITE_APP_NAMESPACE`、`VITE_APP_STORE_SECURE_KEY`）、`.env.development`（`VITE_PORT=5666`、`VITE_GLOB_API_URL=/api`、`VITE_NITRO_MOCK=false`、`VITE_DEVTOOLS`、`VITE_INJECT_APP_LOADING`）、`.env.production`（`VITE_ROUTER_HISTORY=hash`、`VITE_COMPRESS`、`VITE_PWA`、`VITE_ARCHIVER`）、`.env.analyze`（`VITE_VISUALIZER`）。

接真实后端：改 `VITE_GLOB_API_URL`，删掉 `vite.config.ts` 里的 `/api` proxy，并保证后端响应符合 `{ code, data, message }` + `successCode=0`（否则改 `request.ts` 的 `defaultResponseInterceptor`）。

## 业务模块现状：ai-butler

原型（`ui-demo/阿斯系统-桌面端原型-1.0.html` 的 `data-page`）与页面目录一一对应：

| 原型 `data-page` | 路由 | 视图目录 | 菜单名 |
| --- | --- | --- | --- |
| `workbench` | `/ai-butler/workbench` | `views/ai-butler/workbench/` | 工作台 |
| `smart` | `/ai-butler/acquisition` | `views/ai-butler/acquisition/` | 智能获客 |
| `chat` | `/ai-butler/chat` | `views/ai-butler/chat/` | 聊天接管 |
| `contacts` | `/ai-butler/contacts` | `views/ai-butler/contacts/` | 联系列表 |
| `digital` | `/ai-butler/digital` | `views/ai-butler/digital/` | 数字人 |
| `video` | `/ai-butler/video` | `views/ai-butler/video/` | 文生视频 |

一级菜单 `AiButler`（`meta.icon: 'lucide:sparkles'`、`title: '阿斯系统'`）`redirect` 到 workbench。

⚠️ **已知问题**：`modules/ai-butler.ts` 末尾的 `AiButlerLogin` 路由（`/ai-butler/login`）直接把 `component` 指向 `#/layouts/auth.vue`，但**没有配 `children`**。`auth.vue` 只是 `AuthPageLayout` 容器（靠内部 `<router-view>` 渲染子路由，参考 `routes/core.ts` 里 `/auth` 的写法），因此 `views/ai-butler/login/index.vue` 当前是**渲染不到的死代码**。要启用它需改成容器 + 子路由结构，或直接把 `component` 换成该视图。

## 「要改哪里」速查

| 需求 | 改动位置 |
| --- | --- |
| 新增页面 | ① `src/views/<模块>/<子页>/index.vue` ② 在 `src/router/routes/modules/<模块>.ts` 的 `children` 追加路由（带 `meta.title`/`icon`/`order`）③ 需要 i18n 时在 `locales/langs/*/page.json` 加词条 |
| 新增一级菜单 | 在 `modules/*.ts` 顶层加 `RouteRecordRaw`（`meta.title`/`icon`/`order` + `children`），或新建一个 `modules/xxx.ts`（自动被 glob 收集） |
| 新增接口 | `src/api/<模块>/xxx.ts` 用 `requestClient` 写函数 → 在 `src/api/index.ts` 加 `export * from './<模块>'` |
| 新增 mock 接口 | `apps/backend-mock/api/<path>.<method>.ts`，用 `utils/response.ts` 的 `useResponseSuccess`/`useResponseError` 包装 |
| 改登录流程 | `src/store/auth.ts#authLogin` + `src/api/core/auth.ts` |
| 改 token 刷新 / 错误提示 | `src/api/request.ts`（`doRefreshToken` / `errorMessageResponseInterceptor`） |
| 切后端菜单模式 | `src/preferences.ts` 设 `app.accessMode = 'backend'`，后端实现 `src/api/core/menu.ts#getAllMenusApi` 的契约 |
| 新增项目级偏好项 | `src/preferences.ts` 的 `preferencesExtension.fields`，配合 `definePreferencesExtension<T>()` |
| 改应用名 | 改 `.env` 的 `VITE_APP_TITLE`（`overridesPreferences.app.name` 直接读它） |
| 改默认首页 | 在 `src/preferences.ts` 的 `overridesPreferences` 里新增 `app.defaultHomePath`（当前未覆盖，走 `@core/preferences` 默认值） |
| 升级依赖版本 | `pnpm-workspace.yaml` 的 `catalog:` 段 |
