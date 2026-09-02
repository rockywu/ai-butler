<script lang="ts" setup>
import { useRouter } from 'vue-router';

import { Card, Tag } from 'ant-design-vue';

interface StatItem {
  label: string;
  value: string;
  delta?: string;
  positive?: boolean;
}

interface QuickItem {
  key: string;
  title: string;
  desc: string;
  emoji: string;
  gradient: string;
}

interface FeedItem {
  id: string;
  text: string;
  time: string;
  dot: string;
}

const router = useRouter();

const stats: StatItem[] = [
  { label: '运行中任务', value: '1', delta: '关键词拓客 · 18/30' },
  {
    label: '今日新增线索',
    value: '128',
    delta: '↑ 23% 较昨日',
    positive: true,
  },
  { label: '累计私信触达', value: '3,420', delta: '含自动回复命中' },
  { label: '已生成视频', value: '8', delta: '数字人 5 · 文生 3' },
];

const quicks: QuickItem[] = [
  {
    key: 'acquisition',
    title: '智能获客',
    desc: '某音 / 小某书 / 某手评论区、直播间、粉丝智能触达；私信会话 AI 托管，线索自动沉淀',
    emoji: '🎯',
    gradient: 'linear-gradient(135deg,#4B3FE3,#7C3AED)',
  },
  {
    key: 'digital',
    title: '数字人',
    desc: '声音复刻 / 形象定制 / 文案直出口播视频，公共形象库免费可用',
    emoji: '🎙',
    gradient: 'linear-gradient(135deg,#EC4899,#F472B6)',
  },
  {
    key: 'video',
    title: '文生视频',
    desc: '输入提示词直出成片，Grok / Seedance 双引擎，支持参考图',
    emoji: '🎬',
    gradient: 'linear-gradient(135deg,#8B5CF6,#A78BFA)',
  },
];

const feeds: FeedItem[] = [
  {
    id: 'f1',
    text: 'AI 已自动回复 3 条私信 ·「家居控小林」在咨询价格，建议尽快人工接管',
    time: '11:05',
    dot: '#10B981',
  },
  {
    id: 'f2',
    text: '关键词「家居好物」命中 1 条评论，已自动回复并发送私信',
    time: '10:32',
    dot: '#10B981',
  },
  {
    id: 'f3',
    text: '数字人视频《产品介绍 · 智能获客篇》生成完成（消耗 50 算力点）',
    time: '09:15',
    dot: '#4B3FE3',
  },
  {
    id: 'f4',
    text: '直播拓客任务已暂停：直播间已结束',
    time: '昨天 21:40',
    dot: '#F59E0B',
  },
  {
    id: 'f5',
    text: '文生视频 1 条生成完成 · Seedance · 1080P（消耗 30 算力点）',
    time: '昨天 18:22',
    dot: '#4B3FE3',
  },
];

const devices = [
  {
    id: 'WIN-001',
    label: 'WIN-001',
    status: '在线',
    tone: 'success',
    meta: '客户端 v1.0.2 · 心跳 10 秒前',
  },
  {
    id: 'MAC-002',
    label: 'MAC-002',
    status: '未启动',
    tone: 'warning',
    meta: '上次在线 3 天前',
  },
];

function jumpTo(key: string) {
  router.push({
    name: `AiButler${key.charAt(0).toUpperCase()}${key.slice(1)}`,
  });
}
</script>

