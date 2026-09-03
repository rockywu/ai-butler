<script lang="ts" setup>
import { computed, provide, ref } from 'vue';

import { message } from 'ant-design-vue';

import { pageGapClass } from '../_shared/chic-classes';
import { acqLeadCards, acqTaskCards, acqZoneCards } from '../_shared/mock-data';
import ActionCard from './action-card.vue';
import SmartIcons from './smart-icons.vue';

type PlatformKey = 'douyin' | 'kuaishou' | 'xiaohongshu';
type OpenModalFn = (key: string) => void;

const PLATFORM_LABEL: Record<PlatformKey, string> = {
  douyin: '某音',
  kuaishou: '某手',
  xiaohongshu: '小某书',
};

const platforms: Array<{
  dotClass: string;
  key: PlatformKey;
  label: string;
  short: string;
}> = [
  {
    key: 'douyin',
    label: '某音',
    short: '某',
    dotClass: 'bg-[linear-gradient(135deg,#28E0E8,#111827_50%,#FF4D8D)]',
  },
  {
    key: 'xiaohongshu',
    label: '小某书',
    short: '小',
    dotClass: 'bg-[linear-gradient(135deg,#FF657C,#FF2442)]',
  },
  {
    key: 'kuaishou',
    label: '某手',
    short: '某',
    dotClass: 'bg-[linear-gradient(135deg,#FFB34D,#FF5000)]',
  },
];

const activePlatform = ref<PlatformKey>('douyin');
const accountModalTitle = computed(
  () => `账号管理 · ${PLATFORM_LABEL[activePlatform.value]}`,
);

function openModal(_key: string) {
  // 任务 6/7 接入弹窗内容
}

function switchPlatform(key: PlatformKey) {
  activePlatform.value = key;
  message.info(`已切换至${PLATFORM_LABEL[key]} · 账号与任务数据按平台过滤`);
}

provide<OpenModalFn>('openModal', openModal);
provide('activePlatform', activePlatform);
provide('accountModalTitle', accountModalTitle);
</script>

