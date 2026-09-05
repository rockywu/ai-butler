import { defineConfig } from 'vitepress';

export default defineConfig({
  lang: 'zh-CN',
  title: 'AI Butler Backend',
  description: '@ai-butler/backend Fastify 薄内核使用文档',
  cleanUrls: true,
  ignoreDeadLinks: true,
  themeConfig: {
    logo: undefined,
    nav: [
      { text: '指南', link: '/guide/getting-started' },
      { text: '路由', link: '/guide/routes' },
      { text: '数据库', link: '/guide/database' },
    ],
    sidebar: [
      {
        text: '使用指南',
        items: [
          { text: '快速开始', link: '/guide/getting-started' },
          { text: '架构与分层', link: '/guide/architecture' },
          { text: '路由与接口', link: '/guide/routes' },
          { text: '业务逻辑', link: '/guide/logic' },
          { text: '数据库操作', link: '/guide/database' },
          { text: '测试与验证', link: '/guide/testing' },
        ],
      },
    ],
    search: { provider: 'local' },
    outline: { label: '本页目录', level: [2, 3] },
    docFooter: { prev: '上一页', next: '下一页' },
    lastUpdated: { text: '最后更新' },
    sidebarMenuLabel: '菜单',
    returnToTopLabel: '回到顶部',
    darkModeSwitchLabel: '主题',
  },
});
