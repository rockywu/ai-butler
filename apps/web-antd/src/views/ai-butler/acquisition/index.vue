<script lang="ts" setup>
import { ref } from 'vue';

import { Button, message } from 'ant-design-vue';

type PlatformKey = 'douyin' | 'kuaishou' | 'xiaohongshu';

interface Platform {
  key: PlatformKey;
  label: string;
  short: string;
  color: string;
}

interface ActionCard {
  key: string;
  title: string;
  desc: string;
  emoji: string;
  cardCls: string;
  iconCls: string;
}

const activePlatform = ref<PlatformKey>('douyin');

const platforms: Platform[] = [
  { key: 'douyin', label: '某音', short: '某', color: '#111827' },
  { key: 'xiaohongshu', label: '小某书', short: '小', color: '#FF2442' },
  { key: 'kuaishou', label: '某手', short: '某', color: '#FF5000' },
];

const primaryCards: ActionCard[] = [
  {
    key: 'account',
    title: '账号管理',
    desc: '授权和管理平台账号，查看账号状态和数据',
    emoji: '👤',
    cardCls: 't-purple',
    iconCls: 'ico-purple',
  },
  {
    key: 'reply',
    title: '回复 / 私信预设',
    desc: '自由挑选已保存的常用语句，灵活应对各类私信场景，回复更轻松',
    emoji: '💬',
    cardCls: 't-orange',
    iconCls: 'ico-orange',
  },
  {
    key: 'keyword',
    title: '关键词预设',
    desc: '预先配置目标关键词，智能筛选并识别出包含该词汇的用户评论，精准锁定意向客户',
    emoji: '🎯',
    cardCls: 't-cyan',
    iconCls: 'ico-cyan',
  },
  {
    key: 'process',
    title: '运行进程管理',
    desc: '查看当前运行中的任务，可对其进行操作',
    emoji: '⚙',
    cardCls: 't-green',
    iconCls: 'ico-green',
  },
];

const acqCards: ActionCard[] = [
  {
    key: 'competitor',
    title: '对标拓客',
    desc: '针对特定用户精准拓客，分析竞争对手粉丝与评论',
    emoji: '👥',
    cardCls: 't-blue',
    iconCls: 'ico-blue',
  },
  {
    key: 'video',
    title: '视频拓客',
    desc: '通过视频内容拓客，分析视频表现和受众',
    emoji: '📹',
    cardCls: 't-orange',
    iconCls: 'ico-orange',
  },
  {
    key: 'keyword',
    title: '关键词拓客',
    desc: '基于关键词搜索拓客，精准定位目标用户',
    emoji: '🔍',
    cardCls: 't-green',
    iconCls: 'ico-green',
  },
  {
    key: 'live',
    title: '直播拓客',
    desc: '基于直播间配合关键词拓客，精准定位目标用户',
    emoji: '📡',
    cardCls: 't-purple',
    iconCls: 'ico-purple',
  },
  {
    key: 'fan',
    title: '粉丝拓客',
    desc: '针对粉丝进行拓客，分析粉丝互动和转化效果',
    emoji: '❤',
    cardCls: 't-blue',
    iconCls: 'ico-cyan',
  },
];

const taskCards: ActionCard[] = [
  {
    key: 'tasks',
    title: '任务列表',
    desc: '查看已执行的任务列表，了解执行进度和结果',
    emoji: '📋',
    cardCls: 't-green',
    iconCls: 'ico-green',
  },
  {
    key: 'interact',
    title: '互动记录列表',
    desc: '查看点赞和关注的历史记录，分析互动效果',
    emoji: '🤝',
    cardCls: 't-blue',
    iconCls: 'ico-blue',
  },
  {
    key: 'comment',
    title: '数据评论列表',
    desc: '查看和管理账号的评论数据和互动记录',
    emoji: '🗨',
    cardCls: 't-purple',
    iconCls: 'ico-purple',
  },
  {
    key: 'live',
    title: '直播评论列表',
    desc: '查看和管理直播间的评论数据和互动记录',
    emoji: '📺',
    cardCls: 't-orange',
    iconCls: 'ico-orange',
  },
  {
    key: 'fan',
    title: '粉丝列表',
    desc: '查看和管理已采集粉丝数据与触达状态',
    emoji: '💗',
    cardCls: 't-purple',
    iconCls: 'ico-pink',
  },
];

function onCardClick(group: string, key: string) {
  message.info(`打开「${group} · ${key}」（演示）`);
}
</script>

