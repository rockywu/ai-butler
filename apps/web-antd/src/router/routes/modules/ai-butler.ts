import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:sparkles',
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
          icon: 'lucide:layout-dashboard',
          title: '工作台',
        },
      },
      {
        name: 'AiButlerAcquisition',
        path: 'acquisition',
        component: () => import('#/views/ai-butler/acquisition/index.vue'),
        meta: {
          icon: 'lucide:target',
          title: '智能获客',
        },
      },
      {
        name: 'AiButlerChat',
        path: 'chat',
        component: () => import('#/views/ai-butler/chat/index.vue'),
        meta: {
          icon: 'lucide:message-circle',
          title: '聊天接管',
        },
      },
      {
        name: 'AiButlerContacts',
        path: 'contacts',
        component: () => import('#/views/ai-butler/contacts/index.vue'),
        meta: {
          icon: 'lucide:users',
          title: '联系列表',
        },
      },
      {
        name: 'AiButlerDigital',
        path: 'digital',
        component: () => import('#/views/ai-butler/digital/index.vue'),
        meta: {
          icon: 'lucide:mic',
          title: '数字人',
        },
      },
      {
        name: 'AiButlerVideo',
        path: 'video',
        component: () => import('#/views/ai-butler/video/index.vue'),
        meta: {
          icon: 'lucide:film',
          title: '文生视频',
        },
      },
    ],
  },
  {
    component: () => import('#/layouts/auth.vue'),
    meta: {
      hideInTab: true,
      title: '登录',
    },
    name: 'AiButlerLogin',
    path: '/ai-butler/login',
  },
];

export default routes;