<template>
  <div class="flex flex-col gap-3.5 sm:gap-4">
    <!-- Hero -->
    <div
      class="relative overflow-hidden rounded-[10px] p-4 text-white sm:rounded-[14px] sm:p-5"
      style="
        background: linear-gradient(
          135deg,
          #1e1b4b 0%,
          #4c1d95 50%,
          #7c3aed 100%
        );
      "
    >
      <div
        class="pointer-events-none absolute inset-0"
        style="
          background:
            radial-gradient(
              circle at 85% 20%,
              rgb(139 92 246 / 50%),
              transparent 45%
            ),
            radial-gradient(
              circle at 15% 90%,
              rgb(59 130 246 / 35%),
              transparent 45%
            );
        "
      ></div>
      <div class="relative z-[1]">
        <h2 class="mb-1 text-[16px] font-semibold sm:text-[19px]">
          阿斯系统 · AI 超级员工
        </h2>
        <p class="m-0 text-[11.5px] opacity-90 sm:text-[12px]">
          智能获客 × 数字人 × 文生视频，一台电脑顶一支「内容 + 获客」团队
        </p>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4">
      <div
        v-for="item in stats"
        :key="item.label"
        class="rounded-[10px] border border-[#E5E7EB] bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:rounded-[14px] sm:p-3.5"
      >
        <div class="mb-1 text-[11.5px] text-[#6B7280] sm:mb-1.5 sm:text-[12px]">
          {{ item.label }}
        </div>
        <div class="text-[20px] font-bold leading-tight sm:text-[22px]">
          {{ item.value }}
        </div>
        <div
          v-if="item.delta"
          class="mt-[3px] text-[10.5px] sm:text-[11px]"
          :class="item.positive ? 'text-[#10B981]' : 'text-[#6B7280]'"
        >
          {{ item.delta }}
        </div>
      </div>
    </div>

    <!-- 快捷入口 -->
    <div
      class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3"
    >
      <button
        v-for="q in quicks"
        :key="q.key"
        class="flex cursor-pointer flex-col items-start rounded-[10px] border border-[#E5E7EB] bg-white p-3.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.07)] sm:rounded-[14px] sm:p-4"
        @click="jumpTo(q.key)"
      >
        <div
          class="mb-2 grid h-[38px] w-[38px] place-items-center rounded-xl text-[17px] text-white sm:mb-2.5 sm:h-[42px] sm:w-[42px] sm:text-[19px]"
          :style="{ background: q.gradient }"
        >
          {{ q.emoji }}
        </div>
        <div class="mb-[3px] text-[13.5px] font-semibold sm:text-[14px]">
          {{ q.title }}
        </div>
        <div
          class="text-[11.5px] leading-relaxed text-[#6B7280] sm:text-[12px]"
        >
          {{ q.desc }}
        </div>
      </button>
    </div>

    <!-- 两列：设备 + 动态 -->
    <div class="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-3.5">
      <Card
        :bordered="false"
        class="!rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:!rounded-[14px]"
      >
        <template #title>
          <div class="flex items-center justify-between">
            <span class="text-[12.5px] font-semibold sm:text-[13px]">设备连接状态</span>
            <Tag color="success">本机在线</Tag>
          </div>
        </template>
        <ul class="m-0 list-none p-0">
          <li
            v-for="(d, idx) in devices"
            :key="d.id"
            class="flex flex-wrap items-center gap-2 py-2 text-[11.5px] sm:text-[12px]"
            :class="
              idx !== devices.length - 1
                ? 'border-b border-dashed border-[#E5E7EB]'
                : ''
            "
          >
            <Tag :color="d.tone === 'success' ? 'success' : 'warning'">
              {{ d.status }}
            </Tag>
            <strong class="text-[#111827]">{{ d.label }}</strong>
            <span class="ml-auto text-[10.5px] text-[#6B7280] sm:text-[11px]">{{
              d.meta
            }}</span>
          </li>
        </ul>
      </Card>

      <Card
        :bordered="false"
        class="!rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:!rounded-[14px]"
      >
        <template #title>
          <div class="flex items-center justify-between">
            <span class="text-[12.5px] font-semibold sm:text-[13px]">最新动态</span>
            <a
              class="cursor-pointer text-[11.5px] text-[#4B3FE3] sm:text-[12px]"
              @click="jumpTo('acquisition')"
            >
              查看全部
            </a>
          </div>
        </template>
        <ul class="m-0 list-none p-0">
          <li
            v-for="f in feeds"
            :key="f.id"
            class="flex items-start gap-2 py-2 text-[11.5px] leading-relaxed sm:text-[12px]"
            :class="
              f.id !== feeds[feeds.length - 1]?.id
                ? 'border-b border-dashed border-[#E5E7EB]'
                : ''
            "
          >
            <span
              class="mt-1.5 h-[7px] w-[7px] flex-shrink-0 rounded-full"
              :style="{ background: f.dot }"
            ></span>
            <span class="flex-1 text-[#374151]">{{ f.text }}</span>
            <span
              class="ml-auto flex-shrink-0 text-[10.5px] whitespace-nowrap text-[#9CA3AF] sm:text-[11px]"
            >
              {{ f.time }}
            </span>
          </li>
        </ul>
      </Card>
    </div>
  </div>
</template>
