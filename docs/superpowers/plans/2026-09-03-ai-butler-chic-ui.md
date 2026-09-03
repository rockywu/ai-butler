# 阿斯系统黑白奇克版 UI 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 把 `apps/web-antd` 的展示界面对齐 `ui-demo/阿斯系统-桌面端原型-1.0-黑白奇克版.html`：登录、工作台、AI 智能获客（智能获客 / 聊天接管 / 联系列表）、数字人、文生视频；去掉模板残留页面；手机和 PC 都能用。只改 UI，不改任何接口与登录逻辑。

**架构：** 视觉以黑白奇克 Token 覆盖 Ant Design Vue 主色和 Tailwind 工具类。业务页继续放在 `apps/web-antd/src/views/ai-butler/`。弹窗用 `useVbenModal`，表单用 `#/adapter/form` 的 `useVbenForm`（登录页按约定用 `@vben-core/form-ui` + `VbenButton` / `VbenCheckbox`），表格用 `#/adapter/vxe-table` 的 `useVbenVxeGrid`。演示数据从原型 JS 的 `DB` 抽到本地 mock，不接新 API。

**技术栈：** Vue 3、Vben Admin、Ant Design Vue 4、Tailwind CSS、`@vben-core/form-ui`、`@vben-core/shadcn-ui`、`@vben-core/popup-ui`（经 `@vben/common-ui`）、VXE Table、Vitest + happy-dom

---

## 规格来源与范围

视觉与文案的唯一来源：

- `ui-demo/阿斯系统-桌面端原型-1.0-黑白奇克版.html`

硬约束：

- 只改 UI。禁止修改 `apps/web-antd/src/api/**`、`apps/web-antd/src/store/auth.ts`、`apps/web-antd/src/api/request.ts`、Mock 接口文件。
- 登录提交继续调用现有 `authStore.authLogin`，把表单字段映射成已有 `{ username, password }`。
- CSS 只用已配置的 Tailwind。禁止把原型整段 CSS 拷进业务页。
- 组件优先级：Ant Design Vue → `@vben-core/shadcn-ui` → Vben Form / VXE / Modal。
- 业务表单必须走 `useVbenForm`，禁止在弹窗和数字人 / 文生视频里手写一排 `Input` + `label`。
- 不实现原型里的演示控制条、标注圆点（`.anno`）、Electron 窗口点、底部 RPA 状态条。Web 没有桌面壳，这些不是产品界面。

表单引入约定（必须遵守）：

- **登录页**用用户指定的模块：

```ts
import type { VbenFormSchema } from '@vben-core/form-ui';
import { useVbenForm } from '@vben-core/form-ui';
import { VbenButton, VbenCheckbox } from '@vben-core/shadcn-ui';
```

- **业务页表单**（所有获客弹窗、导入、充值、数字人、文生视频）必须用应用适配层，才能绑上 ant-design-vue：

```ts
import type { VbenFormSchema } from '#/adapter/form';
import { useVbenForm, z } from '#/adapter/form';
```

`#/adapter/form` 内部就是 `@vben/common-ui` → `@vben-core/form-ui`，`component: 'Input' | 'Select' | 'Textarea' | 'Switch' | 'Upload' | 'InputNumber' | 'Checkbox'` 已映射。不要在业务页直接从 `@vben-core/form-ui` 引 `useVbenForm`，否则拿不到 Ant Design Vue 组件。

弹窗：

```ts
import { useVbenModal } from '@vben/common-ui';
```

表格：

```ts
import { useVbenVxeGrid } from '#/adapter/vxe-table';
```

---

## 原型页面对照

原型用 `data-page` 切换，不走路由。产品要用 Vue Router。

| 原型 `data-page` / 屏 | HTML 位置 | 产品路由 | 产品文件 | 菜单 |
| --- | --- | --- | --- | --- |
| `data-screen="first"` 登录 | 777–807 | `/auth/login`（已有 `LOGIN_PATH`） | `apps/web-antd/src/views/_core/authentication/login.vue` | 无 |
| `workbench` | 850–884 | `/ai-butler/workbench` | `views/ai-butler/workbench/index.vue` | 工作台 |
| `smart` | 887–989 | `/ai-butler/acquisition` | `views/ai-butler/acquisition/index.vue` | AI 智能获客 / 智能获客 |
| `chat` | 992–1014 | `/ai-butler/chat` | `views/ai-butler/chat/index.vue` | AI 智能获客 / 聊天接管 |
| `contacts` | 1017–1051 | `/ai-butler/contacts` | `views/ai-butler/contacts/index.vue` | AI 智能获客 / 联系列表 |
| `digital` | 1054–1279 | `/ai-butler/digital` | `views/ai-butler/digital/index.vue` | 数字人 |
| `video` | 1282–1376 | `/ai-butler/video` | `views/ai-butler/video/index.vue` | 文生视频 |

原型侧栏 `NAV`（2280–2288 行）结构必须反映到路由 `meta`：

1. 工作台
2. 分组 **AI 智能获客**
   - 智能获客
   - 聊天接管
   - 联系列表
3. 数字人
4. 文生视频

父级菜单不要再叫「阿斯系统」。品牌名只出现在 Logo 区。

---

## 每页内容与交互清单

### 登录页（屏 ①）

页面元素：

- 品牌：黑底 `AS` 方块 + 阴影偏移，标题「阿斯系统」，副标题「智能增长中枢 · V1.0」
- Tab：验证码登录（默认）/ 密码登录
- 手机号输入（演示值 `138****6688`）
- 验证码行：输入 +「获取验证码」倒计时 60s
- 密码行：仅密码 Tab 显示
- 主按钮「登 录」
- 协议勾选：「我已阅读并同意《服务协议》和《隐私政策》」
- 底部虚线提示：首次登录绑定设备 `WIN-001`；登录态保存在本机

交互：

- 未勾选协议或必填为空时按钮禁用
- 获取验证码：`message.success('验证码已发送（演示）')` + 倒计时，不调新接口
- 提交：验证码 Tab → `{ username: phone, password: code }`；密码 Tab → `{ username: phone, password }`，调用 `authStore.authLogin`
- 开发登录：密码 Tab 填 `vben` / `123456`（现有 Mock 账号）。不改 `loginApi`
- 不展示第三方登录、注册、忘记密码、滑块验证、账号下拉（这些是 Vben 模板，原型没有）
- 不实现「正在登录…」全屏遮罩以外的东西：用按钮 `loading` 即可（`authStore.loginLoading`）

### 工作台

页面元素：

- `mini-hero`：kicker `AS GROWTH OS`，标题「阿斯系统 · 智能增长中枢」，副文案「让获客、内容、客户沟通与设备协同，在一个工作台高效运转」
- 数据总览 4 卡：运行中任务 `1` / 今日新增线索 `128` / 累计私信触达 `3,420` / 今日自动化执行 `42`
- 左：设备连接状态（WIN-001 在线、MAC-002 未启动）
- 右：最新动态 5 条，按钮「查看全部」跳转智能获客

交互：

- 删除当前页的三张快捷入口卡（原型工作台没有）
- 「查看全部」`router.push({ name: 'AiButlerAcquisition' })`
- 无弹窗

### 智能获客

页面元素：

- 绿色任务 banner：`家居好物 · 关键词拓客 · 运行中 · 18 / 30 · 由本机 RPA 引擎执行`
- 灰色异常提示条（关闭浏览器后刷新）
- 平台 Tab：某音 / 小某书 / 某手；旁路按钮：数据总览、注意事项、使用指引
- 主要功能 4 卡：账号管理、回复/私信预设、关键词预设、运行进程管理
- 拓客专区 5 卡：对标 / 视频 / 关键词 / 直播 / 粉丝
- 任务明细 5 卡：任务列表、互动记录、数据评论、直播评论、粉丝列表
- 卡片图标：从原型 697–746 行 SVG sprite 原样拷入 `SmartIcons.vue`，不要用 emoji 替换

交互：点卡片或旁路按钮打开对应 `useVbenModal`。平台切换只过滤本地 mock，改标题「账号管理 · {平台}」，`message.info('已切换至某音 · 账号与任务数据按平台过滤')`。

### 聊天接管

页面元素：左会话列表（账号 Select、筛选 pill、会话项）+ 右会话面板（来源、接管按钮、消息流、快捷话术、输入框）。底部「模拟收到新私信」仅 PC 显示。

