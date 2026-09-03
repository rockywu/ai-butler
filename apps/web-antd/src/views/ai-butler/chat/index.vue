<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue';

import {
  Avatar,
  Badge,
  Button,
  Input,
  message,
  Select,
  Tag,
} from 'ant-design-vue';

interface Message {
  id: string;
  side: 'left' | 'right';
  text: string;
  time: string;
  sender?: string;
}

interface Conversation {
  id: string;
  name: string;
  ava: string;
  platform: 'douyin' | 'kuaishou' | 'xiaohongshu';
  preview: string;
  time: string;
  unread: number;
  mode: 'ai' | 'manual';
  account: string;
  agent: string;
  source: string;
  keyword: string;
  autoCount: number;
  messages: Message[];
}

const accounts = ['小雅来啦', '品牌官号-01', '护肤测评', '好物速递'];
const currentAccount = ref(accounts[0]);
const activeConvId = ref('cv1');
const filterKey = ref<'ai' | 'all' | 'manual' | 'unread'>('all');
const draft = ref('');
const msgFlowRef = ref<HTMLElement | null>(null);
// 移动端：true 显示会话列表，false 显示聊天面板；>= md 始终双栏显示
const mobileShowList = ref(true);

const conversations: Conversation[] = [
  {
    id: 'cv1',
    name: '家居控小林',
    ava: '🧑',
    platform: 'douyin',
    preview: '好的，我看看价格再联系您',
    time: '10:23',
    unread: 2,
    mode: 'ai',
    account: '小雅来啦',
    agent: '默认智能体',
    source: '关键词拓客 · 家居好物',
    keyword: '家居好物',
    autoCount: 12,
    messages: [
      {
        id: 'm1',
        side: 'left',
        sender: '家居控小林',
        text: '你好，看到你们家的收纳盒，请问多少钱？',
        time: '10:21',
      },
      {
        id: 'm2',
        side: 'right',
        sender: 'AI · 默认智能体',
        text: '亲～这款收纳盒现在活动价 ¥69，下单立减 20～需要我发您专属链接吗？',
        time: '10:21',
      },
      {
        id: 'm3',
        side: 'left',
        sender: '家居控小林',
        text: '好的，我看看价格再联系您',
        time: '10:23',
      },
    ],
  },
  {
    id: 'cv2',
    name: '装修老张',
    ava: '👷',
    platform: 'douyin',
    preview: '全屋定制怎么收费？',
    time: '昨天 21:20',
    unread: 0,
    mode: 'manual',
    account: '品牌官号-01',
    agent: '品牌智能体',
    source: '对标拓客 · 竞品A粉丝',
    keyword: '全屋定制',
    autoCount: 3,
    messages: [
      {
        id: 'm1',
        side: 'left',
        sender: '装修老张',
        text: '全屋定制怎么收费？',
        time: '昨天 21:20',
      },
      {
        id: 'm2',
        side: 'right',
        sender: '小雅',
        text: '张哥，根据户型不同价格会有差异，方便加个微信详细沟通吗？',
        time: '昨天 21:22',
      },
    ],
  },
  {
    id: 'cv3',
    name: '小红薯·悦悦',
    ava: '👩',
    platform: 'xiaohongshu',
    preview: '已收到您的方案',
    time: '11:41',
    unread: 0,
    mode: 'ai',
    account: '护肤测评',
    agent: '默认智能体',
    source: '视频拓客 · ins风家具',
    keyword: 'ins风家具',
    autoCount: 8,
    messages: [
      {
        id: 'm1',
        side: 'left',
        sender: '小红薯·悦悦',
        text: '请问 ins 风家具是你们家的吗？',
        time: '11:40',
      },
      {
        id: 'm2',
        side: 'right',
        sender: 'AI · 默认智能体',
        text: '是的～已把方案发到您的主页，欢迎查看',
        time: '11:41',
      },
    ],
  },
  {
    id: 'cv4',
    name: '某手-阿强',
    ava: '🧢',
    platform: 'kuaishou',
    preview: '有优惠券吗？',
    time: '09:58',
    unread: 1,
    mode: 'ai',
    account: '好物速递',
    agent: '获客话术智能体',
    source: '直播拓客 · 家居专场',
    keyword: '优惠券',
    autoCount: 5,
    messages: [
      {
        id: 'm1',
        side: 'left',
        sender: '某手-阿强',
        text: '有优惠券吗？',
        time: '09:58',
      },
    ],
  },
  {
    id: 'cv5',
    name: '梅姐',
    ava: '👩‍🦰',
    platform: 'douyin',
    preview: '已激活 30 天，期待新品',
    time: '3 天前',
    unread: 0,
    mode: 'manual',
    account: '小雅来啦',
    agent: '售前客服智能体',
    source: '粉丝拓客 · 老粉激活',
    keyword: '收纳架',
    autoCount: 2,
    messages: [
      {
        id: 'm1',
        side: 'left',
        sender: '梅姐',
        text: '已激活 30 天，期待新品',
        time: '3 天前',
      },
    ],
  },
  {
    id: 'cv6',
    name: '阿豪',
    ava: '🧑‍💻',
    platform: 'xiaohongshu',
    preview: '出租屋改造方案收到',
    time: '08:47',
    unread: 0,
    mode: 'ai',
    account: '护肤测评',
    agent: '默认智能体',
    source: '关键词拓客 · 出租屋改造',
    keyword: '出租屋改造',
    autoCount: 6,
    messages: [
      {
        id: 'm1',
        side: 'left',
        sender: '阿豪',
        text: '出租屋改造方案收到',
        time: '08:47',
      },
    ],
  },
];