<template>
  <div :class="pageGapClass">
    <SmartIcons />

    <div
      class="flex flex-wrap items-center gap-2 rounded-[10px] border border-[#BCEDE1] bg-[#EDFBF7] px-3 py-2 text-[11.5px] font-medium text-[#176B59] sm:px-3.5 sm:py-2.5 sm:text-[12.5px]"
    >
      <span>🟢 家居好物 · 关键词拓客 · 运行中 · 18 / 30 · 由本机 RPA 引擎执行</span>
    </div>

    <div
      class="flex flex-wrap items-center gap-2 rounded-[10px] border border-[#DDE1F2] bg-[linear-gradient(90deg,#F5F7FF,#FAF7FF)] px-3 py-2 text-[11.5px] leading-relaxed text-[#4D566D] sm:px-3.5 sm:text-[12px]"
    >
      <span class="shrink-0 text-[13px] text-[#7A60E8] sm:text-[14px]">⚠</span>
      <span>
        当遇到任务执行异常时（如手动结束任务，但任务提示还在执行），请手动关闭任务浏览器，点击软件右上角的刷新按钮，重新执行任务即可。
      </span>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <button
        v-for="platform in platforms"
        :key="platform.key"
        class="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border px-2.5 py-1.5 text-[11.5px] transition-all sm:px-3 sm:text-[12.5px]"
        :class="
          activePlatform === platform.key
            ? 'border-[#111A38] bg-[#111A38] text-white shadow-[0_5px_14px_rgba(32,48,100,.2)]'
            : 'border-[#DCDAD4] bg-white text-[#6B7280] hover:border-[#D1D5DB]'
        "
        type="button"
        @click="switchPlatform(platform.key)"
      >
        <span
          class="grid h-[15px] w-[15px] place-items-center rounded-[4px] text-[9px] font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.35)]"
          :class="platform.dotClass"
        >
          {{ platform.short }}
        </span>
        {{ platform.label }}
      </button>
      <button
        class="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-dashed border-[#DCDAD4] bg-white px-2.5 py-1.5 text-[11.5px] text-[#6B7280] transition-all hover:border-[#4C59C7] hover:text-[#4C59C7] sm:px-3 sm:text-[12.5px]"
        type="button"
        @click="openModal('m-overview')"
      >
        📊 数据总览
      </button>
      <button
        class="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] px-2.5 py-1.5 text-[11.5px] font-semibold text-[#DC2626] transition-all hover:bg-[#FEE2E2] sm:px-3 sm:text-[12.5px]"
        type="button"
        @click="openModal('m-notice')"
      >
        ⚠ 注意事项!!!
      </button>
      <a
        class="ml-auto cursor-pointer text-[11.5px] font-semibold text-[#4C59C7] hover:underline sm:text-[12px]"
        @click.prevent="openModal('m-guide')"
      >
        ℹ 使用指引
      </a>
    </div>

    <div
      class="mb-[-4px] flex items-center gap-2 py-[2px] text-[12.5px] font-semibold text-[#0A0A0A] sm:text-[13.5px]"
    >
      <span
        class="h-4 w-[3px] shrink-0 rounded-[4px] bg-[linear-gradient(135deg,#5D6CFF_0_36%,#B553FF_36%_68%,#21CAE5_68%)] shadow-[0_3px_10px_rgba(91,108,255,.28)]"
      ></span>
      主要功能
      <span class="text-[11px] font-normal text-[#6B7280] sm:text-[11.5px]">
        账号 · 话术 · 关键词 · 进程
      </span>
    </div>
    <div
      class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4"
    >
      <ActionCard
        v-for="card in acqZoneCards"
        :key="card.modalKey"
        :desc="card.desc"
        :icon-id="card.iconId"
        layout="zone"
        :title="card.title"
        :tone="card.tone"
        @click="openModal(card.modalKey)"
      />
    </div>

    <div
      class="mb-[-4px] flex items-center gap-2 py-[2px] text-[12.5px] font-semibold text-[#0A0A0A] sm:text-[13.5px]"
    >
      <span
        class="h-4 w-[3px] shrink-0 rounded-[4px] bg-[linear-gradient(135deg,#5D6CFF_0_36%,#B553FF_36%_68%,#21CAE5_68%)] shadow-[0_3px_10px_rgba(91,108,255,.28)]"
      ></span>
      拓客专区
      <span class="text-[11px] font-normal text-[#6B7280] sm:text-[11.5px]">
        五种获客方式 · RPA 本地执行
      </span>
    </div>
    <div
      class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-5"
    >
      <ActionCard
        v-for="card in acqLeadCards"
        :key="card.modalKey"
        :desc="card.desc"
        :icon-id="card.iconId"
        :title="card.title"
        :tone="card.tone"
        @click="openModal(card.modalKey)"
      />
    </div>

    <div
      class="mb-[-4px] flex items-center gap-2 py-[2px] text-[12.5px] font-semibold text-[#0A0A0A] sm:text-[13.5px]"
    >
      <span
        class="h-4 w-[3px] shrink-0 rounded-[4px] bg-[linear-gradient(135deg,#5D6CFF_0_36%,#B553FF_36%_68%,#21CAE5_68%)] shadow-[0_3px_10px_rgba(91,108,255,.28)]"
      ></span>
      任务明细
      <span class="text-[11px] font-normal text-[#6B7280] sm:text-[11.5px]">
        线索沉淀 · 可导出跟进
      </span>
    </div>
    <div
      class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-5"
    >
      <ActionCard
        v-for="card in acqTaskCards"
        :key="card.modalKey"
        :desc="card.desc"
        :icon-id="card.iconId"
        :title="card.title"
        :tone="card.tone"
        @click="openModal(card.modalKey)"
      />
    </div>
  </div>
</template>