<template>
  <div class="flex flex-col gap-3.5 sm:gap-4">
    <!-- 任务运行 banner -->
    <div
      class="flex flex-wrap items-center gap-2 rounded-[10px] border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-2 text-[11.5px] font-medium text-[#065F46] sm:px-3.5 sm:py-2.5 sm:text-[12.5px]"
    >
      <span>🟢 家居好物 · 关键词拓客 · 运行中 · 18 / 30 · 由本机 RPA 引擎执行</span>
    </div>

    <!-- 异常提示 -->
    <div
      class="flex flex-wrap items-center gap-2 rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-[11.5px] leading-relaxed text-[#6B7280] sm:px-3.5 sm:text-[12px]"
    >
      <span class="text-[13px] text-[#F59E0B] sm:text-[14px]">⚠</span>
      <span>
        当遇到任务执行异常时（如手动结束任务，但任务提示还在执行），请手动关闭任务浏览器，点击软件右上角的刷新按钮，重新执行任务即可。
      </span>
    </div>

    <!-- 平台 tab 行 -->
    <div class="flex flex-wrap items-center gap-2">
      <button
        v-for="p in platforms"
        :key="p.key"
        class="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border px-2.5 py-1.5 text-[11.5px] transition-all sm:px-3 sm:text-[12.5px]"
        :class="
          activePlatform === p.key
            ? 'border-[#111827] bg-[#111827] text-white'
            : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#D1D5DB]'
        "
        @click="activePlatform = p.key"
      >
        <span
          class="grid h-[15px] w-[15px] place-items-center rounded-[4px] text-[9px] font-bold text-white"
          :style="{ background: p.color }"
        >
          {{ p.short }}
        </span>
        {{ p.label }}
      </button>
      <Button type="default" ghost class="!border-dashed">📊 数据总览</Button>
      <Button danger ghost>⚠ 注意事项!!!</Button>
      <a
        class="ml-auto cursor-pointer text-[11.5px] text-[#3B82F6] hover:underline sm:text-[12px]"
        >ℹ 使用指引</a>
    </div>

    <!-- 主要功能 -->
    <div
      class="mb-[-4px] flex items-center gap-2 border-l-[3px] border-[#4B3FE3] py-[2px] pl-2.5 text-[12.5px] font-semibold sm:text-[13.5px]"
    >
      主要功能
      <span class="text-[11px] font-normal text-[#6B7280] sm:text-[11.5px]">账号 · 话术 · 关键词 · 进程</span>
    </div>
    <div
      class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4"
    >
      <button
        v-for="c in primaryCards"
        :key="c.key"
        class="flex items-start gap-2.5 rounded-[10px] border border-[#E5E7EB] p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.07)] sm:rounded-[14px] sm:p-3.5"
        :class="c.cardCls"
        @click="onCardClick('主要功能', c.title)"
      >
        <div
          class="grid h-[36px] w-[36px] flex-shrink-0 place-items-center rounded-[10px] text-[16px] text-white sm:h-[38px] sm:w-[38px] sm:text-[17px]"
          :class="c.iconCls"
        >
          {{ c.emoji }}
        </div>
        <div>
          <div class="mb-[3px] text-[12.5px] font-semibold sm:text-[13px]">
            {{ c.title }}
          </div>
          <div
            class="text-[11px] leading-relaxed text-[#6B7280] sm:text-[11.5px]"
          >
            {{ c.desc }}
          </div>
        </div>
      </button>
    </div>

    <!-- 拓客专区 -->
    <div
      class="mb-[-4px] flex items-center gap-2 border-l-[3px] border-[#4B3FE3] py-[2px] pl-2.5 text-[12.5px] font-semibold sm:text-[13.5px]"
    >
      拓客专区
      <span class="text-[11px] font-normal text-[#6B7280] sm:text-[11.5px]">五种获客方式 · RPA 本地执行</span>
    </div>
    <div
      class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-5"
    >
      <button
        v-for="c in acqCards"
        :key="c.key"
        class="rounded-[10px] border border-[#E5E7EB] p-2.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.07)] sm:rounded-[14px] sm:p-3"
        :class="c.cardCls"
        @click="onCardClick('拓客专区', c.title)"
      >
        <div
          class="mb-1.5 grid h-7 w-7 place-items-center rounded-[8px] text-[14px] text-white sm:mb-2 sm:h-8 sm:w-8 sm:rounded-[9px] sm:text-[15px]"
          :class="c.iconCls"
        >
          {{ c.emoji }}
        </div>
        <div class="mb-[2px] text-[12px] font-semibold sm:text-[12.5px]">
          {{ c.title }}
        </div>
        <div class="text-[10.5px] leading-snug text-[#6B7280] sm:text-[11px]">
          {{ c.desc }}
        </div>
      </button>
    </div>

    <!-- 任务明细 -->
    <div
      class="mb-[-4px] flex items-center gap-2 border-l-[3px] border-[#4B3FE3] py-[2px] pl-2.5 text-[12.5px] font-semibold sm:text-[13.5px]"
    >
      任务明细
      <span class="text-[11px] font-normal text-[#6B7280] sm:text-[11.5px]">线索沉淀 · 可导出跟进</span>
    </div>
    <div
      class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-5"
    >
      <button
        v-for="c in taskCards"
        :key="c.key"
        class="rounded-[10px] border border-[#E5E7EB] p-2.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.07)] sm:rounded-[14px] sm:p-3"
        :class="c.cardCls"
        @click="onCardClick('任务明细', c.title)"
      >
        <div
          class="mb-1.5 grid h-7 w-7 place-items-center rounded-[8px] text-[14px] text-white sm:mb-2 sm:h-8 sm:w-8 sm:rounded-[9px] sm:text-[15px]"
          :class="c.iconCls"
        >
          {{ c.emoji }}
        </div>
        <div class="mb-[2px] text-[12px] font-semibold sm:text-[12.5px]">
          {{ c.title }}
        </div>
        <div class="text-[10.5px] leading-snug text-[#6B7280] sm:text-[11px]">
          {{ c.desc }}
        </div>
      </button>
    </div>
  </div>
</template>