交互（现有逻辑保留，只改视觉）：

- 筛选：全部 / AI 回复中 / 人工接管 / 未读
- 点会话：未读清零；移动端切到聊天面板
- 接管切换：AI ↔ 人工，`message.info`
- 发送消息写入本地数组
- 移动端 `< md`：列表与面板互斥；`>= md` 双栏

无业务弹窗。不实现浏览器桌面通知 API（原型 `dnotify` 是壳能力）；「模拟收到新私信」用 `message.info` 即可。

### 联系列表

页面元素：4 张统计卡 + 筛选（平台 / 状态 / 来源 / 搜索）+ 表格 +「导入好友任务」「导出」。

交互：

- 筛选在本地过滤
- 导出：`message.success('已导出 86 条联系人（Excel）')`
- 导入：打开 `m-import`
- 行操作「查看」跳转聊天接管；「跟进」「标记」用 `message.info` 演示

### 数字人（5 个 Tab）

| Tab | 内容 | 交互 |
| --- | --- | --- |
| 声音复刻 | 我的复刻音色列表 + 新建复刻表单 | 录制方式切换在线/上传；提交 `message.success` |
| 声音克隆 | 我的克隆音色 + **新建克隆音色** + 文本转语音 | 当前产品缺「新建克隆音色」，必须补上。生成配音后显示试听条 |
| 形象定制 | 公共库 + 我的形象 + 新建形象 | 点选形象；美颜 Switch；拍摄要求折叠 |
| 数字人精剪 | 合成表单 | 按文案长度估算时长；生成消耗 50 点 |
| 精剪视频库 | 卡片网格 | 预览打开 `m-preview`；下载 / 删除 `message` |

### 文生视频

左：生成配置（引擎 Seedance / Grok / VEO，条件字段，提示词，时长/比例/清晰度，消耗预估）。右：作品库。

交互：引擎切换显示不同字段；VEO 隐藏时长和清晰度；生成 `message.success`；作品预览打开 `m-preview`。

### 顶栏（所有已登录页）

在 `layouts/basic.vue` 用 `header-right-0` / `header-right-1` 插入：

- 到期时间 pill：`2027-11-26 14:50`
- 算力点按钮：`1,000`，点击打开充值弹窗

---

## 弹窗完整清单

所有弹窗：`fullscreenButton: true`（手机可全屏），`class: 'w-[calc(100%-32px)] sm:w-[520px]|md:w-[640px]|lg:w-[780px]'` 对应原型 `.sm` / `.md` / 默认。关闭按钮走 Modal 自带。提交只 `message.*`，不调 API。

| id | 标题 | 尺寸 | 触发 | 内容 | 页脚 |
| --- | --- | --- | --- | --- | --- |
| `m-account` | 账号管理 · {平台} | 780 | 账号管理卡 | 授权/刷新 + 账号表 | 关闭 |
| `m-auth` | 授权账号 · {平台} | 520 | 账号表「＋ 授权账号」 | 4 步向导 | 取消 / 开始授权 |
| `m-reply` | 回复 / 私信预设 | 780 | 回复预设卡 | 筛选 + 预设表 | 关闭 |
| `m-keyword` | 关键词预设 | 780 | 关键词预设卡 | 搜索 + 分类表 | 关闭 |
| `m-process` | 运行进程管理 | 780 | 进程卡 | 筛选 + 进程表 | 关闭 |
| `m-tasks` | 任务列表 | 780 | 任务列表卡 | 筛选 + 任务表 | 关闭 |
| `m-task-detail` | 任务详情 | 520 | 任务行「详情」 | 只读配置 dl | 关闭 / 一键复制 / 查看评论 |
| `m-interact` | 互动记录列表 | 780 | 互动卡 | 勾选表 + 批量 | 更多操作 / 关闭 |
| `m-comment` | 数据评论列表 | 780 | 评论卡 | 多筛 + 勾选表 | 更多操作 / 关闭 |
| `m-live` | 直播评论列表 | 780 | 直播评论卡 | 筛 + 勾选表 | 更多操作 / 关闭 |
| `m-fan` | 粉丝列表 | 780 | 粉丝列表卡 | 筛 + 勾选表 | 更多操作 / 关闭 |
| `m-batch` | 更多操作 · 批量触达 | 520 | 上述四表「更多操作」 | 执行账号/动作/间隔/内容 | 取消 / 确定执行 |
| `m-import` | 导入好友任务 | 520 | 联系人「导入」 | 个微/企微 + 范围 | 取消 / 确认导入 |
| `m-preview` | 视频预览 | 640 | 数字人库 / 文生作品 | 封面 + 时长/比例 | 关闭 / 下载 |
| `m-acq-competitor` | 对标拓客 · 新建任务 | 640 | 对标卡 | 见字段表 | 取消 / 提交任务 |
| `m-acq-video` | 视频拓客 · 新建任务 | 640 | 视频拓客卡 | 见字段表 | 取消 / 提交任务 |
| `m-acq-keyword` | 关键词拓客 · 新建任务 | 640 | 关键词拓客卡 | 见字段表 | 取消 / 提交任务 |
| `m-acq-live` | 直播拓客 · 新建任务 | 640 | 直播拓客卡 | 见字段表 | 取消 / 提交任务 |
| `m-acq-fan` | 粉丝拓客 · 新建任务 | 780 | 粉丝拓客卡 | 采集 → 勾选 → 私信 | 取消 / 开始私信 |
| `m-overview` | 数据总览 | 640 | 数据总览按钮 | 4 指标 + 7 日柱 | 关闭 |
| `m-notice` | 注意事项 | 520 | 注意事项按钮 | 5 条 ul | 我知道了 |
| `m-guide` | 使用指引 | 520 | 使用指引链接 | 5 步 ol | 关闭 |
| `m-recharge` | 算力点充值 | 520 | 顶栏算力点 | 套餐卡 + 支付方式 | 取消 / 去支付 |

授权向导四步文案（`m-auth`）：

1. 打开浏览器：「点击开始，自动打开平台登录页」
2. 扫码登录：「请在打开的窗口完成扫码或验证码登录」
3. 授权中：「正在同步登录态到云端…」
4. 完成：「授权成功，可在账号管理中绑定智能体」

演示里用 `setTimeout` 推进步骤，最后 `message.success` 并关闭。不调浏览器插件。

任务详情「查看评论」：关键词/对标/视频 → 打开 `m-comment`；直播拓客 → `m-live`；粉丝拓客 → `m-fan`。

---

## 拓客表单字段（写入 schema，禁止遗漏）

公共选项：

- 执行账号：`小雅来啦` / `品牌官号-01` / `运营小号-A` / `护肤测评` / `好物速递`（按当前平台过滤）
- 地区：不限 / 北京市 / 上海市 / 广东省 / 浙江省 / 江苏省 / 四川省
- 触达动作：用 `Checkbox` 组，不要用不可提交的 pill button 冒充表单值

**对标：** 执行账号\*、对标账号主页链接\*（单条，hint：分享名片复制链接）、命中关键词、地区、触达动作（默认私信+点赞）、私信数量 30、私信间隔 60、评论数量 20、评论间隔 90、隐藏模式 Switch（默认关，旁注不推荐）、兼容模式 Switch（默认开）

**视频：** 执行账号\*、地区、目标作品视频链接\*（Textarea，一行一个）、评论筛选关键词、触达动作（默认私信+评论回复）、私信 20/70、评论 15/100、隐藏/兼容

**关键词：** 执行账号\*、搜索关键词\*（每任务仅一个，默认 `家居好物`）、命中关键词、地区、触达动作（默认「私信（含 AI 自动回复）」+点赞）、私信 30/60、评论 20/90、隐藏/兼容

**直播：** 执行账号\*、直播间地址\*、弹幕关键词、触达动作（默认私信）、私信 50/45、兼容模式（默认开）。无隐藏模式。底部说明：主播下播自动暂停；匿名保护直播间无评论

**粉丝：** 粉丝来源 pill（自有 / 对标）→ 自有显示账号 Select，对标显示主页链接。「开始采集」后展示 3 行 mock 粉丝表，全选 + 私信 Switch + 百分比 100%/50% + 间隔 90 + 预设 Select。「开始私信」在未采集或未勾选时禁用

