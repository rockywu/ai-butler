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