const filters = [
  { key: 'all' as const, label: '全部' },
  { key: 'ai' as const, label: 'AI 回复中' },
  { key: 'manual' as const, label: '人工接管' },
  { key: 'unread' as const, label: '未读' },
];

const filteredConvs = computed(() => {
  if (filterKey.value === 'all') return conversations;
  if (filterKey.value === 'ai')
    return conversations.filter((c) => c.mode === 'ai');
  if (filterKey.value === 'manual')
    return conversations.filter((c) => c.mode === 'manual');
  return conversations.filter((c) => c.unread > 0);
});

const activeConv = computed(
  () =>
    conversations.find((c) => c.id === activeConvId.value) ?? conversations[0],
);

const aiTaking = computed(() => activeConv.value?.mode === 'ai');

const quickReplies = [
  '您好，已为您查询',
  '可以的，安排专员对接',
  '稍等，我看下库存',
];

function pickConv(id: string) {
  activeConvId.value = id;
  const conv = conversations.find((c) => c.id === id);
  if (conv) conv.unread = 0;
  // 移动端：点击会话后切换到聊天面板
  mobileShowList.value = false;
}

function backToList() {
  mobileShowList.value = true;
}

function sendMessage() {
  const text = draft.value.trim();
  if (!text) return;
  const conv = activeConv.value;
  if (!conv) return;
  conv.messages.push({
    id: `m${Date.now()}`,
    side: 'right',
    sender: '我',
    text,
    time: new Date().toTimeString().slice(0, 5),
  });
  draft.value = '';
  nextTick(() => {
    if (msgFlowRef.value)
      msgFlowRef.value.scrollTop = msgFlowRef.value.scrollHeight;
  });
  message.success('已发送（演示）');
}

function insertChip(text: string) {
  draft.value = draft.value ? `${draft.value} ${text}` : text;
}

function toggleTakeover() {
  const conv = activeConv.value;
  if (!conv) return;
  conv.mode = conv.mode === 'ai' ? 'manual' : 'ai';
  message.info(
    conv.mode === 'ai'
      ? '已切换为 AI 自动回复'
      : '已切换为人工接管，AI 仅提供建议',
  );
}