**批量触达：** 执行账号\*、私信/关注 Switch、间隔、私信内容 Select（预设·获客 / 预设·售后 / 直接输入）；选直接输入时显示 Textarea

**导入：** 导入到（个微/企微）、导入范围（仅已留联系方式 / 全部）

**充值：** 当前余额 1,000 + 到期时间；套餐 ¥100/1,000、¥500/5,500 加赠 10%、¥2,000/24,000 加赠 20%；支付 微信/支付宝。去支付：`message.info('演示环境：已生成充值订单，请联系运营完成支付')`

**数字人新建克隆音色（当前缺，必须补）：** 音色名称\*、性别\*、上传音频 MP3\*。按钮「提交克隆」

---

## 表格列（VXE `columns`）

账号：账号昵称、性别、应用信息（绑定智能体）、平台、创建时间、初始化(秒)、同时私信数、监听、操作（绑定智能体 / 开启|关闭监听 / 拉取会话）

回复预设：ID、所属分类、类型、内容、创建时间、操作（编辑 / 删除）

关键词预设：分类名称、包含关键词、创建时间、操作（编辑 / 删除）

进程：进程ID、执行账号、平台、获客链接/关键词、拓客类型、私信、关注、点赞、回复、创建时间、操作（停止）

任务：任务ID、任务名称、类型、执行账号、平台、状态、进度、创建时间、操作（详情 / 一键复制 / 查看评论）

互动：checkbox、用户、动作、内容、时间、状态

评论：checkbox、视频标题、获客类型、发送人、评论内容、评论IP、是否私信、是否关注、评论时间、操作

直播评论：checkbox、直播间、发送人、性别、评论内容、是否私信、是否关注、添加时间、操作

粉丝列表：checkbox、名称、个性签名、粉丝数、关注数、作品数、获赞数、状态、是否私信、是否关注、创建时间、操作

联系人：联系人、平台、来源任务、触达方式、联系方式、最近互动、状态、操作。`scroll.x` 至少 960，手机可横滑

所有列表弹窗的「新建 / 刷新 / 导出 / 删除」点击只 `message.success/info`，不写真实 CRUD 后端。

---

## 要删除的内容

删除这些路由模块和视图（模板残留，原型没有）：

- `apps/web-antd/src/router/routes/modules/dashboard.ts`
- `apps/web-antd/src/router/routes/modules/demos.ts`
- `apps/web-antd/src/router/routes/modules/vben.ts`（其中 Profile 挪到 `ai-butler.ts`，`hideInMenu: true`）
- `apps/web-antd/src/views/dashboard/**`
- `apps/web-antd/src/views/demos/**`
- `apps/web-antd/src/views/ai-butler/login/index.vue`（死代码）
- `ai-butler.ts` 里的 `AiButlerLogin` 路由（`/ai-butler/login` 无 children，登录走 `/auth/login`）

保留（布局依赖，见 `views/_core/README.md`）：

- `_core/authentication/*`（登录改皮肤；code-login / qrcode / register / forget-password 路由保留但不在登录页露出入口）
- `_core/fallback/*`
- `_core/profile/*`（用户下拉仍跳个人中心）
- `_core/about` 文件可留着，但菜单不再挂它

`overridesPreferences.app.defaultHomePath` 改为 `/ai-butler/workbench`。不要改 `packages/@core/preferences/src/config.ts` 的全局默认值（会破坏该包快照测试）。

---

## 文件结构

按职责拆文件，弹窗一个文件一个弹窗，避免 `acquisition/index.vue` 再膨胀。

- 修改：`apps/web-antd/src/preferences.ts` — 浅色 + 主色 `#0A0A0A` + 默认首页 + 侧栏宽度
- 修改：`apps/web-antd/src/router/routes/modules/ai-butler.ts` — 菜单分组、删死登录、挂 Profile
- 删除：`dashboard.ts`、`demos.ts`、`vben.ts` 及对应 views
- 修改：`apps/web-antd/src/layouts/basic.vue` — 顶栏到期 / 算力点
- 修改：`apps/web-antd/src/views/_core/authentication/login.vue` — 奇克登录
- 创建：`apps/web-antd/src/views/ai-butler/_shared/mock-data.ts` — 从原型 `DB` 拷贝的演示数据
- 创建：`apps/web-antd/src/views/ai-butler/_shared/login-payload.ts` — 登录字段映射
- 创建：`apps/web-antd/src/views/ai-butler/_shared/contact-filter.ts` — 联系人筛选
- 创建：`apps/web-antd/src/views/ai-butler/_shared/video-cost.ts` — 文生视频算力
- 创建：`apps/web-antd/src/views/ai-butler/_shared/chic-classes.ts` — 复用的 Tailwind class 字符串
- 创建：`apps/web-antd/src/views/ai-butler/acquisition/smart-icons.vue` — SVG sprite
- 创建：`apps/web-antd/src/views/ai-butler/acquisition/action-card.vue` — 功能卡
- 创建：`apps/web-antd/src/views/ai-butler/acquisition/modals/*.vue` — 上表每个弹窗
- 修改：`workbench/index.vue`、`acquisition/index.vue`、`chat/index.vue`、`contacts/index.vue`、`digital/index.vue`、`video/index.vue`
- 测试：上述 `_shared/*.test.ts` 与 `ai-butler.routes.test.ts`

响应式断点（全页统一，不要各写各的）：

- `< sm`（640）：单列，统计 2 列，弹窗近全宽，聊天只显示列表或面板
- `sm`–`lg`：统计 2–4 列，获客卡 2 列
- `>= lg`：工作台两列，获客主要功能 4 列 / 拓客与任务 5 列，文生视频左配置右作品库，聊天双栏

---

## 视觉 Token（写入 preferences，页面用 Tailwind）

在 `overridesPreferences`：

```ts
app: {
  name: import.meta.env.VITE_APP_TITLE,
  defaultHomePath: '/ai-butler/workbench',
},
theme: {
  mode: 'light',
  colorPrimary: 'hsl(0 0% 4%)', // #0A0A0A
},
sidebar: {
  width: 188,
},
header: {
  height: 50,
},
```

页面级颜色不要再写 `#4B3FE3` 紫主色。工作台 hero 和获客卡允许保留原型里的彩色点缀（hero 渐变字、卡底 `t-purple` 等），那是奇克版自己的强调色，不是旧模板紫。

复用 class 放 `_shared/chic-classes.ts`：

```ts
export const cardClass =
  'rounded-[15px] border border-[#DCDAD4] bg-white shadow-[0_1px_0_rgba(10,10,10,.04),0_5px_16px_rgba(10,10,10,.035)]';

export const primaryBtnClass =
  'bg-[#0A0A0A] border-[#0A0A0A] text-white shadow-[2px_2px_0_#C9C8C1] hover:bg-[#242424]';

export const pillActiveClass =
  'border-[#0A0A0A] bg-[#F0F0EC] text-[#0A0A0A] font-semibold shadow-[3px_3px_0_#D1D0C9]';

export const pageGapClass = 'flex flex-col gap-3.5 sm:gap-4';
```

Ant Design `Button type="primary"` 会跟 `colorPrimary` 走，业务页优先用 antd Button，不要再硬编码紫色。

---

### 任务 1：路由清理与菜单分组

**文件：**

- 修改：`apps/web-antd/src/router/routes/modules/ai-butler.ts`
- 删除：`apps/web-antd/src/router/routes/modules/dashboard.ts`
- 删除：`apps/web-antd/src/router/routes/modules/demos.ts`
- 删除：`apps/web-antd/src/router/routes/modules/vben.ts`
- 删除：`apps/web-antd/src/views/dashboard/**`
- 删除：`apps/web-antd/src/views/demos/**`
- 删除：`apps/web-antd/src/views/ai-butler/login/index.vue`
- 修改：`apps/web-antd/src/preferences.ts`（本任务只加 `defaultHomePath`，主题放到任务 2）
- 测试：`apps/web-antd/src/router/routes/modules/ai-butler.routes.test.ts`

- [ ] **步骤 1：编写失败的测试**