watch(filterKey, () => {
  const first = filteredConvs.value[0];
  if (first && !filteredConvs.value.some((c) => c.id === activeConvId.value)) {
    activeConvId.value = first.id;
  }
});
</script>

<template>
  <div>
    <!-- 移动端（< md）：会话列表 / 聊天面板 互斥显示 -->
    <div class="block md:hidden">
      <div
        v-show="mobileShowList"
        class="flex h-[calc(100vh-120px)] flex-col overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white"
      >
        <div class="flex items-center gap-2 px-3 pt-3 pb-2">
          <h3 class="m-0 text-[13px] font-semibold">会话</h3>
          <Select
            v-model:value="currentAccount"
            :options="accounts.map((a) => ({ label: a, value: a }))"
            class="!flex-1 !min-w-0"
            size="small"
          />
          <Badge
            :count="filteredConvs.length"
            :number-style="{ backgroundColor: '#9CA3AF' }"
          />
        </div>
        <div class="flex flex-wrap gap-1.5 px-3 pb-2.5">
          <button
            v-for="f in filters"
            :key="f.key"
            class="cursor-pointer rounded-full border px-2.5 py-[3px] text-[11px] transition-all"
            :class="
              filterKey === f.key
                ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white'
                : 'border-[#E5E7EB] bg-transparent text-[#6B7280] hover:border-[#D1D5DB]'
            "
            @click="filterKey = f.key"
          >
            {{ f.label }}
          </button>
        </div>
        <div class="flex-1 overflow-y-auto border-t border-[#E5E7EB]">
          <div
            v-for="c in filteredConvs"
            :key="c.id"
            class="flex cursor-pointer items-start gap-2.5 border-b border-[#E5E7EB] px-3 py-2.5 transition-colors hover:bg-[#F9FAFB]"
            :class="
              c.id === activeConvId
                ? '!bg-[#EBEBE6] shadow-[inset_3px_0_0_#0A0A0A]'
                : ''
            "
            @click="pickConv(c.id)"
          >
            <Avatar
              :size="36"
              shape="circle"
              class="!flex-shrink-0 !bg-gradient-to-br !from-[#EDE9FE] !to-[#DDD6FE] !text-[17px]"
            >
              {{ c.ava }}
            </Avatar>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5">
                <span
                  class="truncate text-[12.5px] font-semibold text-[#111827]"
                >
                  {{ c.name }}
                </span>
                <Tag
                  :color="c.mode === 'ai' ? 'processing' : 'warning'"
                  class="!text-[10px]"
                >
                  {{ c.mode === 'ai' ? 'AI' : '人工' }}
                </Tag>
                <span
                  class="ml-auto flex-shrink-0 text-[10px] text-[#6B7280]"
                  >{{ c.time }}</span>
              </div>
              <div class="mt-[2px] truncate text-[11px] text-[#6B7280]">
                {{ c.preview }}
              </div>
              <div class="mt-1 flex items-center gap-1">
                <Tag v-if="c.unread > 0" color="error" class="!text-[10px]">
                  {{ c.unread }} 未读
                </Tag>
              </div>
            </div>
          </div>
          <div
            v-if="filteredConvs.length === 0"
            class="p-8 text-center text-[12.5px] text-[#6B7280]"
          >
            暂无匹配的会话
          </div>
        </div>
      </div>

      <div
        v-if="!mobileShowList && activeConv"
        class="flex h-[calc(100vh-120px)] flex-col overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white"
      >
        <div
          class="flex items-center gap-2 border-b border-[#E5E7EB] px-3 py-2.5"
        >
          <Button size="small" @click="backToList">‹ 返回</Button>
          <Avatar
            :size="28"
            class="!flex-shrink-0 !bg-gradient-to-br !from-[#EDE9FE] !to-[#DDD6FE]"
          >
            {{ activeConv.ava }}
          </Avatar>
          <div class="min-w-0 flex-1">
            <div
              class="flex items-center gap-1.5 truncate text-[13px] font-bold"
            >
              <span class="truncate">{{ activeConv.name }}</span>
              <Tag
                :color="
                  activeConv.platform === 'douyin'
                    ? 'default'
                    : activeConv.platform === 'xiaohongshu'
                      ? 'error'
                      : 'orange'
                "
                class="!text-[10px]"
              >
                {{
                  activeConv.platform === 'douyin'
                    ? '某音'
                    : activeConv.platform === 'xiaohongshu'
                      ? '小某书'
                      : '某手'
                }}
              </Tag>
            </div>
            <div class="mt-[2px] truncate text-[11px] text-[#6B7280]">
              {{ activeConv.source }}
            </div>
          </div>
          <Button size="small" @click="toggleTakeover">
            {{ aiTaking ? '🤖' : '👤' }}
          </Button>
        </div>

        <div
          v-if="aiTaking"
          class="mx-3 mt-2 flex items-center gap-2 rounded-[10px] border border-dashed border-[#C7D2FE] bg-[#EEF2FF] px-3 py-2 text-[11px] leading-relaxed text-[#3730A3]"
        >
          <span>🤖 <b>AI 自动回复中</b> · 已自动回复
            {{ activeConv.autoCount }} 条</span>
        </div>
        <div
          v-else
          class="mx-3 mt-2 flex items-center gap-2 rounded-[10px] border border-dashed border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-[11px] leading-relaxed text-[#92400E]"
        >
          <span>👤 <b>人工接管中</b> · AI 仅提供建议话术</span>
        </div>

        <div
          ref="msgFlowRef"
          class="flex-1 space-y-3 overflow-y-auto bg-[#FAFAFC] p-3"
        >
          <div
            v-for="m in activeConv.messages"
            :key="m.id"
            class="flex max-w-[82%] gap-2"
            :class="m.side === 'right' ? 'ml-auto flex-row-reverse' : ''"
          >
            <Avatar
              :size="26"
              class="!flex-shrink-0"
              :class="
                m.side === 'left'
                  ? '!bg-gradient-to-br !from-[#EDE9FE] !to-[#DDD6FE]'
                  : '!bg-gradient-to-br !from-[#EC4899] !to-[#F472B6] !text-white'
              "
            >
              {{ m.side === 'left' ? activeConv.ava : '我' }}
            </Avatar>
            <div>
              <div
                class="mb-[3px] text-[10px] text-[#6B7280]"
                :class="m.side === 'right' ? 'text-right' : ''"
              >
                {{ m.sender }} · {{ m.time }}
              </div>
              <div
                class="rounded-[10px] border px-2.5 py-1.5 text-[12px] leading-relaxed whitespace-pre-wrap"
                :class="
                  m.side === 'right'
                    ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white'
                    : 'border-[#E5E7EB] bg-white text-[#111827]'
                "
              >
                {{ m.text }}
              </div>
            </div>
          </div>
        </div>

        <div class="border-t border-[#E5E7EB] px-3 pt-2 pb-2.5">
          <div class="mb-2 flex flex-wrap gap-1.5">
            <button
              v-for="q in quickReplies"
              :key="q"
              class="cursor-pointer rounded-full border border-[#E5E7EB] bg-white px-2.5 py-[3px] text-[11px] text-[#6B7280] transition-all hover:border-[#4B3FE3] hover:text-[#4B3FE3]"
              @click="insertChip(q)"
            >
              {{ q }}
            </button>
          </div>
          <div class="flex items-end gap-2">
            <Input.TextArea
              v-model:value="draft"
              :auto-size="{ minRows: 1, maxRows: 3 }"
              placeholder="输入消息…"
              @press-enter.prevent="sendMessage"
            />
            <Button type="primary" @click="sendMessage">发送</Button>
          </div>
        </div>
      </div>
    </div>

    <!-- 平板/PC（>= md）：双栏布局 -->
    <div
      class="hidden gap-3 md:grid"
      style="grid-template-columns: 284px 1fr; min-height: 520px"
    >
      <div
        class="flex flex-col overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white"
      >
        <div class="flex items-center gap-2 px-3.5 pt-3 pb-2">
          <h3 class="m-0 text-[13px] font-semibold">会话</h3>
          <Select
            v-model:value="currentAccount"
            :options="accounts.map((a) => ({ label: a, value: a }))"
            class="!w-[150px]"
            size="small"
          />
          <Badge
            :count="filteredConvs.length"
            :number-style="{ backgroundColor: '#9CA3AF' }"
          />
        </div>
        <div class="flex flex-wrap gap-1.5 px-3 pb-2.5">
          <button
            v-for="f in filters"
            :key="f.key"
            class="cursor-pointer rounded-full border px-2.5 py-[3px] text-[11px] transition-all"
            :class="
              filterKey === f.key
                ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white'
                : 'border-[#E5E7EB] bg-transparent text-[#6B7280] hover:border-[#D1D5DB]'
            "
            @click="filterKey = f.key"
          >
            {{ f.label }}
          </button>
        </div>
        <div class="flex-1 overflow-y-auto border-t border-[#E5E7EB]">
          <div
            v-for="c in filteredConvs"
            :key="c.id"
            class="flex cursor-pointer items-start gap-2.5 border-b border-[#E5E7EB] px-3 py-2.5 transition-colors hover:bg-[#F9FAFB]"
            :class="
              c.id === activeConvId
                ? '!bg-[#EBEBE6] shadow-[inset_3px_0_0_#0A0A0A]'
                : ''
            "
            @click="pickConv(c.id)"
          >
            <Avatar
              :size="36"
              shape="circle"
              class="!flex-shrink-0 !bg-gradient-to-br !from-[#EDE9FE] !to-[#DDD6FE] !text-[17px]"
            >
              {{ c.ava }}
            </Avatar>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5">
                <span
                  class="truncate text-[12.5px] font-semibold text-[#111827]"
                >
                  {{ c.name }}
                </span>
                <Tag
                  :color="c.mode === 'ai' ? 'processing' : 'warning'"
                  class="!text-[10px]"
                >
                  {{ c.mode === 'ai' ? 'AI' : '人工' }}
                </Tag>
                <span
                  class="ml-auto flex-shrink-0 text-[10px] text-[#6B7280]"
                  >{{ c.time }}</span>
              </div>
              <div class="mt-[2px] truncate text-[11px] text-[#6B7280]">
                {{ c.preview }}
              </div>
              <div class="mt-1 flex items-center gap-1">
                <Tag v-if="c.unread > 0" color="error" class="!text-[10px]">
                  {{ c.unread }} 未读
                </Tag>
              </div>
            </div>
          </div>
          <div
            v-if="filteredConvs.length === 0"
            class="p-8 text-center text-[12.5px] text-[#6B7280]"
          >
            暂无匹配的会话
          </div>
        </div>
        <div
          class="hidden flex-wrap items-center gap-2 border-t border-dashed border-[#E5E7EB] px-3 py-2.5 text-[11px] text-[#6B7280] md:flex"
        >
          <Button size="small" @click="message.info('收到新私信 · 家居控小林')">
            🔔 模拟收到新私信
          </Button>
          <span>演示：客户端右下角弹出桌面通知</span>
        </div>
      </div>

      <div
        v-if="activeConv"
        class="flex flex-col overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white"
      >
        <div
          class="flex items-center gap-2.5 border-b border-[#E5E7EB] px-4 py-2.5"
        >
          <Avatar
            :size="32"
            class="!bg-gradient-to-br !from-[#EDE9FE] !to-[#DDD6FE]"
          >
            {{ activeConv.ava }}
          </Avatar>
          <div>
            <div class="flex items-center gap-1.5 text-[13.5px] font-bold">
              {{ activeConv.name }}
              <Tag
                :color="
                  activeConv.platform === 'douyin'
                    ? 'default'
                    : activeConv.platform === 'xiaohongshu'
                      ? 'error'
                      : 'orange'
                "
              >
                {{
                  activeConv.platform === 'douyin'
                    ? '某音'
                    : activeConv.platform === 'xiaohongshu'
                      ? '小某书'
                      : '某手'
                }}
              </Tag>
            </div>
            <div class="mt-[2px] text-[11px] text-[#6B7280]">
              来源：{{ activeConv.source }} · 命中关键词「{{
                activeConv.keyword
              }}」
            </div>
          </div>
          <div class="ml-auto flex items-center gap-2">
            <Button
              size="small"
              :type="aiTaking ? 'default' : 'primary'"
              @click="toggleTakeover"
            >
              {{ aiTaking ? '🤖 切换为人工接管' : '👤 切换为 AI 自动' }}
            </Button>
          </div>
        </div>

        <div
          v-if="aiTaking"
          class="mx-4 mt-2 flex items-center gap-2 rounded-[10px] border border-dashed border-[#C7D2FE] bg-[#EEF2FF] px-3 py-2 text-[11.5px] leading-relaxed text-[#3730A3]"
        >
          <span>🤖 <b>AI 自动回复中</b> · 智能体「{{ activeConv.agent }}」·
            本会话已自动回复 {{ activeConv.autoCount }} 条 ·
            人工可随时接管</span>
        </div>
        <div
          v-else
          class="mx-4 mt-2 flex items-center gap-2 rounded-[10px] border border-dashed border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-[11.5px] leading-relaxed text-[#92400E]"
        >
          <span>👤 <b>人工接管中</b> · AI 仅提供建议话术 ·
            新私信桌面右下角弹通知</span>
        </div>

        <div
          ref="msgFlowRef"
          class="flex-1 space-y-3 overflow-y-auto bg-[#FAFAFC] p-4"
        >
          <div
            v-for="m in activeConv.messages"
            :key="m.id"
            class="flex max-w-[76%] gap-2"
            :class="m.side === 'right' ? 'ml-auto flex-row-reverse' : ''"
          >
            <Avatar
              :size="28"
              class="!flex-shrink-0"
              :class="
                m.side === 'left'
                  ? '!bg-gradient-to-br !from-[#EDE9FE] !to-[#DDD6FE]'
                  : '!bg-gradient-to-br !from-[#EC4899] !to-[#F472B6] !text-white'
              "
            >
              {{ m.side === 'left' ? activeConv.ava : '我' }}
            </Avatar>
            <div>
              <div
                class="mb-[3px] text-[10px] text-[#6B7280]"
                :class="m.side === 'right' ? 'text-right' : ''"
              >
                {{ m.sender }} · {{ m.time }}
              </div>
              <div
                class="rounded-[10px] border px-3 py-2 text-[12.5px] leading-relaxed whitespace-pre-wrap"
                :class="
                  m.side === 'right'
                    ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white'
                    : 'border-[#E5E7EB] bg-white text-[#111827]'
                "
              >
                {{ m.text }}
              </div>
            </div>
          </div>
        </div>

        <div class="border-t border-[#E5E7EB] px-3.5 pt-2.5 pb-3">
          <div class="mb-2 flex flex-wrap gap-1.5">
            <button
              v-for="q in quickReplies"
              :key="q"
              class="cursor-pointer rounded-full border border-[#E5E7EB] bg-white px-2.5 py-[3px] text-[11px] text-[#6B7280] transition-all hover:border-[#4B3FE3] hover:text-[#4B3FE3]"
              @click="insertChip(q)"
            >
              {{ q }}
            </button>
          </div>
          <div class="flex items-end gap-2">
            <Input.TextArea
              v-model:value="draft"
              :auto-size="{ minRows: 2, maxRows: 4 }"
              placeholder="输入消息…"
              @press-enter.prevent="sendMessage"
            />
            <Button type="primary" size="large" @click="sendMessage">
              发送
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