```ts
import { describe, expect, it } from 'vitest';

import aiButler from './ai-butler';

function flatten(routes: typeof aiButler, acc: { name?: string; path: string }[] = []) {
  for (const r of routes) {
    acc.push({ name: r.name as string | undefined, path: r.path });
    if (r.children) flatten(r.children as typeof aiButler, acc);
  }
  return acc;
}

describe('ai-butler routes', () => {
  it('groups acquisition pages under AI 智能获客', () => {
    const root = aiButler.find((r) => r.name === 'AiButler');
    expect(root?.meta?.hideInMenu).toBe(true);
    const names = flatten(aiButler).map((r) => r.name);
    expect(names).toContain('AiButlerGrowth');
    expect(names).toContain('AiButlerAcquisition');
    expect(names).toContain('AiButlerChat');
    expect(names).toContain('AiButlerContacts');
    expect(names).not.toContain('AiButlerLogin');
    expect(names).toContain('Profile');
  });

  it('keeps workbench digital video as top-level menu items', () => {
    const root = aiButler.find((r) => r.name === 'AiButler');
    const childTitles = (root?.children ?? []).map((c) => c.meta?.title);
    expect(childTitles).toContain('工作台');
    expect(childTitles).toContain('AI 智能获客');
    expect(childTitles).toContain('数字人');
    expect(childTitles).toContain('文生视频');
  });
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：`pnpm exec vitest run --dom apps/web-antd/src/router/routes/modules/ai-butler.routes.test.ts`

预期：FAIL，`hideInMenu` 未定义，仍存在 `AiButlerLogin`，没有 `AiButlerGrowth`

- [ ] **步骤 3：编写最少实现代码**

`ai-butler.ts` 改为：

```ts
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      hideInMenu: true,
      title: '阿斯系统',
    },
    name: 'AiButler',
    path: '/ai-butler',
    redirect: '/ai-butler/workbench',
    children: [
      {
        name: 'AiButlerWorkbench',
        path: 'workbench',
        component: () => import('#/views/ai-butler/workbench/index.vue'),
        meta: {
          icon: 'lucide:house',
          order: 1,
          title: '工作台',
        },
      },
      {
        name: 'AiButlerGrowth',
        path: 'growth',
        redirect: '/ai-butler/acquisition',
        meta: {
          icon: 'lucide:target',
          order: 2,
          title: 'AI 智能获客',
        },
        children: [
          {
            name: 'AiButlerAcquisition',
            path: '/ai-butler/acquisition',
            component: () => import('#/views/ai-butler/acquisition/index.vue'),
            meta: {
              icon: 'lucide:target',
              title: '智能获客',
            },
          },
          {
            name: 'AiButlerChat',
            path: '/ai-butler/chat',
            component: () => import('#/views/ai-butler/chat/index.vue'),
            meta: {
              icon: 'lucide:message-circle',
              title: '聊天接管',
            },
          },
          {
            name: 'AiButlerContacts',
            path: '/ai-butler/contacts',
            component: () => import('#/views/ai-butler/contacts/index.vue'),
            meta: {
              icon: 'lucide:users',
              title: '联系列表',
            },
          },
        ],
      },
      {
        name: 'AiButlerDigital',
        path: 'digital',
        component: () => import('#/views/ai-butler/digital/index.vue'),
        meta: {
          icon: 'lucide:mic',
          order: 3,
          title: '数字人',
        },
      },
      {
        name: 'AiButlerVideo',
        path: 'video',
        component: () => import('#/views/ai-butler/video/index.vue'),
        meta: {
          icon: 'lucide:film',
          order: 4,
          title: '文生视频',
        },
      },
    ],
  },
  {
    name: 'Profile',
    path: '/profile',
    component: () => import('#/views/_core/profile/index.vue'),
    meta: {
      hideInMenu: true,
      icon: 'lucide:user',
      title: '个人中心',
    },
  },
];

export default routes;
```

`preferences.ts` 的 `overridesPreferences.app` 增加 `defaultHomePath: '/ai-butler/workbench'`。

删除列出的 dashboard / demos / vben 模块和视图，以及 `views/ai-butler/login/index.vue`。

获客子路由使用绝对 path（`/ai-butler/chat`），这样 URL 不变，菜单却能嵌在「AI 智能获客」下。

- [ ] **步骤 4：运行测试验证通过**

运行：`pnpm exec vitest run --dom apps/web-antd/src/router/routes/modules/ai-butler.routes.test.ts`

预期：PASS

再跑：`pnpm --filter @vben/web-antd exec vue-tsc --noEmit --pretty false`

预期：无因删除 dashboard 路由产生的类型错误。若 `layouts/basic.vue` 里通知示例链到 `/workspace`，改成 `/ai-butler/workbench`。

- [ ] **步骤 5：Commit**

```bash
git add apps/web-antd/src/router apps/web-antd/src/views apps/web-antd/src/preferences.ts
git commit -m "$(cat <<'EOF'
refactor: 收敛阿斯系统菜单并移除模板残留页面

EOF
)"
```

---

### 任务 2：奇克 Token 与顶栏算力点

**文件：**

- 修改：`apps/web-antd/src/preferences.ts`
- 修改：`apps/web-antd/src/layouts/basic.vue`
- 创建：`apps/web-antd/src/views/ai-butler/_shared/chic-classes.ts`
- 创建：`apps/web-antd/src/views/ai-butler/_shared/video-cost.ts`
- 测试：`apps/web-antd/src/views/ai-butler/_shared/video-cost.test.ts`
- 创建：`apps/web-antd/src/views/ai-butler/recharge/recharge-modal.vue`

- [ ] **步骤 1：编写失败的测试**

```ts
import { describe, expect, it } from 'vitest';

import { calcVideoCost } from './video-cost';

describe('calcVideoCost', () => {
  it('returns 10 for Seedance 5s 720P', () => {
    expect(
      calcVideoCost({
        engine: 'Seedance',
        duration: '5s',
        quality: '720P',
      }),
    ).toBe(10);
  });

  it('adds grok veo duration and quality', () => {
    expect(
      calcVideoCost({
        engine: 'Grok',
        duration: '10s',
        quality: '1080P',
      }),
    ).toBe(25);
    expect(
      calcVideoCost({
        engine: 'VEO',
        duration: '5s',
        quality: '720P',
      }),
    ).toBe(18);
  });
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：`pnpm exec vitest run --dom apps/web-antd/src/views/ai-butler/_shared/video-cost.test.ts`

预期：FAIL，`calcVideoCost` 未定义

- [ ] **步骤 3：编写最少实现代码**

```ts
export type VideoEngine = 'Grok' | 'Seedance' | 'VEO';

export function calcVideoCost(input: {
  duration: '10s' | '5s';
  engine: VideoEngine;
  quality: '1080P' | '720P';
}): number {
  let cost = 10;
  if (input.engine === 'Grok') cost += 5;
  if (input.engine === 'VEO') cost += 8;
  if (input.duration === '10s') cost += 5;
  if (input.quality === '1080P') cost += 5;
  return cost;
}
```

`preferences.ts` 补上任务 1 的 `defaultHomePath` 以及：

```ts
theme: {
  mode: 'light',
  colorPrimary: 'hsl(0 0% 4%)',
},
sidebar: {
  width: 188,
},
```

`recharge-modal.vue`：`useVbenModal` + `useVbenForm`，schema 为套餐 Radio（1000/5500/24000）和支付 Radio（wx/alipay）。`onConfirm` 只 toast。

`basic.vue` 增加：

```vue
<template #header-right-0>
  <span class="hidden rounded-full border border-[#D9D8D1] bg-white px-2.5 py-1 text-[12px] sm:inline">
    到期时间 <b>2027-11-26 14:50</b>
  </span>
</template>
<template #header-right-1>
  <button
    type="button"
    class="rounded-full border border-[#0A0A0A] bg-white px-2.5 py-1 text-[12px] hover:bg-[#0A0A0A] hover:text-white"
    @click="rechargeModalApi.open()"
  >
    算力点 <b>1,000</b>
  </button>
</template>
```

插槽规则见 `packages/effects/layouts/src/basic/README.md`：`header-right-n` 排在全局搜索之前。手机上到期时间 `hidden sm:inline`，算力点始终显示。

在 `basic.vue` 引入 `RechargeModal`，保存 `rechargeModalApi`。

- [ ] **步骤 4：运行测试验证通过**

运行：`pnpm exec vitest run --dom apps/web-antd/src/views/ai-butler/_shared/video-cost.test.ts`

预期：PASS

- [ ] **步骤 5：Commit**

```bash
git add apps/web-antd/src/preferences.ts apps/web-antd/src/layouts/basic.vue apps/web-antd/src/views/ai-butler/_shared apps/web-antd/src/views/ai-butler/recharge
git commit -m "$(cat <<'EOF'
feat: 接入黑白奇克主色并在顶栏展示算力点

EOF
)"
```

---

### 任务 3：登录页对齐原型

**文件：**

- 修改：`apps/web-antd/src/views/_core/authentication/login.vue`
- 创建：`apps/web-antd/src/views/ai-butler/_shared/login-payload.ts`
- 测试：`apps/web-antd/src/views/ai-butler/_shared/login-payload.test.ts`

- [ ] **步骤 1：编写失败的测试**

```ts
import { describe, expect, it } from 'vitest';

import { toAuthLoginPayload } from './login-payload';

describe('toAuthLoginPayload', () => {
  it('maps sms tab to username/password', () => {
    expect(
      toAuthLoginPayload({
        tab: 'code',
        phone: '13800006688',
        code: '123456',
        password: '',
      }),
    ).toEqual({ username: '13800006688', password: '123456' });
  });

  it('maps password tab to username/password', () => {
    expect(
      toAuthLoginPayload({
        tab: 'pwd',
        phone: 'vben',
        code: '',
        password: '123456',
      }),
    ).toEqual({ username: 'vben', password: '123456' });
  });
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：`pnpm exec vitest run --dom apps/web-antd/src/views/ai-butler/_shared/login-payload.test.ts`

预期：FAIL，`toAuthLoginPayload` 未定义

- [ ] **步骤 3：编写最少实现代码**

```ts
export type LoginTab = 'code' | 'pwd';

export function toAuthLoginPayload(input: {
  code: string;
  password: string;
  phone: string;
  tab: LoginTab;
}): { password: string; username: string } {
  return {
    username: input.phone,
    password: input.tab === 'code' ? input.code : input.password,
  };
}
```

重写 `login.vue`：不要再用 `AuthenticationLogin`（它会带出账号下拉、第三方、注册）。页面自己排版，表单用：

```ts
import type { VbenFormSchema } from '@vben-core/form-ui';

import { computed, reactive, ref } from 'vue';

import { useVbenForm } from '@vben-core/form-ui';
import { VbenButton, VbenCheckbox } from '@vben-core/shadcn-ui';

import { useAuthStore } from '#/store';

import { toAuthLoginPayload } from '#/views/ai-butler/_shared/login-payload';
```

两个 `useVbenForm`：`codeSchema` 字段 `phone` + `code`；`pwdSchema` 字段 `phone` + `password`。`commonConfig.hideLabel = true`。Tab 切换只渲染其中一个 Form。

模板结构对齐原型 777–804 行：居中卡片、`AS` 品牌、Tab、主按钮、协议勾选、设备提示。背景用 `bg-[#F4F4F1]` 加细网格（Tailwind `bg-[linear-gradient(...)]`）。主按钮 `class="w-full"` + `VbenButton`，`:loading="authStore.loginLoading"`。

协议未勾选时不调用 `authLogin`。服务协议 / 隐私政策链接 `message.info('演示：协议文本')`。

获取验证码不要放进 form-ui 的特殊组件也能做：在验证码 Form 的 `code` 字段右侧用插槽做不到时，把「获取验证码」做成 Form 下方独立 `VbenButton variant="outline"`，倒计时 60s。字段仍是 `phone` + `code`。

提交：

```ts
const payload = toAuthLoginPayload({
  tab: activeTab.value,
  phone: String(values.phone ?? ''),
  code: String(values.code ?? ''),
  password: String(values.password ?? ''),
});
await authStore.authLogin(payload);
```

不改 `authStore`。

- [ ] **步骤 4：运行测试验证通过**

运行：`pnpm exec vitest run --dom apps/web-antd/src/views/ai-butler/_shared/login-payload.test.ts`

预期：PASS

- [ ] **步骤 5：Commit**

```bash
git add apps/web-antd/src/views/_core/authentication/login.vue apps/web-antd/src/views/ai-butler/_shared/login-payload.ts apps/web-antd/src/views/ai-butler/_shared/login-payload.test.ts
git commit -m "$(cat <<'EOF'
feat: 登录页改为验证码/密码双 Tab 的奇克样式

EOF
)"
```

---

### 任务 4：工作台对齐原型

**文件：**

- 修改：`apps/web-antd/src/views/ai-butler/workbench/index.vue`

- [ ] **步骤 1：编写失败的测试**

在 `workbench/index.vue` 抽出常量到 `_shared/mock-data.ts` 的 `workbenchStats`，测试文件：

```ts
import { describe, expect, it } from 'vitest';

import { workbenchStats } from './mock-data';

describe('workbenchStats', () => {
  it('matches demo overview cards', () => {
    expect(workbenchStats.map((s) => s.label)).toEqual([
      '运行中任务',
      '今日新增线索',
      '累计私信触达',
      '今日自动化执行',
    ]);
    expect(workbenchStats[3]?.value).toBe('42');
  });
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：`pnpm exec vitest run --dom apps/web-antd/src/views/ai-butler/_shared/mock-data.test.ts`

预期：FAIL，`workbenchStats` 未导出或仍是「已生成视频」

- [ ] **步骤 3：编写最少实现代码**

`mock-data.ts` 写入工作台统计、设备、动态，文案与原型 859–881 行一致。

重写 `workbench/index.vue`：

- 去掉三张快捷入口
- hero 用原型文案和浅色渐变，不要旧的深紫「AI 超级员工」
- 统计第四张改为「今日自动化执行 / 42 / 成功 40 · 待处理 2」
- 两列在 `grid-cols-1 lg:grid-cols-2`
- 「查看全部」跳转 `AiButlerAcquisition`

统计卡 class：白底、顶条彩色（可用 `nth` 对应 `#6675F5 / #16B9D4 / #9B60E8 / #FF8C5A`）。

- [ ] **步骤 4：运行测试验证通过**

运行：`pnpm exec vitest run --dom apps/web-antd/src/views/ai-butler/_shared/mock-data.test.ts`

预期：PASS

- [ ] **步骤 5：Commit**

```bash
git add apps/web-antd/src/views/ai-butler/workbench/index.vue apps/web-antd/src/views/ai-butler/_shared/mock-data.ts apps/web-antd/src/views/ai-butler/_shared/mock-data.test.ts
git commit -m "$(cat <<'EOF'
feat: 工作台对齐黑白奇克版数据总览与动态

EOF
)"
```

---

### 任务 5：智能获客入口页与 SVG 卡

**文件：**

- 创建：`apps/web-antd/src/views/ai-butler/acquisition/smart-icons.vue`
- 创建：`apps/web-antd/src/views/ai-butler/acquisition/action-card.vue`
- 修改：`apps/web-antd/src/views/ai-butler/acquisition/index.vue`

- [ ] **步骤 1：编写失败的测试**

在 `mock-data.ts` 增加 `acquisitionCards`，测试：

```ts
import { describe, expect, it } from 'vitest';

import { acqZoneCards, acqLeadCards, acqTaskCards } from './mock-data';

describe('acquisition cards', () => {
  it('has 4 + 5 + 5 entries matching demo', () => {
    expect(acqZoneCards.map((c) => c.key)).toEqual([
      'account',
      'reply',
      'keyword',
      'process',
    ]);
    expect(acqLeadCards.map((c) => c.key)).toEqual([
      'competitor',
      'video',
      'keyword',
      'live',
      'fan',
    ]);
    expect(acqTaskCards.map((c) => c.key)).toEqual([
      'tasks',
      'interact',
      'comment',
      'live',
      'fan',
    ]);
  });
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：`pnpm exec vitest run --dom apps/web-antd/src/views/ai-butler/_shared/mock-data.test.ts`

预期：FAIL，上述导出不存在

- [ ] **步骤 3：编写最少实现代码**

`smart-icons.vue`：把原型 690–746 行 `<svg class="smart-icon-defs">` 整段放进组件模板（隐藏 `class="absolute h-0 w-0 overflow-hidden"`）。`action-card.vue` 接收 `title` / `desc` / `iconId` / `tone`，用 `<svg viewBox="0 0 64 64"><use :href="`#${iconId}`" /></svg>`。

`index.vue`：平台 Tab、banner、三组 grid。点击目前先 `openModal(key)` 空实现也可，但要把 `openModal` 留成注入函数，任务 6/7 往里接。

Grid：

- 主要功能：`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- 拓客 / 任务：`grid-cols-1 sm:grid-cols-2 xl:grid-cols-5`

卡样式对齐原型 `t-purple` 等渐变底 + 底边强调条。不要再使用 emoji 方块。

- [ ] **步骤 4：运行测试验证通过**

运行：`pnpm exec vitest run --dom apps/web-antd/src/views/ai-butler/_shared/mock-data.test.ts`

预期：PASS

- [ ] **步骤 5：Commit**

```bash
git add apps/web-antd/src/views/ai-butler/acquisition apps/web-antd/src/views/ai-butler/_shared
git commit -m "$(cat <<'EOF'
feat: 智能获客入口页改用原型彩色 SVG 功能卡

EOF
)"
```

---

### 任务 6：说明类弹窗与账号 / 预设 / 进程 / 任务列表弹窗

**文件：**

- 创建：`apps/web-antd/src/views/ai-butler/acquisition/modals/overview-modal.vue`
- 创建：`apps/web-antd/src/views/ai-butler/acquisition/modals/notice-modal.vue`
- 创建：`apps/web-antd/src/views/ai-butler/acquisition/modals/guide-modal.vue`
- 创建：`apps/web-antd/src/views/ai-butler/acquisition/modals/account-modal.vue`
- 创建：`apps/web-antd/src/views/ai-butler/acquisition/modals/auth-modal.vue`
- 创建：`apps/web-antd/src/views/ai-butler/acquisition/modals/reply-modal.vue`
- 创建：`apps/web-antd/src/views/ai-butler/acquisition/modals/keyword-modal.vue`
- 创建：`apps/web-antd/src/views/ai-butler/acquisition/modals/process-modal.vue`
- 创建：`apps/web-antd/src/views/ai-butler/acquisition/modals/tasks-modal.vue`
- 创建：`apps/web-antd/src/views/ai-butler/acquisition/modals/task-detail-modal.vue`
- 修改：`acquisition/index.vue` 挂载并打开这些 Modal
- 修改：`_shared/mock-data.ts` 写入原型 `DB.accounts` / `replyPresets` / `keywordPresets` / `processes` / `tasks`（2179–2205 行原文）

每个列表 Modal 模式（以账号为例，其它照抄换列）：

```vue
<script lang="ts" setup>
import { useVbenModal } from '@vben/common-ui';
import { Button, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

import { mockAccounts } from '../../_shared/mock-data';

const [Grid] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { field: 'nickname', title: '账号昵称', minWidth: 120 },
      { field: 'gender', title: '性别', width: 70 },
      { field: 'agent', title: '应用信息（绑定智能体）', minWidth: 160 },
      { field: 'platform', title: '平台', width: 90 },
      { field: 'createdAt', title: '创建时间', minWidth: 160 },
      { field: 'initTimeout', title: '初始化(秒)', width: 100 },
      { field: 'maxPrivateMsg', title: '同时私信数', width: 110 },
      { field: 'listenOn', title: '监听', width: 80 },
      { title: '操作', width: 220, slots: { default: 'actions' } },
    ],
    data: mockAccounts,
    pagerConfig: { enabled: false },
    scrollX: { enabled: true },
  },
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-[calc(100%-32px)] lg:w-[780px]',
  fullscreenButton: true,
  title: '账号管理 · 某音',
});

defineExpose({ modalApi });
</script>
<template>
  <Modal>
    <div class="mb-3 flex flex-wrap gap-2">
      <Button type="primary" size="small" @click="message.info('打开授权向导（演示）')">
        ＋ 授权账号
      </Button>
      <Button size="small">刷新</Button>
    </div>
    <Grid>
      <template #actions>
        <Button type="link" size="small">绑定智能体</Button>
      </template>
    </Grid>
  </Modal>
</template>
```

`notice-modal` / `guide-modal` 无表格，body 用原型 2031–2037、2048–2054 行原文。

`auth-modal` 用 4 个状态点 + `setTimeout` 推进，不调 `platformApi.browser`。

`task-detail-modal` 用 `modalApi.getData()` 接收任务行，把 `settings` 渲染成 `dl`。

- [ ] **步骤 1：编写失败的测试**

```ts
import { describe, expect, it } from 'vitest';

import { mockAccounts, mockTasks } from './mock-data';

describe('acquisition mock tables', () => {
  it('loads demo accounts and tasks', () => {
    expect(mockAccounts).toHaveLength(5);
    expect(mockAccounts[0]?.nickname).toBe('小雅来啦');
    expect(mockTasks[0]?.id).toBe('T20260812001');
    expect(mockTasks[0]?.settings?.关键词).toBe('家居好物');
  });
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：`pnpm exec vitest run --dom apps/web-antd/src/views/ai-butler/_shared/mock-data.test.ts`

预期：FAIL，mock 表不存在

- [ ] **步骤 3：实现 mock + 弹窗组件并在入口页打开**

`index.vue` 对每个 Modal `ref` + `defineExpose.modalApi.open()`。平台切换时 `accountModalApi.setState({ title: '账号管理 · ' + label })`。

- [ ] **步骤 4：运行测试验证通过**

运行：`pnpm exec vitest run --dom apps/web-antd/src/views/ai-butler/_shared/mock-data.test.ts`

预期：PASS

- [ ] **步骤 5：Commit**

```bash
git add apps/web-antd/src/views/ai-butler/acquisition apps/web-antd/src/views/ai-butler/_shared
git commit -m "$(cat <<'EOF'
feat: 接入智能获客账号、预设、进程与任务列表弹窗

EOF
)"
```

---

### 任务 7：明细列表弹窗与批量触达 / 五类拓客表单

**文件：**

- 创建：`modals/interact-modal.vue`、`comment-modal.vue`、`live-comment-modal.vue`、`fan-list-modal.vue`、`batch-modal.vue`
- 创建：`modals/acq-competitor-modal.vue`、`acq-video-modal.vue`、`acq-keyword-modal.vue`、`acq-live-modal.vue`、`acq-fan-modal.vue`
- 修改：`_shared/mock-data.ts` 补 `comments` / `liveComments` / 互动 / 粉丝采集行（原型 2216 行起）
- 修改：`acquisition/index.vue` 接线

表单弹窗统一骨架（以关键词拓客为例，其它按上面「拓客表单字段」换 schema）：

```ts
import { useVbenModal } from '@vben/common-ui';
import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';

const [Form, formApi] = useVbenForm({
  wrapperClass: 'grid-cols-1 sm:grid-cols-2',
  schema: [
    {
      component: 'Select',
      fieldName: 'account',
      label: '执行账号',
      rules: 'selectRequired',
      componentProps: {
        options: [
          { label: '小雅来啦', value: '小雅来啦' },
          { label: '品牌官号-01', value: '品牌官号-01' },
        ],
        class: 'w-full',
      },
      help: '多开任务须选择不同账号',
    },
    {
      component: 'Input',
      fieldName: 'keyword',
      label: '搜索关键词',
      rules: 'required',
      defaultValue: '家居好物',
      help: '每任务仅一个；全平台搜索、非精准筛选',
    },
    {
      component: 'Input',
      fieldName: 'hitKeywords',
      label: '命中关键词',
      defaultValue: '多少钱,怎么买,有链接吗',
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'Select',
      fieldName: 'region',
      label: '地区',
      defaultValue: '不限',
      componentProps: {
        class: 'w-full',
        options: ['不限', '北京市', '上海市', '广东省', '浙江省', '江苏省', '四川省'].map(
          (v) => ({ label: v, value: v }),
        ),
      },
    },
    {
      component: 'CheckboxGroup',
      fieldName: 'actions',
      label: '触达动作',
      defaultValue: ['dm', 'like'],
      componentProps: {
        options: [
          { label: '私信（含 AI 自动回复）', value: 'dm' },
          { label: '点赞', value: 'like' },
          { label: '评论回复', value: 'reply' },
          { label: '关注', value: 'follow' },
        ],
      },
    },
    { component: 'InputNumber', fieldName: 'dmCount', label: '私信数量（条/日）', defaultValue: 30 },
    { component: 'InputNumber', fieldName: 'dmGap', label: '私信间隔（秒）', defaultValue: 60 },
    { component: 'InputNumber', fieldName: 'cmtCount', label: '评论数量（条/日）', defaultValue: 20 },
    { component: 'InputNumber', fieldName: 'cmtGap', label: '评论间隔（秒）', defaultValue: 90 },
    {
      component: 'Switch',
      fieldName: 'hiddenMode',
      label: '隐藏模式',
      defaultValue: false,
      help: '不推荐开启：隐藏执行易被平台识别为异常行为',
    },
    {
      component: 'Switch',
      fieldName: 'compatMode',
      label: '兼容模式',
      defaultValue: false,
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-[calc(100%-32px)] md:w-[640px]',
  fullscreenButton: true,
  title: '关键词拓客 · 新建任务',
  onConfirm: async () => {
    await formApi.validateAndSubmitForm();
  },
  onCancel() {
    modalApi.close();
  },
});

function onSubmit(_values: Record<string, unknown>) {
  message.success('任务已提交，由本机 RPA 引擎执行（演示）');
  modalApi.close();
}
```

`acq-fan-modal` 例外：上半 `useVbenForm` 来源/账号/链接；下半采集结果用 VXE + 第二份小 form。未采集时 Confirm 文案仍是「开始私信」但 `disabled`（`modalApi.setState({ confirmDisabled: true })`，若 API 无该字段则在 footer 自定义按钮）。

`batch-modal` 的「直接输入」用 schema `dependencies`：`preset === 'custom'` 时显示 Textarea。

明细表要有 checkbox 列：`{ type: 'checkbox', width: 36 }`。

- [ ] **步骤 1：编写失败的测试**

```ts
import { describe, expect, it } from 'vitest';

import { mockComments, mockLiveComments } from './mock-data';

describe('lead detail mocks', () => {
  it('includes demo comment and live rows', () => {
    expect(mockComments[0]?.name).toBe('Dy丁大帅');
    expect(mockLiveComments[0]?.room).toBe('品牌大促专场');
  });
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：`pnpm exec vitest run --dom apps/web-antd/src/views/ai-butler/_shared/mock-data.test.ts`

预期：FAIL

- [ ] **步骤 3：实现全部表单弹窗并接线**

五个拓客卡分别 `acqXxxModalApi.open()`。任务卡分别打开对应列表。列表「更多操作」打开 `batch-modal`。

- [ ] **步骤 4：运行测试验证通过**

运行：`pnpm exec vitest run --dom apps/web-antd/src/views/ai-butler/_shared/mock-data.test.ts`

预期：PASS

- [ ] **步骤 5：Commit**

```bash
git add apps/web-antd/src/views/ai-butler/acquisition apps/web-antd/src/views/ai-butler/_shared
git commit -m "$(cat <<'EOF'
feat: 补齐拓客新建任务表单与线索明细弹窗

EOF
)"
```

---

### 任务 8：联系列表筛选、VXE 表与导入弹窗

**文件：**

- 修改：`apps/web-antd/src/views/ai-butler/contacts/index.vue`
- 创建：`apps/web-antd/src/views/ai-butler/_shared/contact-filter.ts`
- 测试：`apps/web-antd/src/views/ai-butler/_shared/contact-filter.test.ts`
- 创建：`apps/web-antd/src/views/ai-butler/contacts/import-modal.vue`

- [ ] **步骤 1：编写失败的测试**

```ts
import { describe, expect, it } from 'vitest';

import { filterContacts } from './contact-filter';

const rows = [
  {
    id: 'c1',
    name: '家居控小林',
    platform: 'douyin',
    source: '关键词拓客 · 家居好物',
    phone: '138****6688',
    status: '待跟进',
  },
  {
    id: 'c4',
    name: '某手-阿强',
    platform: 'kuaishou',
    source: '直播拓客 · 家居专场',
    phone: '—',
    status: '未回复',
  },
];

describe('filterContacts', () => {
  it('filters by platform status source and search', () => {
    expect(
      filterContacts(rows, {
        platform: 'douyin',
        status: 'all',
        source: 'all',
        search: '',
      }),
    ).toHaveLength(1);
    expect(
      filterContacts(rows, {
        platform: 'all',
        status: '未回复',
        source: 'all',
        search: '',
      })[0]?.name,
    ).toBe('某手-阿强');
    expect(
      filterContacts(rows, {
        platform: 'all',
        status: 'all',
        source: 'all',
        search: '小林',
      }),
    ).toHaveLength(1);
  });
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：`pnpm exec vitest run --dom apps/web-antd/src/views/ai-butler/_shared/contact-filter.test.ts`

预期：FAIL，`filterContacts` 未定义

- [ ] **步骤 3：编写最少实现代码**

```ts
export interface ContactRow {
  id: string;
  name: string;
  phone: string;
  platform: string;
  source: string;
  status: string;
}

export function filterContacts(
  rows: ContactRow[],
  query: { platform: string; search: string; source: string; status: string },
): ContactRow[] {
  const keyword = query.search.trim();
  return rows.filter((row) => {
    if (query.platform !== 'all' && row.platform !== query.platform) return false;
    if (query.status !== 'all' && row.status !== query.status) return false;
    if (query.source !== 'all' && row.source !== query.source) return false;
    if (keyword && !row.name.includes(keyword) && !row.phone.includes(keyword))
      return false;
    return true;
  });
}
```

`contacts/index.vue` 去掉 ant-design-vue `Table`，改 `useVbenVxeGrid`，`data` 用 `computed(() => filterContacts(mockContacts, query))`。筛选四个控件放在表格上方，移动端 `flex-col`，`sm:flex-row`。

`import-modal.vue`：`useVbenForm` 两个 Radio/Checkbox 组字段 `target: gewei|qiwei`、`scope: contact|all`，确认后 `message.success('已导入到个微加好友任务（演示）')`。

- [ ] **步骤 4：运行测试验证通过**

运行：`pnpm exec vitest run --dom apps/web-antd/src/views/ai-butler/_shared/contact-filter.test.ts`

预期：PASS

- [ ] **步骤 5：Commit**

```bash
git add apps/web-antd/src/views/ai-butler/contacts apps/web-antd/src/views/ai-butler/_shared/contact-filter.ts apps/web-antd/src/views/ai-butler/_shared/contact-filter.test.ts
git commit -m "$(cat <<'EOF'
feat: 联系列表改用 VXE 并补导入好友任务弹窗

EOF
)"
```

---

### 任务 9：聊天接管视觉对齐奇克版

**文件：**

- 修改：`apps/web-antd/src/views/ai-butler/chat/index.vue`

不抽逻辑测试（行为已存在）。本任务只改 class：

- 选中会话：`bg-[#EBEBE6] shadow-[inset_3px_0_0_#0A0A0A]`，去掉紫底 `#F3F1FF`
- 右侧气泡：`bg-[#0A0A0A] text-white`，不要 `#4B3FE3`
- 筛选 pill 激活：黑底白字
- 输入区按钮用 antd `type="primary"`（已随 Token 变黑）
- 保留现有 `< md` 列表/面板互斥和 `>= md` 双栏
- 「模拟收到新私信」仅 `hidden md:flex`，点击 `message.info('收到新私信 · 家居控小林')`

核对：不要删会话数据、接管切换、发送消息。

- [ ] **步骤 1：把右侧气泡 class 从紫色改为 `#0A0A0A`**
- [ ] **步骤 2：把选中态从 `#F3F1FF` 改为左侧黑条灰底**
- [ ] **步骤 3：人工打开 `/ai-butler/chat` 看 PC 双栏和手机列表→详情返回**
- [ ] **步骤 4：Commit**

```bash
git add apps/web-antd/src/views/ai-butler/chat/index.vue
git commit -m "$(cat <<'EOF'
style: 聊天接管配色对齐黑白奇克版

EOF
)"
```

本任务没有新的纯函数。不要为了凑 TDD 去测 CSS class 字符串。

---

### 任务 10：数字人表单改 useVbenForm 并补克隆音色

**文件：**

- 修改：`apps/web-antd/src/views/ai-butler/digital/index.vue`
- 创建：`apps/web-antd/src/views/ai-butler/digital/preview-modal.vue`（若任务 11 的预览可共用，则放到 `_shared/preview-modal.vue`）

Tab 仍是五个。每个含表单的面板一个 `useVbenForm`：

**复刻 schema：** `name` Input\*、`gender` Select 女/男\*、`method` Radio 在线/上传\*。`dependencies.triggerFields: ['method']`：`online` 显示只读朗读文本 Slot（用 `component: 'Input'` 配 `disabled` 不合适，改在 Form 下方 `v-if` 渲染原型 10 句说明）；`upload` 显示 `Upload`。底部费用行写死「100 算力点」。

**新建克隆音色 schema：** `name`\*、`gender`\*、`file` Upload\*（hint：仅 MP3）。这是相对当前代码的新增块，放在「我的克隆音色」和「文本转语音」之间。

**TTS schema：** `voice` Select\*、`speed` Radio 0.8/1.0/1.2、`text` Textarea\*。提交后 `v-if` 显示试听条。

**形象 schema：** `name`\*、`ratio` Radio 9:16/16:9/1:1\*、`video` Upload\*、`beauty` Switch。拍摄要求用 `<details>` 写在 Form 下方，不要塞进 schema。

**精剪 schema：** `avatar` Select\*、`voice` Select\*、`text` Textarea\*、`ratio` Radio、背景与字幕用 CheckboxGroup（简约办公室 / 绿幕抠像 / 自定义图片 / 自动字幕）。

列表（音色、形象、视频库）继续用现有卡片，不全改表格。视频库「预览」打开共用 `preview-modal`。

Tab 在手机 `flex-wrap`，激活态黑底白字（`dh-tab.active`）。

- [ ] **步骤 1：确认 `digital/index.vue` 模板里出现「新建克隆音色」标题**
- [ ] **步骤 2：把四个表单都改成 `useVbenForm`，删除手写 `Input`/`Select` 表单栅格**
- [ ] **步骤 3：提交按钮调用 `formApi.validateAndSubmitForm()`，成功只 toast**
- [ ] **步骤 4：Commit**

```bash
git add apps/web-antd/src/views/ai-butler/digital
git commit -m "$(cat <<'EOF'
feat: 数字人各 Tab 改用 Vben Form 并补齐克隆音色

EOF
)"
```

---

### 任务 11：文生视频表单化与作品预览

**文件：**

- 修改：`apps/web-antd/src/views/ai-butler/video/index.vue`
- 创建：`apps/web-antd/src/views/ai-butler/_shared/preview-modal.vue`（若任务 10 已建则复用）

左侧整卡一个 `useVbenForm`，用 `dependencies` 切换引擎字段：

- `engine` Radio/卡片：用三个 button 会丢掉表单值，改成 `RadioGroup` 或 `Select`。若必须保留大卡片，卡片 `@click` 里 `formApi.setFieldValue('engine', key)`，schema 仍要有隐藏 `Input` 存值。优先 RadioGroup + 自定义 slot。
- `engine === 'Seedance'` 显示 `sdModel`；`sdModel !== 'Seedance 1.5 Pro'` 显示参考图/参考视频 Upload
- `engine === 'Grok'` 显示参考图 Upload + `channel` Select
- `engine === 'VEO'` 显示三个 Upload（start/mid/end），隐藏 duration 与 quality
- 公共：`prompt` Textarea\*、`duration`、`ratio`、`quality`
- 费用行用 `computed(() => calcVideoCost(...))` 读表单值

右侧作品库两张 mock 卡，预览打开 `preview-modal`（标题、时长、比例、渐变封面）。

布局：`grid-cols-1 lg:grid-cols-[minmax(0,400px)_1fr]`。

- [ ] **步骤 1：把 `video/index.vue` 的生成区改成 `useVbenForm`，费用用 `calcVideoCost`**
- [ ] **步骤 2：VEO 选中时 duration/quality 用 `dependencies.if` 隐藏**
- [ ] **步骤 3：预览弹窗可从数字人库和文生作品库打开**
- [ ] **步骤 4：Commit**

```bash
git add apps/web-antd/src/views/ai-butler/video apps/web-antd/src/views/ai-butler/_shared/preview-modal.vue
git commit -m "$(cat <<'EOF'
feat: 文生视频配置改为 Vben Form 并加上预览弹窗

EOF
)"
```

---

### 任务 12：响应式收口与对照验收

**文件：** 本任务只改发现的漏网 class，不新开功能。

对照清单（必须逐项勾）：

- [ ] `/auth/login` 手机宽度卡片不溢出，Tab 可点，协议勾选后能点登录
- [ ] 登录成功进 `/ai-butler/workbench`（不是 `/dashboard`）
- [ ] 侧栏：工作台、AI 智能获客（3 子项）、数字人、文生视频；无分析页 / 演示 / Vben 文档
- [ ] 工作台无快捷三卡；hero 文案是「智能增长中枢」
- [ ] 智能获客 14 张卡都能打开弹窗；5 个拓客表单能提交 toast
- [ ] 聊天手机先列表后详情，PC 双栏
- [ ] 联系人表能横滑，导入弹窗能开
- [ ] 数字人有「新建克隆音色」
- [ ] 文生视频切 VEO 后时长/清晰度消失
- [ ] 顶栏算力点打开充值
- [ ] 无新的 API 文件，`git diff apps/web-antd/src/api apps/web-antd/src/store/auth.ts` 为空

运行：

```bash
pnpm exec vitest run --dom apps/web-antd/src/views/ai-butler/_shared apps/web-antd/src/router/routes/modules/ai-butler.routes.test.ts
pnpm --filter @vben/web-antd exec vue-tsc --noEmit --pretty false
```

预期：测试全绿，类型检查通过。

用 `pnpm dev:antd` 在 375 和 1280 宽度点一遍上述路由。没有浏览器工具时，用 Vite 启动后 curl `http://localhost:5666` 确认 200，并在报告里写明未做真实设备手势验证。

- [ ] **步骤 1：跑 vitest 与 vue-tsc，修红字**
- [ ] **步骤 2：按对照清单点一遍，修溢出和漏弹窗**
- [ ] **步骤 3：Commit（仅当有修复）**

```bash
git add -A
git commit -m "$(cat <<'EOF'
fix: 收口奇克版响应式与弹窗遗漏

EOF
)"
```

---

## 自检

### 1. 规格覆盖度

| 需求 | 任务 |
| --- | --- |
| 分析并整理各页 HTML 对应关系 | 计划「原型页面对照」「每页内容与交互清单」 |
| 分析弹窗与交互 | 计划「弹窗完整清单」「拓客表单字段」 |
| 移除无用页面并改 router | 任务 1 |
| 手机 / PC 适配 | 文件结构断点 + 任务 3/4/5/8/9/12；弹窗 `fullscreenButton` |
| 只用 Tailwind | 任务 2 `chic-classes` + 各页 utility |
| 组件优先 antd + shadcn-ui | 登录 VbenButton/Checkbox；其它 antd Button/Tag/Card |
| 表单 useVbenForm | 任务 3、7、8、10、11 |
| 表格用封装组件 | 任务 6、7、8 VXE |
| 尽量与 demo 一致 | 任务 4–11 文案/字段从原型拷贝 |
| 不改接口 | 硬约束；登录只做 payload 映射 |

未做：原型标注层、演示控制条、桌面通知、底部状态条（明确排除）。

### 2. 占位符扫描

已避免「待定 / TODO / 类似任务 N / 添加适当的错误处理」。各弹窗字段、列、文案均写死。

### 3. 类型一致性

- 路由名：`AiButler` / `AiButlerGrowth` / `AiButlerAcquisition` / `AiButlerChat` / `AiButlerContacts` / `AiButlerDigital` / `AiButlerVideo` / `Profile`
- 登录映射函数名始终 `toAuthLoginPayload`
- 费用函数名始终 `calcVideoCost`
- 联系人筛选始终 `filterContacts`
- 弹窗暴露始终 `defineExpose({ modalApi })`

---

## 执行交接

计划已完成并保存到 `docs/superpowers/plans/2026-09-03-ai-butler-chic-ui.md`。两种执行方式：

**1. 子代理驱动（推荐）** — 每个任务调度一个新的子代理，任务间进行审查，快速迭代

**2. 内联执行** — 在当前会话中使用 executing-plans 执行任务，批量执行并设有检查点

选哪种方式？
